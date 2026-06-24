#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'dist', 'mobile', 'github-upload');
const zipPath = join(root, 'dist', 'mobile', 'tax-document-manager-github.zip');

// PATs without `workflow` scope cannot push .github/workflows/* via API.
// Re-add ci.yml manually in GitHub UI after granting workflow scope on the token.
const excludes = [
  '.github/workflows/*',
  'node_modules/*',
  '.next/*',
  'uploads/*',
  '.git/*',
  '.tools/*',
  'dist/*',
  'mobile/*',
  'prisma/dev.db*',
  'prisma/ci.db*',
  'prisma/prisma/*',
  '*.DS_Store',
  '.env',
  '.env.*',
  '!.env.example',
  'dist/mobile/tax-document-manager-github.zip',
];

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const excludeArgs = excludes.flatMap((x) => ['-x', x]).join(' ');
execSync(
  `cd "${root}" && zip -r "${zipPath}" . ${excludes.map((x) => `-x "${x}"`).join(' ')}`,
  { stdio: 'inherit' }
);
execSync(`unzip -q "${zipPath}" -d "${outDir}"`, { stdio: 'inherit' });

for (const secret of ['.env', '.env.local', '.env.production']) {
  rmSync(join(outDir, secret), { force: true });
}

// Belt-and-suspenders: zip -x may still include workflow files on some platforms.
rmSync(join(outDir, '.github', 'workflows', 'ci.yml'), { force: true });

console.log(`\n✅ Ready: ${outDir}`);
console.log(`   Zip backup: ${zipPath}`);
