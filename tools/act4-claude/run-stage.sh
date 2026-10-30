#!/bin/sh
# Roster -> art modules -> engine render -> canonical integration for stage N.
# usage: run-stage.sh N FARKEY 'views-json'
N=$1; FAR=$2; VIEWS=$3; D=_local/reports/act4-pilot/stage$N/claude
python3 tools/act4-claude/roster$N.py || exit 1
python3 tools/stage31-claude/build-assets.py $N >/dev/null || exit 1
[ -f tools/act4-claude/extra$N.py ] && python3 tools/act4-claude/extra$N.py >/dev/null
node tools/stage31-claude/inspect.mjs --n=$N --tag=v1 --far=$FAR --stage=$D/roster/stage.json --assets=_local/reports/act4-claude/stage$N/modules --views="$VIEWS" 2>&1 | grep -E "Error|rendered" | sort | uniq -c
node tools/stage31-claude/integrate.mjs _local/reports/act4-claude/stage$N/v1/stage$N-composed.json _local/reports/act4-claude/stage$N/modules $N
