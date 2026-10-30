#!/bin/sh
# Full Stage 31 rebuild: art+collider -> skeleton -> physics probe -> roster -> modules -> canonical world.
set -e
V=_local/reports/act4-pilot/stage31/v6
python3 tools/stage31-claude/author.py
node tools/act4-pilot/build-skeleton.mjs 31 $V tools/act4-pilot/layouts/stage31-v6-claude.json
node tools/act4-pilot/probe-skeleton.mjs 31 --dir=$V | grep -E '^\{"passed"' 
python3 - <<'PY'
import json,hashlib
V='_local/reports/act4-pilot/stage31/v6';p='tools/act4-pilot/layouts/stage31-roster-v6.json';d=json.load(open(p))
d['layoutSHA256']=hashlib.sha256(open(V+'/blueprint.json','rb').read()).hexdigest();d['stageSHA256']=hashlib.sha256(open(V+'/stage.json','rb').read()).hexdigest()
json.dump(d,open(p,'w'),ensure_ascii=False,indent=1)
PY
node tools/act4-pilot/build-roster.mjs . _local/reports/act4-pilot/stage31/roster-v6 $V tools/act4-pilot/layouts/stage31-roster-v6.json
python3 tools/stage31-claude/build-assets.py
node tools/stage31-claude/inspect.mjs --tag=roster-v6 --stage=_local/reports/act4-pilot/stage31/roster-v6/stage.json ${VIEWS:+--views=$VIEWS}
node tools/stage31-claude/integrate.mjs
