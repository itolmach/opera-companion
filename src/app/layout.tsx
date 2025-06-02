import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { BookmarkIcon, CheckCircleIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import AppProviders from "@/components/AppProviders";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Opera Companion",
  description: "Your personal opera tracking app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProviders>
          <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex">
                    <Link href="/" className="flex items-center">
                      <span className="text-xl font-semibold text-gray-900">Opera Companion</span>
                    </Link>
                  </div>
                  <div className="flex space-x-8">
                    <Link href="/wishlist" className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-900">
                      <BookmarkIcon className="h-6 w-6" />
                    </Link>
                    <Link href="/watched" className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-900">
                      <CheckCircleIcon className="h-6 w-6" />
                    </Link>
                    <Link href="/profile" className="inline-flex items-center px-1 pt-1 text-gray-500 hover:text-gray-900">
                      <UserCircleIcon className="h-6 w-6" />
                    </Link>
                  </div>
                </div>
              </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
