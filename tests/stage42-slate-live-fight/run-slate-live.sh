#!/usr/bin/env bash
set -euo pipefail
ME="$(cd "$(dirname "$0")"&&pwd)"
STOCK="${1:?built exact stock}"
ROOT="${2:?fresh disposable root}"
OUT="${3:?evidence folder}"
: "${HONRO_CHROME:?expected Chrome}"
[[ ! -e "$ROOT" ]] || exit 1
mkdir -p "$ROOT" "$OUT"
ROOT="$(realpath "$ROOT")";OUT="$(realpath "$OUT")"
q="$ROOT/qa"; b="$ROOT/build"; mkdir -p "$q"
G=tests/stage42-full-native-workshop
C=tests/stage42-composed-native
Z=tests/stage42-central-hierarchy
N=tests/stage42-real-slate
while read -r hash f; do cp "$G/$f" "$q/$f"; done < "$C/inherited.SHA256SUMS"
while read -r hash f; do cp "$C/$f" "$q/$f"; done < "$C/candidate.SHA256SUMS"
while read -r hash f; do cp "$Z/$f" "$q/$f"; done < "$Z/sample-candidate.SHA256SUMS"
while read -r hash f; do cp "$N/$f" "$q/$f"; done < "$N/slate-candidate.SHA256SUMS"
cp -a "$STOCK" "$b"
HONRO_FULL42_WORKSHOP_LOCAL=1 node "$q/prepare.mjs" "$b"
HONRO_FULL_DETAIL_WORKSHOP_QA=1 HONRO_FULL_DISPOSABLE_SHA256=15b93ae4bff4f9367ec99b18e85b515109d871f53a70bfa5cb1129f02bd085f2 node "$q/prepare-detail.mjs" "$b"
f="$b/web/runtime/workshop-app.489f733634454986.js";pre=bdcf8f5673a046006b54c09b86327972c9ba9e068ec530f1019592cfc878a3e6
printf '%s  %s\n' "$pre" "$f"|sha256sum -c -
HONRO_GATE_QA=1 HONRO_GATE_DETAILS_SHA="$pre" node "$q/prepare-gate.mjs" "$b"
printf '%s  %s\n' 5e338aa0cab16d6c265f23177f6787f1de5b294d3a83aa3e19f22e961d5187e0 "$f"|sha256sum -c -
node --check "$f"
node "$ME/build-composed-visual.mjs" "$q" > "$ROOT/live-bundle.js"
node --check "$ROOT/live-bundle.js"
export HONRO_C01_DISPOSABLE_QA=0 HONRO_COMPOSE_LIVE_WALK=0 HONRO_FULL42_URL=http://127.0.0.1:8881/HONRO_WORKSHOP.html HONRO_FULL42_ARTIST_ITINERARY="$q/full-itinerary.json"
python -m http.server 8881 --bind 127.0.0.1 --directory "$b" &
pid=$!; trap 'kill "$pid" 2>/dev/null || true' EXIT
for ((i=0;i<30;i++));do if curl -fsS -o /dev/null "$HONRO_FULL42_URL";then break;fi;sleep 1;done
timeout 850s python "$ME/slate-live-entry.py" "$OUT" "$q/browser-gate.py"
