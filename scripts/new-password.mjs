// Generates a password — once.
//
//   node scripts/new-password.mjs             # this branch's preview password
//   node scripts/new-password.mjs dashboard   # the dashboard password
//
// The one rule that matters: a password is generated once and never rotated.
// Every link you've shared carries it, and rotating breaks all of them at
// once, silently, for people who have no other way to reach the page. That
// rule is enforced here rather than left to memory — this refuses to overwrite
// an existing password.
//
// It writes two files per kind:
//   .<kind>-password-hash  — the SHA-256 hash. Committed. Safe in a public repo.
//   .<kind>-password       — the plaintext, for local builds. Gitignored.
//
// The plaintext is printed once. Put it somewhere you'll find it again — a
// hash can't be turned back into it.
import { writeFile, access } from "node:fs/promises";
import { randomInt } from "node:crypto";
import path from "node:path";

import { ROOT, repoSlug, resolvePages } from "./pages-config.mjs";
import { sha256 } from "./password-gate.mjs";

// No 0/O/1/I/l — these get read aloud, typed from a screenshot, and copied by hand.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LENGTH = 10;
const ROTATE_FLAG = "--rotate-i-know-this-breaks-shared-links";

const KINDS = { preview: "pages", dashboard: "dashboard" };
const requested = (process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "preview")
  .replace(/^-+/, "")
  .toLowerCase();
const kind = KINDS[requested];
if (!kind) {
  console.error(`Unknown kind "${requested}". Use "preview" (default) or "dashboard".`);
  process.exit(1);
}

const exists = async (file) => {
  try {
    await access(path.join(ROOT, file));
    return true;
  } catch {
    return false;
  }
};

const pages = await resolvePages();
const rotate = process.argv.includes(ROTATE_FLAG);
const label = requested === "dashboard" ? "dashboard" : `branch "${pages.branch}"`;

for (const file of [`.${kind}-password-hash`, `.${kind}-password`]) {
  if ((await exists(file)) && !rotate) {
    console.error(
      `${file} already exists — the ${label} already has a password.\n\n` +
        `Every link shared for it uses that password. Generating a new one breaks\n` +
        `all of them permanently. Look the existing password up instead.\n\n` +
        `If invalidating those links is genuinely the goal:\n` +
        `  node scripts/new-password.mjs ${requested} ${ROTATE_FLAG}`,
    );
    process.exit(1);
  }
}

if (requested === "preview" && pages.publishesToRoot) {
  console.warn(
    `Warning: "${pages.branch}" is the primary branch and publishes to the site root.\n` +
      `Gating it puts a password in front of your public site. That's usually not what\n` +
      `you want — preview passwords belong on other branches. Continuing anyway.\n`,
  );
}

let password = "";
for (let i = 0; i < LENGTH; i++) password += ALPHABET[randomInt(ALPHABET.length)];

await writeFile(path.join(ROOT, `.${kind}-password-hash`), `${sha256(password)}\n`, "utf8");
await writeFile(path.join(ROOT, `.${kind}-password`), `${password}\n`, "utf8");

const owner = repoSlug(pages.config).split("/")[0] || "<owner>";
const url =
  requested === "dashboard"
    ? `https://${owner}.github.io${pages.repoBase}${pages.config.dashboard.dir}/`
    : `https://${owner}.github.io${pages.base}`;

console.log(
  `\nFor:      ${label}\n` +
    `Password: ${password}\n` +
    `URL:      ${url}\n\n` +
    `Wrote .${kind}-password-hash (commit this) and .${kind}-password (gitignored).\n` +
    `Save the password somewhere private now — it is not recoverable from the hash.\n` +
    `Never regenerate it.\n`,
);
