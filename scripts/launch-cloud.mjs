#!/usr/bin/env node
/**
 * Prepare and launch TaxDoc on Render (Option A – cloud beta).
 *
 * Requires in .env or environment:
 *   RENDER_API_KEY  – from https://dashboard.render.com/u/settings#api-keys
 *
 * Optional:
 *   GITHUB_TOKEN    – to create/push repo automatically
 *   RENDER_SERVICE_NAME (default: taxdoc-beta)
 */

import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distDir = join(root, 'dist', 'mobile');

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

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { cwd: root, stdio: 'inherit', ...opts });
}

async function renderApi(path, method = 'GET', body) {
  const key = process.env.RENDER_API_KEY;
  if (!key) throw new Error('RENDER_API_KEY missing');

  const response = await fetch(`https://api.render.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(`Render API ${method} ${path} failed (${response.status}): ${text}`);
  }
  return data;
}

async function waitForDeploy(serviceId, timeoutMs = 20 * 60 * 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const deploys = await renderApi(`/services/${serviceId}/deploys?limit=1`);
    const latest = deploys[0]?.deploy;
    const status = latest?.status;
    console.log(`Deploy status: ${status || 'unknown'}`);
    if (status === 'live') return latest;
    if (status === 'build_failed' || status === 'update_failed') {
      throw new Error(`Deploy failed: ${status}`);
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
  throw new Error('Deploy timed out');
}

async function findServiceByName(name) {
  const services = await renderApi('/services?limit=100');
  return services.find((item) => item.service?.name === name)?.service;
}

async function createOrUpdateService(serviceName) {
  const existing = await findServiceByName(serviceName);
  const renderYaml = readFileSync(join(root, 'render.yaml'), 'utf8');

  if (existing) {
    console.log(`Service exists: ${existing.name} (${existing.id})`);
    console.log(`URL: https://${existing.serviceDetails?.url || existing.slug + '.onrender.com'}`);
    await renderApi(`/services/${existing.id}/deploys`, 'POST', { clearCache: 'do_not_clear' });
    return existing;
  }

  console.log('Creating Render blueprint from render.yaml...');
  const ownerId = process.env.RENDER_OWNER_ID;
  const repo = process.env.RENDER_GITHUB_REPO;

  if (!repo) {
    throw new Error(
      'First-time Render setup needs a GitHub repo.\n' +
        'Set RENDER_GITHUB_REPO=https://github.com/YOUR_USER/tax-document-manager\n' +
        'Push the project to GitHub, then re-run: npm run cloud:launch'
    );
  }

  const blueprint = await renderApi('/blueprints', 'POST', {
    name: serviceName,
    repo,
    branch: process.env.RENDER_GITHUB_BRANCH || 'main',
    ...(ownerId ? { ownerId } : {}),
  });

  console.log('Blueprint created:', blueprint?.id || blueprint);
  return null;
}

function writeTesterPack(publicUrl) {
  mkdirSync(distDir, { recursive: true });

  writeFileSync(
    join(distDir, 'TESTER-INSTALL-ONLINE.txt'),
    [
      'TaxDoc Beta – Installation (Online, Option A)',
      '==============================================',
      '',
      `App-Link (für alle Tester): ${publicUrl}`,
      '',
      'ANDROID – Option 1 (einfach):',
      '  1. Link in Chrome öffnen',
      '  2. Anmelden mit Test-E-Mail + Passwort',
      '',
      'ANDROID – Option 2 (App-Icon):',
      '  1. TaxDoc-Android-Cloud.apk installieren (vom Entwickler)',
      '  2. App öffnen und anmelden',
      '',
      'IPHONE:',
      '  1. Link in Safari öffnen → anmelden',
      '  2. Teilen → „Zum Home-Bildschirm“',
      '',
      'Login:',
      '  E-Mails: tester01@taxdoc.test … tester10000@taxdoc.test (bis 10.000 Slots)',
      '  Passwort für alle: TaxDocTest2026!',
      '',
      'Tester = normaler Nutzer, kein Admin.',
      'Feedback-Button in der App nutzen.',
    ].join('\n')
  );

  console.log(`\n📄 Tester guide: dist/mobile/TESTER-INSTALL-ONLINE.txt`);
}

async function buildCloudApk(publicUrl) {
  console.log(`\nBuilding Android APK for ${publicUrl} ...`);
  run(`MOBILE_SERVER_URL=${publicUrl} npm run mobile:apk`, {
    env: { ...process.env, MOBILE_SERVER_URL: publicUrl },
  });

  const apkSrc = join(root, 'dist', 'mobile', 'TaxDoc-Android.apk');
  const apkDst = join(distDir, 'TaxDoc-Android-Cloud.apk');
  if (existsSync(apkSrc)) {
    execSync(`cp "${apkSrc}" "${apkDst}"`, { cwd: root });
    console.log(`📱 Cloud APK: dist/mobile/TaxDoc-Android-Cloud.apk`);
  }
}

async function main() {
  loadEnvFile();
  const serviceName = process.env.RENDER_SERVICE_NAME || 'taxdoc-beta';

  console.log('TaxDoc cloud launch (Render)\n');

  console.log('Step 1/4 – Verify Docker build...');
  run('docker build -t taxdoc-beta:local .');

  if (!process.env.RENDER_API_KEY) {
    const helpPath = join(distDir, 'RENDER-SETUP-NEEDED.txt');
    mkdirSync(distDir, { recursive: true });
    writeFileSync(
      helpPath,
      [
        'Render launch – one-time setup (2 minutes)',
        '==========================================',
        '',
        '1. Create free account: https://dashboard.render.com/register',
        '2. Create API key: https://dashboard.render.com/u/settings#api-keys',
        '3. Add to .env:',
        '   RENDER_API_KEY=rnd_xxxxxxxx',
        '',
        '4. Push project to GitHub (new repo tax-document-manager)',
        '5. Add to .env:',
        '   RENDER_GITHUB_REPO=https://github.com/YOUR_USERNAME/tax-document-manager',
        '',
        '6. Run again:',
        '   npm run cloud:launch',
        '',
        'Docker image build already verified locally.',
      ].join('\n')
    );
    console.log(`\n⚠️  Add RENDER_API_KEY to .env and re-run: npm run cloud:launch`);
    console.log(`    Help file: dist/mobile/RENDER-SETUP-NEEDED.txt`);
    process.exit(2);
  }

  console.log('\nStep 2/4 – Create/update Render service...');
  const service = await createOrUpdateService(serviceName);

  let publicUrl = process.env.APP_URL;
  if (service) {
    publicUrl =
      service.serviceDetails?.url ||
      (service.slug ? `https://${service.slug}.onrender.com` : publicUrl);
  }

  if (service?.id) {
    console.log('\nStep 3/4 – Waiting for deploy to go live...');
    await waitForDeploy(service.id);
  }

  if (!publicUrl) {
    publicUrl = `https://${serviceName}.onrender.com`;
  }

  console.log('\nStep 4/4 – Build tester install pack...');
  writeTesterPack(publicUrl);

  if (process.env.SKIP_APK_BUILD !== 'true') {
    try {
      await buildCloudApk(publicUrl);
    } catch (error) {
      console.warn('APK build skipped:', error.message);
    }
  }

  console.log('\n✅ Cloud beta ready!');
  console.log(`   Public URL: ${publicUrl}`);
  console.log(`   Admin: lf.tipea@gmail.com (password from bootstrap / create-admin)`);
  console.log(`   Testers: tester01@taxdoc.test … tester10000@taxdoc.test / TaxDocTest2026!`);
  console.log('\nSend friends:');
  console.log('  - Link above');
  console.log('  - dist/mobile/TESTER-INSTALL-ONLINE.txt');
  console.log('  - dist/mobile/TEST-ACCOUNTS.txt');
}

main().catch((error) => {
  console.error('\n❌ Launch failed:', error.message || error);
  process.exit(1);
});
