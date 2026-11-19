#!/usr/bin/env bash
set -euo pipefail
P="$(cd "$(dirname "$0")" && pwd)"
INHERITED="${1:?exact gate-parent tests folder}"
STOCK="${2:?pinned clean build}"
ROOT="${3:?disposable work directory}"
E="${4:?PNG/result output directory}"
: "${HONRO_CHROME:?pin Chrome executable}"
mkdir -p "$ROOT" "$E/baseline" "$E/candidate"
ROOT="$(realpath "$ROOT")"; E="$(realpath "$E")"
test "$(realpath "$STOCK")" != "$ROOT"
(cd "$INHERITED" && sha256sum -c "$P/inherited.SHA256SUMS")
for t in baseline candidate; do
 q="$ROOT/$t/qa"; b="$ROOT/$t/build"
 test ! -e "$ROOT/$t"
 mkdir -p "$ROOT/$t"
 cp -a "$INHERITED" "$q"
 cp -a "$STOCK" "$b"
 cp "$P/review-cameras.json" "$q/"
 if [[ "$t" = candidate ]]; then
   for f in detail.mjs detail-itinerary.json full-itinerary.json route-itinerary.json pack-detail.mjs pack-gate.mjs gate.mjs browser-gate.py host-gate.js prepare-gate.mjs prepare-c01.mjs c01_pairs.py game-c01.js game-full.js integration.py walk_probe.py isolated-harness.js build-composed-visual.mjs; do cp "$P/$f" "$q/$f"; done
 else
   python - "$q/browser-gate.py" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text(); a="for v in [c for c in cameras if c['id'] in ['whole','east-rise','gate']]:"
assert s.count(a)==1; p.write_text(s.replace(a,"for v in cameras:"))
PY
 fi
 HONRO_FULL42_WORKSHOP_LOCAL=1 node "$q/prepare.mjs" "$b"
 HONRO_FULL_DETAIL_WORKSHOP_QA=1 HONRO_FULL_DISPOSABLE_SHA256=15b93ae4bff4f9367ec99b18e85b515109d871f53a70bfa5cb1129f02bd085f2 node "$q/prepare-detail.mjs" "$b"
 # Inherited code and candidate inputs are independently SHA-pinned above / by workflow.
 live="$b/web/runtime/workshop-app.489f733634454986.js"
 if [[ "$t" = baseline ]]; then
   pin=73edf6d5e7128e2dd82c5575874ef2916fb8b04cfdab7b1e367c5c475a662781
 else
   pin=25d6f97dcbbb725db9ee7f7069cd05a04b556aa5d45769fd19c5a265f56873ad
 fi
 printf '%s  %s\n' "$pin" "$live" | sha256sum -c -
 HONRO_GATE_QA=1 HONRO_GATE_DETAILS_SHA="$pin" node "$q/prepare-gate.mjs" "$b"
 if [[ "$t" = candidate ]]; then
   printf '%s  %s\n' d4e693ccf208c4ea5c9692ea886d2ac83a7f1b2d1066cf561e148215204fcc26 "$live" | sha256sum -c -
 fi
 node --check "$live"
 if [[ "$t" = candidate && "${STAGE42_ENABLE_C01:-0}" = 1 ]]; then
   HONRO_C01_DISPOSABLE_QA=1 node "$q/prepare-c01.mjs" "$b" "${STAGE42_C01_PNG:?untouched C01 PNG required}"
 fi
done
trap 'jobs -pr | xargs -r kill 2>/dev/null || true' EXIT
for t in baseline candidate; do
 q="$ROOT/$t/qa"; b="$ROOT/$t/build"
 case "$t" in baseline) port=8874;; candidate) port=8875;; esac
 export HONRO_FULL42_URL="http://127.0.0.1:$port/HONRO_WORKSHOP.html"
 export HONRO_FULL42_ARTIST_ITINERARY="$q/full-itinerary.json"
 HONRO_C01_DISPOSABLE_QA=0
 if [[ "$t" = candidate && "${STAGE42_ENABLE_C01:-0}" = 1 ]]; then HONRO_C01_DISPOSABLE_QA=1; fi
 HONRO_COMPOSE_LIVE_WALK=0
 if [[ "$t" = candidate && "${STAGE42_ENABLE_LIVE_WALK:-0}" = 1 ]]; then HONRO_COMPOSE_LIVE_WALK=1; fi
 export HONRO_COMPOSE_LIVE_WALK HONRO_C01_DISPOSABLE_QA
 python -m http.server "$port" --bind 127.0.0.1 --directory "$b" &
 for ((i=0;i<30;i++)); do if curl -fsS -o /dev/null "$HONRO_FULL42_URL"; then break; fi; sleep 1; done
 if timeout 650s python "$q/browser-gate.py" "$E/$t"; then rc=0; else rc=$?; fi
 echo "$rc" > "$ROOT/$t/status"
done
python "$P/verify-capture.py" "$ROOT" "$E"
