#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

console.log('TaxDoc – full cloud launch\n');

execSync('node scripts/prepare-github-upload.mjs', { cwd: root, stdio: 'inherit' });
execSync('node scripts/github-push.mjs', { cwd: root, stdio: 'inherit' });
execSync('node scripts/render-deploy.mjs', { cwd: root, stdio: 'inherit' });

console.log('\n🎉 All done! See dist/mobile/LIVE-URL.txt');
