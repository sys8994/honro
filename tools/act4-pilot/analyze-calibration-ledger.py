"""Read-only recorded-cast analysis. No engine, candidate or profile mutation."""
import sys,json,gzip,hashlib,collections,math,pathlib
raw,ledger,out=map(pathlib.Path,sys.argv[1:4]);events=[json.loads(s) for s in gzip.decompress(raw.read_bytes()).decode().splitlines()];a=json.loads(ledger.read_text());end=next(x for x in events if x['type']=='run-end');assert a['runId']==end['runId'] and a['completeTrace'];fires={(x['before']['id'],x['shot']):x for x in events if x['type']=='engine-event' and x.get('method')=='fire' and x.get('accepted')};hurts=[x for x in events if x['type']=='engine-event' and x.get('method')=='hurt'];stats={};casts=[]
for side in [0,1]:
 rows=[x for x in a['attacks'] if x['ownerSide']==side];stats[str(side)]={'casts':len(rows),'opponentHpDamageCasts':sum(any(t['side']!=side and t['hpLoss']>0 for t in x['targets']) for x in rows),'noRecordedHitCasts':sum(not x['targets'] for x in rows),'friendlyOnlyHitCasts':sum(bool(x['targets']) and all(t['side']==side for t in x['targets']) for x in rows)}
for x in a['attacks']:
 f=fires[(x['owner'],x['shot'])];targets=[]
 for t in x['targets']:
  contexts=[]
  for h in t['hitContext']:
   target=h['target'];source=h.get('source');contexts.append({'direct':h['direct'],'facing':target['facing'],'role':target['role'],'guardArmorBranch':(.4 if (source['x']-target['x'])*target['facing']>0 else .05) if target['role']=='guard' and source else None,'fireOriginToHitTargetDistance':math.hypot(f['before']['x']-target['x'],f['before']['y']-target['y']),'distanceScope':'Fire origin to target location at hit, not launch-time separation or projectile path length'})
  targets.append({'id':t['id'],'side':t['side'],'hpLoss':t['hpLoss'],'shieldLoss':t['shieldLoss'],'hpLossPercent':t['hpLossPercent'],'maxHp':t['maxHp'],'contexts':contexts})
 casts.append({'owner':x['owner'],'side':x['ownerSide'],'round':x['fireRound'],'shot':x['shot'],'skill':x['skill'],'fireFrame':f['frame'],'fireOrigin':f['before'],'angle':f['angle'],'power':f['power'],'targets':targets,'feedback':x['feedback']})
incoming=collections.defaultdict(lambda:{'hpLoss':0,'shieldLoss':0,'casts':0});kills=collections.defaultdict(list)
for x in casts:
 for t in x['targets']:
  if x['side']==1 and t['side']==0:
   r=incoming[(x['round'],t['id'])];r['hpLoss']+=t['hpLoss'];r['shieldLoss']+=t['shieldLoss'];r['casts']+=1
for h in hurts:
 if h['before']['side']==1 and h['after']['hp']<h['before']['hp']:kills[h['before']['id']].append({'owner':h['owner'],'round':h['round'],'skill':h['hit'].get('skill'),'hpLoss':h['before']['hp']-h['after']['hp'],'remainingHp':h['after']['hp']})
report={'runId':a['runId'],'sourceHash':a['sourceHash'],'controllerHash':a['controllerHash'],'rawSHA256':hashlib.sha256(raw.read_bytes()).hexdigest(),'ledgerSHA256':hashlib.sha256(ledger.read_bytes()).hexdigest(),'scope':'Recorded per-target/cast outcomes only; no rerun, tuning, trajectory reconstruction, counterfactual miss reason or population win-rate inference. Fire-to-hit target distances use explicit fire origin and hit location. HP loss can be clipped by remaining HP/shield. No terrain impact/end-of-flight telemetry is present.','outcome':a['outcome'],'round':end['round'],'frame':end['frame'],'stats':stats,'incomingByRoundAndHero':[dict(round=r,target=t,**v) for (r,t),v in incoming.items()],'damagedEnemies':dict(kills),'casts':casts};out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'outcome':a['outcome'],'stats':stats,'enemyDeaths':sum(v[-1]['remainingHp']<=0 for v in kills.values()),'criticalFeedback':sum(f['critical'] for x in casts for f in x['feedback'])}))
