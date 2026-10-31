"""Conservative fire/shot-owner-skill correlation. Does not establish projectile causation."""
import json,sys,lzma,collections,statistics,hashlib
from pathlib import Path
p=Path(sys.argv[1]);read=lambda n:(p/n).read_bytes() if (p/n).exists() else lzma.decompress((p/(n+'.xz')).read_bytes())
rows=json.loads(read('observer.json'))['rows']; events=[json.loads(s) for s in read('events.jsonl').decode().splitlines()]; result=json.loads((p/'result.json').read_text());assert hashlib.sha256((p/'ui-inputs.json').read_bytes()).hexdigest()==result['inputSha256']
first=events[0]['state'];enemies={v['id'] for v in first['foes']};maxhp={v['id']:v['maxHp'] for v in first['heroes'] if v.get('maxHp')};fires=collections.defaultdict(list);finished=collections.defaultdict(set);targets=collections.defaultdict(set);collisions=collections.defaultdict(set);impacts=collections.defaultdict(list);unknown=[]
for r in rows:
 pre=r.get('before') or r; actor=r.get('actor');a=actor if isinstance(actor,dict) else {}
 if r['kind']=='fire' and a.get('id') in enemies and r.get('outcome')=='fired':fires[(r.get('shot'),a['id'],r.get('skill'))].append(r)
 if r['kind']=='finishAction' and a.get('id') in enemies and pre.get('side')==1 and not r.get('reviewed'):finished[pre['round']].add(a['id'])
 if r['kind']=='impact' and actor in enemies:
  target=(r.get('target') or {});key=(r.get('projectileShot'),actor,r.get('skill'));impacts[key].append(target.get('id'))
  if target.get('role') in ('hero','resident'):collisions[pre['round']].add(target['id'])
groups={};primary=0
for r in rows:
 t=r.get('target') or {};pre=r.get('before') or r
 if r['kind']!='hurt' or r.get('outcome')!='damage' or r.get('owner') not in enemies or r.get('skill') in (None,'unknown') or r.get('source')!='normal' or t.get('role') not in ('hero','resident') or r.get('owner')==t.get('id'):continue
 primary+=1; key=(pre.get('shot'),r['owner'],r['skill']); matches=fires.get(key,[])
 item={'shot':key[0],'owner':key[1],'skill':key[2],'round':pre['round'],'target':t['id'],'role':t['role'],'hpLoss':max(0,r['hpBefore']-r['hpAfter']),'shieldLoss':max(0,r['shieldBefore']-r['shieldAfter'])};targets[pre['round']].add(t['id'])
 if len(matches)!=1:unknown.append({**item,'matchingFires':len(matches)});continue
 g=groups.setdefault(key,{'shot':key[0],'owner':key[1],'skill':key[2],'round':matches[0]['round'],'victims':{},'events':0});g['events']+=1
 v=g['victims'].setdefault(t['id'],{'role':t['role'],'hpLoss':0,'shieldLoss':0,'maxHp':maxhp.get(t['id']),'directImpactSameShot':t['id'] in impacts.get(key,[])})
 v['hpLoss']+=item['hpLoss'];v['shieldLoss']+=item['shieldLoss']
for g in groups.values():
 g['hpLoss']=sum(v['hpLoss'] for v in g['victims'].values());g['shieldLoss']=sum(v['shieldLoss'] for v in g['victims'].values())
 for v in g['victims'].values():v['combinedPercentMaxHp']=100*(v['hpLoss']+v['shieldLoss'])/v['maxHp'] if v['maxHp'] else None
attacks=list(groups.values());a_victims=[v['combinedPercentMaxHp'] for a in attacks for v in a['victims'].values() if v['combinedPercentMaxHp'] is not None];points=[a['hpLoss']+a['shieldLoss'] for a in attacks]
res={'definition':'A damage call is grouped with a uniquely observed accepted enemy fire by current battle shot, owner and skill; not projectile ID causation. Delayed damage after a different shot or ambiguous fire is not safely assigned. Impact evidence is separately marked. Percent is per attack-victim and includes shield divided by max HP; not fraction of total effective health.','primaryDamageEvents':primary,'matchedEvents':sum(a['events'] for a in attacks),'unmatched':unknown,'matchedAttacks':len(attacks),'enemyFires':sum(len(v) for v in fires.values()),'pointLossPerAttack':{'n':len(points),'min':min(points) if points else None,'median':statistics.median(points) if points else None,'max':max(points) if points else None},'perVictimPercentMaxHp':{'n':len(a_victims),'min':min(a_victims) if a_victims else None,'median':statistics.median(a_victims) if a_victims else None,'max':max(a_victims) if a_victims else None},'enemyActorsCompletedByRound':{str(k):sorted(v) for k,v in sorted(finished.items())},'victimsWithLossByRound':{str(k):sorted(v) for k,v in sorted(targets.items())},'victimsWithDirectImpactByRound':{str(k):sorted(v) for k,v in sorted(collisions.items())},'attacks':sorted(attacks,key=lambda a:a['shot'])}
print(json.dumps(res,ensure_ascii=False,indent=2))
