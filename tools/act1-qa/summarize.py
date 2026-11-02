"""Fail-closed partial evidence index. Never treats raw totals as fun approval."""
import json,glob,statistics,hashlib,html,subprocess
from collections import Counter
from gates import numeric_gate,overall,ui_receipt_gate
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act1-gameplay-20261103';PLAN=json.loads((ROOT/'tools/act1-qa/plan.json').read_text());rows=[]
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def normalize(stage,label,initial,final,damage,actions,path,cohort=False,seed=None,scope=None,poses=None):
 if not final:return
 actions=[{**a,'op':'fire','hero':str(a.get('actor','')).removeprefix('p-')}if a.get('op')=='app-operation'and a.get('operation')=='fire'and a.get('accepted')is True else a for a in actions]
 us={u['id']:u for u in initial.get('units',[])};allus={u['id']:u for u in final.get('units',[])};foes=[u for u in initial.get('units',[])if u.get('side')==1 and not u.get('honroObjectiveTarget') and not(stage==10 and u.get('id')=='boss')];hero=[u for u in initial.get('units',[])if u.get('side')==0 and not u.get('summoned')]
 taken=dealt=allied=protected=0;engaged=set();normalpct=[];npcById={}
 for d in damage:
  t=allus.get(d.get('target'),us.get(d.get('target'),{}));owner=allus.get(d.get('owner'),us.get(d.get('owner'),{}));v=d.get('loss',d.get('amount',d.get('hpLoss',0)))
  if t.get('side')==0:taken+=v
  if t.get('side')==2:
   allied+=v;npcById[t['id']]=npcById.get(t['id'],0)+v
   if t['id']=='objective' or (stage==7 and t['id'].startswith('resident-')) or (stage==10 and t['id']=='boss'):protected+=v
  if t.get('side')==1 and owner.get('side')==0:dealt+=v;engaged.add(t.get('id'))
  if owner.get('side')==1 and t.get('side') in [0,2]:engaged.add(owner.get('id'))
  # Per-hit only: multi-hit action aggregation is not yet complete, cannot gate.
  if owner.get('side')==1 and t.get('side')==0 and not owner.get('elite') and owner.get('id')!='boss' and t.get('maxHp'):normalpct.append(v/t['maxHp']*100)
 kinds={}
 for u in foes:
  k=u.get('honroVariant',u.get('honroType',u.get('cls','unknown')));kinds[k]=kinds.get(k,0)+1
 playerfires=[a for a in actions if a.get('op',a.get('kind')) in ['fire','shot','fire-seal','fire-binding','fire-input'] and (not a.get('before') or str(a['before'].get('id','')).startswith('p-'))]
 round_=final.get('round');target=PLAN['stages'][stage-1]['design']['rounds']
 row={'stage':stage,'policy':label,'cohort':cohort,'inputErrorSeed':seed,'engineSeed':initial.get('seed'),'scope':scope,'evidence':str(path.relative_to(ROOT)),'sha256':digest(path),'phase':final.get('phase'),'round':round_,'roundTarget':target,'trialRoundInTarget':target[0]<=round_<=target[1] if round_ else None,'hard20Exceeded':round_>20 if round_ else None,'winnerReason':final.get('winnerReason'),'entry':{'difficulty':initial.get('difficulty'),'heroes':[{'cls':u['cls'],'level':u.get('level'),'hp':u.get('maxHp'),'loadout':u.get('loadout'),'ranks':u.get('ranks')}for u in hero]},'composition':{'initialEnemiesExcludingObjectiveTargets':len(foes),'initialElites':sum(bool(u.get('elite'))and not u.get('honroMidboss')and u['id']!='boss'for u in foes),'initialMinibosses':sum(bool(u.get('honroMidboss'))for u in foes),'initialMajorBosses':sum(u['id']=='boss'and not u.get('honroMidboss')for u in foes),'initialMajorBossEncounters':sum(u['id']=='boss'and not u.get('honroMidboss')for u in foes)+(sum(u.get('id')=='sodan-binding'for u in initial.get('units',[]))if stage==10 else 0),'majorBossCountScope':'Stage10 binding is authored major-boss encounter, excluded from enemy budget; bound Sodan separately classified','archetypes':kinds,'initialObjectiveTargets':sum(bool(u.get('honroObjectiveTarget'))for u in initial.get('units',[])),'initialHostileStoryActorsNotKillTargets':[u['id']for u in initial.get('units',[])if stage==10 and u.get('id')=='boss'and u.get('side')==1]},'observed':{'kills':sum(u.get('side')==1 and not u.get('honroObjectiveTarget') and (u.get('dead') or u.get('hp',1)<=0)for u in allus.values()),'survivingHeroes':sum(u.get('side')==0 and not u.get('summoned') and not u.get('dead') and u.get('hp',0)>0 for u in allus.values()),'playerFireCommands':len(playerfires),'partyHpDamage':taken,'protectedNpcHpDamage':protected,'alliedNpcHpDamage':allied,'npcHpDamageById':npcById,'damageToHostileSideIncludingTargets':dealt,'damageBackedEngagementLowerBound':len(engaged),'damageBackedEngagedIds':sorted(engaged),'normalEnemyHitPctHpDiagnostic':{'n':len(normalpct),'mean':statistics.mean(normalpct)if normalpct else None,'range':[min(normalpct),max(normalpct)]if normalpct else None}},'missingEssential':['validated enemy effective-action denominator incl zero phases','normal enemy damage per-action aggregation','accepted full required support graph and elevation ratio','valid jump/drop/landing attribution','stage-specific special metric comparison','readability and native UI scene review','human-independent tactics assessment'], 'acceptance':'FAIL_UNMEASURED'}
 playerids={u['id']for u in hero}
 commands=[a for a in actions if isinstance(a.get('before'),dict) and a['before'].get('id')in playerids and a.get('accepted')is True]
 row['observed']['acceptedSkills']=dict(Counter(a.get('args',[None])[0]for a in commands if a.get('op')=='fire')) if commands else dict(Counter(a.get('skill')for a in playerfires if a.get('skill')))
 row['observed']['acceptedJumpCommands']=sum(a.get('op')=='jump'for a in commands) if commands else None
 row['observed']['acceptedDropCommands']=sum(a.get('op')=='drop'for a in commands) if commands else None
 row['observed']['itemCommands']=[a for a in actions if a.get('op')in ['item','ordinary-heal','ordinary-item']]
 row['observed']['playerEngineWaitCommands']=[a for a in actions if a.get('op')=='wait'and isinstance(a.get('before'),dict)and a['before'].get('id')in playerids]
 row['observed']['normalAppDefendCommands']=sum(a.get('op')=='app-defend'and a.get('accepted')is True for a in actions)
 row['normalUiApplicability']='UNVALIDATED_LEGACY_ITEM_API: no current UI binding found' if row['observed']['itemCommands'] else 'UNVALIDATED_ENGINE_WAIT_API: differs from normal App.defend HP/focus recovery'if row['observed']['playerEngineWaitCommands']else 'No inaccessible item/wait calls observed; remaining controls/entry/UI still require verification'

 row['observed']['finalHeroes']=[{'id':u['id'],'hp':u.get('hp'),'maxHp':u.get('maxHp'),'dead':u.get('dead'),'x':u.get('x'),'y':u.get('y')}for u in allus.values()if u['id']in playerids]
 row['observed']['finalObjectiveState']=final.get('honroState')
 row['observed']['collectedFiniteSupplyPoints']=[{'id':m['id'],'x':m['x'],'y':m['y'],'label':m.get('label')}for m in final.get('honroMarkers',[])if m.get('type')=='rest'and m.get('collected')]
 route={}
 for uid in playerids:
  ps=[u for sample in poses or []for u in sample.get('units',[])if u['id']==uid]
  if ps:route[uid]={'sampleCount':len(ps),'xRange':[min(u['x']for u in ps),max(u['x']for u in ps)],'yRange':[min(u['y']for u in ps),max(u['y']for u in ps)],'observedSupports':sorted({u['support']for u in ps if u.get('support')}),'sampledPathLengthLowerBound':sum(((a['x']-b['x'])**2+(a['y']-b['y'])**2)**.5 for a,b in zip(ps,ps[1:]))}
 row['observed']['sampledRoutes']=route
 # Attribute damage to accepted launch IDs, not raw hit count. Any owner
 # without recorded launch remains unknown rather than receiving invented credit.
 launches={};effective={};unattributed=0
 for a in actions:
  bef=a.get('before');args=a.get('args',[])
  if a.get('op')=='fire' and a.get('accepted')is True and isinstance(bef,dict):launches.setdefault(bef['id'],[]).append(a)
 for d in damage:
  target=allus.get(d.get('target'),{});owner=d.get('owner');time=d.get('tick');loss=d.get('loss',d.get('amount',0))
  if owner not in playerids or target.get('side')!=1 or loss<=0:continue
  candidates=[a for a in launches.get(owner,[])if time is not None and a.get('tick',0)<=time]
  if not candidates:unattributed+=1;continue
  a=candidates[-1];effective.setdefault(target['id'],set()).add((owner,a['tick'],a['args'][0]))
 killed=[u for u in allus.values()if u.get('side')==1 and (u.get('dead')or u.get('hp',1)<=0)and not u.get('honroObjectiveTarget')and not u.get('elite')and not u.get('honroMidboss')and u['id']!='boss']
 row['observed']['normalKilledEnemyPlayerEffectiveLaunches']=[{'target':u['id'],'effectivePlayerLaunchCount':len(effective.get(u['id'],set())) if launches else None,'alliedAssistanceDamage':sum(d.get('loss',d.get('amount',0))for d in damage if d.get('target')==u['id']and allus.get(d.get('owner'),{}).get('side')==2)}for u in killed]
 row['observed']['unattributedPlayerDamageEvents']=unattributed
 # Diagnostic aggregation uses accepted enemy launches, including misses.
 # It does not count approach/control-only turns as ineffective: that accepted
 # denominator remains missing. Delayed effects can overlap, so association
 # by owner/time is explicitly not promoted to the damage acceptance gate.
 enemyLaunches={};enemyGroups={}
 for index,a in enumerate(actions):
  before=a.get('before')if isinstance(a.get('before'),dict)else {};uid=before.get('id');unit=allus.get(uid,us.get(uid,{}))
  if a.get('op')=='fire'and a.get('accepted')is True and unit.get('side')==1:
   enemyLaunches.setdefault(uid,[]).append((a.get('tick',-1),index))
   enemyGroups[index]={'owner':uid,'round':a.get('round'),'skill':a.get('args',[None])[0],'heroDamage':{},'hits':0,'normal':not unit.get('elite')and not unit.get('honroMidboss')and uid!='boss'}
 unassignedEnemy=0
 for hit in damage:
  owner=hit.get('owner');target=allus.get(hit.get('target'),us.get(hit.get('target'),{}))
  if owner not in enemyLaunches or target.get('side')!=0:continue
  matches=[v for v in enemyLaunches[owner]if v[0]<=hit.get('tick',-1)]
  if not matches:unassignedEnemy+=1;continue
  group=enemyGroups[matches[-1][1]];uid=target['id'];group['heroDamage'][uid]=group['heroDamage'].get(uid,0)+hit.get('loss',hit.get('amount',0));group['hits']+=1
 pct=[loss/allus.get(uid,us.get(uid))['maxHp']*100 for group in enemyGroups.values()if group['normal']for uid,loss in group['heroDamage'].items()if allus.get(uid,us.get(uid,{})).get('maxHp')]
 row['observed']['enemyLaunchDiagnostic']={'acceptedLaunches':len(enemyGroups),'launchesDamagingHeroes':sum(bool(v['heroDamage'])for v in enemyGroups.values()),'launchesWithoutObservedHeroDamage':sum(not v['heroDamage']for v in enemyGroups.values()),'byRound':dict(Counter(v['round']for v in enemyGroups.values())),'normalActionTargetPctHp':{'n':len(pct),'mean':statistics.mean(pct)if pct else None,'range':[min(pct),max(pct)]if pct else None},'unassignedHeroDamageEvents':unassignedEnemy,'scope':'Owner/time attribution diagnostic only; approach, control, protected-NPC pressure and delayed-effect overlap not fully classified.'}
 if not any(isinstance(a.get('before'),dict)and 'accepted'in a and 'tick'in a for a in actions):row['observed']['enemyLaunchDiagnostic']={'status':'MISSING_INSTRUMENTATION','acceptedLaunches':None,'scope':'This source does not capture all accepted Engine fire calls; zero cannot be inferred.'}
 row['observed']['effectiveLaunchCaveat']='Recorded launch-to-impact association by actor/time; delayed effects and ally assistance require review before kill-actions gate.'
 row['observed']['routeCaveat']='One-second samples: path length lower bound, not exact movement or valid landing attribution.'
 rows.append(row)
for path in OUT.glob('stage*/trace.json'):
 p=json.loads(path.read_text());stage=p.get('stage');initial=p.get('initial');final=p.get('final')
 if stage and initial and final:normalize(stage,p.get('policy',path.parent.name),initial,final,p.get('damage',[]),p.get('inputs',p.get('actions',[])),path,'cohort' in p.get('policy',''),p.get('inputErrorSeed',p.get('seed')),p.get('scope'),poses=p.get('poses'))
 elif p.get('schema')=='honro-stage5-input-trace/v1':normalize(5,path.parent.name,initial,final,p.get('hits',[]),p.get('actions',[]),path,scope='Current reward/recruit fixture through4, production App native inputs; historical roster gate FAILED separately; not UI')
for path in OUT.glob('stage*/combat.json'):
 p=json.loads(path.read_text());stage=int(path.parent.name.split('-')[0][5:]);normalize(stage,path.parent.name,p['initial'],p['battleEnd'],p.get('damage',[]),p.get('actions',[]),path,scope='Historical declared prior-victory profile, current Engine/App controller calibration; not campaign-continuous or real UI')
p=ROOT/'_local/reports/stage5-foundation-20261026/final-normal/trace.json'
if p.exists():
 d=json.loads(p.read_text());normalize(5,'observed-route-command-replay',d['initial'],d['final'],d['hits'],d['actions'],p,scope=d['scope'])
for folder in OUT.glob('stage8-*'):
 p=folder/'result.json';initial=folder/'initial.json';final=folder/'final-battle.json';trace=folder/'trace.json'
 if p.exists()and initial.exists()and final.exists():
  d=json.loads(trace.read_text());normalize(8,folder.name,json.loads(initial.read_text())['initial']['battle'],json.loads(final.read_text()),d['damage'],d['actions'],trace,scope='Current reward/recruit fixture, native input calibration')
# Preserve candidate identity per row, especially the isolated Stage8 fix.
for row in rows:
 folder=(ROOT/row['evidence']).parent
 adapter=folder/'adapter.json';result=folder/'result.json'
 meta=json.loads(adapter.read_text())if adapter.exists()else {}
 resultMeta=json.loads(result.read_text())if result.exists()else {}
 initialFile=folder/'initial.json';initialMeta=json.loads(initialFile.read_text())if initialFile.exists()else {};recordedInitialSource=initialMeta.get('provenance',{}).get('sha')
 raw=json.loads((ROOT/row['evidence']).read_text());rawSource=raw.get('source');row['sourceCommit']=resultMeta.get('sourceCommit',meta.get('sourceCommit'))or(rawSource if isinstance(rawSource,str)and len(rawSource)==40 else None)or recordedInitialSource
 row['sourceEvidence']=({'path':str(initialFile.relative_to(ROOT)),'sha256':digest(initialFile)}if recordedInitialSource else None)
 row['sourceProvenanceStatus']='Recorded commit'if row['sourceCommit']else 'MISSING_COMMIT: preserve raw/controller hashes; do not infer exact source'
 row['operationMode']=raw.get('operationMode')or('NATIVE_APP_ACTION_SIMULATION'if raw.get('schema')=='honro-stage5-input-trace/v1'or(row['stage']==5 and 'final-normal'in row['evidence'])else 'ENGINE_ACTION_MODEL')
 row['controllerFileSha256']=digest(folder/'controller.js')if(folder/'controller.js').exists()else meta.get('adaptedSha256')
 row['runnerSha256']=raw.get('runnerSha256');row['sourceDirtyAtStart']=raw.get('sourceDirtyAtStart',meta.get('sourceDirty','NOT_RECORDED'))
 if raw.get('damageFx') is not None:
  hits=[v for v in raw['damageFx']if v.get('ownerSide')==1 and v.get('targetSide')==0 and v.get('critical')is False and not v.get('ownerElite')and not v.get('ownerMidboss')and not v.get('ownerMajorBoss')and v.get('targetMaxHp')]
  values=[v['damage']/v['targetMaxHp']*100 for v in hits];row['observed']['noncriticalNormalHitPctHp']={'n':len(values),'values':values,'mean':statistics.mean(values)if values else None,'median':statistics.median(values)if values else None,'range':[min(values),max(values)]if values else None,'source':'Production emitted damage text includes actual damage/critical/attackId; HP-loss truncation avoided. Fully shield-absorbed no-damage hits not in this event sample.','sampleScope':'Separate instrumentation diagnostic, not additional registered cohort cases'}
 row['controllerCalibrationStatus']='INVALID_PLANNED_SKILL_CALLER_MISMATCH'if row['stage']==2 and 'focused'in row['policy']and 'skillmatch'not in row['policy']else 'Diagnostic calibration unless separately preregistered'
 if row['stage']==1 and row.get('inputErrorSeed')==1127:row['controllerCalibrationStatus']='INVALID_POLICY_SUFFIX_ROUTING: observer suffix changed exact route-policy branch; retained diagnostic, not equivalent frozen route'
 row['runtimeSha256']=meta.get('actualRuntimeSha256')
 row['legacyRuntimePartsHash']=resultMeta.get('runtimeSha256')
 row['legacyRuntimeHashScope']='Historical Stage8 test hashes runtimeParts without productionStory:true; NOT a complete hash of actual selected production-story runtime'if row['legacyRuntimePartsHash']else None
 row['candidateScope']='UNVERIFIED_SOURCE_METADATA'
 if row['sourceCommit']:
  try:
   changed=subprocess.check_output(['git','diff','--name-only','292c1122fcd75256c366ec15e815fb4adcfbd7b2',row['sourceCommit'],'--','shared/runtime','shared/engine','game/src'],cwd=ROOT,text=True).splitlines()
   if not changed:row['candidateScope']='Baseline292 tracked gameplay source verified from recorded commit'
   elif changed==['shared/runtime/stage8-bier.js'] and subprocess.check_output(['git','show',row['sourceCommit']+':shared/runtime/stage8-bier.js'],cwd=ROOT)==subprocess.check_output(['git','show','fcfa4e6a85b6faff317da574e8b5ae50b27a6f3e:shared/runtime/stage8-bier.js'],cwd=ROOT):row['candidateScope']='Baseline292 plus authorized Stage8 staging fix; tracked source verified from commit'
  except Exception:pass
 row['runtimeHashStatus']='Recorded'if row['runtimeSha256']else 'MISSING_RUNTIME_HASH; commit comparison may establish tracked source only'
 row['continuationHistory']=resultMeta.get('previousPolicies',[])
 if row['stage']==8 and row['phase']=='won':row['postVictoryStatus']='Normal result/rest/journey9 verified'if(folder/'stage9-entry.json').exists()else 'COMBAT_WON; post-victory reader/progression unverified or harness assertion failed'

registration=json.loads((ROOT/'tools/act1-qa/stage1-cohort.json').read_text())
registered=[r for r in rows if r['cohort']and r['stage']==1]
expectedPairs={(policy,seed)for policy in registration['policies']for seed in registration['seeds']}
actualPairs=[(r['policy'],r['inputErrorSeed'])for r in registered]
registrationChecks={'exactUniqueCases':len(actualPairs)==len(expectedPairs)and set(actualPairs)==expectedPairs,'terminalOnly':all(r['phase']in ['won','lost']for r in registered),'noLegacyItemCalls':all(not r['observed']['itemCommands']for r in registered),'sourceHashesMatch':True,'baselineGameplayUnchanged':True}
for sha in {r['sourceCommit']for r in registered}:
 try:
  for file,expected in registration['sourceHashes'].items():
   if hashlib.sha256(subprocess.check_output(['git','show',sha+':'+file],cwd=ROOT)).hexdigest()!=expected:registrationChecks['sourceHashesMatch']=False
  if subprocess.run(['git','diff','--quiet',registration['candidateGameplay'],sha,'--','shared/runtime','shared/engine','game/src'],cwd=ROOT).returncode:registrationChecks['baselineGameplayUnchanged']=False
 except Exception:registrationChecks['sourceHashesMatch']=False;registrationChecks['baselineGameplayUnchanged']=False
registeredEligible=bool(registered)and all(registrationChecks.values())
groups=[]
for policy in sorted({r['policy']for r in rows if r['cohort']}):
 rs=[r for r in rows if r['policy']==policy and r['cohort']];wins=[r for r in rs if r['phase']=='won'];rounds=[r['round']for r in wins];n=len(rs);groups.append({'policy':policy,'n':n,'clears':len(wins),'clearRatePct':len(wins)/n*100,'humanClearRate':None,'uncertainty':'Fixed engine RNG, tool policy and tiny input errors do not establish a human-population confidence interval.','meanClearRounds':statistics.mean(rounds)if rounds else None,'medianClearRounds':statistics.median(rounds)if rounds else None,'clearRoundRange':[min(rounds),max(rounds)]if rounds else None,'hard20Exceedances':sum(r['hard20Exceeded']for r in rs),'engineSeedCount':len({r['engineSeed']for r in rs}),'seedScope':'input error seeds, canonical fixed game RNG','stageAcceptance':'FAIL_UNMEASURED'})
report={'schema':'honro-act1-gameplay-measurements/v1','candidateGameplay':'292c1122fcd75256c366ec15e815fb4adcfbd7b2','originalCriteria':PLAN['source'],'overall':'FAIL_INCOMPLETE','statement':'Native inputs and declared fixtures only unless separately linked to verified UI run. Clear is not fun approval. Failed controller calibration excluded from general-policy rate.','stages':[{'stage':i,'runs':sum(r['stage']==i for r in rows),'acceptance':'FAIL_UNMEASURED','requiredRounds':PLAN['stages'][i-1]['design']['rounds'],'requiredEngagements':PLAN['stages'][i-1]['design']['requiredEngagements']}for i in range(1,11)],'registrationChecks':registrationChecks,'registeredCohortEligible':registeredEligible,'humanPopulationRate':{'required':False,'measured':False,'scope':'Original criteria explicitly concern finite registered policies, not human probability.'},'macroGates':{'risingDifficultyWithIntentionalPeaks':{'status':'FAIL_MISSING_MEASUREMENT','scope':'Requires comparable accepted effective-action/damage/policy evidence across acts; do not infer from enemy totals.'}},'cohorts':groups,'runs':sorted(rows,key=lambda r:(r['stage'],r['policy'],r.get('inputErrorSeed')or 0))}
uiReceipts={}
for folder in OUT.glob('ui-*'):
 result=folder/'result.json';events=folder/'events.json'
 if not result.exists()or not events.exists():continue
 u=json.loads(result.read_text());ev=json.loads(events.read_text());final=u.get('final',{})
 sourceFile=folder/'source.txt';hashFile=folder/'served-sha256.txt';source=sourceFile.read_text().strip()if sourceFile.exists()else None;served={}
 if hashFile.exists():
  for line in hashFile.read_text().splitlines():
   parts=line.split();
   if len(parts)==2:served[parts[1].lstrip('*')]=parts[0]
 expected={name:digest(ROOT/name)for name in ['HONRO.html','web/manifest.json']}
 if ui_receipt_gate(u,ev,source=source,served=served,expected=expected,artifacts_complete=(folder/'terminal.png').exists()):uiReceipts[u['stage']]={'result':str(result.relative_to(ROOT)),'sha256':digest(result),'eventsSha256':digest(events),'source':u.get('source')}
for st in report['stages']:

 ds=PLAN['stages'][st['stage']-1]['design'];rs=[r for r in rows if r['stage']==st['stage']and r['cohort']];wins=[r for r in rs if r['phase']=='won'];rounds=[r['round']for r in wins]
 hitRows=[r for r in rows if r['stage']==st['stage'] and r.get('sourceDirtyAtStart')==''and r.get('runnerSha256')and not r.get('controllerCalibrationStatus','').startswith('INVALID')and r['observed'].get('noncriticalNormalHitPctHp',{}).get('n')]
 hitValues=[v for r in hitRows for v in r['observed']['noncriticalNormalHitPctHp']['values']]

 st['registeredRoundsDiagnostic']={'n':len(rounds),'median':statistics.median(rounds)if rounds else None,'meanReferenceOnly':statistics.mean(rounds)if rounds else None,'target':ds['rounds'],'medianWithinTarget':ds['rounds'][0]<=statistics.median(rounds)<=ds['rounds'][1]if rounds else None,'definitionSource':'Original criteria sourceMetadata.act3-4.definitions.ranges (scope 1–4)'}
 st['gates']={
 'registeredPolicyMedianRounds':numeric_gate(statistics.median(rounds)if rounds else None,ds['rounds'],n=len(rounds),eligible=False,scope='Original v3 ranges uses successful-run MEDIAN. Frozen Engine-model median is diagnostic pending App-operation corroboration; mean is reference only'),
 'registeredPolicyClearRate':numeric_gate(len(wins)/len(rs)*100 if rs else None,ds['clearRate'],n=len(rs),eligible=False,scope='Original finite registered-policy criterion; recorded frozen cohort is Engine-action model, pending complete App-operation corroboration. Fixed RNG/tiny input errors; NOT independent human probability or broad robustness.'),
 'hard20RegisteredProgression':numeric_gate(sum(r['round']>20 for r in rs)if rs else None,[0,0],n=len(rs),eligible=registeredEligible and st['stage']==1,scope='Registered ordinary-policy trials; calibration over20 logs retained separately, never clipped'),
 'minibossCompositionAndMandatoryRole':{'status':'FAIL_MISSING_MEASUREMENT','target':ds['miniboss'],'scope':'Initial typed count is diagnostic; required encounter/mandatory-role and event composition not fully audited'},
 'majorBossTelegraphAndCounterplay':{'status':'FAIL_MISSING_MEASUREMENT'if ds['majorBossCount'][1]else 'PASS','target':ds['majorBossCount'],'scope':'Required authored boss role, warnings and response not fully audited'if ds['majorBossCount'][1]else 'Not applicable: original majorBossCount=[0,0]'},
 'applicableJumpDropLandingTransitions':{'status':'FAIL_MISSING_MEASUREMENT','scope':'Vertical/combined requires valid transitions; other types need explicit applicability review, not invented jump quotas'},
 'stageSpecialMetrics':{'status':'FAIL_MISSING_MEASUREMENT','criteria':PLAN['stages'][st['stage']-1]['specialMetrics']},
 'originalObjectiveAndProgressionIntegrity':{'status':'FAIL_MISSING_MEASUREMENT','scope':'Representative outcome does not cover all authored mandatory events/save paths; Stage8 baseline softlock separately reproduced'},
 'effectiveEnemyActions':numeric_gate(None,ds['actualEnemyActions'],scope='All effective approach/control/pressure and zero phases not fully classified'),
 'normalEnemyNoncriticalHitPctHp':numeric_gate(statistics.mean(hitValues)if hitValues else None,ds['enemyAttackPctHP'],n=len(hitValues),eligible=False,scope='Exact emitted noncritical ordinary-enemy damaging-hit samples; original single-hit metric, not action sum. Mean diagnostic; sample-band scope not promoted to global pressure coverage.'),
 'requiredRouteEngagements':numeric_gate(None,ds['requiredEngagements'],scope='Damage-backed lower bound is not complete engagement classification'),
 'routeElevationRatio':numeric_gate(None,ds['verticalTravelRatio'],scope='Required support/landing graph not fully measured'),
 'normalUIObjective':{'status':'PASS' if st['stage']in uiReceipts else 'FAIL_MISSING_MEASUREMENT','evidence':uiReceipts.get(st['stage']),'scope':'Representative normal UI objective only; not whole art/fun approval'},
 'readabilityApproval':{'status':'FAIL_MISSING_MEASUREMENT','scope':'Partial representative screenshot inspection is not complete approval'}}
 st['gates']['normalEnemyNoncriticalHitPctHp']['sampleRange']=[min(hitValues),max(hitValues)]if hitValues else None
 st['gates']['normalEnemyNoncriticalHitPctHp']['evidence']=[r['evidence']for r in hitRows]
 st['acceptance']=overall(list(st['gates'].values()))
(OUT/'measurements.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
md=['# Act1 gameplay QA — incomplete / fail closed','',report['statement'],'','## Preregistered Stage1 cohort','', '| Policy | n | Clear | Mean / median / range R | Uncertainty |','|---|---:|---:|---|---|']
for g in groups:md.append(f"| {g['policy']} | {g['n']} | {g['clears']}/{g['n']} | {g['meanClearRounds']} / {g['medianClearRounds']} / {g['clearRoundRange']} | conditional input robustness only; no human CI |")
md+=['','## All diagnostic results (not pooled success rates)','', '| Stage | Policy | Outcome / R | Kills | Damage-backed engaged lower bound | Party / protected NPC HP loss |','|---|---|---|---:|---:|---|']
for r in report['runs']:
 if r['cohort']:continue
 o=r['observed'];md.append(f"| {r['stage']} | {r['policy']} | {r['phase']} / {r['round']} | {o['kills']} | {o['damageBackedEngagementLowerBound']} | {o['partyHpDamage']} / {o['protectedNpcHpDamage']} |")
md+=['','## Required limitations','- Original required/reference classification is in plan.json; total enemy counts and platform quotas are not automatic requirements.','- Trial outside target is not a multi-policy aggregate verdict. Any observed >20R is retained separately; no forced game-over or truncation into success.','- Stage9 objective fast path: fresh two receivers in R2, zero kills, queued waves preempted. This is a design-pressure gap against7–9R/10–16engagement targets, not a mandate to add kill-all or idle hold.','- Native stage1–7 inherited controller captions may say browser historically; this adapter supplied DOM/canvas doubles and no browser screenshots.','- Missing required measurements above keep every stage acceptance unmeasured/failed; no subjective fun score is asserted.']
(OUT/'REPORT.md').write_text('\n'.join(md)+'\n')
body='<h1>Act1 gameplay QA — incomplete</h1><p>Native actual inputs; not human fun or whole acceptance.</p><h2>Stage1 registered policy clear rounds</h2>'
for g in groups:body+=f'<p>{html.escape(g["policy"])} (n={g["n"]}) <span style="display:inline-block;background:#4c8c86;height:16px;width:{(g["meanClearRounds"]or 0)*24}px"></span> {g["meanClearRounds"]}R</p>'
body+='<pre>'+html.escape('\n'.join(md))+'</pre>'
(OUT/'REPORT.html').write_text('<!doctype html><meta charset="utf-8"><title>Act1 gameplay QA</title><style>body{font:15px system-ui;max-width:1300px;margin:40px auto;padding:20px;color:#243334;background:#f5f4ef}pre{white-space:pre-wrap;font:14px monospace;line-height:1.5}</style>'+body)
print('Measured runs',len(rows),'cohorts',len(groups),'overall FAIL_INCOMPLETE')
