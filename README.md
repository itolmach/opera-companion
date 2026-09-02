# Opera Companion

A Next.js web companion to the OperaApp iOS app. Same accounts, same
wishlist/watched data -- both apps read and write the same Supabase project.

## Shared backend

This app and the OperaApp iOS app point at the **same Supabase project**:

- Auth: Supabase Auth (Google OAuth here; Google + Sign in with Apple on
  iOS). Signing in on either app signs into the same account.
- Data: the same `user_lists` / `list_items` (wishlist) and
  `attendance_logs` (watched) tables the iOS app uses. The schema,
  migrations, and RLS policies live in the OperaApp repo under
  `supabase/`; see that repo's `SUPABASE_SETUP.md` for how to stand up the
  project and run the migrations.

Because both apps share one Postgres schema, adding a feature here that
needs a new column/table should go through that same migrations folder,
not a separate one -- otherwise the two apps drift out of sync.

## Getting Started

1. Copy `.env.local.example` to `.env.local` and fill in the Supabase
   project's URL and anon key (same project as the iOS app's
   `Config.xcconfig`).
2. In that Supabase project's dashboard, enable the **Google** provider
   under Authentication > Providers, and add
   `<your-deployed-url>/auth/callback` (and `http://localhost:3000/auth/callback`
   for local dev) to the redirect URL allow-list.
3. Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

- Yandex sign-in (previously a NextAuth provider) isn't available yet --
  Supabase Auth doesn't have a built-in Yandex provider. Yandex supports
  OpenID Connect, so it can be added back via a custom OIDC provider in the
  Supabase dashboard; see the comment in `src/app/login/page.tsx`.
- The opera catalog itself still comes live from the public
  [OpenOpus API](https://api.openopus.org), same as iOS -- there's nothing
  to self-host there.

## Deploy on Vercel

Set the two `NEXT_PUBLIC_SUPABASE_*` environment variables in the Vercel
project settings, then deploy as usual. See the
[Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).
