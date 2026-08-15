import { NextRequest, NextResponse } from 'next/server';
import { DocumentAnalyzer } from '@/lib/ai/document-analyzer';
import { extractPdfText } from '@/lib/utils/pdf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { getClientIp } from '@/lib/security/client-ip';
import {
  mimeTypeForKind,
  validateUploadMagicBytes,
} from '@/lib/security/file-magic';
import { applySecurityHeaders } from '@/lib/security/headers';

export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB guest try
const ALLOWED_EXT = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp']);

/**
 * Guest Beleg-Sortierhilfe — no login, no persistence.
 * Classifies one file via rules (+ server AI keys if present) and returns the category.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request) || 'unknown';
    const rate = await checkRateLimit(ip, {
      windowMs: 60 * 1000,
      maxRequests: 8,
      keyPrefix: 'ratelimit:guest-classify',
    });

    if (!rate.allowed) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: 'Zu viele Anfragen. Bitte kurz warten.' },
          { status: 429 }
        )
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Keine Datei übermittelt.' }, { status: 400 })
      );
    }
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Keine Datei übermittelt.' }, { status: 400 })
      );
    }

    if (file.size <= 0 || file.size > MAX_BYTES) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: 'Datei zu groß oder leer (max. 5 MB).' },
          { status: 400 }
        )
      );
    }

    const ext = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
    if (!ALLOWED_EXT.has(ext)) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: 'Nur PDF, JPG, PNG oder WEBP.' },
          { status: 400 }
        )
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const magic = validateUploadMagicBytes(buffer, file.name);
    if (!magic.ok) {
      return applySecurityHeaders(
        NextResponse.json(
          { error: `Datei ungültig (${magic.reason}).` },
          { status: 400 }
        )
      );
    }

    const mimeType = mimeTypeForKind(magic.kind);
    let extractedText = '';

    if (mimeType === 'application/pdf') {
      try {
        extractedText = await extractPdfText(buffer);
      } catch (err) {
        console.warn('[guest/classify] PDF text extract failed:', err);
      }
    }

    // Guest path: never persist; truncate text before AI for peak RAM.
    if (extractedText.length > 20_000) {
      extractedText = extractedText.slice(0, 20_000);
    }

    // Guest path always DE-oriented for marketing truthfulness
    const analysis = await DocumentAnalyzer.analyzeDocument(
      file.name,
      extractedText,
      mimeType,
      { country: 'DE', language: 'de' }
    );

    const hadTextExtract = extractedText.trim().length > 0;
    extractedText = '';

    // Never store the file — buffer goes out of scope after response
    return applySecurityHeaders(
      NextResponse.json({
        ok: true,
        fileName: file.name,
        fileSize: file.size,
        category: analysis.category,
        categoryLabelDe: analysis.categoryLabelDe || analysis.category,
        taxCategory: analysis.taxCategory ?? null,
        isTaxRelevant: analysis.isTaxRelevant,
        year: analysis.year ?? new Date().getFullYear(),
        confidence: analysis.confidence,
        method: analysis.sortMethod || 'rules',
        suggestions: analysis.suggestions || [],
        hadTextExtract,
        // Truthful claim for UI / docs
        claimDe:
          'KI-gestützte Sortierhilfe (Regeln + optional KI) — Vorschlag, keine Garantie auf perfekte Zuordnung.',
        disclaimerDe:
          'Keine Steuerberatung. Datei wird nicht dauerhaft gespeichert. Zum Speichern bitte Konto erstellen.',
      })
    );
  } catch (error) {
    console.error('[guest/classify]', error);
    return applySecurityHeaders(
      NextResponse.json(
        { error: 'Sortierung fehlgeschlagen. Bitte erneut versuchen.' },
        { status: 500 }
      )
    );
  }
}
