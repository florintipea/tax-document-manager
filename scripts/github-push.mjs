#!/usr/bin/env node
/**
 * Push github-upload folder to GitHub without system git (no Xcode needed).
 *
 * Add to .env:
 *   GITHUB_TOKEN=ghp_xxxx        (repo scope)
 *   GITHUB_USERNAME=your-name
 *   GITHUB_REPO=tax-document-manager
 */

import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadEnvFile() {
  const envPath = join(root, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
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

const pushWorkflows = process.env.GITHUB_PUSH_WORKFLOWS !== 'false';

function walkFiles(dir, base = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.git') continue;
    const full = join(dir, entry.name);
    const rel = relative(base, full);
    if (
      !pushWorkflows &&
      (rel === '.github/workflows/ci.yml' || rel.startsWith('.github/workflows/'))
    ) {
      continue;
    }
    if (rel === '.github/workflows/keep-alive.yml') {
      continue;
    }
    if (entry.isDirectory()) {
      files.push(...walkFiles(full, base));
    } else {
      files.push(rel);
    }
  }
  return files;
}

async function main() {
  loadEnvFile();

  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;
  const repo = process.env.GITHUB_REPO || 'tax-document-manager';

  if (!token || !username) {
    console.error(`
Missing GitHub credentials in .env:

  GITHUB_USERNAME=your-github-username
  GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

Create token: https://github.com/settings/tokens/new
  - Note: TaxDoc deploy
  - Expiration: 90 days
  - Scopes: ✅ repo (full) AND ✅ workflow (update GitHub Actions workflows)

Set GITHUB_PUSH_WORKFLOWS=false only if your token lacks workflow scope.

Then run: npm run github:push
`);
    process.exit(1);
  }

  const uploadDir = join(root, 'dist', 'mobile', 'github-upload');
  console.log('Preparing upload folder from latest source...');
  const { execSync } = await import('node:child_process');
  execSync('node scripts/prepare-github-upload.mjs', { cwd: root, stdio: 'inherit' });

  const repoUrl = `https://github.com/${username}/${repo}.git`;
  const authUrl = `https://${token}@github.com/${username}/${repo}.git`;

  console.log(`Creating repo ${username}/${repo} if needed...`);
  const createRes = await fetch(`https://api.github.com/user/repos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: repo,
      private: true,
      auto_init: false,
    }),
  });

  if (!createRes.ok && createRes.status !== 422) {
    const text = await createRes.text();
    throw new Error(`GitHub create repo failed (${createRes.status}): ${text}`);
  }

  const gitDir = join(root, 'dist', 'mobile', '.git-push-temp');
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }
  fs.mkdirSync(gitDir, { recursive: true });

  const copyRecursive = (src, dest) => {
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      if (entry.name === '.git-push-temp') continue;
      const s = join(src, entry.name);
      const d = join(dest, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(d, { recursive: true });
        copyRecursive(s, d);
      } else {
        fs.copyFileSync(s, d);
      }
    }
  };
  copyRecursive(uploadDir, gitDir);

  console.log('Initializing git commit...');
  await git.init({ fs, dir: gitDir, defaultBranch: 'main' });

  await git.setConfig({
    fs,
    dir: gitDir,
    path: 'user.name',
    value: username,
  });
  await git.setConfig({
    fs,
    dir: gitDir,
    path: 'user.email',
    value: `${username}@users.noreply.github.com`,
  });

  const files = walkFiles(gitDir);
  console.log(`Adding ${files.length} files...`);
  for (const filepath of files) {
    await git.add({ fs, dir: gitDir, filepath });
  }

  const sha = await git.commit({
    fs,
    dir: gitDir,
    message: 'Competitive parity UX: happy path, Mein ELSTER checklist, Grenzgänger, trust/pricing',
    author: {
      name: username,
      email: `${username}@users.noreply.github.com`,
    },
  });

  console.log('Pushing to GitHub...');
  await git.push({
    fs,
    http,
    dir: gitDir,
    remote: 'origin',
    ref: 'main',
    url: authUrl,
    force: true,
  });

  fs.rmSync(gitDir, { recursive: true, force: true });

  console.log('\n✅ GitHub push complete!');
  console.log(`   ${repoUrl}`);
  console.log('\nNext: npm run render:deploy');
}

main().catch((error) => {
  console.error('\n❌ GitHub push failed:', error.message || error);
  process.exit(1);
});
