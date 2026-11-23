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
ln -s "$PWD/node_modules" "$base/node_modules"
ln -s "$PWD/game/node_modules" "$base/game/node_modules"
set +e
(cd "$base" && node tests/act4-stage37-approach-pressure.mjs) > "$OUT/stage37-old-test-A.log" 2>&1
old37a=$?
node tests/act4-stage37-approach-pressure.mjs > "$OUT/stage37-old-test-B.log" 2>&1
old37b=$?
set -e
test "$old37a" = "$old37b"
if [ "$old37a" != 0 ]; then
  python - "$OUT" <<'PY2'
import pathlib,re,sys
d=pathlib.Path(sys.argv[1])
rows=[]
for x in ['A','B']:
 s=(d/f'stage37-old-test-{x}.log').read_text()
 assert 'tests/act4-stage37-approach-pressure.mjs:24:8' in s and s.count("AssertionError [ERR_ASSERTION]:")==1,s
 def capture(key): return re.search(r'^ +'+key+r": '(.+)',?$",s,re.M).group(1)
 rows.append([capture('actual'),capture('expected')])
assert rows[0]==rows[1],rows
for pair in rows:
 assert '["a4-37-b-1",1,1259,1.8683940085876303,0.04,["HBT01","HBT02"]]' in pair[0]
 assert '["a4-37-b-1",1,1385,1.8683940085876303,0.04,["LA01"]]' in pair[1]
print('Exact A/B Story reproduction: prior raw-map Stage37 comparison expects b-1 archer, both active author paths already have the same bat.')
PY2
fi
set +e
node tests/act4-return-follower-guards.mjs > "$OUT/return-follower-test.log" 2>&1
follower=$?
node tests/act4-stage31-boarding-route.mjs > "$OUT/boarding-route-test.log" 2>&1
boarding=$?
set -e
cat "$OUT/return-follower-test.log" "$OUT/boarding-route-test.log"
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
test "$follower" = 0
test "$boarding" = 0
