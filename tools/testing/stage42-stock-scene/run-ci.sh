#!/usr/bin/env bash
set -euo pipefail
[[ "${GITHUB_ACTIONS:-}" == true ]] || { echo 'This runner is for official CI only, not local browser automation.' >&2; exit 2; }
fixtures="$1"; out="$2"; label="$3"
mkdir -p "$out"
browser=$(command -v google-chrome || command -v chromium)
for variant in baseline "$label"; do
 profile=$(mktemp -d "$RUNNER_TEMP/stage42-scene-${variant}-XXXXXX")
 timeout 600s "$browser" --headless --no-first-run --no-default-browser-check --force-device-scale-factor=1 --virtual-time-budget=180000 --user-data-dir="$profile" --dump-dom "file://$(realpath "$fixtures/$variant.html")" > "$out/$variant.dom.html" 2> "$out/$variant.chrome.log"
done
node "$(dirname "$0")/extract-compare.mjs" "$out/baseline.dom.html" "$out/$label.dom.html" "$out"
