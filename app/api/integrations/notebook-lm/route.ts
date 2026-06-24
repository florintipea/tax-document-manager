import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUserId } from '@/lib/auth/session';
import { db } from '@/lib/db/client';
import { protectSecret, revealSecret } from '@/lib/security/credentials';
import { notebookLMService } from '@/lib/integrations/notebook-lm';

const connectSchema = z.object({
  apiKey: z.string().min(1),
});

const createNotebookSchema = z.object({
  name: z.string().min(1),
});

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connections = await db.notebookLMConnection.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      connected: connections.some((connection) => connection.connected),
      notebooks: connections.map((connection) => ({
        id: connection.notebookId,
        name: connection.name,
        documentCount: connection.documentCount,
        lastSync: connection.lastSync,
        connected: connection.connected,
      })),
    });
  } catch (error) {
    console.error('Notebook LM status error:', error);
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

    if (body.action === 'create-notebook') {
      const validated = createNotebookSchema.safeParse(body);
      if (!validated.success) {
        return NextResponse.json({ error: 'Invalid notebook name' }, { status: 400 });
      }

      const existing = await db.notebookLMConnection.findFirst({
        where: { userId, connected: true },
        orderBy: { updatedAt: 'desc' },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Connect Notebook LM first' }, { status: 400 });
      }

      await notebookLMService.connect({ apiKey: revealSecret(existing.apiKey) });

      const notebook = await notebookLMService.createNotebook(validated.data.name);
      if (!notebook) {
        return NextResponse.json({ error: 'Failed to create notebook' }, { status: 400 });
      }

      await db.notebookLMConnection.create({
        data: {
          userId,
          notebookId: notebook.id,
          name: notebook.name,
          apiKey: existing.apiKey,
          connected: true,
        },
      });

      return NextResponse.json({ notebook });
    }

    const validated = connectSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const connected = await notebookLMService.connect({ apiKey: validated.data.apiKey });
    if (!connected) {
      return NextResponse.json({ error: 'Failed to connect to Notebook LM' }, { status: 400 });
    }

    const encryptedApiKey = protectSecret(validated.data.apiKey);
    const defaultNotebook = await notebookLMService.createNotebook('Tax Documents');

    if (!defaultNotebook) {
      return NextResponse.json({ error: 'Failed to initialize Notebook LM workspace' }, { status: 400 });
    }

    const existingDefault = await db.notebookLMConnection.findFirst({
      where: { userId, notebookId: defaultNotebook.id },
    });

    if (existingDefault) {
      await db.notebookLMConnection.update({
        where: { id: existingDefault.id },
        data: {
          apiKey: encryptedApiKey,
          connected: true,
          name: defaultNotebook.name,
        },
      });
    } else {
      await db.notebookLMConnection.create({
        data: {
          userId,
          notebookId: defaultNotebook.id,
          name: defaultNotebook.name,
          apiKey: encryptedApiKey,
          connected: true,
        },
      });
    }

    return NextResponse.json({ connected: true });
  } catch (error) {
    console.error('Notebook LM connect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    notebookLMService.disconnect();

    await db.notebookLMConnection.updateMany({
      where: { userId },
      data: { connected: false },
    });

    return NextResponse.json({ connected: false });
  } catch (error) {
    console.error('Notebook LM disconnect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const notebookId = body.notebookId as string | undefined;
    if (!notebookId) {
      return NextResponse.json({ error: 'notebookId is required' }, { status: 400 });
    }

    const connection = await db.notebookLMConnection.findFirst({
      where: { userId, notebookId, connected: true },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Notebook not found' }, { status: 404 });
    }

    await notebookLMService.connect({ apiKey: revealSecret(connection.apiKey) });

    const documents = await db.document.findMany({
      where: { userId },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const synced = await notebookLMService.syncDocuments(notebookId, documents);

    if (!synced) {
      return NextResponse.json({ error: 'Failed to sync documents' }, { status: 400 });
    }

    await db.notebookLMConnection.updateMany({
      where: { userId, notebookId },
      data: {
        lastSync: new Date(),
        documentCount: documents.length,
      },
    });

    return NextResponse.json({ lastSync: new Date(), documentCount: documents.length });
  } catch (error) {
    console.error('Notebook LM sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
