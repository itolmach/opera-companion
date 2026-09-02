"use client";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign in</h1>
        <button
          onClick={handleGoogleSignIn}
          className="w-full mb-4 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
        >
          Sign in with Google
        </button>
        {/*
          Yandex sign-in used to be a NextAuth provider; Supabase Auth
          doesn't have a built-in Yandex provider. Yandex supports OpenID
          Connect, so it can come back via Authentication > Providers >
          Add a custom OIDC provider in the Supabase dashboard, then
          supabase.auth.signInWithOAuth({ provider: 'oidc', ... }) here --
          see SUPABASE_SETUP.md in the OperaApp repo for the shared project.
        */}
      </div>
    </div>
  );
}
