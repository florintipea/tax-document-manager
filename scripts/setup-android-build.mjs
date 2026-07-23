#!/usr/bin/env node

/**
 * Downloads JDK 21 and Android SDK command-line tools into .tools/
 * (Used when Homebrew/Android Studio cannot be installed due to Xcode license.)
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const tools = join(root, '.tools');

const JDK_URL =
  'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.6%2B7/OpenJDK21U-jdk_aarch64_mac_hotspot_21.0.6_7.tar.gz';
const CMDLINE_URL =
  'https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip';

function run(cmd, cwd = root) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

mkdirSync(tools, { recursive: true });

const jdkDir = join(tools, 'jdk-21.0.6+7');
if (!existsSync(join(jdkDir, 'Contents', 'Home', 'bin', 'java'))) {
  run(`curl -fL -o "${join(tools, 'jdk21.tar.gz')}" "${JDK_URL}"`);
  run(`tar -xzf "${join(tools, 'jdk21.tar.gz')}" -C "${tools}"`);
}

const sdkRoot = join(tools, 'android-sdk');
const sdkManager = join(sdkRoot, 'cmdline-tools', 'latest', 'bin', 'sdkmanager');
if (!existsSync(sdkManager)) {
  mkdirSync(join(sdkRoot, 'cmdline-tools'), { recursive: true });
  run(`curl -fL -o "${join(tools, 'cmdtools.zip')}" "${CMDLINE_URL}"`);
  run(`unzip -qo "${join(tools, 'cmdtools.zip')}" -d "${join(sdkRoot, 'cmdline-tools')}"`);
  run(`mv "${join(sdkRoot, 'cmdline-tools', 'cmdline-tools')}" "${join(sdkRoot, 'cmdline-tools', 'latest')}"`);
}

const javaHome = join(jdkDir, 'Contents', 'Home');
process.env.JAVA_HOME = javaHome;
process.env.ANDROID_HOME = sdkRoot;
process.env.PATH = `${join(javaHome, 'bin')}:${join(sdkRoot, 'cmdline-tools', 'latest', 'bin')}:${process.env.PATH}`;

run('yes | sdkmanager --licenses', root);
run('sdkmanager "platform-tools" "platforms;android-35" "build-tools;35.0.0"', root);

console.log('\n✅ Android build tools ready in .tools/');
console.log('Build APK: npm run mobile:apk');
