// The password gate baked into a preview's HTML at build time.
//
// GitHub Pages has no per-branch auth of its own, so every page in a gated
// build gets a full-screen overlay plus a small inline script. Only the
// SHA-256 hash of the password is ever written into the output — the
// plaintext stays out of the deployed files entirely.
//
// This is a "don't hand the link to the whole internet" gate, not real
// security: the page content is still in the DOM behind the overlay, so
// anyone determined enough to open devtools can read it. Use it for
// work-in-progress you're sharing with a handful of people; never for
// anything that would actually hurt to leak.
import { readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

export const sha256 = (str) => createHash("sha256").update(str).digest("hex");

/**
 * Where the password comes from, in priority order:
 *   1. PAGES_PASSWORD env var        — a repo secret. The right choice for a PUBLIC repo.
 *   2. PAGES_PASSWORD_HASH env var   — same, pre-hashed.
 *   3. .pages-password-hash file     — committed hash, no plaintext in git. Also public-repo safe.
 *   4. .pages-password file          — committed plaintext. PRIVATE repos only; gitignored here.
 * No source found means an ungated (fully public) build, which is the point
 * for the primary branch.
 */
export async function resolvePasswordHash(root, kind = "pages") {
  // "pages" gates branch previews; "dashboard" gates the dashboard. Same
  // mechanism, separate passwords — sharing a preview link shouldn't hand
  // over the dashboard too.
  const envVar = kind === "pages" ? "PAGES_PASSWORD" : `${kind.toUpperCase()}_PASSWORD`;
  if (process.env[envVar]?.trim()) {
    return { hash: sha256(process.env[envVar].trim()), source: `${envVar} env var` };
  }
  if (process.env[`${envVar}_HASH`]?.trim()) {
    return { hash: process.env[`${envVar}_HASH`].trim(), source: `${envVar}_HASH env var` };
  }
  for (const [file, transform] of [
    [`.${kind}-password-hash`, (s) => s],
    [`.${kind}-password`, sha256],
  ]) {
    try {
      const contents = (await readFile(path.join(root, file), "utf8")).trim();
      if (contents) return { hash: transform(contents), source: file };
    } catch {
      // Not this one; try the next.
    }
  }
  return { hash: null, source: null };
}

const MARKER = "__pw_gate__";

export function injectGate(html, hashHex) {
  if (html.includes(MARKER)) return html; // already gated — don't stack overlays
  const gate = `
<div id="__pw_gate__" role="dialog" aria-modal="true" aria-label="Password protected preview" style="position:fixed;inset:0;z-index:2147483647;background:#f4f4f2;color:#111;display:flex;align-items:center;justify-content:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">
  <form id="__pw_form__" style="max-width:320px;width:90%;text-align:center;">
    <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#666;margin-bottom:12px;">Password protected preview</div>
    <input id="__pw_input__" type="password" autocomplete="off" autofocus aria-label="Password" style="width:100%;padding:10px 12px;border:1px solid #ccc;font-family:inherit;font-size:14px;box-sizing:border-box;" placeholder="Enter password" />
    <div id="__pw_err__" role="alert" style="margin-top:8px;font-size:11px;color:#c0392b;display:none;">Incorrect password.</div>
    <button type="submit" style="margin-top:12px;width:100%;padding:10px;border:1px solid #222;background:#222;color:#fff;font-family:inherit;font-size:12px;text-transform:uppercase;letter-spacing:.05em;cursor:pointer;">Unlock</button>
  </form>
</div>
<script>
(function () {
  var HASH = ${JSON.stringify(hashHex)};
  var KEY = "pw-unlocked:" + HASH;
  var gate = document.getElementById("__pw_gate__");
  // localStorage throws outright in some embedded/private contexts, so every
  // access is guarded — a browser that can't remember the unlock should still
  // be able to unlock.
  function remembered() {
    try { return localStorage.getItem(KEY) === "1"; } catch (e) { return false; }
  }
  function remember() {
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
  }
  function unlock() {
    gate.remove();
    document.documentElement.style.overflow = "";
  }
  if (remembered()) { unlock(); return; }
  document.documentElement.style.overflow = "hidden";
  async function sha256(str) {
    var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }
  document.getElementById("__pw_form__").addEventListener("submit", async function (e) {
    e.preventDefault();
    var hash = await sha256(document.getElementById("__pw_input__").value);
    if (hash === HASH) {
      remember();
      unlock();
    } else {
      document.getElementById("__pw_err__").style.display = "block";
    }
  });
})();
</script>
`;
  // Pages built by a framework always have a </body>; a hand-written fragment
  // might not, so fall back to appending rather than silently shipping ungated.
  return html.includes("</body>") ? html.replace("</body>", `${gate}</body>`) : html + gate;
}

/** Injects the gate into every .html file under `dir`. Returns the count. */
export async function gateDirectory(dir, hashHex) {
  let gated = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      gated += await gateDirectory(full, hashHex);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      const html = await readFile(full, "utf8");
      await writeFile(full, injectGate(html, hashHex), "utf8");
      gated += 1;
    }
  }
  return gated;
}
