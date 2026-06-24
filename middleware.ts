import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";
import { NextResponse } from "next/server";
import {
  isAdminRole,
  isBetaTesterEmail,
  isTestPhaseEnabled,
} from "@/lib/test-phase/flags";
import { applySecurityHeaders } from "@/lib/security/headers";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  try {
    const { pathname } = req.nextUrl;
    const role = (req.auth?.user as { role?: string } | undefined)?.role;
    const isAdmin = isAdminRole(role);
    const email = req.auth?.user?.email;
    const twoFactorVerified =
      (req.auth?.user as { twoFactorVerified?: boolean } | undefined)
        ?.twoFactorVerified !== false;

    if (
      req.auth &&
      !twoFactorVerified &&
      (pathname.startsWith("/dashboard") ||
        pathname.startsWith("/documents") ||
        pathname.startsWith("/calculator") ||
        pathname.startsWith("/ai-assistant") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/tax-forms") ||
        pathname.startsWith("/admin"))
    ) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL("/auth/verify-2fa", req.url))
      );
    }

    // Protect authenticated routes
    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/documents") ||
      pathname.startsWith("/calculator") ||
      pathname.startsWith("/ai-assistant") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/tax-forms") ||
      pathname.startsWith("/admin")
    ) {
      if (!req.auth) {
        return applySecurityHeaders(
          NextResponse.redirect(new URL("/auth/login", req.url))
        );
      }
    }

    if (pathname.startsWith("/admin") && !isAdmin) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL("/dashboard", req.url))
      );
    }

    if (
      req.auth &&
      !isAdmin &&
      email &&
      isBetaTesterEmail(email) &&
      !isTestPhaseEnabled()
    ) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL("/auth/test-phase-ended", req.url))
      );
    }

    return applySecurityHeaders(NextResponse.next());
  } catch (error) {
    console.error("[TaxDoc middleware] Unhandled error — allowing request:", error);
    return applySecurityHeaders(NextResponse.next());
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/documents/:path*",
    "/calculator/:path*",
    "/ai-assistant/:path*",
    "/settings/:path*",
    "/tax-forms/:path*",
    "/admin/:path*",
  ],
};
