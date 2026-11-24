#!/usr/bin/env bash
set -euo pipefail
qa="$RUNNER_TEMP/monster-scale-jamunsa"
base="$RUNNER_TEMP/monster-scale-jamunsa-baseline"
git worktree add --detach "$base" bde5c1e807896069152d4d580379f8a0939474cc
npm install --prefix "$RUNNER_TEMP/honro-qa-deps" --no-audit --no-fund playwright@1.62.1 @napi-rs/canvas@0.1.100
export PLAYWRIGHT_MODULE="$RUNNER_TEMP/honro-qa-deps/node_modules/playwright"
export HONRO_NAPI_MODULE="$RUNNER_TEMP/honro-qa-deps/node_modules/@napi-rs/canvas"
if command -v google-chrome >/dev/null; then
 export HONRO_CHROMIUM="$(command -v google-chrome)"
else
 node "$PLAYWRIGHT_MODULE/cli.js" install chromium
 export HONRO_CHROMIUM="$(node -p "require(process.env.PLAYWRIGHT_MODULE).chromium.executablePath()")"
fi
a=cbf3d99c9cb220a81b6553efccb98241965157373999feb2abe86537ba0c623b
b="$(sha256sum web/manifest.json | cut -d ' ' -f1)"
node --experimental-vm-modules "$qa/wave2-probe.mjs" "$base" "$OUT/engine-A" 16
node --experimental-vm-modules "$qa/wave2-probe.mjs" . "$OUT/engine-B" 16
node "$qa/parity.mjs" "$OUT/engine-A" "$OUT/engine-B"
node "$qa/save.mjs" "$base" . "$OUT/save" "$a" "$b" 16
