#!/usr/bin/env bash
set -euo pipefail
qa="$RUNNER_TEMP/encounter-p12"
stage_ids=8,10,12,17,18,20,21,25,26,28,39,41,42,44,50
node "$qa/parity.mjs" "$qa/baseline.json" .
base="$RUNNER_TEMP/encounter-f59-baseline"
git worktree add --detach "$base" f59c3365e4e19ad8ec6ca2c23edf1c814bafefa9
npm install --prefix "$RUNNER_TEMP/honro-qa-deps" --no-audit --no-fund playwright@1.62.1 @napi-rs/canvas@0.1.100
export PLAYWRIGHT_MODULE="$RUNNER_TEMP/honro-qa-deps/node_modules/playwright"
export HONRO_NAPI_MODULE="$RUNNER_TEMP/honro-qa-deps/node_modules/@napi-rs/canvas"
if command -v google-chrome >/dev/null; then
  export HONRO_CHROMIUM="$(command -v google-chrome)"
else
  node "$PLAYWRIGHT_MODULE/cli.js" install chromium
  export HONRO_CHROMIUM="$(node -p "require(process.env.PLAYWRIGHT_MODULE).chromium.executablePath()")"
fi
export HONRO_DEVICES=pc
a=8e1051183d08528a4a9594917dfc94c0e75451fae4940ac0129422dca6254879
b="$(sha256sum web/manifest.json | cut -d ' ' -f1)"
export FRAMES=yes
export HONRO_FRAME_IDS="$HONRO_INTENDED"
node --expose-gc --experimental-vm-modules "$qa/engine.mjs" "$base" "$OUT/engine-A" "$stage_ids"
HONRO_FRAME_REFERENCE="$OUT/engine-A/ENGINE.json" node --expose-gc --experimental-vm-modules "$qa/engine.mjs" . "$OUT/engine-B" "$stage_ids"
node "$qa/compare.mjs" "$OUT/engine-A/ENGINE.json" "$OUT/engine-B/ENGINE.json" "$OUT/runtime-parity.json"
node "$qa/browser.mjs" "$base" . "$OUT/browser-continue" "$a" "$b" "$stage_ids"
node --experimental-vm-modules "$qa/phase-native.mjs" "$base" "$OUT/phase-A" A "$a"
node --experimental-vm-modules "$qa/phase-native.mjs" . "$OUT/phase-B" B "$b"
node "$qa/compare-phases.mjs" "$OUT/phase-A/ACT5-PHASES.json" "$OUT/phase-B/ACT5-PHASES.json" "$OUT/phase-parity.json"
