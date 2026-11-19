#!/usr/bin/env bash
set -euo pipefail
ME="$(cd "$(dirname "$0")"&&pwd)"
OLD="${1:?frozen composed QA package}"
STOCK="${2:?runtime from exact master 1e043b09}"
ROOT="${3:?new disposable directory}"
OUT="${4:?evidence directory}"
: "${HONRO_CHROME:?expected Chrome}"
[[ "$ROOT" != "$STOCK" ]] || exit 1
mkdir -p "$ROOT" "$OUT"
ROOT="$(realpath "$ROOT")";OUT="$(realpath "$OUT")"
[[ "$ROOT" != "$(realpath "$STOCK")" ]] || exit 1
(cd "$OLD" && sha256sum -c candidate.SHA256SUMS >/dev/null)
(cd "$ME" && sha256sum -c sample-candidate.SHA256SUMS >/dev/null)
for a in baseline sample; do
 q="$ROOT/$a/qa"; b="$ROOT/$a/build"
 [[ ! -e "$ROOT/$a" ]] || exit 1
 mkdir -p "$ROOT/$a"; cp -a "$OLD" "$q"; cp -a "$STOCK" "$b"
 cp "$ME/review-cameras.json" "$q/review-cameras.json"
 if [[ "$a" == sample ]]; then
   for f in detail.mjs detail-itinerary.json pack-gate.mjs browser-gate.py prepare-c01.mjs c01_pairs.py; do cp "$ME/$f" "$q/$f";done
   pre=80ae4910a9b8f341ab64cbc49f88aaa4c3c988438408db248ec0e27278caba24
   post=7340af3da58bc0e95bb436fb75d3e86c8dc86093581a12d880dfbbd7fba98321
 else
   pre=25d6f97dcbbb725db9ee7f7069cd05a04b556aa5d45769fd19c5a265f56873ad
   post=d4e693ccf208c4ea5c9692ea886d2ac83a7f1b2d1066cf561e148215204fcc26
 fi
 HONRO_FULL42_WORKSHOP_LOCAL=1 node "$q/prepare.mjs" "$b"
 HONRO_FULL_DETAIL_WORKSHOP_QA=1 HONRO_FULL_DISPOSABLE_SHA256=15b93ae4bff4f9367ec99b18e85b515109d871f53a70bfa5cb1129f02bd085f2 node "$q/prepare-detail.mjs" "$b"
 f="$b/web/runtime/workshop-app.489f733634454986.js"
 printf '%s  %s\n' "$pre" "$f"|sha256sum -c -
 HONRO_GATE_QA=1 HONRO_GATE_DETAILS_SHA="$pre" node "$q/prepare-gate.mjs" "$b"
 printf '%s  %s\n' "$post" "$f"|sha256sum -c -
 node --check "$f"
 if [[ "${HONRO_SAMPLE_C01_ON:-0}" == 1 ]]; then
   HONRO_C01_DISPOSABLE_QA=1 node "$q/prepare-c01.mjs" "$b" "${STAGE42_C01_PNG:?exact C01 A}"
 fi
done
trap 'jobs -pr | xargs -r kill 2>/dev/null || true' EXIT
export HONRO_C01_DISPOSABLE_QA="${HONRO_SAMPLE_C01_ON:-0}" HONRO_COMPOSE_LIVE_WALK=0
for a in baseline sample; do
 q="$ROOT/$a/qa"; b="$ROOT/$a/build"
 case "$a" in baseline) port=8876;; sample) port=8877;; esac
 export HONRO_FULL42_URL="http://127.0.0.1:$port/HONRO_WORKSHOP.html" HONRO_FULL42_ARTIST_ITINERARY="$q/full-itinerary.json"
 python -m http.server "$port" --bind 127.0.0.1 --directory "$b" &
 for ((i=0;i<30;i++));do if curl -fsS -o /dev/null "$HONRO_FULL42_URL";then break;fi;sleep 1;done
 if timeout 650s python "$q/browser-gate.py" "$OUT/$a";then rc=0;else rc=$?;fi
 echo "$rc" > "$ROOT/$a/status"
done
python "$ME/verify-sample.py" "$ROOT" "$OUT"
