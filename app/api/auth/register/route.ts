import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getClientIp } from "@/lib/security/client-ip";

const registerSchema = z.object({
  email: z.string().email("Invalid email address").transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    ),
  name: z.string().min(2, "Name must be at least 2 characters"),
  country: z.string().optional().default("DE"),
  language: z.string().optional().default("en"),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const { checkRateLimit } = await import("@/lib/security/rate-limit");
    const rateLimitResult = await checkRateLimit(ip, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5,
      keyPrefix: "ratelimit:register",
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const { email, password, name, country, language } = validated.data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        country,
        language,
      },
    });

    // Create trial subscription
    try {
      await db.subscription.create({
        data: {
          userId: user.id,
          planId: "trial",
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
      });
    } catch (subError) {
      console.error("Failed to create subscription:", subError);
      // Continue even if subscription creation fails
    }

    // Log security event
    try {
      await db.securityEvent.create({
        data: {
          userId: user.id,
          type: "account_created",
          severity: "low",
          description: "New account created",
          ipAddress: ip,
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      });
    } catch (logError) {
      console.error("Failed to log security event:", logError);
      // Don't fail registration if logging fails
    }

    return NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

