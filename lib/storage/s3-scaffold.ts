/**
 * S3 storage scaffold — DISABLED by default.
 *
 * Production stores uploads on local disk (`lib/utils/paths.ts` → `DATA_DIR/uploads`).
 * This module is NOT imported by upload/download routes until you migrate storage.
 *
 * ## How to enable (post-beta)
 *
 * 1. Set Render env: `USE_S3=true`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`,
 *    `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`.
 * 2. Replace local `writeFile` / `readFile` calls in document routes with these helpers.
 * 3. Store the S3 object key in `Document.fileUrl` (e.g. `s3://bucket/userId/file.pdf`).
 * 4. Serve downloads via short-lived presigned URLs from `getSignedDownloadUrl`.
 * 5. Test on staging before enabling on beta/production.
 */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function requireS3Enabled(): void {
  if (process.env.USE_S3 !== 'true') {
    throw new Error('S3 not enabled — set USE_S3=true and AWS credentials');
  }
  if (!process.env.S3_BUCKET) {
    throw new Error('S3_BUCKET is required when USE_S3=true');
  }
}

function getS3Client(): S3Client {
  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
}

function getBucket(): string {
  return process.env.S3_BUCKET || '';
}

/** Upload a buffer to S3. Returns the object key. */
export async function uploadBufferToS3(
  buffer: Buffer,
  key: string,
  contentType = 'application/octet-stream'
): Promise<string> {
  requireS3Enabled();
  const client = getS3Client();
  const bucket = getBucket();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return key;
}

/** Presigned GET URL for client download (default 5 minutes). */
export async function getSignedDownloadUrl(
  key: string,
  expiresInSeconds = 60 * 5
): Promise<string> {
  requireS3Enabled();
  const client = getS3Client();
  const bucket = getBucket();

  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn: expiresInSeconds }
  );
}

/** Delete an object from S3. */
export async function deleteFromS3(key: string): Promise<void> {
  requireS3Enabled();
  const client = getS3Client();
  const bucket = getBucket();

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** True when S3 scaffold should be used (env gate only — routes must opt in separately). */
export function isS3Enabled(): boolean {
  return process.env.USE_S3 === 'true';
}
