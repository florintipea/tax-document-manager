import { join } from 'node:path';

/** Persistent data root (DB sibling dir, uploads). Set DATA_DIR on cloud hosts. */
export function getDataDir(): string {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  // turbopackIgnore: do not NFT-trace the whole repo via process.cwd()
  return /* turbopackIgnore: true */ process.cwd();
}

export function getUploadsRoot(): string {
  const base = getDataDir().replace(/[/\\]+$/, '');
  return join(base, 'uploads');
}
