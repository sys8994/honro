"""Three predeclared, matched Stage23 native diagnostics, not release approval."""
import json
from pathlib import Path
from collections import Counter
root=Path('_local/reports/stage23-independent-probes')
rows=[]
for kind in ['original','elite-hp-90','carrier-budget-1000']:
    d=root/kind
    if not (d/'result.json').exists():
        rows.append({'variant':kind,'missingResult':True});continue
    r=json.loads((d/'result.json').read_text());f=json.loads((d/'final.json').read_text());i=json.loads((d/'initial.json').read_text())
    fires=[a for a in f['actions'] if a['op']=='fire'];defends=[a for a in f['actions'] if a['op']=='defend'];damage=f['damage']
    enemy_ids={u['id'] for u in i['battle']['units'] if u['side']==1}
    advances=[a for a in f['actions'] if a['op']=='friendly-muzzle-advance']
    phase_rows=[]
    for phase in dict.fromkeys(a.get('goal') for a in f['actions']):
        aa=[a for a in f['actions'] if a.get('goal')==phase]
        ss=[a for a in aa if a['op']=='fire'];dd=[a for a in aa if a['op']=='defend']
        phase_rows.append({'goal':phase,'firstRound':min(a['round'] for a in aa),'lastRound':max(a['round'] for a in aa),'shots':len(ss),'defends':len(dd),'blockedDefends':sum(bool(a.get('blocked')) for a in dd),'targets':dict(Counter(a['target'] for a in ss))})
    rows.append({'variant':kind,'phase':r['phase'],'round':r['round'],'twentyTurnTargetMet':r['phase']=='won' and r['round']<=20,'shots':len(fires),'defends':len(defends),'blockedDefends':sum(bool(a.get('blocked')) for a in defends),'skills':dict(Counter(a['skill'] for a in fires)),'targets':dict(Counter(a['target'] for a in fires)),'npcHp':r['npc']['hp'],'npcMaxHp':r['npc']['maxHp'],'npcHpLossEvents':sum(x['amount'] for x in damage if x['id']=='act3-carrier'),'heroHpLossEventsAllSources':sum(x['amount'] for x in damage if x['side']==0),'heroHpLossEventsEnemySources':sum(x['amount'] for x in damage if x['side']==0 and x.get('source') in enemy_ids),'heroLowestRecordedHp':{u['id']:min([u['hp']]+[x['hp'] for x in damage if x['id']==u['id']]) for u in i['battle']['units'] if u['side']==0},'remainingEnemies':r['remaining'],'initialEnemies':len(enemy_ids),'initialEliteCount':sum(bool(u.get('honroAct3Elite')) for u in i['battle']['units'] if u['side']==1),'heroes':r['heroes'],'settlement':r.get('settlement'),'phases':phase_rows,'rounds':f['rounds'],'muzzleAdvances':advances,'scoringAudit':r.get('scoringAudit'),'source':r['provenance'],'audit':r['audit'],'controllerSha256':r['provenance']['controllerHash'],'entryProfileSha256':r['provenance']['profileHash'],'runtimeSha256':r['provenance']['reviewedRuntimeHash'],'stageSha256':r['provenance']['stageHash'],'presentedRows':[s for e in r['reviewed']['events'].values() for s in e.get('presentedIds',[])]})
summary={'acceptedProductCommit':'b1b1ce63dfa08b111725f3b907088b70f280f17c','scope':'Isolated generated native candidates, same exact pre-entry profile and same independent-estimate/S04/20px-obstruction controller. Predeclared estimate streams are not live future rolls or mean damage. No product candidate has normal-build, Stage31 refresh, actual browser, human-fun or release acceptance here. No all-survive criterion. One seed/profile only; no optimality claim.','runs':rows}
(root/'comparison.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
print(json.dumps({**summary,'runs':[{k:v for k,v in x.items() if k not in ['rounds','source','audit']} for x in rows]},ensure_ascii=False))
assert len(rows)==3 and all(x.get('phase')=='won' for x in rows),'Inspect missing/lost results before drawing pacing conclusions'
a=rows[0]
assert a['runtimeSha256']=='71e3b81904fe845b4cbc190e1e0be9be714421c75a146725075665e42b07773c'
for z in rows:
    for key in ['controllerSha256','entryProfileSha256','initialEnemies','initialEliteCount']:
        assert a[key]==z[key],(key,a[key],z[key])
    assert z['initialEnemies']==40 and z['initialEliteCount']==10
    assert sorted(a['presentedRows'])==sorted(z['presentedRows']),'Narrative receipts differ'
    assert not z['audit']['externalWrites'] and not z['audit']['recoveries']
    assert z['settlement']['reloadExact'] and z['settlement']['visits']==1
    assert all(x['actualForward']<=20.05 for x in z['muzzleAdvances']),'Extra movement exceeded the predeclared20px bound'
