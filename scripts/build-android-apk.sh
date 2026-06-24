#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS="$ROOT/.tools"
JAVA_HOME="${JAVA_HOME:-$TOOLS/jdk-21.0.6+7/Contents/Home}"
if [[ ! -x "$JAVA_HOME/bin/java" ]]; then
  JAVA_HOME="$TOOLS/jdk-17.0.14+7/Contents/Home"
fi
ANDROID_HOME="${ANDROID_HOME:-$TOOLS/android-sdk}"

if [[ ! -x "$JAVA_HOME/bin/java" ]]; then
  echo "JDK not found. Run: node scripts/setup-android-build.mjs"
  exit 1
fi

if [[ ! -d "$ANDROID_HOME/platforms" ]]; then
  echo "Android SDK not found. Run: node scripts/setup-android-build.mjs"
  exit 1
fi

export JAVA_HOME ANDROID_HOME
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

cd "$ROOT"
npm run mobile:build

if [[ -f "$ROOT/dist/mobile/TaxDoc-Android.apk" ]]; then
  echo ""
  echo "Ready to install: $ROOT/dist/mobile/TaxDoc-Android.apk"
  ls -lah "$ROOT/dist/mobile/TaxDoc-Android.apk"
else
  echo "APK was not created. Check build output above."
  exit 1
fi
