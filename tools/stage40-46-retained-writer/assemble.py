"""No rebuild, exact success-only archive and guarded frozen assembly. Disabled until root binds scope."""
from urllib.parse import urlsplit
from datetime import datetime,timezone
from pathlib import Path
import hashlib,io,json,os,re,stat,statistics,subprocess as sp,sys,time,zipfile
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_bytes());R=P['base'];Q=P['normalQA'];K=P['workshopQA'];OLD=R['head']
M='web/manifest.json';F={'HONRO.html','HONRO_WORKSHOP.html','index.html',M}
SRC=set(P['sources']); NEWSRC={k for k,a in P['sources'].items() if a['old'] is None}; MODSRC=SRC-NEWSRC; MODIFY=MODSRC|F
KEEP={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
RETAINER='tools/release/retain-published-web.mjs'; POLICY='shared/web-retention.mjs'
def need(ok,msg):
 if not ok:raise RuntimeError(msg)
def h(b):return hashlib.sha256(b).hexdigest()
def f(b):return {'bytes':len(b),'sha256':h(b)}
def g(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def full(b):return {**f(b),'git':g(b)}
def o(b):
 def strict(p):
  d=dict(p);need(len(d)==len(p),'duplicate JSON keys');return d
 return json.loads(b,object_pairs_hook=strict)
def save(p,x):p.write_text(json.dumps(x,indent=2)+'\n')
def git(p,*x):return sp.check_output(['git','-C',str(p),*x],timeout=120,text=True).strip()
def read(p,k):
 k=Path(k);q=p/k
 need(not k.is_absolute() and '..' not in k.parts and q.is_file() and not q.is_symlink() and q.resolve().is_relative_to(p.resolve()),'unsafe path '+str(k));return q.read_bytes()
def idx(rows):
 d={}
 for x in rows:
  k=x['path'];m={p:x[p]for p in ('bytes','sha256')}
  need(re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',k) and type(m['bytes'])is int and m['bytes']>0 and re.fullmatch('[0-9a-f]{64}',m['sha256']) and(k not in d or d[k]==m),'unsafe or conflicting registered immutable')
  d[k]=m
 return d
def registry(m):
 return idx([*m['files'],*m['previousFiles'],*sum(m['previousGenerations'],[]),*(x for gen in m['publishedGenerations']for x in gen['files'])])
def zipped(b,expect,limit):
 z=zipfile.ZipFile(io.BytesIO(b));v=z.infolist()
 need(len(v)==len(expect) and {x.filename for x in v}==set(expect) and sum(x.file_size for x in v)<limit,'unexpected/missing archive members')
 need(all(not x.is_dir() and not x.filename.startswith('/') and '..' not in Path(x.filename).parts and x.file_size>0 and x.compress_type in (0,8) and stat.S_IFMT(x.external_attr>>16) in (0,stat.S_IFREG) for x in v),'unsupported archive entry')
 need(z.testzip() is None,'archive CRC error')
 return z
def role(k):
 return re.sub(r'\.[a-f0-9]{16}(?=\.[^.]+$)','',k)
def bound(*,require_r2=True):
 need(all(Q[k] is not None for k in ('run','job','head','branch','artifact','artifactName','fact','innerFact','members','receipts','closedFiles','workflow','jobName','onlyError')) and all(P[k] is not None for k in ('expectedNormalManifest','expectedAliasPairs','reviewedFrames')),'official combined B still unbound')
 need(type(Q['run']) is type(Q['job']) is type(Q['artifact']) is int and all(v>0 for v in (Q['run'],Q['job'],Q['artifact'])) and all(re.fullmatch('[a-f0-9]{40}',Q[k]) for k in ('head',)),'bad reviewed producer identifiers')
 if require_r2:
  need(all(K[k] is not None for k in ('run','job','head','tree','branch','artifact','artifactName','fact','members','receipts','workflow','jobName')) and all(re.fullmatch(r'[0-9a-f]{40}',a)for a in (Q['tree'],K['tree'],K['head'])) and all(type(K[i]) is int and K[i]>0 and K[i]!=Q[i] for i in ('run','job','artifact')) and K['head']!=Q['head'],'official R2 Workshop authority still unbound')
def measured(accept):
 # Identical R1 capture.py summary; that call was reached only after Workshop.
 expected={(dev,s,rep,arm) for dev in ('PC','Mobile') for s in (11,40,46) for rep in range(1 if s==11 else 3) for arm in 'AB'}
 trials=accept['trials'];table={}
 need(len(trials)==28,'incomplete authentic R1 timing')
 for r in trials:
  k=(r['device'],r['stage'],r['rep'],r['arm']);st,arm=k[1],k[3]
  need(k in expected and k not in table and r['status']=='OBSERVED' and r['nativeReady'] is True,'duplicate/unproven native timing case')
  need(r['firstFrame']['pose']['stage']==st and r['firstFrame']['pose']['mode']=='campaign' and r['firstFrame']['pose']['custom'] is False,'unexpected native trial stage/mode')
  need(r['nativeStage40SourceAndOwner']=={'present':arm=='B','accepted':arm=='B' and st==40} and r['nativeStage46SourceAndOwner']=={'present':[arm=='B']*3,'eligible':st==46},'native timing owner or negative drift')
  t=r['times'];ff=r['firstFrame'];v=t['readyToDrawEnd']
  need(set(t)=={'readyToDrawEnd','readyToDrawStart','launchToDrawEnd','firstDrawCpu'} and all(type(n) in (int,float) and 0<=n<35000 for n in t.values()) and v>0 and ff['start']<=ff['end'] and abs(v-t['readyToDrawStart']-t['firstDrawCpu'])<1e-5,'bad native sample or draw arithmetic');table[k]=v
 need(set(table)==expected,'missing native timing case')
 result={}
 for dev in ('PC','Mobile'):
  a0,b0=[table[dev,11,0,arm]for arm in 'AB'];control=b0-a0;result[dev]={}
  for st in (40,46):
   pairs=[]
   for i in range(3):
    a,b=[table[dev,st,i,arm]for arm in 'AB'];pairs.append([a,b,a-b])
   gain=statistics.median([r[2]for r in pairs]);stock=statistics.median([r[0]for r in pairs])
   passed=all(r[2]>0 for r in pairs) and gain>=max(30,.08*stock,abs(control)) and control<=max(30,.10*a0)
   result[dev][str(st)]={'paired':pairs,'medianDeltaMs':gain,'largestControlShiftMs':control,'firstScreenBenefitQualified':passed}
 need(all(v['firstScreenBenefitQualified']for dev in result.values()for v in dev.values()),'authentic R1 samples fail original native timing qualification')
 return result
def verified(raw):
 bound(require_r2=False)
 need(f(raw)==Q['fact'],'official outer archive hash mismatch')
 needed={'BASE-AND-SOURCE.json','ACCEPTANCE.json','GRAPH.json','ORDERED.json','B-NATIVE-CLOSURE.json'}
 need(needed<=Q['receipts'].keys() and len(P['reviewedFrames'])==4,'missing exact native decisions/frames')
 with zipped(raw,Q['members'],260_000_000) as z:
  for group in (Q['receipts'],P['reviewedFrames']):
   need(all(f(z.read(k))==v for k,v in group.items()),'official receipt or separately reviewed image changed')
  src,accept,d,order,cu=(o(z.read(k))for k in ('BASE-AND-SOURCE.json','ACCEPTANCE.json','GRAPH.json','ORDERED.json','B-NATIVE-CLOSURE.json'))
  need(src['base']==OLD and src['head']==Q['head'] and src['ship'] is False and src['unchangedProfileStore']==P['profileStoreExactGit'],'native armed exact parent and profile store')
  want={Path(k).name:{'stock':v['old'],'candidate':v['new'],'bytes':v['bytes'],'sha256':v['sha256']}for k,v in P['sources'].items()}
  need(src['source']==want,'candidate four signed sources differ')
  need(accept['status']=='HOLD' and accept['errors']==[Q['onlyError']] and accept['workshop']=={'A':{'status':'STARTED'}} and 'timing' not in accept and accept['rawSaveExported'] is False,'R1 failed only the stated Inspector Workshop observation')
  timing=measured(accept)
  need(set(accept['saves'])=={'40','46'},'actual cold Continue absent')
  for stage,rows in accept['saves'].items():
   need(set(rows)=={'PC','Mobile'},'actual cold Continue devices missing')
   for v in rows.values():
    need(v['resumeA']==v['resumeB'] and v['resumeA']['actualNativeTitleClick'] is True and bool(v['resumeA']['providers']),'actual cold Continue or restored identity changed')
    if stage=='46':
     need(v['openingBeforeAdvanceA']==v['openingBeforeAdvanceB'] and v['nativeMintedA']==v['nativeMintedB'] and v['nativeMintedA']['refs']=={'act5:near:46':'16328502:43d17801'} and v['nativeMintedA']['state']==v['resumeB']['state'],'Stage46 native opening/post-intro bytes and cold state differ')
    else:need(v['saved']['state']==v['resumeB']['state'],'Stage40 genuine saved/cold state mismatch')
  frames=set();expectedFrames={f'{v}-{n}'for v in ('PC','Mobile')for n in (40,46)};need(set(accept['images'])==expectedFrames|{'PC-11','Mobile-11'},'both target devices missing')
  for n,x in accept['images'].items():
   need(set(x)=={'A','B'} and x['A']['quiescent'] is True and x['B']['quiescent'] is True and x['A']['rgba']==x['B']['rgba'] and x['A']['meta']==x['B']['meta'],'matched actual frame/physics changed')
   for arm in 'AB':
    name=n+'-'+arm+'-RAW.png';need(x[arm]['file']==name and name in Q['members'] and f(z.read(name))==x[arm]['png'],'native frame body differs '+name)
   if n in expectedFrames:frames.add(x['B']['file'])
  need(frames==set(P['reviewedFrames']),'approved B exact PC and mobile frame refs differ')
  need(d['identicalCampaignSlots']==50 and d['previousOnlyBaselineStillExact'] and d['deploy'] is False and order['status']=='PASS_ONLY_FOUR_SIGNED_SOURCE_MODULES_AND_POINTERS' and d['ordered']==order,'native closure/change scope not proven')
  pairs=order['addressPairs'];C=P['closureContract']
  need(pairs==P['expectedAliasPairs'] and set(pairs)==set(C['stockActiveAliases'])==set(d['aonly']) and set(pairs.values())==set(d['bonly']) and len(pairs)==len(set(pairs.values()))==7,'seven exact alias transitions required')
  need(all(pairs[k]==v for k,v in C['runtimeReplacementByStock'].items()if v is not None),'independent expected runtime owner drift')
  need(cu['custodyWithQAOnly'] and cu['shipAuthorized'] is False and cu['retentionIncluded'] is False and set(cu['oldActiveAliasesNotToRetireInProduct'])==set(pairs),'QA-only custody scope')
  inner=z.read('B-NATIVE-CLOSURE.zip');need(f(inner)==Q['innerFact']==cu['archive'],'inner exact real compiler payload')
  need(cu['files']==Q['closedFiles'],'closed raw bytes digest map not independently bound')
  with zipped(inner,Q['closedFiles'],40_000_000) as zz:parts={k:zz.read(k)for k in zz.namelist()}
 want=set(pairs.values())|SRC|F
 need(set(parts)==want and len(parts)==cu['pathCount']==C['outputCount']==15 and all(full(v)==cu['files'][k]for k,v in parts.items()),'exact fifteen normal compiler/member bodies')
 need(full(parts[M])==P['expectedNormalManifest'] and o(parts[M])==d['b']['manifest'],'raw generated manifest differs from normal active compile')
 need(all(full(parts[k])=={f:v for f,v in P['sources'][k].items()if f in ('bytes','sha256')}|{'git':P['sources'][k]['new']} for k in SRC),'four source payloads must stay exactly signed')
 need(all(f(parts[k])==d['b']['active'][k] and f(parts[k])['sha256'][:16] in k for k in pairs.values()),'new alias body/Git drift')
 proof={k:accept[k]for k in ('trials','images','saves')};proof.update(timing=timing,previousR1Errors=accept['errors'])
 return parts,d,proof
def verified_workshop(raw,d,parts,proof):
 timing=proof['timing']
 bound()
 need(f(raw)==K['fact'],'wrong exact successful continuation archive')
 with zipped(raw,K['members'],110_000_000) as z:
  needed={'CONTINUATION.json','PRIOR-R1-AUTHORITY.json','R1-RECOMPUTED.json','ACCEPTANCE.json','GRAPH.json','BASE-AND-SOURCE.json','B-NATIVE-CLOSURE.json','B-NATIVE-CLOSURE.zip'}
  need(needed<=K['receipts'].keys() and all(f(z.read(k))==v for k,v in K['receipts'].items()),'missing/mismatched official Workshop continuation receipt')
  for k in ('GRAPH.json','BASE-AND-SOURCE.json','B-NATIVE-CLOSURE.json'):
   need(f(z.read(k))==Q['receipts'][k],'R2 did not carry the exact R1 '+k)
  need(f(z.read('B-NATIVE-CLOSURE.zip'))==Q['innerFact'],'R2 recopied different compiled bytes')
  c,accept,prior,recompute=(o(z.read(k))for k in ('CONTINUATION.json','ACCEPTANCE.json','PRIOR-R1-AUTHORITY.json','R1-RECOMPUTED.json'))
 def prior_match(v):
  return all(v.get(k)==Q[k]for k in ('run','job','head','artifact')) and all(v.get(k)==Q['fact'][k]for k in ('bytes','sha256'))
 need(c['status']=='PASS_COMBINED_NO_REBUILD_R1_FAILED_WORKSHOP_TRANSPORT_ONLY' and prior_match(c['prior']) and c['r1RemainsFailed'] is True and c['normalBuildRerun'] is False and c['graph']==Q['receipts']['GRAPH.json'] and c['custody']==Q['innerFact'] and c['combinedAcceptance']==K['receipts']['ACCEPTANCE.json'],'R2 must be a successful exact Workshop-only continuation of failed R1')
 need(prior_match(prior['prior']) and prior['r1JobRemainsFailed'] is True and prior['noRebuild'] is True and prior['checkout']==K['head'],'R2 ancestry/custody link missing')
 need(prior_match(recompute['source']) and recompute['r1RemainsFailed'] is True and recompute['normalBuildRerun'] is False and recompute['completedHistoricalArms']==28 and recompute['verifiedHistoricalPNG']==12 and recompute['priorActualSavePairs']==4 and recompute['timing']==timing,'R2 prior evidence was altered')
 w=c['workshop'];need(set(w)=={'A','B'} and w==accept['workshop'] and all(accept[k]==v for k,v in proof.items()) and accept['status']=='NATIVE_EQUIVALENCE_TIMING_QUALIFIED' and accept['errors']==[] and accept['rawSaveExported'] is False,'missing equivalent combined Workshop/timing evidence')
 for arm,v in w.items():
  h0=d[arm.lower()];m=h0['manifest'];fq=urlsplit(v['frame'])
  routes=(m['workshopEntry'],m['playtest'],m['gameEntry'])
  need(v['status']=='OBSERVED' and v['embedded'] is True and v['stage']=='stage-1' and v['started']==1 and v['stages']==50 and type(v['library']) is int and v['library']>0 and re.fullmatch(r'[0-9a-f]{64}',v['stateSHA']),'actual embedded starter state unproven')
  need(fq.scheme=='http' and fq.hostname=='127.0.0.1' and fq.port=={'A':18961,'B':18962}[arm] and not fq.fragment and v['frame']==f'http://127.0.0.1:{fq.port}/'+m['playtest'],'not exact reconstructed embedded URL')
  need(v['shell']==d['ordered']['workshopShell'][arm.lower()] and v['HTTP']=={route:h0['active'][route.split('?',1)[0]]for route in routes},'actual Workshop shell/script/playtest/entry bytes differ')
 need(w['A']['stateSHA']==w['B']['stateSHA'] and w['A']['library']==w['B']['library'] and w['B']['shell']==f(parts['HONRO_WORKSHOP.html']),'embedded editor-start runtime/library changed')
 return w
def official_argv(path):
 # gh Runner policy rejects raw ANSI logs; compressed archival bytes are also
 # binary. Bypass only its terminal filtering for these fixed capture-only paths.
 raw=re.fullmatch(r'actions/(?:jobs/[0-9]+/logs|artifacts/[0-9]+/zip)',path)
 return ['gh','api',*(['--allow-escape-sequences'] if raw else []),'repos/'+P['repo']+'/'+path]
def authority(root):
 need(P['releaseRef'] and re.fullmatch(r'refs/heads/release/[A-Za-z0-9][A-Za-z0-9._-]+',P['releaseRef']),'disabled target release ref')
 def api(p):return sp.check_output(official_argv(p),timeout=120)
 def workflow(r,expected):
  ri=o(api('actions/runs/'+str(r['run'])));ji=o(api('actions/jobs/'+str(r['job'])));c=o(api('git/commits/'+r['head']))
  need(ri['head_sha']==ji['head_sha']==r['head'] and ri['head_branch']==r['branch'] and ri['path'].split('@',1)[0]==r['workflow'] and ji['name']==r['jobName'] and ri['id']==ji['run_id']==r['run'] and ri['status']==ji['status']=='completed' and ri['conclusion']==ji['conclusion']==expected and c['tree']['sha']==r['tree'] and [v['sha']for v in c['parents']]==[OLD],'unverified exact producer/continuation QA authority')
  a=o(api('actions/artifacts/'+str(r['artifact'])))
  need(a['workflow_run']['id']==r['run'] and a['workflow_run']['head_sha']==r['head'] and a['name']==r['artifactName'] and not a['expired'] and a['digest']=='sha256:'+r['fact']['sha256'] and a['size_in_bytes']==r['fact']['bytes'],'wrong official archive metadata')
  return ji
 r1=workflow(Q,'failure');r2=workflow(K,'success')
 steps2={x['name']:x['conclusion']for x in r2['steps']}
 need(all(steps2.get(n)=='success' for n in ('Match the original exact failed official R1 and its retained bytes','Verify prior 28 real timings, A/B images and saves; reconstruct only existing bytes','Observe genuine Workshop and embedded native app only')),'R2 exact three no-rebuild steps must all succeed')
 steps={x['name']:x['conclusion']for x in r1['steps']}
 need(steps['A is tracked exact stock and B is a single standard normal build']=='success' and steps['Native cold launch timing, matched raw and ordinary A save continued in B']=='failure','R1 build or browser actual stage conclusion changed')
 p=o(api('actions/runs/'+str(R['pages'])));j=o(api('actions/jobs/'+str(R['job'])));b=o(api('branches/master'))
 need(p['head_sha']==j['head_sha']==b['commit']['sha']==OLD and p['head_branch']=='master' and p['conclusion']==j['conclusion']=='success' and j['run_id']==R['pages'] and any(q['name']=='Deploy to GitHub Pages' and q['conclusion']=='success' for q in j['steps']),'wrong exact eaf Pages/master')
 logs=api('actions/jobs/'+str(R['job'])+'/logs');marker=(R['publishedAt']+' Reported success!').encode()
 if zipfile.is_zipfile(io.BytesIO(logs)):
  with zipfile.ZipFile(io.BytesIO(logs)) as l:
   need(l.testzip() is None and sum(e.file_size for e in l.infolist())<16<<20,'unexpected Pages log archive')
   found=any(marker in l.read(e)for e in l.infolist()if not e.is_dir())
 else:found=marker in logs
 need(found,'exact eaf Pages success moment mismatch')
 a=api('actions/artifacts/'+str(Q['artifact'])+'/zip');b=api('actions/artifacts/'+str(K['artifact'])+'/zip')
 parts,d,proof=verified(a);wk=verified_workshop(b,d,parts,proof)
 return parts,d,{'r1':{'run':Q['run'],'job':Q['job'],'overall':'failure','artifact':Q['artifact'],'sha256':Q['fact']['sha256']},'r2':{'run':K['run'],'job':K['job'],'overall':'success','artifact':K['artifact'],'sha256':K['fact']['sha256']},'timing':proof['timing'],'workshop':wk}

def select(b,old,incoming,now):
 code="""import fs from 'node:fs';import{graphSha256,selectPublishedGenerations}from './shared/web-retention.mjs';const a=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(JSON.stringify(selectPublishedGenerations([{...a.incoming,graphSha256:graphSha256(a.incoming.files)},...a.prior],{now:a.now})));"""
 return o(sp.check_output(['node','--input-type=module','-e',code],cwd=b,input=json.dumps({'prior':old,'incoming':incoming,'now':now}).encode(),timeout=60))
def assemble(root,w):
 need(P['enabled'] is True and P['scopeApproval'] is True and P['destinationMustBeAtBase'] is True,'DISABLED until explicit root release review')
 bound()
 need(git(root,'rev-parse','HEAD')==OLD and git(root,'rev-parse','HEAD^{tree}')==R['tree'] and not git(root,'status','--porcelain'),'wrong pristine eaf repository')
 need(not w.exists() and w.parent.is_dir() and not w.is_relative_to(root),'non-isolated scratch assembly')
 parts,d,native=authority(root)
 w.mkdir()
 b=w/'B';git(root,'worktree','add','--detach',str(b),OLD)
 need(not git(b,'status','--porcelain') and git(b,'rev-parse','HEAD^{tree}')==R['tree'],'nonpristine assembly stage')
 before=read(b,M)
 need(full(before)==R['manifest'] and g(read(b,RETAINER))==R['retainerGit'] and g(read(b,POLICY))==R['policyGit'],'official retention code mismatch')
 need(all(g(read(b,k))==P['sources'][k]['old']for k in MODSRC) and len(MODSRC)==4 and not NEWSRC and g(read(b,'shared/runtime/profile-store.js'))==P['profileStoreExactGit'],'prior four owner source or provider store changed')
 old,normal=o(before),o(parts[M])
 oldreg=registry(old);active=idx(normal['files']);baseactive=idx(old['files'])
 diff=set(active)-set(baseactive)
 need(len(oldreg)==R['registry'] and len(old['publishedGenerations'])==R['publishedGenerations'] and len(active)==len(baseactive)==811 and diff==set(d['bonly']) and set(baseactive)-set(active)==set(d['aonly']),'wrong exact old/new live graph')
 need(all(f(read(b,k))==v for k,v in oldreg.items()),'historical immutable URL bytes changed')
 need(all(oldreg[k]==active[k]for k in set(oldreg)&set(active)),'existing immutable path identity changed')
 pairs=P['expectedAliasPairs']
 need(set(pairs)==set(baseactive)-set(active) and set(pairs.values())==diff and len(diff)==7,'approved seven live aliases changed')
 need(old['project']==normal['project'] and active[old['project']]==baseactive[old['project']]==f(read(b,old['project'])),'campaign descriptor changed')
 ca=o(read(b,old['project']))
 need(len(ca['stages'])==len(ca['stageLibraries'])==50,'incomplete canonical 50-stage graph')
 for k in ca['stages']+ca['stageLibraries']:
  need(active[k]==baseactive[k]==f(read(b,k)) and k not in diff,'actual stage map/art packet changed '+k)
  if 'assets-parts.' in k:
   x=o(read(b,k));body=b''.join(read(b,n['path'])for n in x['parts'])
   need(f(body)=={p:x[p]for p in ('bytes','sha256')} and all(active[n['path']]==baseactive[n['path']]=={p:n[p]for p in ('bytes','sha256')}for n in x['parts']),'split terrain packet changed '+k)
 for k in ('common','gameOnly'):
  need([pairs.get(x,x)for x in old[k]]==normal[k],'compiled ordered sequence changed beyond reported aliases')
 for k in ('gameEntry','workshopEntry'):
  need(pairs.get(old[k],old[k])==normal[k],'visible entry root link drift')
 def play(v):
  a,mid,b=v.partition('?')
  need(mid=='?' and b=='embedded=1','standalone wrong native Playtest locator')
  return a
 need(pairs[play(old['playtest'])]==play(normal['playtest']),'actual normal Playtest document alias changed')
 need(all(k in active and f(parts[k])==active[k] for k in diff),'included active raw body hash differs')
 addActive=diff-set(oldreg);need(len(addActive)==7,'new alias already bound in historical registry');add=addActive
 # Previous published asset URL bytes are never removed. The compiled active graph is not recomposed.
 need(OLD not in {x['sourceSha']for x in old['publishedGenerations']},'prior retained provenance already exists')
 merged={**normal,**{k:old[k]for k in KEEP}}
 prev={r['path']for r in old['previousFiles']}
 merged['previousFiles']=[*old['previousFiles'],*(dict(path=k,**v)for k,v in oldreg.items()if k not in active and k not in prev)]
 union={**oldreg,**{k:active[k]for k in addActive}}
 need(registry(merged)==union,'historical URL registry not preserved')
 for k,v in parts.items():
  p=b/k
  need(p.parent.resolve().is_relative_to(b) and not p.is_symlink(),'unsafe named candidate path')
  if k in MODIFY or k in add:
   need(p.exists()==(k in MODIFY),'stale or missing exact path '+k)
   p.write_bytes(v)
  else:need(read(b,k)==v,'candidate already published path bytes differ '+k)
 save(b/M,merged)
 evidence=f"https://github.com/sys8994/honro/actions/runs/{R['pages']}"
 incoming={'sourceSha':OLD,'publishedAt':R['publishedAt'],'publishedAtPrecision':'instant','publicationOrder':0,'evidence':evidence,'files':old['files']}
 before_ms=int(time.time()*1000)
 rt=o(sp.check_output(['node',RETAINER,OLD,'--published-at',R['publishedAt'],'--evidence',evidence],cwd=b,timeout=180))
 after_ms=int(time.time()*1000);final=o(read(b,M))
 need(rt['restored']==[] and rt['restoredBytes']==0,'previous asset restoration unexpected')
 need(final['publishedGenerations']==select(b,old['publishedGenerations'],incoming,before_ms)==select(b,old['publishedGenerations'],incoming,after_ms),'official retention window drift')
 oldg={x['sourceSha']:x for x in old['publishedGenerations']};newg={x['sourceSha']:x for x in final['publishedGenerations']}
 need(newg[OLD]['publishedAt']==R['publishedAt'] and newg[OLD]['files']==old['files'] and all(oldg[k]==newg[k]for k in oldg.keys()&newg.keys()),'published archive authority mismatch')
 need(set(oldg)-set(newg)==set(P['expectedExpiry']) and len(newg)==P['expectedFinalGenerations'],'unexpected publication metadata expiry; explicit review required')
 need(len(union)==P['expectedFinalRegistry'] and registry(final)==union and final['publishedRetention']==old['publishedRetention'] and all(f(read(b,k))==v for k,v in union.items()),'bad published immutable route closure')
 need({k:v for k,v in final.items()if k not in KEEP}=={k:v for k,v in normal.items()if k not in KEEP} and all(read(b,k)==v for k,v in parts.items()if k!=M),'official retention changed reviewed active data')
 git(b,'add','--',*sorted(MODIFY|add));changes=set(git(b,'diff','--cached','--name-status','--no-renames',OLD).splitlines())
 # A generated stable shell is only staged if actually different; no unrelated mode/byte stamped.
 typ={k for k in MODIFY if read(b,k)!=sp.check_output(['git','-C',str(b),'show',OLD+':'+k],timeout=90)}
 need(MODSRC|{M}<=typ and len(typ)==8 and len(add)==7 and changes=={'M\t'+k for k in typ}|{'A\t'+k for k in add} and not git(b,'ls-files','--others','--exclude-standard') and not git(b,'diff','--name-only'),'dirty exact release scope')
 need(all(git(b,'ls-files','--stage','--',k).split()[:3]==['100644',g(read(b,k)),'0'] for k in add|typ),'staged original bytes mismatch')
 tree=git(b,'write-tree')
 report={'status':'EXACT_DERIVED_LOCAL_TREE_NO_PUSH_NO_DEPLOY','candidateTree':tree,'parent':OLD,'manifest':full(read(b,M)),'add':sorted(add),'modify':sorted(typ),'oldUrls':len(oldreg),'preservedUrls':len(union),'publishedGenerations':len(newg),'expiredMetadata':sorted(set(oldg)-set(newg)),'candidateRawManifest':P['expectedNormalManifest'],'files':{k:full(read(b,k))for k in sorted(add|typ)},'reviewedRuns':native}
 save(w/'ASSEMBLY.json',report);print(json.dumps({k:v for k,v in report.items()if k not in ('files','add','modify')}))
if __name__=='__main__':
 act=sys.argv[1]
 if act=='local-verify':
  v,d,_=verified(Path(sys.argv[2]).read_bytes());print(json.dumps({'status':'EXACT_LOCAL_ARCHIVE_VERIFIED','files':len(v),'newActive':len(d['bonly']),'manifest':full(v[M])}))
 elif act=='local-verify-pair':
  v,d,t=verified(Path(sys.argv[2]).read_bytes());w=verified_workshop(Path(sys.argv[3]).read_bytes(),d,v,t);print(json.dumps({'status':'EXACT_LOCAL_TWO_OFFICIAL_ARCHIVES_VERIFIED','files':len(v),'newActive':len(d['bonly']),'manifest':full(v[M]),'timing':t['timing'],'workshopState':w['A']['stateSHA']}))
 elif act=='assemble':
  assemble(Path(sys.argv[2]).resolve(),Path(sys.argv[3]).resolve())
 else:raise SystemExit('local-verify EXACT_ZIP | assemble EXACT_EAF_REPO FRESH_SCRATCH (no push)')
