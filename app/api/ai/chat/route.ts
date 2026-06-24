import { NextRequest, NextResponse } from "next/server";
import { requireSessionUserId } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { getAIServiceForUser } from "@/lib/ai/providers";
import { isAIConfiguredForUser } from "@/lib/ai/config";
import { isAIConfigurationError } from "@/lib/ai/errors";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { checkAiMessageAllowed } from "@/lib/billing/guards";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1).max(5000),
  context: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(userId, {
      windowMs: 60 * 1000,
      maxRequests: 50,
      keyPrefix: "ratelimit:ai_chat",
    });

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const aiGate = await checkAiMessageAllowed(userId);
    if (!aiGate.allowed) {
      return aiGate.response;
    }

    const body = await request.json();
    const validated = chatSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        documents: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const context = {
      country: user?.country,
      language: user?.language,
      documentCount: user?.documents.length || 0,
      ...validated.data.context,
    };

    const configured = await isAIConfiguredForUser(userId);
    if (!configured) {
      return NextResponse.json(
        {
          error: "No AI provider connected. Connect your account in Settings → AI Providers.",
          code: "AI_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    const aiService = await getAIServiceForUser(userId);
    const startTime = Date.now();
    const response = await aiService.getResponse(validated.data.message, context);
    const latency = Date.now() - startTime;

    try {
      await db.aIInteraction.create({
        data: {
          userId,
          message: validated.data.message,
          response: response.message,
          provider: response.provider || "unknown",
          model: response.model || "unknown",
          tokensUsed: response.tokensUsed,
          latency,
          confidence: response.confidence,
          context: validated.data.context ? JSON.stringify(validated.data.context) : null,
        },
      });
    } catch (logError) {
      console.error("Failed to log AI interaction:", logError);
    }

    return NextResponse.json({
      message: response.message,
      provider: response.provider,
      model: response.model,
      latency,
      confidence: response.confidence,
    });
  } catch (error) {
    console.error("AI chat error:", error);

    if (isAIConfigurationError(error)) {
      return NextResponse.json(
        {
          error: "No AI provider connected. Connect your account in Settings → AI Providers.",
          code: "AI_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to get AI response. Please try again.",
        code: "AI_REQUEST_FAILED",
      },
      { status: 500 }
    );
  }
}
