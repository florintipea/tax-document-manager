const MAX_FILE_SIZE_MB = Number(
  process.env.NEXT_PUBLIC_UPLOAD_MAX_MB || process.env.UPLOAD_MAX_MB || 25
);
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Chunk size for multi-file upload / batch-autofill HTTP requests.
 * No product-facing file-count Obergrenze — large selections are processed in packets.
 */
const BATCH_UPLOAD_CHUNK = Number(process.env.NEXT_PUBLIC_UPLOAD_CHUNK || 5);

/**
 * Per-request safety for batch-autofill (abuse + Starter ~512MB heap).
 * Clients already send packets of uploadChunkSize; keep server cap tight.
 */
const BATCH_AUTOFILL_REQUEST_MAX = Number(
  process.env.BATCH_AUTOFILL_REQUEST_MAX || 40
);

/** Client-safe upload size limits (no Node path/fs). */
export const uploadLimits = {
  maxFileSize: MAX_FILE_SIZE,
  maxFileSizeMB: MAX_FILE_SIZE_MB,
  maxFileSizeLabel: `${MAX_FILE_SIZE_MB}MB`,
  /** Files per HTTP upload / autofill request (rate-limit & timeout friendly) */
  uploadChunkSize:
    Number.isFinite(BATCH_UPLOAD_CHUNK) && BATCH_UPLOAD_CHUNK > 0
      ? Math.min(BATCH_UPLOAD_CHUNK, 20)
      : 5,
  /**
   * Max docs / documentIds processed in one batch-autofill API call.
   * Not a product limit — clients should send work in uploadChunkSize packets.
   */
  batchAutofillRequestMax:
    Number.isFinite(BATCH_AUTOFILL_REQUEST_MAX) && BATCH_AUTOFILL_REQUEST_MAX > 0
      ? Math.min(BATCH_AUTOFILL_REQUEST_MAX, 200)
      : 40,
} as const;
