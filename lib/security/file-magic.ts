type SupportedKind = 'pdf' | 'jpeg' | 'png' | 'webp' | 'doc' | 'docx';

const EXTENSION_TO_KIND: Record<string, SupportedKind> = {
  '.pdf': 'pdf',
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.png': 'png',
  '.webp': 'webp',
  '.doc': 'doc',
  '.docx': 'docx',
};

function matchesAt(buffer: Buffer, offset: number, signature: number[]): boolean {
  if (buffer.length < offset + signature.length) return false;
  return signature.every((byte, index) => buffer[offset + index] === byte);
}

function detectKind(buffer: Buffer): SupportedKind | null {
  if (matchesAt(buffer, 0, [0x25, 0x50, 0x44, 0x46])) return 'pdf';
  if (matchesAt(buffer, 0, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (matchesAt(buffer, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (
    matchesAt(buffer, 0, [0x52, 0x49, 0x46, 0x46]) &&
    matchesAt(buffer, 8, [0x57, 0x45, 0x42, 0x50])
  ) {
    return 'webp';
  }
  if (matchesAt(buffer, 0, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return 'doc';
  if (matchesAt(buffer, 0, [0x50, 0x4b, 0x03, 0x04])) return 'docx';
  return null;
}

export function getExtensionKind(fileName: string): SupportedKind | null {
  const extension = `.${fileName.split('.').pop()?.toLowerCase() || ''}`;
  return EXTENSION_TO_KIND[extension] ?? null;
}

export function validateUploadMagicBytes(
  buffer: Buffer,
  fileName: string
): { ok: true; kind: SupportedKind } | { ok: false; reason: string } {
  const expectedKind = getExtensionKind(fileName);
  if (!expectedKind) {
    return { ok: false, reason: 'unsupported extension' };
  }

  const detectedKind = detectKind(buffer);
  if (!detectedKind) {
    return { ok: false, reason: 'unrecognized file content' };
  }

  if (detectedKind !== expectedKind) {
    return { ok: false, reason: 'file content does not match extension' };
  }

  // docx and legacy .doc both use OLE/zip signatures; docx is zip-based.
  if (expectedKind === 'doc' && detectedKind === 'docx') {
    return { ok: false, reason: 'file content does not match extension' };
  }

  return { ok: true, kind: detectedKind };
}

export function mimeTypeForKind(kind: SupportedKind): string {
  switch (kind) {
    case 'pdf':
      return 'application/pdf';
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
}
