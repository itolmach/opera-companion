---
name: site-preview
description: Publish this site or a branch of it to GitHub Pages, with password-protected per-branch previews. Use when the user wants to put a page online, share work in progress privately, get a preview link for a branch, password-protect or unprotect a preview, look up or (rarely) rotate a preview password, take a preview down, ship a branch publicly, or set up GitHub Pages for this repo the first time.
---

# Publishing and sharing this site

Every branch pushed to this repo deploys to its own URL. The primary branch
publishes publicly at the site root; every other branch publishes to
`/<branch-slug>/` behind a password. `README.md` explains the machinery; this
skill is the set of moves.

Before anything else, read `workspace.config.json` — `primaryBranch`, `repo` and
`build` decide most of what follows. `node scripts/pages-config.mjs` prints
where the *current* branch publishes; run it rather than guessing a URL.

## Share work in progress (the common one)

```bash
git checkout -b <branch>
node scripts/new-password.mjs      # prints the password ONCE
git add -A && git commit -m "..." && git push -u origin <branch>
```

Then hand back **both** the URL and the password — a link alone is useless, and
this is the only moment the password is recoverable.

Tell the user to save it. The plaintext lands in `.pages-password` (gitignored,
local only) and the hash in `.pages-password-hash` (commit it). If the repo is
public, the plaintext must not be committed anywhere — including a table in
`README.md`. `PASSWORDS.local.md` is gitignored for exactly this.

If the script refuses because the branch already has a password: that's working
as intended. Find the existing password; don't rotate. Every link already shared
for that branch stops working the moment you do, silently, and the people
holding those links usually have no other way in. Rotate only if the user says
invalidating them is the point — then use
`--rotate-i-know-this-breaks-shared-links` and tell them plainly what just
broke.

## Ship it publicly

Merge into the primary branch and push. Two things to check before you do:

- No `.pages-password` / `.pages-password-hash` is riding along in the merge —
  that would put a password in front of the public site.
- Links in the pages are relative (`./styles/…`), or the framework's base is
  wired to `GITHUB_PAGES_BASE`. Absolute `/styles/…` paths work at the root and
  break in every preview folder, so the bug shows up on the *next* branch, not
  this one.

## Take a preview down

Delete the branch, then push anything (or re-run the workflow) — the deploy
after the deletion is what prunes the folder. Deleting the branch alone leaves
the preview live.

## First-time setup

Follow `MANUAL.md` → Setup, end to end. The two steps that are easy to get wrong:

- Pages **Source must be "Deploy from a branch" → `gh-pages` → `/ (root)`**, not
  "GitHub Actions". The Actions source requires a `github-pages` environment
  that by default blocks deploys from non-default branches — every preview
  branch would silently fail to publish.
- Actions needs **read and write** workflow permissions to push `gh-pages`.

Pages on a private repo needs a paid plan. If the user is on a free account, the
repo has to be public — which decides the password handling (hashes only, never
plaintext). Raise this before setting anything up, not after.

## Plug in a real framework

Set `build.command` and `build.outDir` in `workspace.config.json`, uncomment the
dependency-install step in `.github/workflows/deploy-pages.yml`, and point the
framework's `base` at `process.env.GITHUB_PAGES_BASE`. For a server-rendered app
with no static output, use `"mode": "snapshot"` — see README, "Bringing your own
framework."

## Design changes

Colours, type, spacing: `site/styles/tokens.css`, as named tokens. Then open
`site/style-guide/` and check **both** themes with the toggle — dark values rot
unnoticed otherwise. Moving a component or tokens between branches: `ADOPT.md`,
and run its token check first (a component reading an undeclared token renders
as nothing, with no error).

## Before you push, always

```bash
node scripts/build-gh-pages.mjs
python3 -m http.server -d .gh-pages-out 8000    # then actually load it
```

For a gated branch, confirm the gate appears *and* that the password unlocks it.
A push that publishes a broken preview costs the user a shared link that 404s.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Preview 404s | Pages source not set to `gh-pages` / root, or the first deploy hasn't finished |
| Page loads unstyled | Absolute asset paths; use relative, or wire `GITHUB_PAGES_BASE` |
| Gate never appears | No password source on that branch — check `.pages-password-hash` is committed |
| Gate appears on the public site | A password file got merged into the primary branch |
| Preview still live after deleting the branch | Nothing has deployed since; push to trigger the prune |
| Two deploys, one folder missing | Concurrent runs — `concurrency` must queue, not cancel |
