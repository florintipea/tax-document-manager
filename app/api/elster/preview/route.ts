import { NextRequest, NextResponse } from 'next/server';
import { requireSessionUserId } from '@/lib/auth/session';
import {
  loadElsterPreviewForUser,
  yearFromSearchParams,
} from '@/lib/tax/elster-data';
import { ensureDefaultCategories } from '@/lib/tax/default-categories';
import { db } from '@/lib/db/client';

function germanPreviewError(error: unknown): { status: number; error: string; code: string } {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/no such table|does not exist|P2021/i.test(message)) {
    return {
      status: 503,
      code: 'ELSTER_SCHEMA_MISSING',
      error:
        'ELSTER-Datenbanktabellen fehlen noch. Bitte Seite neu laden nach dem nächsten Deploy / Migration.',
    };
  }
  if (/no such column|P2022/i.test(message)) {
    return {
      status: 503,
      code: 'ELSTER_SCHEMA_DRIFT',
      error:
        'Steuerprofil-/ELSTER-Spalten fehlen in der Datenbank. Bitte nach dem Deploy erneut versuchen.',
    };
  }
  return {
    status: 500,
    code: 'ELSTER_PREVIEW_FAILED',
    error: 'Vorschau konnte serverseitig nicht erzeugt werden. Bitte erneut versuchen.',
  };
}

export async function GET(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json(
        {
          error: 'Bitte melden Sie sich an, um die ELSTER-Vorschau zu laden.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const year =
      yearFromSearchParams(request.nextUrl.searchParams.get('year')) ??
      new Date().getFullYear() - 1;

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { country: true },
      });
      if (user?.country) {
        await ensureDefaultCategories(db, user.country);
      }
    } catch (categoryError) {
      // Categories are helpful but must never block the preview mapping.
      console.warn('ELSTER preview: ensureDefaultCategories skipped:', categoryError);
    }

    const preview = await loadElsterPreviewForUser(userId, year);
    if (!preview) {
      return NextResponse.json(
        { error: 'Benutzerkonto nicht gefunden.', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ preview });
  } catch (error) {
    console.error('ELSTER preview error:', error);
    const mapped = germanPreviewError(error);
    return NextResponse.json(
      { error: mapped.error, code: mapped.code },
      { status: mapped.status }
    );
  }
}
