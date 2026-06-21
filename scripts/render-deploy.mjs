#!/usr/bin/env node
/**
 * Deploy TaxDoc to Render from GitHub repo (after github:push).
 *
 * Add to .env:
 *   RENDER_API_KEY=rnd_xxxx
 *   GITHUB_USERNAME=your-name
 *   GITHUB_REPO=tax-document-manager
 */

import fs from 'node:fs';
import { join, dirname } from 'node:path';
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

async function renderApi(path, method = 'GET', body) {
  const key = process.env.RENDER_API_KEY;
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
  if (!response.ok) {
    throw new Error(`Render API ${method} ${path} (${response.status}): ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function getOwnerId() {
  if (process.env.RENDER_OWNER_ID) return process.env.RENDER_OWNER_ID;
  const owners = await renderApi('/owners');
  const owner = owners[0]?.owner;
  if (!owner?.id) throw new Error('Could not find Render workspace owner ID');
  return owner.id;
}

async function createWebService(serviceName, repoUrl, ownerId) {
  const publicUrlGuess = `https://${serviceName}.onrender.com`;
  const plan = process.env.RENDER_PLAN || 'free';
  const useDisk = plan !== 'free';

  const serviceDetails = {
    runtime: 'docker',
    plan,
    region: 'frankfurt',
    healthCheckPath: '/api/health',
    envSpecificDetails: {
      dockerfilePath: './Dockerfile',
    },
  };

  if (useDisk) {
    serviceDetails.disk = {
      name: 'taxdoc-data',
      mountPath: '/var/data',
      sizeGB: 2,
    };
  }

  const body = {
    type: 'web_service',
    name: serviceName,
    ownerId,
    repo: repoUrl,
    branch: 'main',
    autoDeploy: 'yes',
    envVars: [
      { key: 'NODE_ENV', value: 'production' },
      { key: 'DATA_DIR', value: useDisk ? '/var/data' : '/tmp/taxdoc-data' },
      { key: 'DATABASE_URL', value: useDisk ? 'file:/var/data/prod.db' : 'file:/tmp/taxdoc-data/prod.db' },
      { key: 'HOSTNAME', value: '0.0.0.0' },
      { key: 'NEXTAUTH_URL', value: publicUrlGuess },
      { key: 'APP_URL', value: publicUrlGuess },
      { key: 'TEST_PHASE_ENABLED', value: 'true' },
      { key: 'ADMIN_EMAIL', value: 'lf.tipea@gmail.com' },
      { key: 'NEXTAUTH_SECRET', generateValue: true },
      { key: 'ENCRYPTION_KEY', generateValue: true },
    ],
    serviceDetails,
  };

  const result = await renderApi('/services', 'POST', body);
  return result.service || result;
}

async function waitForLive(serviceId, minutes = 20) {
  const deadline = Date.now() + minutes * 60 * 1000;
  while (Date.now() < deadline) {
    const list = await renderApi(`/services/${serviceId}/deploys?limit=1`);
    const deploy = list[0]?.deploy;
    const status = deploy?.status;
    process.stdout.write(`\rDeploy: ${status || 'pending'}...   `);
    if (status === 'live') {
      console.log('\n');
      return deploy;
    }
    if (status === 'build_failed' || status === 'update_failed') {
      throw new Error(`Deploy failed: ${status}`);
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
  throw new Error('Deploy timed out');
}

async function main() {
  loadEnvFile();

  const apiKey = process.env.RENDER_API_KEY;
  const username = process.env.GITHUB_USERNAME;
  const repo = process.env.GITHUB_REPO || 'tax-document-manager';
  const serviceName = process.env.RENDER_SERVICE_NAME || 'taxdoc-beta';

  if (!apiKey) {
    console.error(`
Missing RENDER_API_KEY in .env

Create at: https://dashboard.render.com/u/settings#api-keys
Then add:
  RENDER_API_KEY=rnd_xxxxxxxx

Run: npm run render:deploy
`);
    process.exit(1);
  }

  if (!username) {
    console.error('Missing GITHUB_USERNAME in .env');
    process.exit(1);
  }

  const repoUrl = `https://github.com/${username}/${repo}`;

  const services = await renderApi('/services?limit=100');
  let service = services.find((s) => s.service?.name === serviceName)?.service;

  if (!service) {
    console.log('Creating Render web service (Docker)...');
    console.log(`Repo: ${repoUrl}`);

    const ownerId = await getOwnerId();
    service = await createWebService(serviceName, repoUrl, ownerId);
    console.log('Service created:', service.id || service.name);
  }

  const publicUrl =
    service.serviceDetails?.url || `https://${service.slug || serviceName}.onrender.com`;

  console.log(`Service: ${service.name} (${service.id})`);
  console.log(`URL: ${publicUrl}`);

  if (service.serviceDetails?.healthCheckPath !== '/api/health') {
    try {
      console.log('Updating health check path to /api/health...');
      await renderApi(`/services/${service.id}`, 'PATCH', {
        serviceDetails: {
          healthCheckPath: '/api/health',
        },
      });
    } catch (error) {
      console.warn('Health check path update skipped:', error.message);
    }
  }

  console.log('\nUpdating environment variables (if needed)...');
  const envVars = [
    ['NEXTAUTH_URL', publicUrl],
    ['APP_URL', publicUrl],
    ['TEST_PHASE_ENABLED', 'true'],
  ];

  try {
    const existing = await renderApi(`/services/${service.id}/env-vars`);
    for (const [key, value] of envVars) {
      const found = existing.find((item) => item.envVar?.key === key);
      if (found?.envVar?.id) {
        await renderApi(`/services/${service.id}/env-vars/${found.envVar.id}`, 'PUT', {
          value,
        });
      }
    }
  } catch (error) {
    console.warn('Env var update skipped (set at create):', error.message);
  }

  console.log('Triggering deploy...');
  await renderApi(`/services/${service.id}/deploys`, 'POST', {
    clearCache: 'do_not_clear',
  });

  console.log('Waiting for live (this can take 10–15 minutes)...');
  await waitForLive(service.id);

  const distDir = join(root, 'dist', 'mobile');
  fs.mkdirSync(distDir, { recursive: true });
  fs.writeFileSync(
    join(distDir, 'LIVE-URL.txt'),
    [
      'TaxDoc is LIVE',
      '==============',
      '',
      `App URL: ${publicUrl}`,
      '',
      'RENDER FREE TIER — SPIN-DOWN',
      '----------------------------',
      'After ~15 min without traffic, Render stops the server.',
      'First next visit may show Render\'s welcome/loading screen for 1–2 minutes.',
      'Wait, then hard-refresh. Login page shows a cloud banner with retry.',
      '',
      'Optional keep-alive (every 14 min):',
      '  node scripts/keep-alive-render.mjs',
      '',
      'Permanent fix: upgrade to Render Starter (paid) in dashboard.',
      '',
      'Admin login:',
      '  lf.tipea@gmail.com',
      '  Admin@2024!Secure  (change after first login!)',
      '',
      'Testers:',
      '  tester01@taxdoc.test … tester50@taxdoc.test',
      '  Password: TaxDocTest2026!',
      '',
      'Send testers:',
      `  ${publicUrl}`,
      '  TEST-ACCOUNTS.txt',
    ].join('\n')
  );

  fs.writeFileSync(
    join(distDir, 'CLOUD-HOSTING.txt'),
    [
      'TaxDoc Cloud Hosting (Render)',
      '=============================',
      '',
      `Live URL: ${publicUrl}`,
      '',
      'Why does the app "disappear" after 30 minutes?',
      '------------------------------------------------',
      'Render Free tier spins down after ~15 minutes of inactivity.',
      'You may see Render\'s default welcome/loading page — not a bug in TaxDoc.',
      'Cold start (migrations + server) typically takes 1–2 minutes.',
      '',
      'User instructions (German):',
      '  1. Seite öffnen und ~1 Minute warten',
      '  2. Hard-Refresh (Neu laden)',
      '  3. Auf dem Login: Banner „Cloud-Instanz“ → „Erneut laden“',
      '',
      'Health endpoint: /api/health',
      'Wake helper page: /wake.html (polls health, redirects when ready)',
      '',
      'Keep-alive (optional, beta):',
      '  */14 * * * * node scripts/keep-alive-render.mjs',
      '',
      'Upgrade to Render Starter for 24/7 uptime + persistent disk.',
    ].join('\n')
  );

  console.log('\n✅ Render deploy complete!');
  console.log(`   Live URL: ${publicUrl}`);
  console.log(`   Saved: dist/mobile/LIVE-URL.txt`);
}

main().catch((error) => {
  console.error('\n❌ Render deploy failed:', error.message || error);
  process.exit(1);
});
