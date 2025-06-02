import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import YandexProvider from 'next-auth/providers/yandex';
import type { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@/generated/prisma/client'; // Adjusted import path

// Vercel Debugging for NEXTAUTH_SECRET
console.log(
  '[Custom Log] NEXTAUTH_SECRET on Vercel:',
  process.env.NEXTAUTH_SECRET ? 'SET (length: ' + process.env.NEXTAUTH_SECRET.length + ')' : 'NOT SET or EMPTY'
);

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = { // Export authOptions for potential use elsewhere
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    YandexProvider({
      clientId: process.env.YANDEX_CLIENT_ID || '',
      clientSecret: process.env.YANDEX_CLIENT_SECRET || '',
      authorization: { params: { scope: 'login:email login:info' } },
    }),
  ],
  session: {
    strategy: 'database', // Changed to database strategy
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async session({ session, user }) { // user object is available with database strategy
      if (session.user) {
        session.user.id = user.id; // Add the user ID from the database to the session
      }
      return session;
    },
    // The signIn callback is generally for flow control (e.g., allow/deny sign-in)
    // Logging can be done here, but it's not strictly necessary for functionality.
    // async signIn({ user, account, profile, email, credentials }) {
    //   console.log('Yandex signIn callback:', { user, account, profile, email, credentials });
    //   return true;
    // },
  },
  debug: process.env.NODE_ENV === 'development', // Enabled debug mode
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 