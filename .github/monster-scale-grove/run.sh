#!/usr/bin/env bash
set -euo pipefail
qa="$RUNNER_TEMP/monster-scale-grove"
base="$RUNNER_TEMP/monster-scale-grove-baseline"
git worktree add --detach "$base" d80e64593e40342a34e5ea1e4e13f22ecda770a7
npm install --prefix "$RUNNER_TEMP/honro-qa-deps" --no-audit --no-fund playwright@1.62.1 @napi-rs/canvas@0.1.100
export PLAYWRIGHT_MODULE="$RUNNER_TEMP/honro-qa-deps/node_modules/playwright"
export HONRO_NAPI_MODULE="$RUNNER_TEMP/honro-qa-deps/node_modules/@napi-rs/canvas"
if command -v google-chrome >/dev/null; then
 export HONRO_CHROMIUM="$(command -v google-chrome)"
else
 node "$PLAYWRIGHT_MODULE/cli.js" install chromium
 export HONRO_CHROMIUM="$(node -p "require(process.env.PLAYWRIGHT_MODULE).chromium.executablePath()")"
fi
a=b0a7c49c6c8e2a992c05c94327902b760cca45c3e21d0f3b3f7437ce0a891c78
b="$(sha256sum web/manifest.json | cut -d ' ' -f1)"
HONRO_MODE=B node --experimental-vm-modules "$qa/bridge-regression.mjs" . "$OUT/bridge"
HONRO_MODE=B node --experimental-vm-modules "$qa/stage44-live.mjs" . "$OUT/grove"
node --experimental-vm-modules "$qa/wave2-probe.mjs" "$base" "$OUT/engine-A" 44
node --experimental-vm-modules "$qa/wave2-probe.mjs" . "$OUT/engine-B" 44
node "$qa/parity.mjs" "$OUT/engine-A" "$OUT/engine-B"
node "$qa/save.mjs" "$base" . "$OUT/save" "$a" "$b" 44
