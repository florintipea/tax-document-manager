#!/usr/bin/env node

import { execSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { networkInterfaces } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const mobileDir = join(root, 'mobile');
const distDir = join(root, 'dist', 'mobile');

function run(cmd, cwd = root, env = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
}

function runOptional(cmd, cwd = root, env = {}) {
  try {
    run(cmd, cwd, env);
    return true;
  } catch {
    return false;
  }
}

function getLocalIp() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

function writeCapacitorConfig(serverUrl) {
  const config = {
    appId: 'com.taxdoc.manager',
    appName: 'TaxDoc',
    webDir: 'www',
    server: {
      url: serverUrl,
      cleartext: true,
      androidScheme: 'http',
    },
    android: {
      allowMixedContent: true,
    },
  };
  writeFileSync(
    join(mobileDir, 'capacitor.config.json'),
    JSON.stringify(config, null, 2)
  );

  const htmlTemplate = `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>TaxDoc</title>
  </head>
  <body>
    <script>window.location.replace('${serverUrl}/dashboard');</script>
    <p>TaxDoc wird geladen…</p>
  </body>
</html>`;
  writeFileSync(join(mobileDir, 'www', 'index.html'), htmlTemplate);
}

function zipDirectory(sourceDir, outPath) {
  run(`cd "${sourceDir}" && zip -r "${outPath}" .`, root);
}

function main() {
  const ip = process.env.MOBILE_SERVER_URL
    ? new URL(process.env.MOBILE_SERVER_URL).hostname
    : getLocalIp();
  const port = process.env.MOBILE_SERVER_PORT || '3000';
  const serverUrl = process.env.MOBILE_SERVER_URL || `http://${ip}:${port}`;

  console.log(`\nTaxDoc mobile build`);
  console.log(`Server URL embedded in app: ${serverUrl}\n`);

  mkdirSync(distDir, { recursive: true });

  run('node scripts/generate-pwa-icons.mjs', root);

  writeCapacitorConfig(serverUrl);

  if (!existsSync(join(mobileDir, 'node_modules'))) {
    run('npm install', mobileDir);
  }

  if (!existsSync(join(mobileDir, 'android'))) {
    run('npx cap add android', mobileDir, { MOBILE_SERVER_URL: serverUrl });
  }
  if (!existsSync(join(mobileDir, 'ios'))) {
    const iosAdded = runOptional('npx cap add ios', mobileDir, {
      MOBILE_SERVER_URL: serverUrl,
    });
    if (!iosAdded) {
      console.warn('iOS project skipped (CocoaPods/Xcode not installed). iPhone uses PWA zip.');
    }
  }

  run('npx cap sync', mobileDir, { MOBILE_SERVER_URL: serverUrl });

  const androidApk = join(
    mobileDir,
    'android',
    'app',
    'build',
    'outputs',
    'apk',
    'debug',
    'app-debug.apk'
  );

  const toolsDir = join(root, '.tools');
  const javaHome21 = join(toolsDir, 'jdk-21.0.6+7', 'Contents', 'Home');
  const javaHome17 = join(toolsDir, 'jdk-17.0.14+7', 'Contents', 'Home');
  const javaHome = existsSync(join(javaHome21, 'bin', 'java'))
    ? javaHome21
    : javaHome17;
  const androidHome = join(toolsDir, 'android-sdk');
  const hasLocalJava = existsSync(join(javaHome, 'bin', 'java'));
  const hasLocalSdk = existsSync(join(androidHome, 'platforms'));

  if (hasLocalSdk) {
    writeFileSync(
      join(mobileDir, 'android', 'local.properties'),
      `sdk.dir=${androidHome.replace(/\\/g, '/')}\n`
    );
  }

  const buildEnv = {
    ...(hasLocalJava ? { JAVA_HOME: javaHome } : {}),
    ...(hasLocalSdk ? { ANDROID_HOME: androidHome } : {}),
  };

  let androidBuilt = false;
  const gradlew = join(mobileDir, 'android', 'gradlew');
  if (existsSync(gradlew)) {
    try {
      run('chmod +x ./gradlew && ./gradlew assembleDebug', join(mobileDir, 'android'), buildEnv);
      androidBuilt = existsSync(androidApk);
    } catch (error) {
      console.warn('Android APK build failed. Install Android Studio / SDK to build APK.');
      console.warn(String(error.message || error));
    }
  }

  if (androidBuilt) {
    cpSync(androidApk, join(distDir, 'TaxDoc-Android.apk'));
    console.log(`\n✅ Android APK: dist/mobile/TaxDoc-Android.apk`);
  } else {
    const androidInstallDir = join(distDir, 'TaxDoc-Android');
    rmSync(androidInstallDir, { recursive: true, force: true });
    mkdirSync(androidInstallDir, { recursive: true });
    cpSync(join(root, 'public', 'icons'), join(androidInstallDir, 'icons'), {
      recursive: true,
    });

    writeFileSync(
      join(androidInstallDir, 'INSTALL-Android.txt'),
      [
        'TaxDoc für Android installieren',
        '================================',
        '',
        'OPTION A – APK (App-Datei):',
        '  Installieren Sie Android Studio + Java auf dem Mac, dann:',
        '    npm run mobile:build',
        '  Die Datei TaxDoc-Android.apk wird erstellt.',
        '  Per WhatsApp senden → auf dem Handy öffnen → Installieren.',
        '',
        'OPTION B – Ohne APK (Chrome):',
        `  1. Server starten: npm run dev:mobile`,
        `  2. Chrome auf Android öffnen: ${serverUrl}`,
        '  3. Menü (⋮) → App installieren / Zum Startbildschirm hinzufügen',
        '',
        `Server-Adresse: ${serverUrl}`,
        'Mac und Handy im gleichen WLAN.',
      ].join('\n')
    );

    writeFileSync(
      join(androidInstallDir, 'install.html'),
      `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="mobile-web-app-capable" content="yes" />
  <title>TaxDoc Android</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 520px; margin: 40px auto; padding: 0 16px; }
    a.button { display: inline-block; background: #2563eb; color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; }
  </style>
</head>
<body>
  <h1>TaxDoc Android</h1>
  <p><a class="button" href="${serverUrl}/dashboard">TaxDoc öffnen</a></p>
  <p>Chrome-Menü → <strong>App installieren</strong> oder <strong>Zum Startbildschirm</strong>.</p>
</body>
</html>`
    );

    const androidZip = join(distDir, 'TaxDoc-Android.zip');
    rmSync(androidZip, { force: true });
    zipDirectory(androidInstallDir, androidZip);
    rmSync(androidInstallDir, { recursive: true, force: true });
    console.log(`✅ Android: dist/mobile/TaxDoc-Android.zip (PWA + APK-Anleitung)`);

    writeFileSync(
      join(distDir, 'ANDROID-APK-BUILD.txt'),
      [
        'APK auf dem Mac bauen (einmalig):',
        '1. Android Studio installieren: https://developer.android.com/studio',
        '2. Xcode-Lizenz akzeptieren / Java installieren',
        '3. Im Projektordner: npm run mobile:build',
        '4. Datei: dist/mobile/TaxDoc-Android.apk',
      ].join('\n')
    );
  }

  const iphoneDir = join(distDir, 'TaxDoc-iPhone');
  rmSync(iphoneDir, { recursive: true, force: true });
  mkdirSync(iphoneDir, { recursive: true });

  cpSync(join(root, 'public', 'icons'), join(iphoneDir, 'icons'), { recursive: true });

  writeFileSync(
    join(iphoneDir, 'INSTALL-iPhone.txt'),
    [
      'TaxDoc für iPhone installieren',
      '================================',
      '',
      'iPhone erlaubt keine APK-Installation wie Android.',
      'So installieren Sie TaxDoc als App auf dem Home-Bildschirm:',
      '',
      '1. Starten Sie TaxDoc auf Ihrem Mac:',
      '     npm run dev:mobile',
      '',
      '2. iPhone muss im gleichen WLAN sein wie der Mac.',
      '',
      `3. Öffnen Sie Safari auf dem iPhone und gehen Sie zu:`,
      `     ${serverUrl}`,
      '',
      '4. Tippen Sie auf Teilen (Quadrat mit Pfeil nach oben).',
      '',
      '5. Wählen Sie "Zum Home-Bildschirm".',
      '',
      '6. Tippen Sie "Hinzufügen".',
      '',
      'TaxDoc erscheint wie eine App auf Ihrem iPhone.',
      '',
      'Login: lf.tipea@gmail.com (Ihr Passwort)',
    ].join('\n')
  );

  writeFileSync(
    join(iphoneDir, 'install.html'),
    `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-title" content="TaxDoc" />
  <link rel="apple-touch-icon" href="icons/icon-192.png" />
  <title>TaxDoc installieren</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 520px; margin: 40px auto; padding: 0 16px; }
    a.button { display: inline-block; background: #2563eb; color: #fff; padding: 12px 20px; border-radius: 10px; text-decoration: none; margin: 12px 0; }
    ol { line-height: 1.7; }
  </style>
</head>
<body>
  <h1>TaxDoc auf iPhone</h1>
  <p>Öffnen Sie TaxDoc in Safari und fügen Sie die App zum Home-Bildschirm hinzu.</p>
  <a class="button" href="${serverUrl}/dashboard">TaxDoc öffnen</a>
  <ol>
    <li>Oben auf <strong>Teilen</strong> tippen</li>
    <li><strong>Zum Home-Bildschirm</strong> wählen</li>
    <li><strong>Hinzufügen</strong> bestätigen</li>
  </ol>
</body>
</html>`
  );

  const iphoneZip = join(distDir, 'TaxDoc-iPhone.zip');
  rmSync(iphoneZip, { force: true });
  zipDirectory(iphoneDir, iphoneZip);
  rmSync(iphoneDir, { recursive: true, force: true });
  console.log(`✅ iPhone: dist/mobile/TaxDoc-iPhone.zip`);

  writeFileSync(
    join(distDir, 'WHATSAPP-ANLEITUNG.txt'),
    [
      'TaxDoc per WhatsApp aufs Handy senden',
      '=====================================',
      '',
      'ANDROID (WhatsApp senden):',
      '  → TaxDoc-Android.apk (fertig zum Installieren!)',
      '  → INSTALL-Android-APK.txt (Anleitung)',
      '',
      'IPHONE (WhatsApp senden):',
      '  → TaxDoc-iPhone.zip (entpacken, INSTALL-iPhone.txt lesen)',
      '',
      'SERVER AUF DEM MAC STARTEN (Pflicht):',
      '  npm run dev:mobile',
      '',
      'Handy und Mac im gleichen WLAN.',
      '',
      `App-Adresse: ${serverUrl}`,
      '',
      'Upload: bis 100 MB pro Datei',
      '',
      'TEST-ACCOUNTS FÜR FREUNDE:',
      '  → TEST-ACCOUNTS.txt (50 Login-Konten)',
      '  → FRIEND-TEST-GUIDE.txt (Anleitung für Tester)',
      '  Passwort für alle Tester: TaxDocTest2026!',
      '  Beispiel: tester01@taxdoc.test … tester10000@taxdoc.test',
    ].join('\n')
  );

  console.log(`\n✅ Anleitung: dist/mobile/WHATSAPP-ANLEITUNG.txt`);
  console.log(`\nSende die Dateien aus dem Ordner: dist/mobile/\n`);
}

main();
