"""Make an explicitly synthetic 33–38 progression fixture from actual 32 export.
Never modifies input; Act4 provenance, equipment and rank ledger stay byte-equivalent as JSON values.
"""
import json,hashlib,sys,copy
from pathlib import Path
src=Path(sys.argv[1]);out=Path(sys.argv[2]);raw=src.read_bytes()
expected='ba3f60cd23a556dbc75438389b7507fb8d59fb1628a0ac70501ffb61053ca525'
assert hashlib.sha256(raw).hexdigest()==expected
p=json.loads(raw);act=copy.deepcopy(p['honroAct4']);equipment=copy.deepcopy(p['equipment']);growth=copy.deepcopy(p['honroGrowth']);assert act['runId']=='eq-mvw35tg3-84xgprgd'
q=act['safeSeven'];assert q['sourceRun']=='honro-map-stage-32-1793463406330' and q['campaignRunId']==act['runId'] and q['stage']==32 and q['success'] and len(set(q['ids']))==7
assert act['completed']['32']['sourceRun']==q['sourceRun'] and 'A4.S32.MISSING.01' in q['reportIds'] and q['reunionObserved']['sourceRun']==q['sourceRun']
assert p['cleared']['31']['rounds']==13 and p['cleared']['32']['rounds']==8
for n in range(33,39):p['cleared'][str(n)]={'visits':1,'rounds':0}
for h in p['heroes'].values():
 assert h['xp']<=225393;h['xp']=225393
p['mapNode']=39;p['lastStage']=38;p['honroJourney']['pendingDirect']=39;p.pop('honroBattle',None);p['saved']=None
assert p['honroAct4']==act and p['equipment']==equipment and p['honroGrowth']==growth
out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'sourceSHA256':expected,'fixtureSHA256':hashlib.sha256(out.read_bytes()).hexdigest(),'sourceRun':q['sourceRun'],'campaignRun':act['runId'],'synthetic':'clears 33-38, XP 225393, navigation, remove in-progress battle','preserved':'entire honroAct4, equipment and honroGrowth values'},ensure_ascii=False))
