#!/bin/sh
# Geometry gate for stage N: build skeleton, engine probes, trap sweep.
set -eu
: "${ACT4_PROBE_RUN_ID:=$(python3 -c 'import secrets;print(secrets.token_hex(16))')}"
export ACT4_PROBE_RUN_ID
N=$1; D=_local/reports/act4-pilot/stage$N/claude
python3 tools/act4-claude/stage$N.py || exit 1
node tools/act4-pilot/build-skeleton.mjs $N $D tools/act4-pilot/layouts/stage$N-claude.json >/dev/null || exit 1
node tools/act4-pilot/probe-skeleton.mjs "$N" --dir="$D"
python3 -c "
import json;d=json.load(open('$D/verification-summary.json'));print('edges',d['edgeBodyChecks'],'bodies',d['continuousBodyChecks'])"
node tools/act4-claude/trap-sweep.mjs $N $D
