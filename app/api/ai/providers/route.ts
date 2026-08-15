import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUserId } from '@/lib/auth/session';
import {
  disconnectUserAIProvider,
  listUserAIProviders,
  upsertUserAIProvider,
  getDecryptedApiKeyForProvider,
  type UserAIProviderType,
} from '@/lib/ai/user-providers';
import { createAIService } from '@/lib/ai/providers';
import { getServerProviderStatus } from '@/lib/ai/config';
import { clientSafeErrorMessage } from '@/lib/security/api-response';

const connectSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'custom']),
  apiKey: z.string().min(8).optional(),
  model: z.string().optional(),
  label: z.string().optional(),
  connectionType: z.enum(['api_key', 'oauth']).optional(),
});

const disconnectSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'custom']),
});

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connections = await listUserAIProviders(userId);
    const serverProviders = getServerProviderStatus();

    return NextResponse.json({
      connections,
      serverProviders,
      oauth: {
        google: {
          available: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
          mode: 'api_key_guided',
        },
      },
    });
  } catch (error) {
    console.error('AI providers list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = connectSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { provider, apiKey, model, label, connectionType } = validated.data;

    if (provider === 'custom' && !label?.trim()) {
      return NextResponse.json(
        { error: 'Label is required for custom providers' },
        { status: 400 }
      );
    }

    if (!apiKey?.trim()) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    await upsertUserAIProvider(userId, {
      provider,
      apiKey: apiKey.trim(),
      model,
      label,
      connectionType: connectionType || 'api_key',
    });

    const connections = await listUserAIProviders(userId);

    return NextResponse.json({
      success: true,
      connections,
    });
  } catch (error) {
    console.error('AI provider connect error:', error);
    return NextResponse.json({ error: 'Failed to connect provider' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = disconnectSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    await disconnectUserAIProvider(userId, validated.data.provider);

    const connections = await listUserAIProviders(userId);

    return NextResponse.json({
      success: true,
      connections,
    });
  } catch (error) {
    console.error('AI provider disconnect error:', error);
    return NextResponse.json({ error: 'Failed to disconnect provider' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body?.action;

    if (action !== 'test') {
      return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
    }

    const provider = body?.provider as UserAIProviderType | undefined;
    if (!provider || !['openai', 'anthropic', 'google'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider for test' }, { status: 400 });
    }

    const apiKey = await getDecryptedApiKeyForProvider(userId, provider);
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'Provider key missing or unreadable. Disconnect and reconnect your API key.',
          code: 'AI_KEY_UNREADABLE',
        },
        { status: 404 }
      );
    }

    const connections = await listUserAIProviders(userId);
    const storedModel = connections.find((c) => c.provider === provider)?.model;

    const config =
      provider === 'openai'
        ? { openai: { apiKey, model: storedModel || undefined } }
        : provider === 'anthropic'
          ? { anthropic: { apiKey, model: storedModel || undefined } }
          : { google: { apiKey, model: storedModel || undefined } };

    const service = createAIService(config);
    const response = await service.getResponse('Reply with exactly: OK');

    return NextResponse.json({
      success: true,
      provider: response.provider,
      model: response.model,
      preview: response.message.slice(0, 120),
    });
  } catch (error) {
    console.error('AI provider test error:', error);
    const detail =
      error instanceof Error
        ? error.message
            .replace(/sk-[a-zA-Z0-9._-]{8,}/g, '[key]')
            .replace(/AIza[a-zA-Z0-9._-]{8,}/g, '[key]')
            .slice(0, 280)
        : null;
    return NextResponse.json(
      {
        error: detail
          ? `Connection test failed: ${detail}`
          : clientSafeErrorMessage(error, 'Connection test failed'),
        code: 'AI_TEST_FAILED',
        detail: detail || undefined,
      },
      { status: 500 }
    );
  }
}
