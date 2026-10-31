"""Apply pre-registered analysis-rules.md to a retained v6 run."""
import json,sys,statistics,collections,hashlib,lzma
from pathlib import Path
p=Path(sys.argv[1]);read=lambda name: (p/name).read_bytes() if (p/name).exists() else lzma.decompress((p/(name+'.xz')).read_bytes());rows=json.loads(read('observer.json'))['rows'];ev=[json.loads(x) for x in read('events.jsonl').decode().splitlines()];assert hashlib.sha256((p/'ui-inputs.json').read_bytes()).hexdigest()==json.loads((p/'result.json').read_text())['inputSha256'];first=ev[0]['state'];enemy={x['id'] for x in first['foes']};hero={x['id'] for x in first['heroes']};maxhp={x['id']:x['maxHp'] for x in first['heroes'] if x.get('maxHp')};h=[];primary=[];other=[];finished=collections.defaultdict(list);knownhero=set();impact=collections.defaultdict(set);terrain=collections.Counter();fire=collections.Counter()
for x in rows:
 k=x['kind']; pre=x.get('before') or x; actor=x.get('actor');role=actor if isinstance(actor,dict) else {}
 if k=='finishAction' and role.get('side')==1 and pre.get('side')==1:finished[(pre.get('run'),pre['round'],role['id'])].append(bool(x['reviewed']))
 if k=='fire' and role.get('side')==1:fire[x['outcome']]+=1
 if k=='impact' and actor in enemy:
  if x.get('outcome')=='unit-impact' and (x.get('target') or {}).get('role') in ('hero','resident'):impact[actor].add(x['target']['id'])
  elif x.get('outcome')=='terrain-impact':terrain[actor]+=1
 if k!='hurt' or x.get('outcome')!='damage':continue
 t=x.get('target') or {};tid=t.get('id');owner=x.get('owner') or 'unknown';skill=x.get('skill') or 'unknown';source=x.get('source') or 'unknown';hploss=max(0,(x.get('hpBefore') or 0)-(x.get('hpAfter') or 0));shieldloss=max(0,(x.get('shieldBefore') or 0)-(x.get('shieldAfter') or 0));flags=[]
 if owner not in enemy:flags.append('owner-not-in-initial-enemy-roster')
 if owner=='unknown':flags.append('owner-unknown')
 if skill=='unknown':flags.append('skill-unknown')
 if source!='normal':flags.append('non-normal-source')
 if owner==tid:flags.append('self')
 if owner in enemy and t.get('side')==1:flags.append('enemy-on-enemy')
 if owner in hero and (t.get('side')==0 or t.get('role')=='resident'):flags.append('party-friendly-fire')
 if t.get('role') not in ('hero','resident'):flags.append('target-not-party-or-resident')
 q={'round':pre.get('round'),'phase':pre.get('phase'),'owner':owner,'skill':skill,'source':source,'target':tid,'targetRole':t.get('role'),'hpLoss':hploss,'shieldLoss':shieldloss,'heroHpLossFraction':hploss/maxhp[tid] if tid in maxhp else None,'heroShieldLossFraction':shieldloss/maxhp[tid] if tid in maxhp else None,'heroCombinedLossFraction':(hploss+shieldloss)/maxhp[tid] if tid in maxhp else None,'flags':flags};h.append(q)
 if not flags:primary.append(q)
 else:other.append(q)
 if owner in hero and t.get('side')==1:knownhero.add(tid)
assert len(h)==len(primary)+len(other)
damageowners={x['owner'] for x in primary};exchange=damageowners|knownhero;additional=set(impact)-exchange;union=exchange|set(impact)
def dist(v):
 if not v:return None
 v=sorted(v)
 def q(t):
  i=(len(v)-1)*t;lo=int(i);hi=min(lo+1,len(v)-1);return v[lo]+(v[hi]-v[lo])*(i-lo)
 return {'n':len(v),'min':v[0],'q25':q(.25),'median':statistics.median(v),'q75':q(.75),'max':v[-1]}
perround=collections.Counter();raw=collections.Counter();dup=0
for (run,r,id),calls in finished.items():
 raw[str(r)]+=len(calls)
 if False in calls:perround[str(r)]+=1;dup+=len(calls)-1
 else:dup+=len(calls)
res={'scope':'Pre-registered event-level observation; no attack-level damage rate or human win-rate claim','run':(rows[0].get('before') or rows[0]).get('run'),'enemyRosterCount':len(enemy),'primaryAttributableHostileDamage':{'count':len(primary),'events':primary,'hpLossDistribution':dist([x['hpLoss'] for x in primary]),'shieldLossDistribution':dist([x['shieldLoss'] for x in primary]),'heroHpLossFractionDistribution':dist([x['heroHpLossFraction'] for x in primary if x['heroHpLossFraction'] is not None]),'heroShieldLossFractionDistribution':dist([x['heroShieldLossFraction'] for x in primary if x['heroShieldLossFraction'] is not None]),'heroCombinedLossFractionDistribution':dist([x['heroCombinedLossFraction'] for x in primary if x['heroCombinedLossFraction'] is not None]),'residentHpFractionUnknown':sum(x['targetRole']=='resident' and x['heroHpLossFraction'] is None for x in primary)},'otherDamage':{'count':len(other),'overlappingFlagCounts':dict(collections.Counter(f for x in other for f in x['flags'])),'events':other},'narrowExchange':{'enemyOwnersInflictingPrimary':sorted(damageowners),'enemyTargetsTakingHeroDamage':sorted(knownhero),'ids':sorted(exchange),'count':len(exchange)},'additionalImpactPressure':{'allEnemyToPartyOrResidentImpact':{k:sorted(v) for k,v in sorted(impact.items())},'additionalIds':sorted(additional),'count':len(additional)},'confirmedDirectUnion':{'ids':sorted(union),'count':len(union)},'enemyFireOutcomesWithTargetUnknown':dict(fire),'enemyTerrainImpactCallsWithoutLinkedChoice':dict(terrain),'enemyFinishedActionUniqueByRound':dict(perround),'enemyFinishRawCallsByRound':dict(raw),'duplicateFinishCalls':dup,'appDefenseHealing':{'events':sum(1 for x in rows if x['kind']=='appDefend' and (x.get('hpAfter') or 0)>(x.get('hpBefore') or 0)),'hpTotal':sum((x.get('hpAfter') or 0)-(x.get('hpBefore') or 0) for x in rows if x['kind']=='appDefend' and (x.get('hpAfter') or 0)>(x.get('hpBefore') or 0))},'capturedWaterRecoveries':(ev[-1]['state'].get('water') or {}).get('recoveries',[]),'inputHash':hashlib.sha256((p/'ui-inputs.json').read_bytes()).hexdigest(),'limits':['Resident max HP is not in captured entry fields; fraction omitted.','Direct impact does not prove targeted intent or visible player reaction.','No causal input link demonstrates action change from a terrain block.','Healing and attack-level damage denominators are not instrumented.']}
print(json.dumps(res,ensure_ascii=False,indent=2))
