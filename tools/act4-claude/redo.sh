#!/bin/sh
# Rebuild, gate, integrate and sheet a stage: redo.sh N
N=$1
R=/tmp/claude-0/-home-user/ce99f28e-d0a2-5521-9bd0-ca7baa6be50e/scratchpad/ref/ACT4_TERRAIN_REFERENCE/02_play_layers
FAR=$(python3 -c "import json;print(json.load(open('tools/act4-claude/views.json'))['$N'][0])")
VIEWS=$(python3 -c "import json;print(json.dumps(json.load(open('tools/act4-claude/views.json'))['$N'][1]))")
REF=$(python3 -c "import json;print(json.load(open('tools/act4-claude/views.json'))['$N'][2])")
PLAY=$(python3 -c "import json;print(','.join(v['name'] for v in json.load(open('tools/act4-claude/views.json'))['$N'][1] if v['name'].endswith('-play')))")
bash tools/act4-claude/check.sh $N 2>&1 | grep -E "edges|traps|passed\":false" | head -4
python3 tools/act4-claude/gate.py $N | grep -v PASS
sh tools/act4-claude/run-stage.sh $N $FAR "$VIEWS" 2>&1 | grep -E "enemies\"|rror|inside|overlap"
python3 tools/act4-claude/sheet.py $N $R/$REF $PLAY
