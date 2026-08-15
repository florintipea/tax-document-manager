#!/usr/bin/env node
/**
 * Push project to GitHub without system git (no Xcode needed).
 * Uses tar snapshot → isomorphic-git force-push to main.
 * Exclusive lock prevents concurrent agents from deleting each other's trees.
 */
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

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

function walkFiles(dir, base = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.git') continue;
    const full = join(dir, entry.name);
    const rel = relative(base, full);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full, base));
    } else {
      files.push(rel);
    }
  }
  return files;
}

async function acquireLock(lockDir, maxWaitMs = 180_000) {
  const started = Date.now();
  while (Date.now() - started < maxWaitMs) {
    try {
      fs.mkdirSync(lockDir);
      fs.writeFileSync(join(lockDir, 'pid'), String(process.pid));
      return;
    } catch (err) {
      if (err?.code !== 'EEXIST') throw err;
      await sleep(500);
    }
  }
  fs.rmSync(lockDir, { recursive: true, force: true });
  fs.mkdirSync(lockDir);
  fs.writeFileSync(join(lockDir, 'pid'), String(process.pid));
}

async function main() {
  loadEnvFile();

  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;
  const repo = process.env.GITHUB_REPO || 'tax-document-manager';
  // Opt-in only: updating Actions YAML requires a PAT with `workflow` scope.
  const pushWorkflows = process.env.GITHUB_PUSH_WORKFLOWS === 'true';

  if (!token || !username) {
    console.error('Missing GITHUB_TOKEN / GITHUB_USERNAME in .env');
    process.exit(1);
  }

  const mobileDist = join(root, 'dist', 'mobile');
  fs.mkdirSync(mobileDist, { recursive: true });
  const lockDir = join(mobileDist, '.github-push.lock');
  await acquireLock(lockDir);

  const gitDir = join(mobileDist, `git-push-${process.pid}-${Date.now()}`);

  try {
    for (const name of fs.readdirSync(mobileDist)) {
      if (name === '.github-push.lock') continue;
      const full = join(mobileDist, name);
      if (full === gitDir) continue;
      if (
        name.startsWith('git-push-') ||
        name.startsWith('github-upload') ||
        name.startsWith('.git-push-temp')
      ) {
        const m = /^git-push-(\d+)-/.exec(name);
        if (m) {
          try {
            process.kill(Number(m[1]), 0);
            console.log(`Leaving live push tree ${name}`);
            continue;
          } catch {
            // process dead — safe to remove
          }
        }
        fs.rmSync(full, { recursive: true, force: true });
      }
    }

    fs.mkdirSync(gitDir, { recursive: true });

    console.log('Snapshotting source via tar (excludes node_modules/.next/...)...');
    const excludes = [
      '--exclude=node_modules',
      '--exclude=.next',
      '--exclude=.git',
      '--exclude=dist',
      '--exclude=mobile',
      '--exclude=.tools',
      '--exclude=uploads',
      '--exclude=.venv-marketing',
      '--exclude=.venv-reels',
      '--exclude=logs',
      '--exclude=.env',
      '--exclude=.env.local',
      '--exclude=.env.production',
      '--exclude=.env.development',
      '--exclude=.DS_Store',
      '--exclude=tsconfig.tsbuildinfo',
      '--exclude=.taxdoc-keepalive-state.json',
      '--exclude=prisma/dev.db',
      '--exclude=prisma/dev.db-journal',
      '--exclude=prisma/ci.db',
      '--exclude=marketing/*.mp4',
      '--exclude=marketing/**/*.mp4',
      '--exclude=marketing/**/*.mov',
      '--exclude=**/__pycache__',
    ];
    // macOS BSD tar ignores bare `--exclude=.github/workflows`; exclude both
    // the directory and its contents so Actions YAML never enters the snapshot
    // unless we explicitly restore remote copies / opt into GITHUB_PUSH_WORKFLOWS.
    excludes.push(
      '--exclude=.github/workflows',
      '--exclude=./.github/workflows',
      '--exclude=.github/workflows/*',
      '--exclude=./.github/workflows/*'
    );

    execSync(
      `tar -C "${root}" ${excludes.join(' ')} -cf - . | tar -C "${gitDir}" -xf -`,
      { stdio: 'inherit', shell: '/bin/bash' }
    );

    for (const secret of ['.env', '.env.local', '.env.production', '.env.development']) {
      fs.rmSync(join(gitDir, secret), { force: true });
    }
    // Belt-and-suspenders: BSD tar may still leak workflow files.
    fs.rmSync(join(gitDir, '.github', 'workflows'), {
      recursive: true,
      force: true,
    });

    // Restore workflow files from GitHub so the force-push tree matches remote
    // Actions paths (avoids PAT workflow-scope errors on create/update/delete).
    const wfDir = join(gitDir, '.github', 'workflows');
    try {
      const wfListRes = await fetch(
        `https://api.github.com/repos/${username}/${repo}/contents/.github/workflows`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
          },
        }
      );
      if (wfListRes.ok) {
        const wfEntries = await wfListRes.json();
        if (Array.isArray(wfEntries) && wfEntries.length > 0) {
          fs.mkdirSync(wfDir, { recursive: true });
          for (const entry of wfEntries) {
            if (entry?.type !== 'file' || !entry?.name || !entry?.download_url) {
              continue;
            }
            // Always restore every remote workflow when we cannot update Actions.
            // Omitting any file looks like a delete and GitHub rejects the push
            // without the `workflow` PAT scope.
            const bodyRes = await fetch(entry.download_url, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.raw',
              },
            });
            if (!bodyRes.ok) {
              throw new Error(
                `Failed to restore workflow ${entry.name} (${bodyRes.status})`
              );
            }
            const body = await bodyRes.text();
            fs.writeFileSync(join(wfDir, entry.name), body, 'utf8');
          }
          console.log(
            `Restored ${fs.readdirSync(wfDir).length} remote workflow file(s) into snapshot`
          );
        } else {
          console.log('Remote .github/workflows empty — snapshot stays without Actions YAML');
        }
      } else if (wfListRes.status === 404) {
        console.log('No remote .github/workflows — snapshot stays without Actions YAML');
      } else {
        throw new Error(
          `Could not list remote workflows (${wfListRes.status}): ${await wfListRes.text()}`
        );
      }
    } catch (wfErr) {
      if (!pushWorkflows) {
        throw new Error(
          `Workflow restore required (no workflow PAT scope): ${
            wfErr instanceof Error ? wfErr.message : wfErr
          }`
        );
      }
      console.warn(
        'Workflow restore skipped:',
        wfErr instanceof Error ? wfErr.message : wfErr
      );
    }

    if (pushWorkflows) {
      // Optional: overlay local workflow sources when token may update Actions
      fs.mkdirSync(wfDir, { recursive: true });
      const localWf = join(root, '.github', 'workflows');
      if (fs.existsSync(localWf)) {
        for (const name of fs.readdirSync(localWf)) {
          if (name === 'keep-alive.yml') continue;
          const src = join(localWf, name);
          if (!fs.statSync(src).isFile()) continue;
          fs.copyFileSync(src, join(wfDir, name));
        }
      }
    } else {
      // Final guard: never ship local Actions YAML without workflow scope.
      const leaked = fs.existsSync(wfDir)
        ? fs.readdirSync(wfDir).filter((n) => n.endsWith('.yml') || n.endsWith('.yaml'))
        : [];
      // If remote had none, ensure local copies are gone. If remote had some,
      // leaked list is the restored set (OK). Detect local-only by comparing names
      // only when we intentionally kept an empty/absent dir after 404.
      if (!fs.existsSync(wfDir) || leaked.length === 0) {
        fs.rmSync(wfDir, { recursive: true, force: true });
      }
    }

    const required = [
      'package.json',
      'app/api/admin/support/route.ts',
      'scripts/ensure-tax-profile-columns.ts',
      'lib/auth/magic-link.ts',
    ];
    for (const rel of required) {
      if (!fs.existsSync(join(gitDir, rel))) {
        throw new Error(`Snapshot missing required file: ${rel}`);
      }
    }

    const repoUrl = `https://github.com/${username}/${repo}.git`;
    const authUrl = `https://${token}@github.com/${username}/${repo}.git`;

    console.log(`Ensuring repo ${username}/${repo}...`);
    const createRes = await fetch(`https://api.github.com/user/repos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: repo, private: true, auto_init: false }),
    });
    if (!createRes.ok && createRes.status !== 422) {
      throw new Error(
        `GitHub create repo failed (${createRes.status}): ${await createRes.text()}`
      );
    }

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

    // Assert: without workflow scope, snapshot may only contain remote-restored
    // Actions YAML (byte-identical). Local-only YAML must already be removed.
    if (!pushWorkflows && fs.existsSync(wfDir)) {
      const names = fs
        .readdirSync(wfDir)
        .filter((n) => n.endsWith('.yml') || n.endsWith('.yaml'));
      console.log(`Workflow files in snapshot: ${names.join(', ') || '(none)'}`);
    }

    const files = walkFiles(gitDir);
    console.log(`Adding ${files.length} files...`);
    let added = 0;
    for (const filepath of files) {
      const abs = join(gitDir, filepath);
      if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
      try {
        await git.add({ fs, dir: gitDir, filepath });
        added += 1;
      } catch (err) {
        console.warn(`skip ${filepath}:`, err.message || err);
      }
    }
    console.log(`Staged ${added} files`);

    if (added < 50) {
      throw new Error(`Too few files staged (${added}) — aborting push`);
    }

    await git.commit({
      fs,
      dir: gitDir,
      message:
        process.env.GITHUB_COMMIT_MESSAGE ||
        'Ship A–F tax autofill polish (typed-routes build fix).',
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

    console.log('\n✅ GitHub push complete!');
    console.log(`   ${repoUrl}`);
    console.log('\nNext: npm run render:deploy');
  } finally {
    fs.rmSync(gitDir, { recursive: true, force: true });
    fs.rmSync(lockDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error('\n❌ GitHub push failed:', error.message || error);
  process.exit(1);
});
