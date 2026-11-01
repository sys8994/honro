"""Execute pre-registered, code-pinned measurement/review adapters on snapshots.
The registry and collector need protected CI. This is not an OS security sandbox.
No arbitrary evidence JSON, unchecked identity string, or adapter PASS flag is a
measurement. Core thresholds are never supplied by the adapter.
"""
import hashlib,json,math,os,shutil,subprocess,tempfile
from pathlib import Path

def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def need(v,msg):
 if not v:raise ValueError(msg)
def child(root,p):
 path=(root/p).resolve();need(path.is_relative_to(root) and path!=root,'adapter path escapes root');return path
def number(m,k,integer=False):
 v=m[k];need(isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v) and v>=0,'invalid measurement '+k)
 if integer:need(int(v)==v,'non-integer measurement '+k)
 return v
def decision(criterion,measurements,stage):
 m=measurements;d=stage['design']
 if criterion=='requiredElevationCoverage':
  required=number(m,'requiredSupports',True);seen=number(m,'visitedRequiredSupports',True);bad=number(m,'invalidContacts',True);height=number(m,'registeredActiveHeight');span=number(m,'supportedElevationSpan');dx=number(m,'physicalDx');dy=number(m,'physicalDy')
  need(required>0 and height>0 and dx>0,'empty support/height/movement coverage')
  if stage.get('_criteriaVersion')=='v4':
   # v3 final classification: literal map size is reference, not a universal
   # release threshold. Derive the denominator from the complete registered
   # reachable graph instead; never crop it to the successful route.
   graph_height=number(m,'completeReachableGraphHeight');graph_supports=number(m,'completeReachableGraphSupports',True)
   need(graph_height>0 and graph_supports>0 and abs(height-graph_height)<=1e-6,'registered height differs from complete reachable graph')
   need(number(m,'registeredGraphSupports',True)==graph_supports and number(m,'omittedReachableSupports',True)==0,'incomplete/cropped support graph')
  else:need(d['height'][0]<=height<=d['height'][1],'registration height outside frozen criterion')
  result=seen==required and bad==0 and d['verticalSpanRatio'][0]<=span/height<=d['verticalSpanRatio'][1] and d['verticalTravelRatio'][0]<=dy/dx<=d['verticalTravelRatio'][1]
  if stage.get('_criteriaVersion')=='v4':
   absolute=d.get('verticalRoute',{}).get('requiredElevationSpan')
   if absolute:result=result and absolute[0]<=span<=absolute[1]

 elif criterion=='protectedFeaturesAndSeams':
  result=number(m,'naturalLongStraightRatio')<.30 and number(m,'maxContourErrorPx')<=1.5 and number(m,'maxProtectedErrorPx')<=.5 and number(m,'lostProtectedFeatures',True)==0 and number(m,'visibleBadSeams',True)==0
 elif criterion=='actDifficultyCurve':
  need(number(m,'matchedGeneralPolicies',True)>=2 and number(m,'missingStageCohorts',True)==0,'unmatched/missing campaign cohorts')
  need(m['act3CombatStageIds']==list(range(21,31)) and m['act4CombatStageIds']==list(range(31,41)) and m['act3GeneralStageIds']==[21,22,23,24,28,30] and m['act4GeneralStageIds']==[31,33,34,35,37,38],'changed comparison exclusions')
  # Frozen macro checks ACT4_PRESSURE/ACTIONS/DAMAGE/DURATION, not merely
  # non-regression. Exact deltas come from criteria-v3.macro.checks.
  conditions=[
   number(m,'act4GeneralClearRate')<=number(m,'act3GeneralClearRate')-5,
   number(m,'act4AllCombatClearRate')<=number(m,'act3AllCombatClearRate')-5,
   number(m,'act4GeneralEnemyActionsMedian')>=number(m,'act3GeneralEnemyActionsMedian')+1,
   number(m,'act4AllEnemyActionsMean')>=number(m,'act3AllEnemyActionsMean'),
   number(m,'act4GeneralAttackDamageMedian')>=number(m,'act3GeneralAttackDamageMedian')+3,
   number(m,'act4AllAttackDamageMean')>=number(m,'act3AllAttackDamageMean'),
   number(m,'act4AllRoundsMean')>number(m,'act3AllRoundsMean'),
   number(m,'act4AllRoundsMedian')>number(m,'act3AllRoundsMedian')]
  previous_count=previous_stages=0
  for act,count_bounds,stage_bounds,vertical,combined in [(1,(2,3),(2,3),3,4),(2,(4,5),(4,5),4,4),(3,(5,7),(5,6),4,4),(4,(11,13) if stage.get('_criteriaVersion')=='v4' else (9,11),(8,8) if stage.get('_criteriaVersion')=='v4' else (7,8),4,4)]:
   count=number(m,f'act{act}Midbosses',True);stages=number(m,f'act{act}MidbossStages',True)
   conditions += [count_bounds[0]<=count<=count_bounds[1],stage_bounds[0]<=stages<=stage_bounds[1],count>previous_count,stages>previous_stages,number(m,f'act{act}VerifiedVerticalStages',True)>=vertical,number(m,f'act{act}VerifiedCombinedStages',True)>=combined]
   previous_count,previous_stages=count,stages
  if stage.get('_criteriaVersion')=='v4':conditions.append(number(m,'stage40UniqueEnemyBudget',True)>=number(m,'stage39UniqueEnemyBudget',True)+2)
  result=all(conditions)
 elif criterion=='simultaneousParticipants':
  need(m.get('definition')=='overlapping-active-engagement-intervals-v1','round union is not simultaneous pressure')
  need(number(m,'registeredTrials',True)>0 and number(m,'coveredTrials',True)==number(m,'registeredTrials',True),'missing simultaneous engagement coverage')
  lo,hi=d['requiredSimultaneousParticipants'];result=lo<=number(m,'successfulGeneralPeakMedian')<=hi
 elif criterion=='finaleReturnSafety':
  need(number(m,'registeredTrials',True)>0 and number(m,'coveredTrials',True)==number(m,'registeredTrials',True),'missing finale safety trials')
  need(number(m,'successfulTrials',True)>0 and number(m,'physicalReturnCoveredWins',True)==number(m,'successfulTrials',True),'missing actual boat/high-route return evidence')
  result=all(number(m,k,True)==0 for k in ['unobservedSafeReturnTransitions','enemyActionsAfterSafeReturn','enemySpawnsAfterSafeReturn','winsWithWrongResidentSurvival','winsWithWrongBoatResidents','winsWithWrongHighRouteResidents','winsWithWrongFinalAccounting','winsWithPendingRequiredSpawns'])
 elif criterion=='combatSafety':
  need(number(m,'registeredThreatSituations',True)>0 and number(m,'testedThreatSituations',True)==number(m,'registeredThreatSituations',True),'missing threat/counterexample coverage')
  result=number(m,'unavoidableOneTurnDeaths',True)==0 and number(m,'unboundedControlChains',True)==0 and number(m,'minimumVerifiedCounterRoutes',True)>=2
 elif criterion=='qualitativeArtAndTactics':
  # The pinned adapter must authenticate the review at its actual authority,
  # e.g. a protected review-service artifact, not just read local review JSON.
  need(m.get('authorityVerified') is True and m.get('authority') and m.get('verificationReference'),'independent review authority unverified')
  need(m.get('reviewer') and m['reviewer']!=m.get('producer'),'producer cannot approve its own output')
  rows=m['items'];mandatory={'story-and-gimmick','terrain-and-routes','enemy-roles-and-counterplay','art-style-and-readability','unforced-strategy-diversity'}
  need(isinstance(rows,list) and len(rows)==len(mandatory) and {r['id'] for r in rows}==mandatory,'missing qualitative rubric items')
  need(all(r.get('observations') and r.get('evidenceRoles') and r.get('decision') in ['pass','fail','review_required'] for r in rows),'review lacks localized evidence or explicit decisions')
  result=all(r['decision']=='pass' for r in rows)
 else:raise ValueError('unregistered criterion type')
 return {'criterion':criterion,'status':'pass' if result else 'fail','observations':[{'measurements':m}]}
def verify_trial_coverage(criterion,m,registration,traces):
 if criterion not in ['simultaneousParticipants','finaleReturnSafety']:return
 ids={s['trialId'] for s in registration['trials']}
 need(set(traces)==ids,'adapter trace coverage differs from registration')
 need(number(m,'registeredTrials',True)==len(ids) and number(m,'coveredTrials',True)==len(ids),'adapter omitted registered trials')
 digest=lambda t:hashlib.sha256(json.dumps(t,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
 need(m.get('traceDigests')=={i:digest(traces[i]) for i in sorted(ids)},'adapter must bind exact trial IDs and trace digests')
 if criterion=='finaleReturnSafety':
  wins=sum(t['events'][-1].get('outcome')=='won' for t in traces.values())
  need(number(m,'successfulTrials',True)==wins and number(m,'physicalReturnCoveredWins',True)==wins,'adapter omitted actual successful returns')
def execute(root,evidence_root,criterion,config,stage,registration,traces):
 files=config.get('lockedFiles',{});need(files,'adapter source/dependencies not pinned')
 paths={p:child(root,p) for p in files}
 for p,h in files.items():need(sha(paths[p])==h,'adapter code changed: '+p)
 argv=config['argv'];need(isinstance(argv,list) and len(argv)>=2 and argv[1] in files,'adapter entry not code-pinned')
 spec=registration.get('adapters',{}).get(criterion);need(spec and spec.get('registryDigest')==hashlib.sha256(json.dumps(config,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'adapter registration missing/stale')
 inputs=spec.get('inputs',[]);need(inputs and len({x['role'] for x in inputs})==len(inputs),'empty/duplicate adapter input roles')
 original={x['role']:child(evidence_root,x['path']) for x in inputs};digests={x['role']:x['sha256'] for x in inputs}
 for role,p in original.items():need(sha(p)==digests[role],'input changed: '+role)
 with tempfile.TemporaryDirectory(prefix='honro-adapter-') as folder:
  folder=Path(folder);snapshot={}
  for i,(role,p) in enumerate(original.items()):
   target=folder/(str(i)+p.suffix);shutil.copyfile(p,target);target.chmod(0o444);snapshot[role]=str(target)
  request={'schema':'honro-adapter-request-v1','criterion':criterion,'candidateDigest':registration['candidateDigest'],'criteriaDigest':registration['criteriaDigest'],'inputDigests':digests,'inputs':snapshot,'stage':stage['id']}
  proc=subprocess.run([argv[0],str(paths[argv[1]]),*argv[2:]],input=json.dumps(request),capture_output=True,text=True,cwd=folder,timeout=120,env=os.environ.copy())
  need(proc.returncode==0,'adapter execution failed: '+proc.stderr[-1000:]);result=json.loads(proc.stdout)
  need(set(result)=={'schema','criterion','candidateDigest','criteriaDigest','inputDigests','measurements','evidence'},'unsupported adapter output/PASS shortcut')
  need(result['schema']=='honro-measurements-v1' and result['criterion']==criterion,'adapter output identity mismatch')
  for key in ['candidateDigest','criteriaDigest','inputDigests']:need(result[key]==request[key],'wrong adapter '+key)
  need(result['evidence'] and all(x.get('role') in snapshot and x.get('sha256')==digests[x['role']] and x.get('locator') for x in result['evidence']),'adapter evidence does not identify source locations')
  for role,p in snapshot.items():need(sha(p)==digests[role],'adapter changed its snapshot')
  if criterion=='qualitativeArtAndTactics':
   need(result['measurements'].get('authority')==config.get('reviewAuthority') and config.get('reviewAuthority'),'review authority not registered')
   need(result['measurements'].get('reviewer') in config.get('reviewers',[]),'reviewer not authorized by protected registry')
   need(all(set(x['evidenceRoles'])<=set(snapshot) for x in result['measurements']['items']),'review cites nonexistent artifact')
 for p,h in files.items():need(sha(paths[p])==h,'adapter code changed during run')
 for role,p in original.items():need(sha(p)==digests[role],'adapter modified original input')
 verify_trial_coverage(criterion,result['measurements'],registration,traces)
 return decision(criterion,result['measurements'],stage)
def load(root,evidence_root):
 path=root/'tools/quality-gate/adapter-registry.json';registry=json.loads(path.read_text())
 need(registry.get('schema')=='honro-adapter-registry-v1','bad adapter registry')
 return {name:(lambda stage,registration,traces,name=name,config=config:execute(root,evidence_root,name,config,stage,registration,traces)) for name,config in registry['adapters'].items()}
