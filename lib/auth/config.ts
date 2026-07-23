import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkUserAppAccess } from "@/lib/test-phase/access";
import { verifyTwoFactorLoginToken } from "@/lib/auth/two-factor-tokens";
import {
  formatLockoutMessage,
  getAccountLockUntil,
  isAdminLoginEmail,
} from "@/lib/auth/login-lockout";
import { authConfig } from "@/lib/auth/auth.config";

const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8),
  remember: z.enum(["true", "false"]).optional(),
});

const twoFactorLoginSchema = z.object({
  twoFactorToken: z.string().min(10),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db) as any,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember Me", type: "text" },
        twoFactorToken: { label: "Two Factor Token", type: "text" },
      },
      async authorize(credentials) {
        if (credentials?.twoFactorToken) {
          const tokenValidated = twoFactorLoginSchema.safeParse({
            twoFactorToken: credentials.twoFactorToken,
          });

          if (!tokenValidated.success) {
            throw new Error("Invalid two-factor login token");
          }

          const tokenPayload = verifyTwoFactorLoginToken(
            tokenValidated.data.twoFactorToken
          );

          if (!tokenPayload) {
            throw new Error("Two-factor login expired. Please sign in again.");
          }

          const user = await db.user.findUnique({
            where: { id: tokenPayload.userId },
          });

          if (!user || !user.twoFactorEnabled) {
            throw new Error("Invalid two-factor login");
          }

          const access = await checkUserAppAccess(
            user.id,
            user.email,
            user.role
          );
          if (!access.allowed) {
            throw new Error(access.message);
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role || "user",
            rememberMe: tokenPayload.rememberMe,
            twoFactorVerified: true,
            tokenVersion: user.tokenVersion,
          };
        }

        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Validate input
        const validated = loginSchema.safeParse({
          email: credentials.email,
          password: credentials.password,
          remember: credentials.remember === "true" ? "true" : "false",
        });

        if (!validated.success) {
          throw new Error("Invalid email or password format");
        }

        // Find user
        const user = await db.user.findUnique({
          where: { email: validated.data.email },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        const isAdmin = isAdminLoginEmail(validated.data.email);

        // Check if account is locked (admin exempt — ensure-admin clears lockout on startup)
        if (user.lockedUntil && user.lockedUntil > new Date() && !isAdmin) {
          throw new Error(formatLockoutMessage(user.lockedUntil));
        }

        // Verify password
        const isValid = await bcrypt.compare(
          validated.data.password,
          user.passwordHash
        );

        if (!isValid) {
          let failedAttempts = user.failedLoginAttempts;
          let lockedUntil: Date | null = user.lockedUntil;

          if (!isAdmin) {
            failedAttempts += 1;
            lockedUntil = getAccountLockUntil(failedAttempts);

            await db.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: failedAttempts,
                lockedUntil,
              },
            });
          }

          // Log security event
          try {
            await db.securityEvent.create({
              data: {
                userId: user.id,
                type: "failed_login",
                severity: lockedUntil ? "high" : "medium",
                description: `Failed login attempt ${failedAttempts}`,
                ipAddress: "unknown", // Will be set from request
                userAgent: "unknown",
              },
            });
          } catch (logError) {
            // Don't fail the login attempt if logging fails
            console.error("Failed to log security event:", logError);
          }

          throw new Error("Ungültige E-Mail oder Passwort.");
        }

        if (user.twoFactorEnabled) {
          throw new Error("Two-factor authentication required");
        }

        // Reset failed login attempts and update login timestamp
        await db.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
          },
        });

        const access = await checkUserAppAccess(
          user.id,
          user.email,
          user.role
        );
        if (!access.allowed) {
          throw new Error(access.message);
        }

        // Log successful login
        try {
          await db.securityEvent.create({
            data: {
              userId: user.id,
              type: "login",
              severity: "low",
              description: "Successful login",
              ipAddress: "unknown",
              userAgent: "unknown",
            },
          });
        } catch (logError) {
          // Don't fail the login attempt if logging fails
          console.error("Failed to log security event:", logError);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role || 'user',
          rememberMe: validated.data.remember === "true",
          twoFactorVerified: !user.twoFactorEnabled,
          tokenVersion: user.tokenVersion,
        };
      },
    }),
    // Email provider can be added later when SMTP is configured
    // Requires: npm install nodemailer
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, ...rest }) {
      const baseCallbacks = authConfig.callbacks;
      token = (await baseCallbacks?.jwt?.({ token, user, ...rest })) ?? token;

      if (!user && token.id && process.env.NEXT_RUNTIME !== 'edge') {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { twoFactorEnabled: true, role: true, tokenVersion: true },
        });

        if (!dbUser) {
          token.error = 'UserNotFound';
        } else {
          token.role = dbUser.role || 'user';
          if (dbUser.twoFactorEnabled && token.twoFactorVerified !== true) {
            token.error = 'TwoFactorRequired';
          }
          if (
            typeof token.tokenVersion === 'number' &&
            dbUser.tokenVersion !== token.tokenVersion
          ) {
            token.error = 'SessionInvalidated';
          }
        }
      }
      return token;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        try {
          // Create default subscription for new users
          await db.subscription.create({
            data: {
              userId: user.id,
              planId: "trial",
              status: "active",
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
            },
          });
        } catch (error) {
          console.error("Failed to create subscription for new user:", error);
          // Don't fail sign-in if subscription creation fails
        }
      }
    },
  },
});

