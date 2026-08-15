/**
 * Resolve client IP for rate limiting and audit logs.
 * When TRUST_CLOUDFLARE=true, prefer CF-Connecting-IP (only set when proxied via Cloudflare).
 */

export function getClientIp(request: Request): string {
  if (process.env.TRUST_CLOUDFLARE === 'true') {
    const cfIp = request.headers.get('cf-connecting-ip')?.trim();
    if (cfIp) {
      return cfIp;
    }
  }

  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) {
    return forwarded;
  }

  return 'unknown';
}

export function isTrustCloudflareEnabled(): boolean {
  return process.env.TRUST_CLOUDFLARE === 'true';
}
