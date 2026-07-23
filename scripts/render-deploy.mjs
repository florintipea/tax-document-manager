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

/** Persistent paths — Steuerprofil / calculatorDraft / documents must survive redeploys. */
const PERSISTENT_DATA_DIR = '/var/data';
const PERSISTENT_DATABASE_URL = 'file:/var/data/prod.db';

async function createWebService(serviceName, repoUrl, ownerId) {
  const publicUrlGuess = `https://${serviceName}.onrender.com`;
  // Match render.yaml: starter + disk. Free tier /tmp wipes Steuerprofil on every deploy.
  const plan = process.env.RENDER_PLAN || 'starter';
  const useDisk = plan !== 'free';

  if (!useDisk) {
    console.warn(
      'WARNING: RENDER_PLAN=free uses ephemeral /tmp — Steuerprofil and documents will be wiped on redeploy.'
    );
  }

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
      mountPath: PERSISTENT_DATA_DIR,
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
      {
        key: 'DATA_DIR',
        value: useDisk ? PERSISTENT_DATA_DIR : '/tmp/taxdoc-data',
      },
      {
        key: 'DATABASE_URL',
        value: useDisk ? PERSISTENT_DATABASE_URL : 'file:/tmp/taxdoc-data/prod.db',
      },
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

async function waitForLive(serviceId, minutes = 30) {
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

async function upsertEnvVar(serviceId, key, value) {
  await renderApi(
    `/services/${serviceId}/env-vars/${encodeURIComponent(key)}`,
    'PUT',
    { value }
  );
}

async function deleteEnvVar(serviceId, key) {
  try {
    await renderApi(
      `/services/${serviceId}/env-vars/${encodeURIComponent(key)}`,
      'DELETE'
    );
  } catch (error) {
    if (!String(error.message).includes('404')) {
      throw error;
    }
  }
}

async function getRenderEnvVar(serviceId, key) {
  try {
    const result = await renderApi(
      `/services/${serviceId}/env-vars/${encodeURIComponent(key)}`
    );
    return result?.envVar?.value ?? result?.value ?? null;
  } catch (error) {
    if (String(error.message).includes('404')) {
      return null;
    }
    throw error;
  }
}

async function waitUntilNoPendingDeploys(serviceId, minutes = 25) {
  const deadline = Date.now() + minutes * 60 * 1000;
  while (Date.now() < deadline) {
    const list = await renderApi(`/services/${serviceId}/deploys?limit=5`);
    const busy = (list || []).some((item) => {
      const status = item?.deploy?.status || item?.status;
      return (
        status === 'queued' ||
        status === 'build_in_progress' ||
        status === 'update_in_progress' ||
        status === 'created'
      );
    });
    if (!busy) return;
    process.stdout.write('\rWaiting for pending deploys to finish...   ');
    await new Promise((r) => setTimeout(r, 15000));
  }
  throw new Error('Timed out waiting for pending deploys before attaching disk');
}

/**
 * Ensure a persistent disk is attached. Env alone (DATA_DIR=/var/data) is NOT enough —
 * without a real mount, SQLite is wiped on every redeploy (Steuerprofil loss).
 */
async function ensurePersistentDisk(serviceId) {
  const service = await renderApi(`/services/${serviceId}`);
  const details = service?.serviceDetails || service?.service?.serviceDetails || {};
  if (details.disk?.id || details.disk?.name) {
    console.log(
      `Persistent disk already attached: ${details.disk.name || details.disk.id} → ${details.disk.mountPath || PERSISTENT_DATA_DIR}`
    );
    return details.disk;
  }

  console.log(
    'No persistent disk on service — attaching taxdoc-data at /var/data (required for Steuerprofil)...'
  );
  await waitUntilNoPendingDeploys(serviceId);

  try {
    const disk = await renderApi('/disks', 'POST', {
      name: 'taxdoc-data',
      sizeGB: 2,
      mountPath: PERSISTENT_DATA_DIR,
      serviceId,
    });
    console.log('Disk created:', disk?.id || disk?.name || JSON.stringify(disk));
    return disk;
  } catch (error) {
    const message = String(error.message || error);
    if (/already|exists|conflict/i.test(message)) {
      console.warn('Disk may already exist:', message);
      return null;
    }
    throw new Error(
      `Failed to attach persistent disk (Steuerprofil will be wiped on deploy): ${message}\n` +
        'Manual fix: Render Dashboard → taxdoc-beta → Disks → Add disk → Mount path /var/data (2 GB).'
    );
  }
}

async function verifyAdminLogin(publicUrl, email, password) {
  const response = await fetch(`${publicUrl}/api/auth/login-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  let body = {};
  try {
    body = await response.json();
  } catch {
    /* ignore */
  }
  return { ok: response.ok, status: response.status, body };
}

async function waitForAdminLogin(publicUrl, email, password, minutes = 5) {
  const deadline = Date.now() + minutes * 60 * 1000;
  while (Date.now() < deadline) {
    const result = await verifyAdminLogin(publicUrl, email, password);
    if (result.ok) {
      return result;
    }
    process.stdout.write(`\rLogin check: ${result.status} — retrying...   `);
    await new Promise((r) => setTimeout(r, 10000));
  }
  throw new Error('Admin login-check did not return 200 after deploy');
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

  let adminEmail = process.env.ADMIN_EMAIL || 'lf.tipea@gmail.com';
  let adminPassword = process.env.ADMIN_PASSWORD;

  const repoUrl = `https://github.com/${username}/${repo}`;

  const services = await renderApi('/services?limit=100');
  let service = services.find((s) => s.service?.name === serviceName)?.service;

  if (service) {
    if (!adminPassword) {
      adminPassword = await getRenderEnvVar(service.id, 'ADMIN_PASSWORD');
      if (adminPassword) {
        console.log('Using ADMIN_PASSWORD from Render dashboard (not in local .env).');
      }
    }
    if (!process.env.ADMIN_EMAIL) {
      const renderEmail = await getRenderEnvVar(service.id, 'ADMIN_EMAIL');
      if (renderEmail) {
        adminEmail = renderEmail;
      }
    }
  }

  if (!adminPassword) {
    console.error(`
Missing ADMIN_PASSWORD

Set in .env or in Render dashboard → Environment:
  ADMIN_PASSWORD=your-chosen-password

Then run: npm run render:deploy
`);
    process.exit(1);
  }

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

  const planName = service.serviceDetails?.plan || process.env.RENDER_PLAN || 'starter';
  if (planName === 'free') {
    console.warn(
      'WARNING: Free plan cannot attach a persistent disk — Steuerprofil will wipe on every redeploy. Upgrade to Starter.'
    );
  } else {
    console.log('\nEnsuring persistent disk for Steuerprofil...');
    await ensurePersistentDisk(service.id);
    // Refresh service details after disk attach
    const refreshed = await renderApi(`/services/${service.id}`);
    service.serviceDetails =
      refreshed?.serviceDetails || refreshed?.service?.serviceDetails || service.serviceDetails;
  }

  console.log('\nUpdating environment variables (if needed)...');
  const hasDisk = Boolean(service.serviceDetails?.disk);
  const usePersistentDb = hasDisk || planName !== 'free';

  if (!hasDisk && planName !== 'free') {
    console.warn(
      'WARNING: Disk attach may still be pending — verify in Render Dashboard → Disks. Until mounted, Steuerprofil is ephemeral.'
    );
  } else if (usePersistentDb) {
    console.log(
      `Persistence: DATA_DIR=${PERSISTENT_DATA_DIR}, DATABASE_URL=${PERSISTENT_DATABASE_URL}`
    );
  }

  const envVars = [
    ['NEXTAUTH_URL', publicUrl],
    ['APP_URL', publicUrl],
    ['TEST_PHASE_ENABLED', 'true'],
    ['TEST_ACCOUNT_COUNT', process.env.TEST_ACCOUNT_COUNT || '200'],
    ['ADMIN_EMAIL', adminEmail],
    ['ADMIN_PASSWORD', adminPassword],
    // Always force persistent paths on paid plans — never leave /tmp from an old free-tier create
    ...(usePersistentDb
      ? [
          ['DATA_DIR', PERSISTENT_DATA_DIR],
          ['DATABASE_URL', PERSISTENT_DATABASE_URL],
        ]
      : []),
  ];

  try {
    for (const [key, value] of envVars) {
      await upsertEnvVar(service.id, key, value);
    }
    console.log('Admin env synced (password syncs from ADMIN_PASSWORD on startup).');
  } catch (error) {
    console.warn('Env var update failed:', error.message);
    process.exit(1);
  }

  console.log('Triggering deploy...');
  await renderApi(`/services/${service.id}/deploys`, 'POST', {
    clearCache: 'do_not_clear',
  });

  console.log('Waiting for live (this can take 10–15 minutes)...');
  await waitForLive(service.id);

  console.log('\nVerifying admin login-check...');
  const loginResult = await waitForAdminLogin(publicUrl, adminEmail, adminPassword);
  console.log(`\nLogin-check OK (${loginResult.status})`);

  try {
    await deleteEnvVar(service.id, 'ADMIN_FORCE_RESET');
  } catch {
    // Legacy one-time flag — safe to ignore if absent.
  }

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
      'Admin login (Render dashboard → Environment):',
      '  ADMIN_EMAIL=lf.tipea@gmail.com',
      '  ADMIN_PASSWORD=Admin@2024!Secure  (or your choice — required secret)',
      '',
      'Sign in:',
      '  lf.tipea@gmail.com',
      '  (password = ADMIN_PASSWORD value above)',
      '',
      'If login fails after changing ADMIN_PASSWORD, redeploy once so ensure-admin can sync.',
      '',
      'Testers:',
      '  tester01@taxdoc.test … tester10000@taxdoc.test (max 10.000)',
      '  Password: TaxDocTest2026!',
      '',
      'Send testers:',
      `  ${publicUrl}`,
      '  TEST-ACCOUNTS.txt',
    ].join('\n')
  );

  fs.writeFileSync(
    join(distDir, 'CLOUD-HOSTING.txt'),
    fs
      .readFileSync(join(root, 'docs/cloud/CLOUD-HOSTING.txt'), 'utf8')
      .replace('https://taxdoc-beta.onrender.com', publicUrl)
  );

  fs.copyFileSync(
    join(root, 'docs/cloud/CLOUDFLARE-SETUP.txt'),
    join(distDir, 'CLOUDFLARE-SETUP.txt')
  );

  console.log('\n✅ Render deploy complete!');
  console.log(`   Live URL: ${publicUrl}`);
  console.log(`   Saved: dist/mobile/LIVE-URL.txt`);
}

main().catch((error) => {
  console.error('\n❌ Render deploy failed:', error.message || error);
  process.exit(1);
});
