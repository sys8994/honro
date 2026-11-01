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
  need(d['height'][0]<=height<=d['height'][1],'registration height outside frozen criterion')
  result=seen==required and bad==0 and d['verticalSpanRatio'][0]<=span/height<=d['verticalSpanRatio'][1] and d['verticalTravelRatio'][0]<=dy/dx<=d['verticalTravelRatio'][1]
 elif criterion=='protectedFeaturesAndSeams':
  result=number(m,'naturalLongStraightRatio')<.30 and number(m,'maxContourErrorPx')<=1.5 and number(m,'maxProtectedErrorPx')<=.5 and number(m,'lostProtectedFeatures',True)==0 and number(m,'visibleBadSeams',True)==0
 elif criterion=='actDifficultyCurve':
  need(number(m,'matchedGeneralPolicies',True)>=2 and number(m,'missingStageCohorts',True)==0,'unmatched/missing campaign cohorts')
  result=number(m,'act4GeneralClearRate')<=number(m,'act3GeneralClearRate') and number(m,'act4AllCombatClearRate')<=number(m,'act3AllCombatClearRate') and number(m,'act4EnemyActions')>=number(m,'act3EnemyActions') and number(m,'act4AttackDamagePct')>=number(m,'act3AttackDamagePct') and number(m,'act4Midbosses',True)>=9
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
 return decision(criterion,result['measurements'],stage)
def load(root,evidence_root):
 path=root/'tools/quality-gate/adapter-registry.json';registry=json.loads(path.read_text())
 need(registry.get('schema')=='honro-adapter-registry-v1','bad adapter registry')
 return {name:(lambda stage,registration,traces,name=name,config=config:execute(root,evidence_root,name,config,stage,registration,traces)) for name,config in registry['adapters'].items()}
