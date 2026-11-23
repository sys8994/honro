#!/usr/bin/env bash
set -euo pipefail
qa="$RUNNER_TEMP/encounter-p0"
node "$qa/parity.mjs" "$qa/baseline.json" .
base="$RUNNER_TEMP/encounter-e93-baseline"
git worktree add --detach "$base" e93d606bda906d03a13febc8e04aff2870b8847e
(
  cd "$base"
  node --input-type=module -e "import {materializeWorld} from './tools/act4-source/world-source.mjs'; await materializeWorld();"
)
set +e
(cd "$base" && npm run test:act4-source) > "$OUT/source-parts-baseline.log" 2>&1
a_status=$?
npm run test:act4-source > "$OUT/source-parts-candidate.log" 2>&1
b_status=$?
set -e
test "$a_status" = "$b_status"
if [ "$a_status" != 0 ]; then
  for f in "$OUT/source-parts-baseline.log" "$OUT/source-parts-candidate.log"; do
    grep -F "not ok 1 - real canonical chunks reconstruct clean checkout byte-for-byte" "$f"
    grep -F "actual: '55d22b333065275b4de00acbae7543b8ccb64adb53a248e20a400fd054b92275'" "$f"
    grep -F "expected: '801df923ce89d8747f337f0b71e2ae38c604a8efbd6250d56e885b931af9f1b5'" "$f"
    grep -Fx '# fail 1' "$f"
  done
  echo "Exact baseline and candidate match known static world hash fixture failure; no world parts modified."
fi
node tests/act4-story-compact-save.mjs
node tests/act4-stage37-approach-pressure.mjs
node tests/act4-return-follower-guards.mjs
node tests/act4-stage31-boarding-route.mjs
node tests/act4-local-objective-progression.mjs
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
export CAPTURE=yes
b="$(sha256sum web/manifest.json | cut -d ' ' -f1)"
node --expose-gc --experimental-vm-modules "$qa/engine.mjs" "$base" "$OUT/engine-A"
node --expose-gc --experimental-vm-modules "$qa/engine.mjs" . "$OUT/engine-B"
node "$qa/compare.mjs" "$OUT/engine-A/ENGINE.json" "$OUT/engine-B/ENGINE.json" "$OUT/runtime-parity.json"
node "$qa/browser.mjs" "$base" . "$OUT/browser-continue" a6c3e634ab6e6ef016e8b24f237a873bcb15dec4ffc738569a48cb9dbb00af63 "$b"
