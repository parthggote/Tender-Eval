import { cache } from 'react';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

import { prisma } from '@workspace/database/client';
import { baseUrl, getPathname, routes } from '@workspace/routes';

import { keys } from '../keys';

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const hasDevCredentials = Boolean(
  process.env.DEV_AUTH_EMAIL && process.env.DEV_AUTH_PASSWORD
);

function devUserId(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex');
}

export const authConfig = {
  // If DB isn't configured (or we're explicitly using DEV credentials), don't use an adapter.
  // JWT sessions work without a DB, and this prevents callback route crashes.
  adapter:
    hasDatabaseUrl && !hasDevCredentials ? PrismaAdapter(prisma) : undefined,
  secret: keys().AUTH_SECRET,
  trustHost: true,
  // Auth.js only supports Credentials when JWT sessions are enabled.
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  cookies: {
    pkceCodeVerifier: {
      name: 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: getPathname(routes.portal.auth.SignIn, baseUrl.Portal),
    signOut: getPathname(routes.portal.auth.SignIn, baseUrl.Portal)
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (!email || !password) return null;

        // Re-evaluate flags inside authorize to catch runtime environment changes
        const devEmail = process.env.DEV_AUTH_EMAIL;
        const devPassword = process.env.DEV_AUTH_PASSWORD;
        const dbUrl = process.env.DATABASE_URL;

        if (devEmail && devPassword) {
          if (email === devEmail && password === devPassword) {
            return {
              id: devUserId(email),
              email,
              name: 'Dev Officer',
              image: null
            };
          }
          return null;
        }

        if (!dbUrl) {
          // DB auth not configured; avoid throwing inside the callback route.
          console.warn('[auth] No database or dev credentials configured');
          return null;
        }

        try {
          const user = await prisma.user.findUnique({ where: { email: String(email) } });
          if (!user?.passwordHash) return null;

          const ok = bcrypt.compareSync(String(password), user.passwordHash);
          if (!ok) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image
          };
        } catch (err) {
          console.error('[auth] credentials authorize failed', err);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    }
  }
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
export const dedupedAuth = cache(auth);
