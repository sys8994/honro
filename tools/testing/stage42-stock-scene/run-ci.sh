#!/usr/bin/env bash
set -euo pipefail
[[ "${GITHUB_ACTIONS:-}" == true ]] || { echo 'Official CI only, not local browser automation.' >&2; exit 2; }
fixtures="$1"; out="$2"; label="$3"; mkdir -p "$out"
browser=$(command -v google-chrome || command -v chromium)
node "$(dirname "$0")/capture-ci.mjs" "$fixtures" "$out" "$label" "$browser"
node "$(dirname "$0")/extract-compare.mjs" "$out/baseline.dom.html" "$out/$label.dom.html" "$out"
