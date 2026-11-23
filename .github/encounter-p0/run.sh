#!/usr/bin/env bash
set -euo pipefail
qa="$RUNNER_TEMP/encounter-p0"
node "$qa/parity.mjs" "$qa/baseline.json" .
npm run test:act4-source
node tests/act4-story-compact-save.mjs
node tests/act4-stage37-approach-pressure.mjs
node tests/act4-return-follower-guards.mjs
node tests/act4-stage31-boarding-route.mjs
node tests/act4-local-objective-progression.mjs
base="$RUNNER_TEMP/encounter-e93-baseline"
qa="$RUNNER_TEMP/encounter-p0"
git worktree add --detach "$base" e93d606bda906d03a13febc8e04aff2870b8847e
npm install --prefix "$RUNNER_TEMP/honro-qa-deps" --no-audit --no-fund playwright@1.62.1 @napi-rs/canvas@0.1.100
export PLAYWRIGHT_MODULE="$RUNNER_TEMP/honro-qa-deps/node_modules/playwright"
export NAPI_CANVAS_MODULE="$RUNNER_TEMP/honro-qa-deps/node_modules/@napi-rs/canvas"
if command -v google-chrome >/dev/null; then
  export HONRO_CHROMIUM="$(command -v google-chrome)"
else
  node "$PLAYWRIGHT_MODULE/cli.js" install chromium
  export HONRO_CHROMIUM="$(node -p "require(process.env.PLAYWRIGHT_MODULE).chromium.executablePath()")"
fi
export HONRO_DEVICES=pc
export CAPTURE=yes
b="$(sha256sum web/manifest.json | cut -d ' ' -f1)"
node "$qa/browser.mjs" "$base" . "$OUT/browser-continue" a6c3e634ab6e6ef016e8b24f237a873bcb15dec4ffc738569a48cb9dbb00af63 "$b"
