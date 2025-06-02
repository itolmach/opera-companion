"use client";
import { SessionProvider } from "next-auth/react";
import { Providers } from "@/components/Providers";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Providers>
        {children}
      </Providers>
    </SessionProvider>
  );
} 