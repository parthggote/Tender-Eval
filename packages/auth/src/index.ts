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

// Disable adapter for OAuth providers to avoid PKCE issues on Vercel
// We'll handle user creation manually in the signIn callback
const useAdapter = false; // hasDatabaseUrl && !hasDevCredentials;

function devUserId(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex');
}

export const authConfig = {
  // Disable adapter to avoid PKCE cookie issues on Vercel serverless
  // Use JWT sessions and handle user creation in callbacks
  adapter: undefined,
  secret: keys().AUTH_SECRET,
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
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
    async signIn({ user, account, profile }) {
      // For OAuth providers, ensure user exists in database
      if (account?.provider === 'google' && user.email) {
        try {
          const dbUrl = process.env.DATABASE_URL;
          if (!dbUrl) {
            console.warn('[auth] No database configured, skipping user creation');
            return true;
          }

          // Check if user exists
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          // Create user if doesn't exist
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || null,
                image: user.image || null,
                emailVerified: new Date(),
              },
            });
          }

          // Check if account link exists
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          });

          // Create account link if doesn't exist
          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
              },
            });
          }

          // Set the user ID from database
          user.id = dbUser.id;
        } catch (err) {
          console.error('[auth] Error creating user:', err);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
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
