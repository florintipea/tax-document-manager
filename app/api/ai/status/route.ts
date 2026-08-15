import { NextResponse } from 'next/server';
import { requireSessionUserId } from '@/lib/auth/session';
import {
  isAIConfiguredForUser,
  isServerAIConfigured,
  getServerProviderStatus,
} from '@/lib/ai/config';
import { getAIServiceForUser } from '@/lib/ai/providers';
import { listUserAIProviders } from '@/lib/ai/user-providers';

export async function GET() {
  const userId = await requireSessionUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userConfigured = await isAIConfiguredForUser(userId);
  const serverConfigured = isServerAIConfigured();
  const configured = userConfigured || serverConfigured;

  const userConnections = await listUserAIProviders(userId);

  let availableProviders: string[] = [];
  if (userConfigured) {
    const service = await getAIServiceForUser(userId);
    availableProviders = service.getAvailableProviders();
  } else if (serverConfigured) {
    availableProviders = Object.entries(getServerProviderStatus())
      .filter(([, enabled]) => enabled)
      .map(([name]) => name);
  }

  return NextResponse.json({
    configured,
    userConfigured,
    serverConfigured,
    providers: availableProviders,
    userProviders: userConnections.map((c) => ({
      provider: c.provider,
      isActive: c.isActive,
      connected: c.hasApiKey,
      keyUnreadable: c.keyUnreadable,
      connectionType: c.connectionType,
      keyPreview: c.keyPreview,
      model: c.model,
      connectedAt: c.connectedAt,
    })),
    serverProviders: getServerProviderStatus(),
    source: userConfigured ? 'user' : serverConfigured ? 'server' : 'none',
  });
}
