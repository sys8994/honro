"""Quantitative release gate. Reduces recorded events; never trusts a PASS flag.
Raw logs must be collected by a protected CI adapter. This reducer is not an
attestation authority and does not certify that arbitrary uploaded events are real.
"""
import argparse,gzip,hashlib,json,statistics,subprocess
from pathlib import Path
from effective_criteria import load as load_effective, ACTIVE_DIGEST, ACTIVE_VERSION
PINNED_CRITERIA='e2183e74492a4cb61338f8a691a51f23e7af2205fb9148ae6f6b2c138311aa54'
class Invalid(Exception):pass
def need(x,message):
 if not x:raise Invalid(message)
def sha(b):return hashlib.sha256(b).hexdigest()
def canonical(x):return sha(json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode())
def criteria(root,version="v3"):
 if version=="v4":return load_effective(root,"v4")
 need(version=="v3","unsupported criteria version")
 b=gzip.decompress((root/'tools/quality-gate/criteria-v3.json.gz').read_bytes());need(sha(b)==PINNED_CRITERIA,'criteria changed; explicit new version and review required')
 lock=json.loads((root/'tools/quality-gate/criteria-lock.json').read_text());need(lock['rawSha256']==PINNED_CRITERIA,'criteria lock mismatch');return json.loads(b)
GATE_SOURCES=('gate.py','adapters.py','effective_criteria.py','collect.py','criteria-v4-lock.json','protocols.json','adapter-registry.json')
def gate_source_hashes(root):
 return {'tools/quality-gate/'+p:sha((root/'tools/quality-gate'/p).read_bytes()) for p in GATE_SOURCES}
def candidate_digest(root):
 names=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0')
 prefixes=('shared/runtime/','shared/engine/src/','shared/map/','shared/data/','shared/assets/','game/config/','game/src/','game/templates/','tools/party-forge/','tools/monster-forge/','tools/actor-forge/')
 selected=sorted(p for p in names if p and (p.startswith(('shared/','game/','workshop/','tools/')) or p in ['package.json','package-lock.json']) and not p.startswith(('game/docs/','tools/task-gate/','tools/quality-gate/','tools/act4-ci/','tools/act4-rc/','tools/stage31/evidence/','tools/stage31/production-package.json')) and not p.endswith('.md'))
 need(selected,'no candidate sources');h=hashlib.sha256()
 for p in selected:h.update(p.encode()+b'\0');h.update((root/p).read_bytes())
 return h.hexdigest()
def bounds(value):
 if finite(value):return [value,value]
 need(isinstance(value,list) and len(value)==2 and all(finite(v) for v in value) and value[0]<=value[1],'invalid numeric criterion bounds');return value
def finite(v):return isinstance(v,(int,float)) and not isinstance(v,bool) and float('-inf')<v<float('inf')
def reduce_trace(trace,registration,slot):
 need(set(trace)=={'header','events'},'metrics/PASS-only files are not event traces')
 h=trace['header'];need(h.get('schema')=='honro-events-v1','missing trusted collector event format')
 for key in ['candidateDigest','criteriaDigest','stage']:
  need(h.get(key)==registration[key],'trace identity mismatch: '+key)
 for key in ['trialId','seed','policy','profileDigest']:need(h.get(key)==slot[key],'trial differs from preregistration: '+key)
 events=trace['events'];need(len(events)>=2,'empty trace')
 need(events[0].get('type')=='start' and events[-1].get('type')=='end','incomplete trace, keep timeout/failure outcome')
 need([e.get('seq') for e in events]==list(range(len(events))),'missing/reordered events')
 units={u['id']:dict(u) for u in events[0]['units']};need(units and len(units)==len(events[0]['units']),'invalid roster')
 for u in units.values():
  need(u.get('team') in ['player','enemy','npc'] and all(finite(u.get(k)) for k in ['hp','maxHP','x','y','height']) and 0<=u['hp']<=u['maxHP'] and u['maxHP']>0 and u['height']>0,'invalid initial unit state')
  if u['team']=='enemy':need(u.get('rank') in ['normal','elite','miniboss','major-boss'],'invalid enemy rank')
 heroes={k for k,u in units.items() if u['team']=='player'};enemies={k for k,u in units.items() if u['team']=='enemy'}
 engaged=set();enemy_by_round={};damage={};moves=[];jumps=set();drops=set();seen_transitions=set();objective=False;last_time=-1;actions={};counter_ids=set();participants={};phase_round=1;phase_side='player';movement_actions=set();phase_seen=set()
 for e in events:
  need(finite(e.get('time')) and e['time']>=last_time,'non-monotonic clock');last_time=e['time'];kind=e['type']
  need(kind in ['start','spawn','phase','action','damage','heal','health_change','movement','landing','objective','end'],'unknown event kind')
  if kind=='spawn':
   u=e['unit'];expected=registration.get('spawnSlots',{}).get(u['id']);need(expected and u['id'] not in units,'unregistered/duplicate spawn')
   need(all(u.get(k)==expected.get(k) for k in ['team','rank','maxHP','height']),'spawn differs from fixed budget')
   need(all(finite(u.get(k)) for k in ['x','y','hp','maxHP','height']) and 0<u['hp']<=u['maxHP'],'invalid spawned unit')
   units[u['id']]=dict(u)
   if u['team']=='enemy':enemies.add(u['id'])
   elif u['team']=='player':heroes.add(u['id'])
  elif kind=='phase':
   need(e['side'] in ['player','enemy'] and isinstance(e['round'],int),'invalid phase')
   pair=(e['round'],e['side']);need(pair not in phase_seen,'duplicate phase')
   need((e['side']=='enemy' and phase_side=='player' and e['round']==phase_round) or (e['side']=='player' and phase_side=='enemy' and e['round']==phase_round+1),'missing/out-of-order phase')
   phase_seen.add(pair);phase_round=e['round'];phase_side=e['side']
   if phase_side=='enemy' and any(units[u]['hp']>0 for u in enemies):enemy_by_round[phase_round]=set()
  elif kind=='action':
   need(e['actor'] in units and e['actionId'] not in actions and e.get('accepted') is True,'invalid/duplicate/unaccepted action')
   need(e['round']==phase_round and units[e['actor']]['team']==phase_side,'action outside recorded phase')
   need(e['kind'] in ['attack','jump','drop','walk','defend','interact'],'unknown action');actions[e['actionId']]=e
  elif kind=='damage':
   a=actions.get(e['actionId']);need(a and a['kind']=='attack' and e['target'] in units,'damage without actual attack')
   need(all(finite(e[k]) for k in ['beforeHP','afterHP','maxHP']) and 0<=e['afterHP']<=e['beforeHP']<=e['maxHP'] and e['maxHP']>0,'invalid damage')
   target=e['target'];need(abs(units[target]['hp']-e['beforeHP'])<1e-6 and abs(units[target]['maxHP']-e['maxHP'])<1e-6,'damage HP continuity violation');units[target]['hp']=e['afterHP'];loss=e['beforeHP']-e['afterHP'];need(isinstance(e.get('critical'),bool),'critical observation missing');need(all(finite(e.get(k)) for k in ['beforeShield','afterShield']) and 0<=e['afterShield']<=e['beforeShield'] and abs(units[target].get('shield',0)-e['beforeShield'])<1e-6,'shield continuity violation');shield_loss=e['beforeShield']-e['afterShield'];units[target]['shield']=e['afterShield']
   if (loss or shield_loss) and a['actor'] in enemies and target in heroes:
    need(a['round'] in enemy_by_round,'damage outside eligible enemy phase');enemy_by_round[a['round']].add(a['actor']);key=(e['actionId'],target)
    if units[a['actor']].get('rank')=='normal':damage[key]=damage.get(key,0)+100*loss/e['maxHP']
   if (loss or shield_loss) and a['actor'] in heroes and target in enemies:participants.setdefault(a['round'],set()).add(target)
   if (loss or shield_loss) and a['actor'] in enemies and target in heroes:participants.setdefault(a['round'],set()).add(a['actor'])
   if loss and a['actor'] in heroes and target in enemies:engaged.add(target)
  elif kind=='health_change':
   need(e['target'] in units and e['cause'] in ['healing','equipment','level','scripted'],'invalid health-change source');u=units[e['target']]
   need(set(e['before'])==set(e['after'])=={'hp','maxHP','shield'},'health change cannot rewrite roster identity/rank')
   for key in ['hp','maxHP','shield']:
    need(finite(e['before'][key]) and finite(e['after'][key]) and abs(u.get(key,0)-e['before'][key])<1e-6,'health-change continuity violation')
   need(0<=e['after']['hp']<=e['after']['maxHP'] and e['after']['maxHP']>0 and e['after']['shield']>=0,'invalid changed health');u.update(e['after'])
  elif kind=='heal':
   need(e['target'] in units and all(finite(e[k]) for k in ['beforeHP','afterHP']),'invalid heal')
   u=units[e['target']];need(abs(u['hp']-e['beforeHP'])<1e-6 and u['hp']<=e['afterHP']<=u['maxHP'],'heal continuity violation');u['hp']=e['afterHP']
  elif kind=='movement':
   need(e['actor'] in units,'movement from unknown unit')
   a=actions.get(e.get('actionId'))
   if e['cause'] in ['walk','jump','drop']:need(a and e['actor']==a['actor'] and a['kind']==e['cause'],'movement without matching physical action')
   else:a={'actor':e['actor'],'round':phase_round}
   need(e['cause'] in ['walk','jump','drop','scripted','boat','camera'],'unknown movement source')
   need(len(e['from'])==len(e['to'])==2 and all(finite(v) for v in e['from']+e['to']),'invalid position')
   need(all(abs(units[a['actor']][k]-e['from'][i])<1e-6 for i,k in enumerate(['x','y'])),'movement continuity violation')
   if a['actor'] in heroes and e['cause'] in ['walk','jump','drop']:moves.append(e)
   if a['actor'] in enemies and e['cause']=='walk':
    # Conservative measurable approach. Stationary display/empty shots do not count.
    distances=[((e['from'][0]-units[u]['x'])**2+(e['from'][1]-units[u]['y'])**2)**.5-((e['to'][0]-units[u]['x'])**2+(e['to'][1]-units[u]['y'])**2)**.5 for u in heroes]
    if distances and max(distances)>=units[a['actor']]['height']:enemy_by_round.setdefault(a['round'],set()).add(a['actor']);participants.setdefault(a['round'],set()).add(a['actor'])
   units[a['actor']]['x'],units[a['actor']]['y']=e['to'];movement_actions.add(e.get('actionId'))
  elif kind=='landing':
   a=actions.get(e['actionId']);need(a and e['actor']==a['actor'] and e['actionId'] in movement_actions,'landing without actual linked movement')
   supports=registration.get('supportIds',[]);need(e['fromSupport'] in supports and e['toSupport'] in supports,'unregistered support labels')
   transition=(a['actor'],e['fromSupport'],e['toSupport'])
   if a['actor'] in heroes and e['fromSupport']!=e['toSupport'] and transition not in seen_transitions:
    seen_transitions.add(transition)
    if a['kind']=='jump':jumps.add(e['actionId'])
    if a['kind']=='drop':drops.add(e['actionId'])
  elif kind=='objective':
   need(isinstance(e.get('facts'),dict) and e.get('state') in ['complete','incomplete'],'invalid objective facts')
   required=registration.get('objectiveFacts');need(isinstance(required,dict) and required,'stage-specific objective facts not registered');derived={'enemyAlive':sum(units[u]['hp']>0 for u in enemies),'heroesAlive':sum(units[u]['hp']>0 for u in heroes)}
   for key,value in derived.items():
    if key in e['facts']:need(e['facts'][key]==value,'objective contradicts observed roster')
   objective=e['state']=='complete' and all(e['facts'].get(k)==v for k,v in required.items());counter_ids.update(e['facts'])
 end=events[-1];need(end['outcome'] in ['won','lost','timeout','aborted'],'invalid outcome');need(isinstance(end['round'],int) and end['round']>=0,'invalid round count')
 need(end['round']==phase_round,'terminal round differs from actual phases');won=end['outcome']=='won';need(not won or objective,'won without objective observation')
 dx=sum(abs(e['to'][0]-e['from'][0]) for e in moves);dy=sum(abs(e['to'][1]-e['from'][1]) for e in moves)
 ys=[point[1] for e in moves for point in [e['from'],e['to']]]
 # Movement alone cannot certify required support coverage; registered supports
 # and independent qualitative review remain required, rather than inflating ratios.
 budget={**registration.get('spawnSlots',{}),**units}
 return {'majorBossBudget':sum(u.get('team')=='enemy' and u.get('rank')=='major-boss' for u in budget.values()),'minibossBudget':sum(u.get('team')=='enemy' and u.get('rank')=='miniboss' for u in budget.values()),'majorBossDefeated':sum(u['hp']==0 and u.get('rank')=='major-boss' for k,u in units.items() if k in enemies),'uniqueEnemyBudget':len(enemies|{k for k,v in registration.get('spawnSlots',{}).items() if v.get('team')=='enemy'}),'observedEnemyCount':len(enemies),'peakRoundParticipants':max(map(len,participants.values()),default=0),'won':won,'outcome':end['outcome'],'rounds':end['round'],'engaged':len(engaged),'enemyActions':statistics.mean(map(len,enemy_by_round.values())) if enemy_by_round else None,'enemyAttackPctHP':statistics.median(damage.values()) if damage else None,'jumps':len(jumps),'drops':len(drops),'verticalTravelRatio':dy/dx if dx else None,'observedYSpan':max(ys)-min(ys) if ys else None,'miniboss':sum(u.get('rank')=='miniboss' for u in units.values() if u['id'] in enemies),'majorBossCount':sum(u.get('rank')=='major-boss' for u in units.values() if u['id'] in enemies),'objective':objective,'traceDigest':canonical(trace)}
def check_range(name,value,bounds):
 if value is None:return {'criterion':name,'status':'unmeasured','target':bounds,'actual':None}
 return {'criterion':name,'status':'pass' if bounds[0]<=value<=bounds[1] else 'fail','target':bounds,'actual':value}
def evaluate_stage(stage,registration,traces,candidate,adapters=None):
 need(registration.get('schema')=='honro-cohort-v1','cohort preregistration missing')
 need(registration.get('candidateDigest')==candidate and registration.get('criteriaDigest')==stage.get('_criteriaDigest',PINNED_CRITERIA) and registration.get('stage')==stage['id'],'wrong candidate/criteria/stage registration')
 slots=registration.get('trials',[]);need(len(slots)>=12,'at least 12 preregistered trials required; no single-success cohort')
 need(len({s['trialId'] for s in slots})==len(slots),'duplicate trial IDs')
 need(len({(s['seed'],s['policy'],s['profileDigest']) for s in slots})==len(slots),'duplicated experiment counted as independent')
 need(len({s['seed'] for s in slots})>=4 and len({s['policy'] for s in slots})>=2,'multiple seeds and policies required')
 need(set(traces)=={s['trialId'] for s in slots},'missing/extra trial; failures cannot be omitted')
 need(all(s.get('class') in ['general','skilled','counterexample'] for s in slots),'preregister general/skilled/counterexample class')
 need(sum(s['class']=='general' for s in slots)>=12,'12 general-policy trials required; skilled runs cannot inflate clear rate')
 outcomes=[{**reduce_trace(traces[s['trialId']],registration,s),'class':s['class']} for s in slots];general=[r for r in outcomes if r['class']=='general'];success=[r for r in general if r['won']];d=stage['design']
 med=lambda key:statistics.median(r[key] for r in success) if success and all(r[key] is not None for r in success) else None
 checks=[check_range('rounds',med('rounds'),d['rounds']),check_range('clearRate',100*len(success)/len(general),d['clearRate']),check_range('enemyActions',med('enemyActions'),d['enemyActions']),check_range('enemyAttackPctHP',med('enemyAttackPctHP'),d['enemyAttackPctHP']),check_range('requiredEngagements',med('engaged'),d['requiredEngagements']),check_range('miniboss',med('miniboss'),d['miniboss']['count']),check_range('majorBossCount',med('majorBossCount'),bounds(d['majorBossCount']))]
 checks.append({'criterion':'normalRunNotAborted','status':'pass' if all(r['outcome']!='aborted' for r in outcomes if r['class'] in ['general','skilled']) else 'fail','target':'normal cohorts cannot manufacture losses by aborting'})
 checks.append({'criterion':'normalRunOver20','status':'pass' if all(r['rounds']<=20 for r in outcomes if r['class'] in ['general','skilled']) else 'fail','actual':[r['rounds'] for r in outcomes],'target':'0 normal runs beyond 20'})
 references=[]
 if d.get('requiredUniqueEnemyBudget'):
  checks += [check_range('uniqueEnemyBudget',r['uniqueEnemyBudget'],d['requiredUniqueEnemyBudget']) for r in outcomes]
  checks += [check_range('observedEnemyCountOnWin',r['observedEnemyCount'],d['requiredUniqueEnemyBudget']) for r in outcomes if r['won']]
 if d.get('finaleSafetyRequirements'):
  for r in outcomes:
   checks += [check_range('majorBossBudget',r['majorBossBudget'],[1,1]),check_range('minibossBudget',r['minibossBudget'],[2,2])]
   if r['won']:checks.append(check_range('majorBossDefeated',r['majorBossDefeated'],[1,1]))
 if d['primaryAxis'] in ['V','C'] and not all(stage.get('measurementClassification',{}).get(k)=='reference' for k in ['jumps','drops']):
  checks += [check_range('jumps',med('jumps'),d['jumps']),check_range('drops',med('drops'),d['drops'])]
 else:
  references=[{'criterion':k,'actual':med(k),'historicalTarget':d[k],'classification':'reference'} for k in ['jumps','drops']]
 # Specialized checks run registered code on actual artifacts. Missing adapters
 # block; no unconditional permanent failure and no caller-supplied PASS shortcut.
 specialized=['requiredElevationCoverage','qualitativeArtAndTactics','protectedFeaturesAndSeams','actDifficultyCurve','combatSafety']
 if d.get('requiredSimultaneousParticipants'):specialized.append('simultaneousParticipants')
 if d.get('finaleSafetyRequirements'):specialized.append('finaleReturnSafety')
 for name in specialized:
  if not adapters or name not in adapters:
   checks.append({'criterion':name,'status':'unmeasured','reason':'Registered evidence adapter missing'})
  else:
   result=adapters[name](stage,registration,traces)
   need(isinstance(result,dict) and result.get('criterion')==name and result.get('status') in ['pass','fail','unmeasured','review_required'] and result.get('observations'),'invalid specialized adapter result')
   checks.append(result)
 return {'stage':stage['id'],'releaseAllowed':all(x['status']=='pass' for x in checks),'checks':checks,'referenceChecks':references,'trials':outcomes}
def audit(root,evidence,ids,version=ACTIVE_VERSION):
 from adapters import load as load_adapters
 adapters=load_adapters(root,evidence)
 plan=criteria(root,version);criteria_digest=ACTIVE_DIGEST if version=='v4' else PINNED_CRITERIA;candidate=candidate_digest(root);reports=[]
 for id in ids:
  try:
   stage=next(s for s in plan['stages'] if s['id']==id);directory=evidence/str(id);registration=json.loads((directory/'registration.json').read_text())
   proof=json.loads((directory/'collection.json').read_text());need(proof.get('schema')=='honro-collection-v1' and proof.get('candidateDigest')==candidate and proof.get('criteriaDigest')==criteria_digest,'missing/stale collector evidence')
   need(version!='v4' or proof.get('gateCode')==gate_source_hashes(root),'gate/projection changed or unpinned')
   need(proof['registrationSha256']==sha((directory/'registration.json').read_bytes()),'collection registration altered')
   files=sorted((directory/'traces').glob('*.json'));need(proof['files']=={p.name:sha(p.read_bytes()) for p in files},'raw traces added/removed/altered after collection')
   for path,expected in proof['collectorCode'].items():
    source=(root/path).resolve();need(source.is_relative_to(root) and sha(source.read_bytes())==expected,'collector code altered after collection')
   traces={p.stem:json.loads(p.read_text()) for p in files};reports.append(evaluate_stage(stage,registration,traces,candidate,adapters))
  except Exception as exc:reports.append({'stage':id,'releaseAllowed':False,'checks':[{'criterion':'evidence','status':'unmeasured','reason':str(exc)}]})
 lock=json.loads((root/('tools/quality-gate/criteria-v4-lock.json' if version=='v4' else 'tools/quality-gate/criteria-lock.json')).read_text())
 if version=='v4':need(lock.get('criteriaDigest')==ACTIVE_DIGEST,'v4 lock mismatch')
 if lock.get('unresolved'):
  for r in reports:r['checks'].append({'criterion':'criteriaResolution','status':'review_required','reason':lock['unresolved']});r['releaseAllowed']=False
 return {'schema':'honro-quality-gate-v1','criteriaVersion':version,'criteriaDigest':criteria_digest,'candidateDigest':candidate,'releaseAllowed':bool(reports) and all(r['releaseAllowed'] for r in reports),'stages':reports,'limits':['CI provenance and protected policy/validator required. Arbitrary local event files are not authenticated play evidence.','Unsupported qualitative/spatial/art adapters fail closed, never a placeholder PASS.']}
def main():
 p=argparse.ArgumentParser();p.add_argument('--root',default='.');p.add_argument('--evidence',default='_local/quality-evidence');p.add_argument('--stages',default=','.join(map(str,range(31,41))));p.add_argument('--criteria-version',choices=['v3','v4'],default=ACTIVE_VERSION);p.add_argument('--out');a=p.parse_args();root=Path(a.root).resolve();ids=[int(v) for v in a.stages.split(',')];need(ids and len(set(ids))==len(ids) and all(1<=i<=40 for i in ids),'invalid stage set');report=audit(root,(root/a.evidence).resolve(),ids,a.criteria_version);text=json.dumps(report,ensure_ascii=False,indent=2)+'\n';print(text)
 if a.out:target=root/a.out;target.parent.mkdir(parents=True,exist_ok=True);target.write_text(text)
 return 0 if report['releaseAllowed'] else 2
if __name__=='__main__':raise SystemExit(main())
