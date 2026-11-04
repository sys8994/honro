"""Summarize a matched synthetic Stage23 native pair; not browser/fun approval."""
import hashlib,json
from pathlib import Path
root=Path('_local/reports/stage23-s04-pair')
rows=[]
for variant in ['baseline','ordinary-s04']:
    d=root/variant
    if not (d/'result.json').exists():
        rows.append({'variant':variant,'missingResult':True});continue
    r=json.loads((d/'result.json').read_text());f=json.loads((d/'final.json').read_text());initial=json.loads((d/'initial.json').read_text())
    fires=[a for a in f['actions'] if a['op']=='fire'];defends=[a for a in f['actions'] if a['op']=='defend']
    skills={};targets={}
    for a in fires:
        skills[a['skill']]=skills.get(a['skill'],0)+1;targets[a['target']]=targets.get(a['target'],0)+1
    b=initial['battle'];damage=f['damage']
    rows.append({'variant':variant,'phase':r['phase'],'round':r['round'],'twentyTurnTargetMet':r['round']<=20,'shots':len(fires),'defends':len(defends),'blockedDefends':sum(bool(a.get('blocked')) for a in defends),'skills':skills,'targets':targets,'npcHp':r['npc']['hp'],'npcMaxHp':r['npc']['maxHp'],'npcHpLossEvents':sum(x['amount'] for x in damage if x['id']=='act3-carrier'),'heroHpLossEventsAllSources':sum(x['amount'] for x in damage if x['side']==0),'remainingEnemies':r['remaining'],'initialEnemies':sum(u['side']==1 for u in b['units']),'livingHeroes':r['heroes'],'settlement':r.get('settlement'),'scoringAudit':r.get('scoringAudit'),'source':r['provenance'],'externalWrites':r['audit']['externalWrites'],'controllerSha256':r['provenance']['controllerHash'],'entryProfileSha256':r['provenance']['profileHash'],'runtimeSha256':r['provenance']['reviewedRuntimeHash'],'stageSha256':r['provenance']['stageHash'],'presentedRows':[i for e in r['reviewed']['events'].values() for i in e.get('presentedIds',[])]})
summary={'productCommit':'b1b1ce63dfa08b111725f3b907088b70f280f17c','historicalBaseline':{'run':41850399757,'round':26,'controllerSha256':'3c6bca2831652de4324da654c08b4eff4fa360442167d3834e82654905a4a1c3'},'scope':'Same unchanged product and exact synthetic initial profile, serial native App input runs. S04 landing score only. Native DOM/clock doubles, not browser or human time/fun. Production predictors can internally simulate cloned casts with retained random state; not RNG-independent certification. No explicit future roll/result lookup added.','runs':rows}
(root/'comparison.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print(json.dumps(summary,ensure_ascii=False))
assert len(rows)==2 and all(x.get('phase')=='won' for x in rows)
a,z=rows
for key in ['entryProfileSha256','runtimeSha256','stageSha256','initialEnemies']:
    assert a[key]==z[key],(key,a[key],z[key])
assert a['initialEnemies']==40 and a['controllerSha256']==summary['historicalBaseline']['controllerSha256']
assert a['runtimeSha256']=='71e3b81904fe845b4cbc190e1e0be9be714421c75a146725075665e42b07773c'
assert a['round']==26,'Historical26 baseline did not reproduce; inspect before attributing candidate difference'
assert sorted(a['presentedRows'])==sorted(z['presentedRows']),'Narrative presented receipts changed'
