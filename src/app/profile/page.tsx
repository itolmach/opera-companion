"use client";
import { useSession, signOut } from "next-auth/react";
import Image from 'next/image';

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4">You are not signed in.</p>
        <a href="/login" className="text-blue-600 underline">Go to Login</a>
      </div>
    );
  }

  const { user } = session;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm flex flex-col items-center">
        {user?.image && (
          <Image src={user.image} alt="avatar" width={96} height={96} className="w-24 h-24 rounded-full mb-4" />
        )}
        <h1 className="text-xl font-bold mb-2">{user?.name}</h1>
        <p className="mb-2 text-gray-700">{user?.email}</p>
        <button
          onClick={() => signOut()}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
        >
          Sign out
        </button>
      </div>
    </div>
  );
} 