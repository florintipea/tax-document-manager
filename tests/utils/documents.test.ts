import { describe, expect, it } from 'vitest';
import {
  buildStoredFileName,
  buildStoredFilePath,
  resolveDocumentFilePath,
  sanitizeFileName,
} from '@/lib/utils/documents';

describe('document file name safety', () => {
  it('strips path traversal from upload names', () => {
    expect(sanitizeFileName('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFileName('..')).toBe('upload.bin');
    expect(sanitizeFileName('.')).toBe('upload.bin');
    expect(sanitizeFileName('foo/../../../bar.pdf')).toBe('bar.pdf');
  });

  it('rejects separators and null bytes', () => {
    expect(sanitizeFileName('foo/bar.pdf')).toBe('bar.pdf');
    expect(sanitizeFileName('foo\\bar.pdf')).toBe('foo_bar.pdf');
    expect(sanitizeFileName('safe\0name.pdf')).toBe('safename.pdf');
  });

  it('prefixes stored names with a timestamp', () => {
    const stored = buildStoredFileName('invoice.pdf');
    expect(stored).toMatch(/^\d+-invoice\.pdf$/);
  });

  it('keeps resolved paths inside the user upload directory', () => {
    const userId = 'user-123';
    const safePath = buildStoredFilePath(userId, '1700000000000-invoice.pdf');
    expect(safePath).toContain(userId);
    expect(safePath).toContain('1700000000000-invoice.pdf');

    expect(() => buildStoredFilePath(userId, '../other-user/secret.pdf')).toThrow(
      'Invalid file path'
    );
    expect(() => buildStoredFilePath(userId, '..')).toThrow('Invalid file path');
  });

  it('rejects traversal when resolving stored file URLs', () => {
    const userId = 'user-123';
    expect(resolveDocumentFilePath(userId, `/uploads/${userId}/1700000000000-invoice.pdf`)).toContain(
      userId
    );
    expect(resolveDocumentFilePath(userId, `/uploads/${userId}/../other/secret.pdf`)).toBeNull();
    expect(resolveDocumentFilePath(userId, `/uploads/${userId}/foo/bar.pdf`)).toBeNull();
    expect(resolveDocumentFilePath(userId, '/uploads/other-user/file.pdf')).toBeNull();
  });
});
