"use client";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign in</h1>
        <button
          onClick={() => signIn("google")}
          className="w-full mb-4 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
        >
          Sign in with Google
        </button>
        <button
          onClick={() => signIn("yandex")}
          className="w-full py-2 px-4 bg-yellow-400 text-black rounded hover:bg-yellow-500 font-semibold"
        >
          Sign in with Yandex
        </button>
      </div>
    </div>
  );
} 