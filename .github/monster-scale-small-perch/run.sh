#!/usr/bin/env bash
set -euo pipefail
qa="$RUNNER_TEMP/monster-scale-small-perch"
base="$RUNNER_TEMP/monster-scale-small-perch-baseline"
git worktree add --detach "$base" a9f6345e6d22e82359a820a565ddc293deaa280f
npm install --prefix "$RUNNER_TEMP/honro-qa-deps" --no-audit --no-fund playwright@1.62.1 @napi-rs/canvas@0.1.100
export PLAYWRIGHT_MODULE="$RUNNER_TEMP/honro-qa-deps/node_modules/playwright"
export HONRO_NAPI_MODULE="$RUNNER_TEMP/honro-qa-deps/node_modules/@napi-rs/canvas"
if command -v google-chrome >/dev/null; then
 export HONRO_CHROMIUM="$(command -v google-chrome)"
else
 node "$PLAYWRIGHT_MODULE/cli.js" install chromium
 export HONRO_CHROMIUM="$(node -p "require(process.env.PLAYWRIGHT_MODULE).chromium.executablePath()")"
fi
a=7b805d34e42a7ac1e0afafdf1210e5473b8a56059ceccf8f3794b1d5b5655df7
b="$(sha256sum web/manifest.json | cut -d ' ' -f1)"
HONRO_MODE=A node --experimental-vm-modules "$qa/stage6-bat-live.mjs" "$base" "$OUT/roost-A" 6
HONRO_MODE=B node --experimental-vm-modules "$qa/stage6-bat-live.mjs" . "$OUT/roost-B" 6
HONRO_MODE=B node --experimental-vm-modules "$qa/weak-live.mjs" . "$OUT/guardian"
HONRO_MODE=B node --experimental-vm-modules "$qa/grove-regression.mjs" . "$OUT/grove"
node "$qa/save.mjs" "$base" . "$OUT/save" "$a" "$b" 6
