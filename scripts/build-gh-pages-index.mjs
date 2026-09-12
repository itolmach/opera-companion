// Regenerates the "live previews" index inside a gh-pages checkout — one link
// per branch currently deployed there.
//
// Where it writes depends on who owns the gh-pages root:
//   primaryDeploy "root"    — the primary branch's real site owns index.html,
//                             so the preview list goes to <previewIndexDir>/index.html.
//   primaryDeploy "subpath" — nothing owns the root, so the preview list IS the
//                             root index.html.
//
// Preview folders identify themselves with a .preview-branch.json marker
// written by build-gh-pages.mjs, so the primary site's own folders (styles/,
// blog/, assets/) are never mistaken for previews.
//
// Usage: node scripts/build-gh-pages-index.mjs <gh-pages-checkout-dir>
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

import { ROOT, loadSiteConfig, resolvePages, slugifyBranch } from "./pages-config.mjs";

const targetDir = process.argv[2];
if (!targetDir) {
  console.error("Usage: node scripts/build-gh-pages-index.mjs <gh-pages-checkout-dir>");
  process.exit(1);
}

const config = await loadSiteConfig();
const pages = await resolvePages(config);

/**
 * Branch slugs that still exist on origin, or null if we couldn't find out.
 * Deleting a branch doesn't delete what it published, so previews outlive their
 * branches unless something prunes them — but a failed lookup must never be
 * read as "no branches exist", so on any error this returns null and pruning is
 * skipped entirely.
 */
function liveBranchSlugs() {
  try {
    const out = execFileSync("git", ["ls-remote", "--heads", "origin"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const slugs = out
      .split("\n")
      .map((line) => line.split("refs/heads/")[1])
      .filter(Boolean)
      .map((branch) => slugifyBranch(branch.trim()));
    return slugs.length > 0 ? new Set(slugs) : null;
  } catch {
    return null;
  }
}

const previews = [];
for (const entry of await readdir(targetDir, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === ".git") continue;
  const dir = path.join(targetDir, entry.name);
  let marker;
  try {
    marker = JSON.parse(await readFile(path.join(dir, ".preview-branch.json"), "utf8"));
  } catch {
    continue; // not a branch preview — part of the primary site, or hand-added
  }
  const { mtime } = await stat(dir);
  previews.push({ dir: entry.name, mtime, ...marker });
}
// Prune previews whose branch is gone. Only folders carrying the marker are
// ever touched, so the primary site's own folders are never at risk.
if (config.pruneDeletedBranches !== false) {
  const live = liveBranchSlugs();
  if (live) {
    for (let i = previews.length - 1; i >= 0; i--) {
      const preview = previews[i];
      if (live.has(preview.slug || preview.dir)) continue;
      await rm(path.join(targetDir, preview.dir), { recursive: true, force: true });
      previews.splice(i, 1);
      console.log(`Pruned ${preview.dir}/ — branch "${preview.branch}" no longer exists on origin.`);
    }
  } else {
    console.log("Could not list origin's branches; skipping prune (nothing removed).");
  }
}

previews.sort((a, b) => new Date(b.deployedAt || b.mtime) - new Date(a.deployedAt || a.mtime));

const escape = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// The list lives one level down when the primary site owns the root, and at the
// root otherwise — so links to a preview folder differ by one "../".
const intoRoot = pages.publishesToRoot;
const linkPrefix = intoRoot ? "../" : "./";

const listItems = previews
  .map((p) => {
    const when = p.deployedAt ? new Date(p.deployedAt).toISOString().slice(0, 10) : "";
    const lock = p.gated ? ' <span class="lock" title="Password protected">&#128274;</span>' : "";
    return `      <li><a href="${linkPrefix}${encodeURIComponent(p.dir)}/">${escape(p.branch || p.dir)}</a>${lock}<span class="when">${when}</span></li>`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Live previews</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 3rem auto; padding: 0 1rem; color: #111113; background: #f4f4f2; }
    h1 { font-size: 1.25rem; }
    p.note { color: #6e6e73; font-size: 0.85rem; }
    ul { padding-left: 1.25rem; }
    li { margin: 0.4rem 0; }
    a { color: #0a5fd4; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .when { color: #9a9aa0; font-size: 0.75rem; margin-left: 0.5rem; }
    .lock { font-size: 0.75rem; }
  </style>
</head>
<body>
  <h1>Live previews</h1>
${previews.length === 0 ? "  <p>No branch previews deployed yet.</p>" : `  <ul>\n${listItems}\n  </ul>`}
  <p class="note">One folder per pushed branch. &#128274; means the preview is password protected.</p>
${intoRoot ? '  <p><a href="../">&larr; Back to the site</a></p>\n' : ""}</body>
</html>
`;

const outDir = intoRoot ? path.join(targetDir, config.previewIndexDir) : targetDir;
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "index.html"), html, "utf8");
await writeFile(path.join(targetDir, ".nojekyll"), "", "utf8");

console.log(
  `Wrote ${path.relative(targetDir, path.join(outDir, "index.html"))} listing ` +
    `${previews.length} preview(s): ${previews.map((p) => p.branch).join(", ") || "(none)"}`,
);
