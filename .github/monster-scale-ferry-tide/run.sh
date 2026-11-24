#!/usr/bin/env bash
set -euo pipefail
qa="$RUNNER_TEMP/monster-scale-ferry-tide"
base="$RUNNER_TEMP/monster-scale-ferry-tide-baseline"
git worktree add --detach "$base" 577b364d49b4456af402b362d2a9e7660c00bc3e
npm install --prefix "$RUNNER_TEMP/honro-qa-deps" --no-audit --no-fund playwright@1.62.1 @napi-rs/canvas@0.1.100
export PLAYWRIGHT_MODULE="$RUNNER_TEMP/honro-qa-deps/node_modules/playwright"
export HONRO_NAPI_MODULE="$RUNNER_TEMP/honro-qa-deps/node_modules/@napi-rs/canvas"
if command -v google-chrome >/dev/null; then
 export HONRO_CHROMIUM="$(command -v google-chrome)"
else
 node "$PLAYWRIGHT_MODULE/cli.js" install chromium
 export HONRO_CHROMIUM="$(node -p "require(process.env.PLAYWRIGHT_MODULE).chromium.executablePath()")"
fi
a=f1cffe69c1bc8825866ffe4d6b3b9bbcff90a5964f24f745af8e841a4ced263b
b="$(sha256sum web/manifest.json | cut -d ' ' -f1)"
node --experimental-vm-modules "$qa/palette-live.mjs" "$base" "$OUT/palettes-A" 30,40
node --experimental-vm-modules "$qa/palette-live.mjs" . "$OUT/palettes-B" 30,40
node "$qa/parity.mjs" "$OUT/palettes-A" "$OUT/palettes-B"
node "$qa/save.mjs" "$base" . "$OUT/save" "$a" "$b" 30,40
