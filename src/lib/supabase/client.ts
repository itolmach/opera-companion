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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // These are baked in at build time, so missing values mean the build was
    // made without them -- typically a preview branch built before the
    // staging secrets existed. Say so plainly rather than failing somewhere
    // deep inside the Supabase client.
    if (!url || !anonKey) {
      throw new Error(
        "This build has no Supabase connection: NEXT_PUBLIC_SUPABASE_URL / " +
          "NEXT_PUBLIC_SUPABASE_ANON_KEY were not set when it was built. " +
          "For a preview branch, add the SUPABASE_*_STAGING repo secrets and " +
          "push again. See README.md."
      );
    }

    client = createClient(
      url,
      anonKey,
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
