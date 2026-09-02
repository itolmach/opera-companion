// Builds this branch's deployable folder at `publishDir`, ready for
// peaceiris/actions-gh-pages to drop into gh-pages.
//
// Two modes, set by `build.mode` in workspace.config.json:
//
//   "static"   — your build already emits HTML files (plain HTML, Vite, Astro,
//                Eleventy, `next export`, …). We run your build command, copy
//                its output, and post-process it.
//
//   "snapshot" — your app renders on a server and has no static output. We run
//                the built Node server for a moment, fetch each route, and save
//                the returned HTML. The client bundle then hydrates that
//                snapshot exactly as it would fresh server output, so the
//                exported site stays fully interactive.
//
// Either way the last two steps are the same: bake in the password gate if
// this branch has one, and write .nojekyll so Pages serves _-prefixed files.
import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { ROOT, resolvePages } from "./pages-config.mjs";
import { gateDirectory, resolvePasswordHash } from "./password-gate.mjs";

const SNAPSHOT_PORT = Number(process.env.SNAPSHOT_PORT || 5199);
const SNAPSHOT_HOST = "127.0.0.1";

function run(command, env) {
  return new Promise((resolve, reject) => {
    console.log(`> ${command}`);
    const child = spawn(command, { cwd: ROOT, env, shell: true, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`Build command failed (exit ${code}): ${command}`)),
    );
  });
}

async function buildStatic(pages, env) {
  const { config } = pages;
  if (config.build.command) await run(config.build.command, env);

  const outDir = path.resolve(ROOT, config.build.outDir);
  const publishDir = path.resolve(ROOT, config.publishDir);
  if (outDir === publishDir) return publishDir; // build wrote straight into it

  await rm(publishDir, { recursive: true, force: true });
  await cp(outDir, publishDir, { recursive: true });
  console.log(`Copied ${config.build.outDir}/ -> ${config.publishDir}/`);
  return publishDir;
}

/**
 * Static routes to snapshot. An explicit `snapshot.routes` list wins; otherwise
 * we read them out of TanStack Router's generated route tree so adding a route
 * needs no edit here. Dynamic segments (/posts/$id) have no fixed HTML to
 * snapshot and are skipped.
 */
async function discoverRoutes(config) {
  if (config.snapshot.routes?.length) return config.snapshot.routes;

  const treePath = path.join(ROOT, config.snapshot.routeTree);
  let routeTree;
  try {
    routeTree = await readFile(treePath, "utf8");
  } catch {
    throw new Error(
      `snapshot mode: no route list. Either set snapshot.routes in workspace.config.json, ` +
        `or make ${config.snapshot.routeTree} readable.`,
    );
  }
  const match = routeTree.match(/fullPaths:\s*(.+)/);
  if (!match) throw new Error(`Could not find \`fullPaths\` in ${config.snapshot.routeTree}.`);
  const routes = match[1]
    .split("|")
    .map((s) => s.trim().replace(/^'|'$/g, ""))
    .filter((route) => route && !route.includes("$"));
  if (routes.length === 0) throw new Error("No static (non-dynamic) routes found to snapshot.");
  return routes;
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 307) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Server at ${url} did not respond within ${timeoutMs}ms`);
}

async function buildSnapshot(pages, env) {
  const { config, base } = pages;
  if (config.build.command) await run(config.build.command, env);

  const publishDir = path.resolve(ROOT, config.publishDir);
  const serverEntry = path.resolve(ROOT, config.snapshot.serverEntry);
  const routes = await discoverRoutes(config);
  console.log(`Snapshotting routes: ${routes.join(", ")}`);

  const server = spawn(process.execPath, [serverEntry], {
    env: { ...env, PORT: String(SNAPSHOT_PORT), HOST: SNAPSHOT_HOST },
    stdio: "inherit",
  });
  const killServer = () => server.kill();
  process.on("exit", killServer);

  try {
    await waitForServer(`http://${SNAPSHOT_HOST}:${SNAPSHOT_PORT}${base}`);
    for (const route of routes) {
      const url = `http://${SNAPSHOT_HOST}:${SNAPSHOT_PORT}${base}${route.replace(/^\//, "")}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to snapshot ${route}: HTTP ${res.status}`);
      const outDir =
        route === "/" ? publishDir : path.join(publishDir, route.replace(/^\//, ""));
      await mkdir(outDir, { recursive: true });
      await writeFile(path.join(outDir, "index.html"), await res.text(), "utf8");
      console.log(`Snapshotted ${route}`);
    }
  } finally {
    killServer();
  }
  return publishDir;
}

async function main() {
  const pages = await resolvePages();
  console.log(
    `Building branch "${pages.branch}" -> base ${pages.base} ` +
      `(gh-pages/${pages.destinationDir || "<root>"})`,
  );

  // Your build command gets the branch's URL base handed to it; point your
  // framework's `base` option at GITHUB_PAGES_BASE (see README).
  const env = {
    ...process.env,
    GITHUB_PAGES_BUILD: "1",
    GITHUB_PAGES_BASE: pages.base,
    GITHUB_PAGES_BRANCH_SLUG: pages.branchSlug,
  };

  const publishDir =
    pages.config.build.mode === "snapshot"
      ? await buildSnapshot(pages, env)
      : await buildStatic(pages, env);

  const { hash, source } = await resolvePasswordHash(ROOT);
  if (hash) {
    const count = await gateDirectory(publishDir, hash);
    console.log(`Password gate from ${source}: baked into ${count} HTML file(s).`);
  } else {
    console.log("No password source found — building this branch fully public.");
  }

  // A preview folder identifies itself, so the index builder can tell branch
  // previews apart from the primary site's own folders sitting next to them in
  // gh-pages (styles/, blog/, …) without guessing from names.
  if (!pages.publishesToRoot) {
    await writeFile(
      path.join(publishDir, ".preview-branch.json"),
      JSON.stringify(
        { branch: pages.branch, slug: pages.branchSlug, gated: Boolean(hash), deployedAt: new Date().toISOString() },
        null,
        2,
      ),
      "utf8",
    );
  }

  // Without this, Pages runs the output through Jekyll and drops _-prefixed files.
  await writeFile(path.join(publishDir, ".nojekyll"), "", "utf8");
  console.log(`Done: ${pages.config.publishDir}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
