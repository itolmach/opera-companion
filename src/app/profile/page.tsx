"use client";
import Image from 'next/image';
import { useUser } from '@/lib/supabase/useUser';
import { getSupabase } from '@/lib/supabase/client';

export default function ProfilePage() {
  const { user, status } = useUser();

  if (status === "loading") {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4">You are not signed in.</p>
        <a href="/login" className="text-blue-600 underline">Go to Login</a>
      </div>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const displayName = (user.user_metadata?.full_name as string | undefined) ?? user.email;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm flex flex-col items-center">
        {avatarUrl && (
          <Image src={avatarUrl} alt="avatar" width={96} height={96} className="w-24 h-24 rounded-full mb-4" />
        )}
        <h1 className="text-xl font-bold mb-2">{displayName}</h1>
        <p className="mb-2 text-gray-700">{user.email}</p>
        <button
          onClick={async () => {
            await getSupabase().auth.signOut();
            // Base-path aware: a bare "/login" would leave the preview
            // folder and 404 on the Pages root.
            window.location.href = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/login`;
          }}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
