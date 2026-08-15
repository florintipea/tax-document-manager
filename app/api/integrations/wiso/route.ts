import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { protectSecret, revealSecret } from '@/lib/security/credentials';
import { wisoService } from '@/lib/integrations/wiso';

const connectSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  licenseKey: z.string().optional(),
});

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await db.wISOConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({
      connected: connection.connected,
      username: connection.username,
      lastSync: connection.lastSync,
      syncEnabled: connection.syncEnabled,
    });
  } catch (error) {
    console.error('WISO status error:', error);
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

    const connected = await wisoService.connect(validated.data);
    if (!connected) {
      return NextResponse.json({ error: 'Failed to connect to WISO' }, { status: 400 });
    }

    const encryptedCredentials = protectSecret(JSON.stringify(validated.data));

    await db.wISOConnection.upsert({
      where: { userId },
      create: {
        userId,
        username: validated.data.username,
        connected: true,
        syncEnabled: true,
        credentials: encryptedCredentials,
      },
      update: {
        username: validated.data.username,
        connected: true,
        credentials: encryptedCredentials,
      },
    });

    return NextResponse.json({ connected: true, username: validated.data.username });
  } catch (error) {
    console.error('WISO connect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    wisoService.disconnect();

    await db.wISOConnection.updateMany({
      where: { userId },
      data: {
        connected: false,
        credentials: '',
      },
    });

    return NextResponse.json({ connected: false });
  } catch (error) {
    console.error('WISO disconnect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await db.wISOConnection.findUnique({ where: { userId } });
    if (!connection?.connected || !connection.credentials) {
      return NextResponse.json({ error: 'WISO is not connected' }, { status: 400 });
    }

    const credentials = JSON.parse(revealSecret(connection.credentials));
    await wisoService.connect(credentials);

    const year = new Date().getFullYear();
    const data = await wisoService.importTaxData(year);

    await db.wISOConnection.update({
      where: { userId },
      data: { lastSync: new Date() },
    });

    return NextResponse.json({ lastSync: new Date(), data });
  } catch (error) {
    console.error('WISO sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
