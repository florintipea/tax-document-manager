'use client';

/**
 * Minimal global error UI — must NOT use root layout providers/context.
 * Required for Next.js 16 static generation of /_global-error.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
          background: '#f8fafc',
          color: '#0f172a',
        }}
      >
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          Etwas ist schiefgelaufen
        </h1>
        <p style={{ fontSize: '0.875rem', marginBottom: '1rem', color: '#475569' }}>
          TaxDoc konnte die Seite nicht laden. Bitte erneut versuchen.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: '1px solid #cbd5e1',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Erneut versuchen
        </button>
      </body>
    </html>
  );
}
