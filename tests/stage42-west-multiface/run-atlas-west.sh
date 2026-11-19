#!/usr/bin/env bash
set -euo pipefail
D="$(cd "$(dirname "$0")"&&pwd)"
STOCK="$(realpath "${1:?built official stock directory}")"
ROOT="${2:?new disposable copy root}"; OUT="${3:?evidence directory}"
: "${HONRO_CHROME:?pinned Chrome executable}"
[[ ! -e "$ROOT" && -f "$STOCK/HONRO.html" && -d "$STOCK/web/runtime" ]] || exit 1
mkdir -p "$ROOT" "$OUT"; ROOT="$(realpath "$ROOT")"; OUT="$(realpath "$OUT")"
q="$ROOT/qa"; w="$ROOT/upper"; B="$ROOT/build"; mkdir -p "$q" "$w"
G=tests/stage42-full-native-workshop; C=tests/stage42-composed-native; Z=tests/stage42-central-hierarchy; A=tests/stage42-slate-atlas; I=tests/stage42-atlas-west-integrated
while read -r hash f; do cp "$G/$f" "$q/$f"; done < "$C/inherited.SHA256SUMS"
while read -r hash f; do cp "$C/$f" "$q/$f"; done < "$C/candidate.SHA256SUMS"
while read -r hash f; do cp "$Z/$f" "$q/$f"; done < "$Z/sample-candidate.SHA256SUMS"
while read -r hash f; do cp "$A/$f" "$q/$f"; done < "$A/atlas-candidate.SHA256SUMS"
for f in browser-gate.py detail-itinerary.json detail.mjs pack-gate.mjs; do cp "$I/$f" "$q/$f"; done
for f in isolated-harness.js walk_probe.py equipment-ephemeral-entry.js; do cp "$I/$f" "$w/$f"; done
for f in locked-envelope.mjs multi.mjs west-owner.mjs host-west.js prepare-west.mjs upper-structure-pointer.json proof-west.py stock_actor_view.py west_visual_pixels.py build-composed-visual.mjs; do cp "$D/$f" "$w/$f"; done
cp "$q/author-detail.mjs" "$w/pinned-author-detail.mjs"
echo "d1226731e51c1261b9d6b253786c88e4ecebfe033145c96a2edef11e0d5678de  $w/pinned-author-detail.mjs"|sha256sum -c -
cp -a "$STOCK" "$B"; f="$B/web/runtime/workshop-app.489f733634454986.js"
HONRO_FULL42_WORKSHOP_LOCAL=1 node "$q/prepare.mjs" "$B"
HONRO_FULL_DETAIL_WORKSHOP_QA=1 HONRO_FULL_DISPOSABLE_SHA256=15b93ae4bff4f9367ec99b18e85b515109d871f53a70bfa5cb1129f02bd085f2 node "$q/prepare-detail.mjs" "$B"
HONRO_GATE_QA=1 HONRO_GATE_DETAILS_SHA=9909d309b059ef4d32ff082fa6a4968be19e6082889edac172b0adf9f8f5dfb9 node "$q/prepare-gate.mjs" "$B"
HONRO_WEST_UPPER_QA=1 node "$w/prepare-west.mjs" "$B"
echo "9dcccbf005a5433a87adfb4efa24a1cf51a369c500c4734dc9630fb8cf5146ab  $f"|sha256sum -c -
node --check "$f"
export HONRO_C01_DISPOSABLE_QA=0 HONRO_COMPOSE_LIVE_WALK=0 HONRO_FULL42_URL=http://127.0.0.1:8884/HONRO_WORKSHOP.html HONRO_FULL42_ARTIST_ITINERARY="$q/full-itinerary.json"
python -m http.server 8884 --bind 127.0.0.1 --directory "$B" &
pid=$!; trap 'kill "$pid" 2>/dev/null||true' EXIT
for i in {1..30};do if curl -fsS -o /dev/null "$HONRO_FULL42_URL";then break;fi;sleep 1;done
timeout 1000s python "$w/proof-west.py" "$OUT" "$q/browser-gate.py"
