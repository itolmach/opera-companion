import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// One browser client for the whole app.
//
// This is a fully static site (see next.config.js `output: "export"`), so
// there is no server to hold a session: the browser talks to Supabase
// directly and Row Level Security is the authorization boundary. That's the
// same boundary the iOS app relies on -- the anon key below is designed to be
// public and grants nothing on its own.
//
// A single shared instance matters. Each createClient() call spins up its own
// auth client, with its own onAuthStateChange listeners and token-refresh
// timer; several of them racing over one localStorage entry is how you get a
// session that randomly vanishes on reload.
let client: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // The OAuth redirect returns with tokens in the URL fragment, which
          // this reads and turns into a session. It replaces the
          // /auth/callback route handler that a server build would need.
          detectSessionInUrl: true,
        },
      }
    );
  }
  return client;
}
