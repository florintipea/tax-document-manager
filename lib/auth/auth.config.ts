import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe NextAuth config for middleware.
 * No Prisma, bcrypt, or other Node-only imports.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-email',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-authjs.session-token'
          : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user as { role?: string }).role || 'user';
        const rememberMe = (user as { rememberMe?: boolean }).rememberMe ?? false;
        token.rememberMe = rememberMe;
        token.twoFactorVerified =
          (user as { twoFactorVerified?: boolean }).twoFactorVerified ?? true;
        token.tokenVersion = (user as { tokenVersion?: number }).tokenVersion ?? 0;
        const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
        token.exp = Math.floor(Date.now() / 1000) + maxAge;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.error) {
        return null as unknown as typeof session;
      }
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = (token.role as string) || 'user';
        (session.user as { twoFactorVerified?: boolean }).twoFactorVerified =
          token.twoFactorVerified !== false;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.AUTH_DEBUG === 'true',
  providers: [],
} satisfies NextAuthConfig;
