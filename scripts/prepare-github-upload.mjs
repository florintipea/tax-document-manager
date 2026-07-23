#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile() {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();
const outDir = join(root, 'dist', 'mobile', 'github-upload');
const zipPath = join(root, 'dist', 'mobile', 'tax-document-manager-github.zip');

// Include workflows by default. Set GITHUB_PUSH_WORKFLOWS=false if the PAT lacks
// `workflow` scope (see docs/CI-WORKFLOW-TO-ADD-MANUALLY.yml).
const pushWorkflows = process.env.GITHUB_PUSH_WORKFLOWS !== 'false';

const excludes = [
  ...(pushWorkflows ? [] : ['.github/workflows/*']),
  // keep-alive.yml: add manually in GitHub UI if PAT lacks workflow scope (see docs/KEEP-ALIVE-SETUP.md)
  '.github/workflows/keep-alive.yml',
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
  '.taxdoc-keepalive-state.json',
  'logs/keepalive.log',
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
if (!pushWorkflows) {
  rmSync(join(outDir, '.github', 'workflows', 'ci.yml'), { force: true });
}
rmSync(join(outDir, '.github', 'workflows', 'keep-alive.yml'), { force: true });

console.log(`\n✅ Ready: ${outDir}`);
console.log(`   Zip backup: ${zipPath}`);
