import { describe, expect, it } from 'vitest';
import { validateUploadMagicBytes } from '@/lib/security/file-magic';

const MINIMAL_PDF = Buffer.from(
  '%PDF-1.1\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\ntrailer\n<< /Size 1 /Root 1 0 R >>\n%%EOF\n'
);

describe('upload magic bytes validation', () => {
  it('accepts valid PDF content', () => {
    const result = validateUploadMagicBytes(MINIMAL_PDF, 'invoice.pdf');
    expect(result.ok).toBe(true);
  });

  it('rejects extension mismatch', () => {
    const result = validateUploadMagicBytes(MINIMAL_PDF, 'invoice.jpg');
    expect(result.ok).toBe(false);
  });

  it('rejects unrecognized content', () => {
    const result = validateUploadMagicBytes(Buffer.from('not a file'), 'doc.pdf');
    expect(result.ok).toBe(false);
  });
});
