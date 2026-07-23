import { join } from 'path';

/** Persistent data root (DB sibling dir, uploads). Set DATA_DIR on cloud hosts. */
export function getDataDir(): string {
  return process.env.DATA_DIR || process.cwd();
}

export function getUploadsRoot(): string {
  return join(getDataDir(), 'uploads');
}
