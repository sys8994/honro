#!/usr/bin/env bash
set -euo pipefail
qa="$RUNNER_TEMP/monster-scale-v2"
base="$RUNNER_TEMP/monster-scale-baseline"
git worktree add --detach "$base" eb3dbeb2afab096d8933173286c912d6298855c0
npm install --prefix "$RUNNER_TEMP/honro-qa-deps" --no-audit --no-fund playwright@1.62.1 @napi-rs/canvas@0.1.100
export PLAYWRIGHT_MODULE="$RUNNER_TEMP/honro-qa-deps/node_modules/playwright"
export HONRO_NAPI_MODULE="$RUNNER_TEMP/honro-qa-deps/node_modules/@napi-rs/canvas"
if command -v google-chrome >/dev/null; then
 export HONRO_CHROMIUM="$(command -v google-chrome)"
else
 node "$PLAYWRIGHT_MODULE/cli.js" install chromium
 export HONRO_CHROMIUM="$(node -p "require(process.env.PLAYWRIGHT_MODULE).chromium.executablePath()")"
fi
a=ea26c6b4b838fbac260e1a33fd12716a045e4addee4e92ed9aef8963e04c1508
b="$(sha256sum web/manifest.json | cut -d ' ' -f1)"
node -e "const fs=require('fs'); const a=JSON.parse(fs.readFileSync(process.argv[1]+'/web/manifest.json')); const b=JSON.parse(fs.readFileSync('web/manifest.json')); if(a.project!==b.project) throw Error('Campaign maps or providers changed')" "$base"
HONRO_MODE=A node --experimental-vm-modules "$qa/weak-live.mjs" "$base" "$OUT/damage-A"
HONRO_MODE=B node --experimental-vm-modules "$qa/weak-live.mjs" . "$OUT/damage-B"
node "$qa/browser6.mjs" "$base" . "$OUT/frames" "$a" "$b" 6
node "$qa/save.mjs" "$base" . "$OUT/save" "$a" "$b" 6
WARDEN_ROUNDS=3 node --experimental-vm-modules "$qa/focus.mjs" . "$OUT/focus-B" 6
node -e "const fs=require('fs'),r=JSON.parse(fs.readFileSync(process.argv[1])); console.log(r.initial,r.remaining);if(r.initial.boss.hp!==734||r.remaining.h!==0||r.remaining.round>3||r.remaining.payload<=0||r.samples.filter(x=>x.weakMessage?.includes('약점!')).length<2)throw Error('Stage 6 precision budget not yet verified')" "$OUT/focus-B/focused-route.json"
