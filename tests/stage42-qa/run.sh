#!/usr/bin/env bash
set -euo pipefail
[[ ${GITHUB_REF:-} == refs/heads/qa/stage42-production ]]
root=tests/stage42-qa
out="${RUNNER_TEMP:?}/stage42-evidence"
fixtures="$RUNNER_TEMP/stage42-scene-fixtures"
mkdir -p "$out" "$fixtures"
browser=$(command -v google-chrome || command -v chromium)
"$browser" --version > "$out/browser.txt"
node "$root/make-fixtures.mjs" "$fixtures"
views=(overview west east top bottom contact portrait)
if [[ ${HONRO_QA_SINGLE:-0} == 1 ]]; then views=(overview); fi
for v in "${views[@]}"; do
 for t in baseline candidate; do
  n="$t-$v"
  timeout 105s "$browser" --headless --no-first-run --no-default-browser-check --force-device-scale-factor=1 --virtual-time-budget=45000 --user-data-dir="$RUNNER_TEMP/profile-$n" --dump-dom "file://$fixtures/$n.html" > "$fixtures/$n.raw.html"
  node -e 'const fs=require("fs"); const x=fs.readFileSync(process.argv[1],"utf8").match(/<pre id="result">([A-Za-z0-9+/=]+)<\/pre>/); if(!x) throw Error("Chrome did not report valid evidence"); console.log(x[0]);' "$fixtures/$n.raw.html" > "$out/$n.result.html"
  rm "$fixtures/$n.raw.html"
  rm "$fixtures/$n.html"
 done
done
node "$root/compare.mjs" "$out"
