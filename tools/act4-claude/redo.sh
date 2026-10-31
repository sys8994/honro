#!/bin/sh
# Rebuild, gate, integrate and sheet a stage: redo.sh N
set -eu
N=${1:?stage number required}
ACT4_PROBE_RUN_ID=$(python3 -c 'import secrets;print(secrets.token_hex(16))')
export ACT4_PROBE_RUN_ID
R=${ACT4_REFERENCE_DIR:?set ACT4_REFERENCE_DIR to the reviewed play-layer reference directory}
# Stop before generating or integrating anything if no stage card exists.
python3 - "$N" <<'PY'
import json, sys
n = sys.argv[1]
with open('tools/act4-claude/cards.json') as f:
    cards = json.load(f)
if n not in cards:
    raise SystemExit(f'No design card for stage {n}; integration blocked.')
if cards[n].get('schema') == 'criteria-v3':
    raise SystemExit('Criteria card exists, but its actual play and visual acceptance are unverified; integration blocked.')
PY
FAR=$(python3 -c "import json,sys;print(json.load(open('tools/act4-claude/views.json'))[sys.argv[1]][0])" "$N")
VIEWS=$(python3 -c "import json,sys;print(json.dumps(json.load(open('tools/act4-claude/views.json'))[sys.argv[1]][1]))" "$N")
REF=$(python3 -c "import json,sys;print(json.load(open('tools/act4-claude/views.json'))[sys.argv[1]][2])" "$N")
PLAY=$(python3 -c "import json,sys;print(','.join(v['name'] for v in json.load(open('tools/act4-claude/views.json'))[sys.argv[1]][1] if v['name'].endswith('-play')))" "$N")
bash tools/act4-claude/check.sh "$N"
python3 tools/act4-claude/gate.py "$N"
sh tools/act4-claude/run-stage.sh "$N" "$FAR" "$VIEWS"
python3 tools/act4-claude/sheet.py "$N" "$R/$REF" "$PLAY"
