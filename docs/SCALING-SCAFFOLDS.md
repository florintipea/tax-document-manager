# Scaling Scaffolds (CSP nonces + S3)

Disabled preparation for post-beta scaling. **Nothing here is active in production** until you wire it in and set env vars.

## Status

| Scaffold | File | Active? | Env gate |
|----------|------|---------|----------|
| CSP nonces | `lib/security/csp-scaffold.ts` | No | `CSP_NONCE_ENABLED=true` (after wiring) |
| S3 storage | `lib/storage/s3-scaffold.ts` | No | `USE_S3=true` |

Current production paths:

- CSP: `lib/security/headers.ts` (`script-src 'unsafe-inline'`)
- Files: local disk under `DATA_DIR/uploads` via `lib/utils/paths.ts`

## Enable CSP nonces

1. Read comments in `lib/security/csp-scaffold.ts`.
2. Generate a per-request nonce in `middleware.ts`.
3. Set `Content-Security-Policy` with `buildCSP(nonce)` instead of the static header.
4. Pass nonce into the app layout; add `nonce={nonce}` to inline scripts.
5. Set `CSP_NONCE_ENABLED=true` only after end-to-end verification.
6. Keep beta on `'unsafe-inline'` until tester feedback is stable.

**Risk:** Breaking Next.js client hydration if any inline script lacks the nonce.

## Enable S3 storage

1. Create an S3 bucket and IAM user with `PutObject`, `GetObject`, `DeleteObject`.
2. Set on Render (or staging):

   | Variable | Example |
   |----------|---------|
   | `USE_S3` | `true` |
   | `AWS_REGION` | `eu-central-1` |
   | `AWS_ACCESS_KEY_ID` | `AKIA…` |
   | `AWS_SECRET_ACCESS_KEY` | (secret) |
   | `S3_BUCKET` | `taxdoc-uploads-prod` |

3. Update document upload route to call `uploadBufferToS3` instead of `writeFile`.
4. Update download route to redirect or proxy `getSignedDownloadUrl` (uses **GetObjectCommand**, not Put).
5. Migrate existing files or run a one-off copy script before cutover.
6. Test presigned URLs on staging — expiry defaults to 5 minutes.

**Dependencies:** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` (already in `package.json`).

## Phase 0 gate (before enabling either)

```bash
npm run build
npx vitest run
```

Both must pass before merging scaffold wiring into production routes.
