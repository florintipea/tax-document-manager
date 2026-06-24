/**
 * CSP nonce scaffold — DISABLED by default.
 *
 * Production uses `lib/security/headers.ts` with `script-src 'unsafe-inline'`.
 * This file is NOT imported anywhere until you deliberately wire it in.
 *
 * ## How to enable (post-beta)
 *
 * 1. In `middleware.ts`, generate a per-request nonce:
 *    ```ts
 *    import { randomBytes } from 'node:crypto';
 *    const nonce = randomBytes(16).toString('base64');
 *    ```
 * 2. Pass `nonce` to the response CSP header via `buildCSP(nonce)`.
 * 3. Forward the nonce to React (e.g. `x-nonce` request header → `headers()` in layout).
 * 4. Add `nonce={nonce}` to every inline `<script>` or move scripts to external files.
 * 5. Remove or gate the static CSP in `lib/security/headers.ts`.
 *
 * Do NOT enable without auditing all inline scripts — Next.js hydration may break.
 */

import { CSP_CONNECT_SRC } from '@/lib/security/headers';

/** Build a nonce-based Content-Security-Policy string. */
export function buildCSP(nonce: string): string {
  const connectSrc = CSP_CONNECT_SRC.join(' ');

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}

/** Opt-in gate — set CSP_NONCE_ENABLED=true only after full wiring (see above). */
export function isCspNonceEnabled(): boolean {
  return process.env.CSP_NONCE_ENABLED === 'true';
}
