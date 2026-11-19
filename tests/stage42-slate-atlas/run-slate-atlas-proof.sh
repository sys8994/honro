#!/usr/bin/env bash
set -euo pipefail
ME="$(cd "$(dirname "$0")"&&pwd)"
STOCK="${1:?built exact stock}"
ROOT="${2:?fresh disposable root}"
OUT="${3:?evidence folder}"
: "${HONRO_CHROME:?expected Chrome}" "${STAGE42_C01_PNG:?exact C01 A}"
[[ ! -e "$ROOT" ]] || exit 1
mkdir -p "$ROOT" "$OUT"
ROOT="$(realpath "$ROOT")";OUT="$(realpath "$OUT")"
q="$ROOT/qa"; b="$ROOT/build"; mkdir -p "$q"
G=tests/stage42-full-native-workshop
C=tests/stage42-composed-native
Z=tests/stage42-central-hierarchy
while read -r hash f; do cp "$G/$f" "$q/$f"; done < "$C/inherited.SHA256SUMS"
while read -r hash f; do cp "$C/$f" "$q/$f"; done < "$C/candidate.SHA256SUMS"
while read -r hash f; do cp "$Z/$f" "$q/$f"; done < "$Z/sample-candidate.SHA256SUMS"
while read -r hash f; do cp "$ME/$f" "$q/$f"; done < "$ME/atlas-candidate.SHA256SUMS"
cp -a "$STOCK" "$b"
HONRO_FULL42_WORKSHOP_LOCAL=1 node "$q/prepare.mjs" "$b"
HONRO_FULL_DETAIL_WORKSHOP_QA=1 HONRO_FULL_DISPOSABLE_SHA256=15b93ae4bff4f9367ec99b18e85b515109d871f53a70bfa5cb1129f02bd085f2 node "$q/prepare-detail.mjs" "$b"
f="$b/web/runtime/workshop-app.489f733634454986.js";pre=9909d309b059ef4d32ff082fa6a4968be19e6082889edac172b0adf9f8f5dfb9
printf '%s  %s\n' "$pre" "$f"|sha256sum -c -
HONRO_GATE_QA=1 HONRO_GATE_DETAILS_SHA="$pre" node "$q/prepare-gate.mjs" "$b"
printf '%s  %s\n' 86561f45e38bb32e206e428b965ebae6c973e2160a363b94ff31b572f6b08a5e "$f"|sha256sum -c -
node --check "$f"
HONRO_C01_DISPOSABLE_QA=1 node "$q/prepare-c01.mjs" "$b" "$STAGE42_C01_PNG"
export HONRO_C01_DISPOSABLE_QA=1 HONRO_COMPOSE_LIVE_WALK=0 HONRO_FULL42_URL=http://127.0.0.1:8878/HONRO_WORKSHOP.html HONRO_FULL42_ARTIST_ITINERARY="$q/full-itinerary.json"
python -m http.server 8878 --bind 127.0.0.1 --directory "$b" &
pid=$!; trap 'kill "$pid" 2>/dev/null || true' EXIT
for ((i=0;i<30;i++));do if curl -fsS -o /dev/null "$HONRO_FULL42_URL";then break;fi;sleep 1;done
timeout 650s python "$q/browser-gate.py" "$OUT"
