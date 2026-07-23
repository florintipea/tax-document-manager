export async function register() {
  try {
    const { validateEnv } = await import('@/lib/utils/env');
    validateEnv();
  } catch (error) {
    console.error('[TaxDoc] Environment validation failed (non-fatal):', error);
  }

  try {
    const { assessPersistence, logPersistenceStartupWarning } = await import(
      '@/lib/db/persistence'
    );
    logPersistenceStartupWarning(assessPersistence());
  } catch (error) {
    console.error('[TaxDoc] Persistence check failed (non-fatal):', error);
  }

  try {
    const { logRateLimitStartup } = await import('@/lib/security/rate-limit');
    logRateLimitStartup();
  } catch (error) {
    console.error('[TaxDoc] Rate limit startup log failed (non-fatal):', error);
  }

  try {
    const { isTrustCloudflareEnabled } = await import('@/lib/security/client-ip');
    if (isTrustCloudflareEnabled()) {
      console.log('[TaxDoc] Cloudflare proxy: TRUST_CLOUDFLARE enabled (CF-Connecting-IP for rate limits)');
    }
  } catch (error) {
    console.error('[TaxDoc] Cloudflare check failed (non-fatal):', error);
  }
}
