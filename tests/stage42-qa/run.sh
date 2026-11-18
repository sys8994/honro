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
for v in overview west east top bottom contact portrait; do
 for t in baseline candidate; do
  n="$t-$v"
  timeout 105s "$browser" --headless --no-first-run --no-default-browser-check --force-device-scale-factor=1 --virtual-time-budget=45000 --user-data-dir="$RUNNER_TEMP/profile-$n" --dump-dom "file://$fixtures/$n.html" > "$out/$n.result.html"
  rm "$fixtures/$n.html"
 done
done
node "$root/compare.mjs" "$out"
