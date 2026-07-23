import { NextRequest, NextResponse } from 'next/server';
import { requireSessionUserId } from '@/lib/auth/session';
import {
  loadElsterPreviewForUser,
  yearFromSearchParams,
} from '@/lib/tax/elster-data';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const year =
      yearFromSearchParams(request.nextUrl.searchParams.get('year')) ??
      new Date().getFullYear() - 1;

    const preview = await loadElsterPreviewForUser(userId, year);
    if (!preview) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const format = request.nextUrl.searchParams.get('format') || 'print';

    if (format === 'json') {
      return NextResponse.json({
        export: {
          title: `TaxDoc ELSTER-Vorbereitung ${year}`,
          disclaimer: preview.disclaimerDe,
          checklist: preview.checklist,
          fields: preview.fields,
          gaps: preview.gaps,
          anlagen: preview.anlagen,
          generatedAt: preview.generatedAt,
        },
      });
    }

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8"/>
<title>TaxDoc — ELSTER-Checkliste ${year}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #111; }
  h1 { font-size: 1.4rem; }
  .disclaimer { background: #fef3c7; border: 1px solid #f59e0b; padding: 0.75rem 1rem; margin: 1rem 0; font-size: 0.9rem; }
  ol, ul { line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 1rem; }
  th, td { border: 1px solid #ddd; padding: 0.4rem 0.5rem; text-align: left; vertical-align: top; }
  th { background: #f3f4f6; }
  .prüfen { color: #b45309; font-weight: 600; }
  @media print { .no-print { display: none; } }
</style>
</head>
<body>
  <p class="no-print"><button onclick="window.print()">Drucken / PDF speichern</button></p>
  <h1>So trägst du das in Mein ELSTER ein — ${year}</h1>
  <div class="disclaimer">${escapeHtml(preview.disclaimerDe)}</div>
  <p><strong>Geschätzte Dauer:</strong> ca. 20 Minuten in Mein ELSTER (je nach Anlagen). TaxDoc übermittelt nichts — Sie senden selbst.</p>
  <p class="no-print"><a href="https://www.elster.de/eportal/start" target="_blank" rel="noopener noreferrer">Mein ELSTER öffnen</a></p>
  ${
    preview.gaps.filter((g) => g.severity === 'warn').length
      ? `<h2 style="color:#b91c1c">Fehlende / zu prüfende Unterlagen</h2><ul style="color:#b91c1c">${preview.gaps
          .filter((g) => g.severity === 'warn')
          .map((g) => `<li>${escapeHtml(g.messageDe)}</li>`)
          .join('')}</ul>`
      : ''
  }
  <h2>Ablauf-Checkliste</h2>
  <ol>
    ${preview.checklist.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}
  </ol>
  <h2>Feld-für-Feld / Zeilen-Vorschau</h2>
  <table>
    <thead>
      <tr><th>Anlage</th><th>Feld</th><th>Wert</th><th>Confidence</th><th>Belege</th><th>Hinweis</th></tr>
    </thead>
    <tbody>
      ${preview.fields
        .map(
          (f) => `<tr>
        <td>${escapeHtml(f.anlage)}</td>
        <td>${escapeHtml(f.fieldLabelDe)}</td>
        <td>${escapeHtml(f.valueFormatted ?? (f.value != null ? String(f.value) : '—'))}${
          f.needsReview ? ' <span class="prüfen">prüfen</span>' : ''
        }</td>
        <td>${escapeHtml(f.confidence)}${f.source ? ` (${escapeHtml(f.source)})` : ''}</td>
        <td>${escapeHtml(f.documents.map((d) => d.name).join(', ') || '—')}</td>
        <td>${escapeHtml(f.elsterHintDe)}</td>
      </tr>`
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="taxdoc-elster-checkliste-${year}.html"`,
      },
    });
  } catch (error) {
    console.error('ELSTER export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
