// Single source of truth for "where does this branch publish, and under what
// URL base" — read by the build script, the index builder, and the deploy
// workflow, so those three can never disagree about a path.
//
// CLI usage (what the workflow calls):
//   node scripts/pages-config.mjs            # human-readable dump
//   node scripts/pages-config.mjs --github-output   # key=value into $GITHUB_OUTPUT
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DEFAULTS = {
  repo: "",
  title: "Workspace",
  primaryBranch: "main",
  primaryDeploy: "root", // "root" | "subpath"
  previewIndexDir: "previews",
  pruneDeletedBranches: true,
  publishDir: ".gh-pages-out",
  build: { mode: "static", command: "", outDir: "site" },
  snapshot: { serverEntry: ".output/server/index.mjs", routeTree: "src/routeTree.gen.ts", routes: [] },
  content: {
    dir: "content",
    notes: "notes",
    published: "published",
    tasks: "tasks",
    agendas: "agendas",
    assets: "assets",
    reports: "reports",
  },
  dashboard: {
    dir: "dashboard",
    title: "Workspace Pulse",
    tagline: "Everything current, in one place. Regenerates on every push.",
    deckTitle: "Weekly Sync & Updates",
    deckEyebrow: "DESIGN & UX",
    deckDir: "reviews",
  },
  archive: { staleDays: 90, neverArchive: ["main", "gh-pages", "design-system", "HEAD"] },
};

export async function loadSiteConfig() {
  let raw = {};
  try {
    raw = JSON.parse(await readFile(path.join(ROOT, "workspace.config.json"), "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw new Error(`workspace.config.json is not valid JSON: ${err.message}`);
  }
  return {
    ...DEFAULTS,
    ...raw,
    build: { ...DEFAULTS.build, ...(raw.build || {}) },
    snapshot: { ...DEFAULTS.snapshot, ...(raw.snapshot || {}) },
    content: { ...DEFAULTS.content, ...(raw.content || {}) },
    dashboard: { ...DEFAULTS.dashboard, ...(raw.dashboard || {}) },
    archive: { ...DEFAULTS.archive, ...(raw.archive || {}) },
  };
}

/** Absolute path to one of the content folders (notes, tasks, agendas, …). */
export function contentPath(config, key) {
  return path.join(ROOT, config.content.dir, config.content[key] ?? key);
}

/** owner/name of the repo, from the CI env or the config. */
export function repoSlug(config) {
  return process.env.GITHUB_REPOSITORY || config.repo || "";
}

/** Base URL for linking a file on GitHub, e.g. …/blob/main. */
export function githubBlobBase(config, branch = null) {
  const slug = repoSlug(config);
  if (!slug) return null;
  return `https://github.com/${slug}/blob/${branch || config.primaryBranch}`;
}

/** Folder/URL-safe form of a branch name — `feat/thing` becomes `feat-thing`, so every
 *  preview is one flat folder under gh-pages instead of a nested tree. */
export function slugifyBranch(branch) {
  return branch.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

function detectBranch() {
  // GITHUB_PAGES_BRANCH_SLUG wins so a local build can pretend to be any branch.
  if (process.env.GITHUB_PAGES_BRANCH_SLUG) return process.env.GITHUB_PAGES_BRANCH_SLUG;
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME;
  try {
    return execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: ROOT })
      .toString()
      .trim();
  } catch {
    return "preview";
  }
}

/** `/` for a user/org site (`<owner>.github.io`), `/<repo>/` for a project site. */
export function repoBasePath(config) {
  const slug = process.env.GITHUB_REPOSITORY || config.repo || "";
  const [owner, name] = slug.split("/");
  if (!owner || !name) {
    // No repo known (fresh clone, no CI): assume a user site at the root. Set
    // "repo": "<owner>/<name>" in workspace.config.json to pin it.
    return "/";
  }
  return name.toLowerCase() === `${owner.toLowerCase()}.github.io` ? "/" : `/${name}/`;
}

export async function resolvePages(config = null) {
  const cfg = config || (await loadSiteConfig());
  const branch = detectBranch();
  const branchSlug = slugifyBranch(branch);
  const isPrimary = branch === cfg.primaryBranch || branchSlug === slugifyBranch(cfg.primaryBranch);
  const repoBase = repoBasePath(cfg);
  const publishesToRoot = isPrimary && cfg.primaryDeploy === "root";

  return {
    config: cfg,
    branch,
    branchSlug,
    isPrimary,
    repoBase,
    publishesToRoot,
    // What the site's asset URLs are relative to. Hand this to your framework
    // (Vite `base`, Astro `base`, …) via the GITHUB_PAGES_BASE env var.
    base: publishesToRoot ? repoBase : `${repoBase}${branchSlug}/`,
    // Where peaceiris/actions-gh-pages drops the build inside the gh-pages branch.
    // Empty string means the gh-pages root.
    destinationDir: publishesToRoot ? "" : branchSlug,
    // Where the auto-generated list of live previews goes. When the primary
    // branch owns the gh-pages root, the index can't sit there too.
    previewIndexDir: publishesToRoot ? cfg.previewIndexDir : "",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const info = await resolvePages();
  const pairs = {
    branch: info.branch,
    branch_slug: info.branchSlug,
    is_primary: String(info.isPrimary),
    base: info.base,
    destination_dir: info.destinationDir,
    publish_dir: info.config.publishDir,
    preview_index_dir: info.previewIndexDir,
  };
  if (process.argv.includes("--github-output") && process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      Object.entries(pairs)
        .map(([k, v]) => `${k}=${v}`)
        .join("\n") + "\n",
    );
  }
  for (const [k, v] of Object.entries(pairs)) console.log(`${k}=${v}`);
}
