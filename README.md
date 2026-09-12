# Opera Companion

A Next.js web companion to the OperaApp iOS app. Same accounts, same
wishlist/watched data — both apps read and write one Supabase project.

Every branch you push publishes its own password-protected preview URL, so
work in progress can be shared and tested as the **real app**, with real login
and real data.

```
https://itolmach.github.io/opera-companion/            <- main, public
https://itolmach.github.io/opera-companion/<branch>/   <- any branch, password-gated
https://itolmach.github.io/opera-companion/previews/   <- index of what's live
```

## Architecture: static, no server

This app is a **fully static export** (`output: "export"`). There is no server
and no API layer: the browser talks to Supabase directly, and Row Level
Security is the authorization boundary — the same boundary the iOS app relies
on. The anon key is designed to be public and grants nothing on its own.

That is why it can be served from GitHub Pages at all, and it means preview
URLs run the genuine app rather than a mock.

Consequences worth knowing:

- **No server-side secrets, ever.** Everything shipped is public. A feature
  needing a real secret needs a server — a Supabase Edge Function, or a host
  like Vercel — it cannot live in this build.
- **`/opera?id=<id>`, not `/opera/<id>`.** A static export must know every URL
  at build time; a path segment would mean pre-rendering one page per opera in
  the entire OpenOpus catalogue. The query string sidesteps that.
- **OAuth returns to the app itself**, not to an `/auth/callback` route. The
  browser client reads the session out of the URL (`detectSessionInUrl`).

## Two Supabase projects

| Project | Used by | Why |
| --- | --- | --- |
| **Production** | `main` (the public site) and the iOS app | Real users. One account, one dataset across web and iOS. |
| **Staging** | every preview branch | Throwaway data. |

The deploy workflow picks between them by branch name, so this is automatic:
push to `main` and you're building against production, push anything else and
you're building against staging.

Keep them separate. Every preview shares the `itolmach.github.io` origin, so a
session in `localStorage` is visible to *every* preview branch and to any other
GitHub Pages project on that domain. Pointed at production, that would mean
anyone holding a preview link could sign up against the database the iOS
release depends on, and an RLS mistake on a scratch branch would become a
production incident.

The schema for both lives in the OperaApp repo under `supabase/migrations` —
run the same migrations against each project. See its `SUPABASE_SETUP.md`.

## Setup

### 1. Environment

Copy `.env.local.example` to `.env.local` and fill in the **staging** project's
URL and anon key. Then:

```bash
npm install
npm run dev
```

### 2. Repo secrets (for CI builds)

Settings → Secrets and variables → Actions:

| Secret | Value |
| --- | --- |
| `SUPABASE_URL_PRODUCTION` | production project URL — used by `main` |
| `SUPABASE_ANON_KEY_PRODUCTION` | production anon key |
| `SUPABASE_URL_STAGING` | staging project URL — used by every other branch |
| `SUPABASE_ANON_KEY_STAGING` | staging anon key |
| `PAGES_PASSWORD` | *(optional)* gates every branch lacking its own hash |

Until the staging pair exists, preview branches build without a database and
say so at runtime. That's the intended failure: a broken preview beats a
preview quietly writing to production.

### 3. GitHub Pages

- Settings → Actions → General → Workflow permissions → **Read and write**.
- Push `main` once, then Settings → Pages → **Deploy from a branch** →
  `gh-pages` → `/ (root)`.

Not "GitHub Actions" as the source — that mode requires a `github-pages`
environment which by default blocks deploys from non-default branches, which
would kill every preview.

### 4. Supabase redirect URLs

Authentication → URL Configuration. Each branch has its own URL, so use a
wildcard rather than editing this per branch:

```
https://itolmach.github.io/opera-companion/**
http://localhost:3000/**
```

Enable the **Google** provider under Authentication → Providers.

## Sharing a branch preview

```bash
git checkout -b redesign
node scripts/new-password.mjs      # prints the password ONCE
git add -A && git commit -m "..." && git push -u origin redesign
```

A minute later it's live at `/opera-companion/redesign/`, behind that password.
Send both the link and the password.

Passwords are **generated once and never rotated** — every shared link carries
it, so rotating breaks all of them at once, silently. The script refuses to
overwrite an existing one.

The gate is a client-side SHA-256 check: it stops a link being casually
readable, it is not security. The page content sits in the DOM behind the
overlay.

To take a preview down: delete the branch, then push anything — the next deploy
prunes it.

Before pushing, it's worth loading the real output locally:

```bash
node scripts/build-gh-pages.mjs
python3 -m http.server -d .gh-pages-out 8000
```

## Notes

- **Yandex sign-in** isn't available: Supabase Auth has no built-in Yandex
  provider. Yandex speaks OpenID Connect, so it can return via a custom OIDC
  provider — see the comment in `src/app/login/page.tsx`.
- **Build depends on a third party.** `npm run build` first fetches the full
  OpenOpus catalogue dump (`scripts/fetch-and-process-data.mjs`). If OpenOpus is
  down or rate-limits, the build fails and nothing publishes. Failing loudly is
  defensible — the app is useless without a catalogue — but it does mean
  deploys depend on OpenOpus being up.

## Where the preview machinery came from

`scripts/pages-config.mjs`, `build-gh-pages.mjs`, `password-gate.mjs`,
`build-gh-pages-index.mjs`, `new-password.mjs`,
`.github/workflows/deploy-pages.yml` and `workspace.config.json` are adopted
from the [TolmachevFamily](https://github.com/itolmach/tolmachevfamily)
workspace template. Only that half was taken: the template's `content/`
dashboard and weekly-report routines stay in the workspace repo, since this is
an app repo, not a personal workspace.
