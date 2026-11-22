"""One verified normal B, no rebuild. Writes one detached candidate tree only."""
from pathlib import Path
from datetime import datetime,timezone
import hashlib, json, io, os, re, stat, subprocess as sp, sys, time, zipfile
H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_bytes())
R=P['base'];QA=P['qa'];BASE=R['head'];TREE=R['tree'];S=P['source'];SRC=S['path']
MAN='web/manifest.json';SHELL={'HONRO.html','index.html','HONRO_WORKSHOP.html'}
HISTORY={'previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
ADD=set(P['generated'])-SHELL-{MAN};MODS=SHELL|{MAN,SRC}
FILES={'.github/workflows/stage44-root-floor-onebuild.yml',*(f'tools/stage44-root-floor-onebuild/{n}' for n in ('PINS.json','writer.py','safe-push.sh','candidate.js'))}
RETAINER='tools/release/retain-published-web.mjs';POLICY='shared/web-retention.mjs'
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def blob(b):return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
def full(b):return {**fact(b),'git':blob(b)}
def obj(b):
 def check(v):
  d=dict(v);assert len(d)==len(v);return d
 return json.loads(b,object_pairs_hook=check)
def save(f,x):f.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def git(r,*args):return sp.check_output(['git','-C',str(r),*args],timeout=120).decode().strip()
def read(r,p):
 p=Path(p);assert not p.is_absolute() and '..' not in p.parts
 q=r/p;assert q.is_file() and not q.is_symlink() and q.resolve().is_relative_to(r.resolve()),p
 return q.read_bytes()
def inv(rows):
 d={}
 for q in rows:
  k=q['path'];assert re.fullmatch(r'web/(runtime|entries|data|styles|graphics|fonts)/[\w.-]+',k)
  v={a:q[a]for a in ('bytes','sha256')}
  assert type(v['bytes'])is int and v['bytes']>0 and re.fullmatch('[a-f0-9]{64}',v['sha256'])
  assert k not in d or d[k]==v
  d[k]=v
 return d
def registry(x):
 return inv([*x['files'],*x['previousFiles'],*sum(x['previousGenerations'],[]),*(p for g in x['publishedGenerations']for p in g['files'])])
def safezip(z,names,cap):
 f=z.infolist()
 assert len(f)==len(names) and {p.filename for p in f}==set(names) and sum(p.file_size for p in f)<cap
 assert all(not p.is_dir() and p.file_size>0 and p.compress_type in (zipfile.ZIP_STORED,zipfile.ZIP_DEFLATED) and stat.S_IFMT(p.external_attr >>16) in (0,stat.S_IFREG) for p in f)
 assert z.testzip() is None
def verified(outer):
 assert fact(outer)==QA['outer']
 with zipfile.ZipFile(io.BytesIO(outer)) as z:
  safezip(z,P['outerMembers'],28<<20)
  for p,v in P['receipts'].items():assert fact(z.read(p))==v
  br,g,s,se=(obj(z.read(k))for k in ('BROWSER.json','GRAPH.json','SOURCE.json',P['sealPath']))
  assert br['status']==se['status']=='KNOWN_PREVIOUS_1DN_ONLY_PENDING_ART_STRICT_HOLD'
  assert br['strictUnchanged'] is False and not br['latePixelGateMismatches']
  assert len(br['http'])==4 and all(not v['errors'] for v in br['http'].values())
  assert set(br['frames'])==set(P['fixedViews'])
  assert s['stock']==se['base']==BASE and s['qaHead']==QA['head'] and s['stockTree']==TREE
  assert s['targetSource']==se['authorPath']==SRC and s['A']['git']==S['old'] and s['B']==se['author']
  assert s['B']['git']==S['new'] and s['B']['sha256']==S['sha256']
  assert se['mustReviewActualBothDevices'] is se['oldStrictProofStaysHold'] is se['noDeployAuthorized'] is se['requiresPublishedRetention'] is True
  assert se['browser']==P['receipts']['BROWSER.json'] and se['graph']==P['receipts']['GRAPH.json']
  for key,a in br['frames'].items():
   assert set(a)=={'A','B','verification'}
   target=P['fixedViews'][key];expected=target['outside'];visible=target['changed']>0
   assert a['verification']['lineTargetInActualViewport'] is visible and a['verification']['signedRasterPad']==4
   assert a['A']['observedClosure']==0 and a['B']['observedClosure']==1
   kset=('mapSHA256','registeredArtSHA256','domainSHA256','physicsSHA256','raster','camera','fixedCloud','fixedGrade','rootSHA256','allOtherOmitted','rootWalk','keptWalk','physicalClosureCount')
   assert all(a['A'][k]==a['B'][k]for k in kset)
   assert z.read(f'{key}-A-geometry.json')==z.read(f'{key}-B-geometry.json')
   for kind in ('raw','dom'):
    for arm in 'AB':
     assert a[arm]['identicalImmediateReplay'][kind] is True
     assert fact(z.read(f'{key}-{arm}-{kind}.png'))==a[arm][kind]
    m=a['verification']['modes'][kind]
    assert m['strictExactProtected'] is (not expected) and m['predeclaredPriorExceptionOnly'] is True
    assert (m['changedRGBPixels'],m['outsideCount'],m['maxOutsideDN'],m['alphaChanged'])==(target['changed'],len(expected),int(bool(expected)),0)
    assert [[x['pixel'],x['delta']] for x in m['actualOutside']]==expected
    assert all(x['A'][3]==x['B'][3]==255 and [bb-aa for aa,bb in zip(x['A'],x['B'])]==x['delta'] for x in m['actualOutside'])
  assert se['files']==P['generated'] and se['zip']==P['nested'] and fact(z.read(P['innerPath']))==P['nested']
  assert g['activeAssetsAnd50MapsExact'] is g['orderedModulesExactOutsideAct5'] is True and g['mapCount']==g['assetPacketCount']==50
  assert all(len(set(g[arm])-SHELL-{MAN})==R['active'] for arm in 'AB')
  assert {y for _,y in g['allRenamedPaths']}==ADD and len(ADD)==4 and len(g['allRenamedPaths'])==4
  unchanged=g['unchangedStage23Common17'];assert unchanged=='web/runtime/ordered-common-17.08ee20a4002559b5.js' and g['A'][unchanged]==g['B'][unchanged]
  assert g['repacked']==[['web/runtime/ordered-common-18.9dcb25cd7e4ae77b.js','web/runtime/ordered-common-18.5bef8d649618eec7.js']]
  assert g['A'][MAN]=={k:R['manifest'][k] for k in ('bytes','sha256')}
  assert all({k:v[k]for k in ('bytes','sha256')}==g['B'][a]for a,v in P['generated'].items())
  inner=z.read(P['innerPath'])
 with zipfile.ZipFile(io.BytesIO(inner)) as z:
  safezip(z,P['generated'],20<<20)
  files={k:z.read(k)for k in z.namelist()}
  assert all(full(b)==P['generated'][k]for k,b in files.items())
 author=read(H,'candidate.js');assert full(author)==s['B']
 return files,author
def checkenv(root):
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_REF'],os.environ['GITHUB_EVENT_NAME'])==(P['repo'],P['qaRef'],'push')
 head=os.environ['GITHUB_SHA'];assert git(root,'rev-parse','HEAD')==head and git(root,'show','-s','--format=%P',head)==BASE
 assert git(root,'rev-parse',BASE+'^{tree}')==TREE
 assert set(git(root,'diff','--name-status','--no-renames',BASE,head).splitlines())=={'A\t'+p for p in FILES}
 assert not git(root,'status','--porcelain=v1') and all(git(root,'ls-tree',head,'--',k).startswith('100644 ')for k in FILES)
def awsafe(archive):
 assert fact(archive)==QA['outer']
 return archive
def acquire(work):
 root=Path(os.environ['GITHUB_WORKSPACE']).resolve();checkenv(root)
 def api(k):return sp.check_output(['gh','api',f"repos/{P['repo']}/{k}"],timeout=95)
 run=obj(api(f"actions/runs/{QA['run']}"));job=obj(api(f"actions/jobs/{QA['job']}"))
 assert (run['head_sha'],run['head_branch'],run['status'],run['conclusion'])==(QA['head'],QA['branch'],'completed','success')
 assert (job['run_id'],job['head_sha'],job['name'],job['status'],job['conclusion'])==(QA['run'],QA['head'],'verify','completed','success')
 c=obj(api(f"git/commits/{QA['head']}"));assert c['tree']['sha']==QA['tree'] and [p['sha']for p in c['parents']]==[BASE]
 pages=obj(api(f"actions/runs/{R['pagesRun']}"));deploy=obj(api(f"actions/jobs/{R['pagesJob']}"))
 assert (pages['head_sha'],pages['head_branch'],pages['name'],pages['conclusion'])==(BASE,'master','pages build and deployment','success')
 assert (deploy['run_id'],deploy['name'],deploy['conclusion'])==(R['pagesRun'],'deploy','success')
 assert any(x['name']=='Deploy to GitHub Pages' and x['conclusion']=='success'for x in deploy['steps'])
 x=obj(api(f"actions/artifacts/{QA['artifact']}"))
 assert (x['workflow_run']['id'],x['workflow_run']['head_sha'],x['name'],x['expired'],x['digest'],x['size_in_bytes'])==(QA['run'],QA['head'],QA['name'],False,'sha256:'+QA['outer']['sha256'],QA['outer']['bytes'])
 work.mkdir();a=awsafe(api(f"actions/artifacts/{QA['artifact']}/zip"));verified(a);(work/'visual.zip').write_bytes(a)
def policy(b,old,inputBase,when):
 """Pure canonical policy with a fresh wall clock, not a historical expiry pin."""
 cmd="""import fs from 'node:fs';
 import {graphSha256,selectPublishedGenerations} from './shared/web-retention.mjs';
 const a=JSON.parse(fs.readFileSync(0,'utf8'));
 const f={...a.incoming,graphSha256:graphSha256(a.incoming.files)};
 process.stdout.write(JSON.stringify(selectPublishedGenerations([f,...a.prior],{now:a.now})));"""
 data=json.dumps({'incoming':inputBase,'prior':old['publishedGenerations'],'now':when}).encode()
 return obj(sp.check_output(['node','--input-type=module','-e',cmd],cwd=b,input=data,timeout=60))
def assemble(work):
 assert not (os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 root=Path(os.environ['GITHUB_WORKSPACE']).resolve();checkenv(root)
 files,author=verified(read(work,'visual.zip'));b=work/'B';git(root,'worktree','add','--detach',str(b),BASE)
 assert not git(b,'status','--porcelain=v1') and git(b,'rev-parse','HEAD^{tree}')==TREE and not git(b,'branch','--show-current')
 oldRaw=read(b,MAN);assert full(oldRaw)==R['manifest']
 assert blob(read(b,RETAINER))==R['retainerGit'] and blob(read(b,POLICY))==R['policyGit'] and blob(read(b,SRC))==S['old']
 old,normal=obj(oldRaw),obj(files[MAN]);oldreg=registry(old);active=inv(normal['files']);oldactive=inv(old['files'])
 assert len(active)==len(oldactive)==R['active'] and len(oldreg)==R['registry'] and not ADD&oldreg.keys()
 assert set(active)-set(oldactive)==ADD and all(active[k]==oldreg[k]for k in set(active)&set(oldreg))
 assert BASE not in {g['sourceSha']for g in old['publishedGenerations']}
 assert all(fact(read(b,k))==v for k,v in oldreg.items())
 merged={**normal,**{k:old[k]for k in HISTORY}}
 previous={q['path']for q in old['previousFiles']}
 merged['previousFiles']=[*old['previousFiles'],*(dict(path=k,**v)for k,v in oldreg.items() if k not in active and k not in previous)]
 union={**oldreg,**{k:active[k]for k in ADD}}
 assert registry(merged)==union and len(union)==R['registry']+4
 for k,v in {SRC:author,**files}.items():
  p=b/k;assert p.parent.resolve().is_relative_to(b) and not p.is_symlink() and p.exists()==(k in MODS)
  p.write_bytes(v)
 save(b/MAN,merged)
 evidence=f"https://github.com/sys8994/honro/actions/runs/{R['pagesRun']}"
 incoming={'sourceSha':BASE,'publishedAt':R['publishedAt'],'publishedAtPrecision':'instant','publicationOrder':0,'evidence':evidence,'files':old['files']}
 nowA=int(time.time()*1000)
 applied=sp.check_output(['node',RETAINER,BASE,'--published-at',R['publishedAt'],'--evidence',evidence],cwd=b,timeout=180)
 nowB=int(time.time()*1000)
 returned=obj(applied);final=obj(read(b,MAN))
 assert returned['restored']==[] and returned['restoredBytes']==0
 assert final['publishedGenerations']==policy(b,old,incoming,nowA)==policy(b,old,incoming,nowB)
 oldg={x['sourceSha']:x for x in old['publishedGenerations']};newg={x['sourceSha']:x for x in final['publishedGenerations']}
 assert newg[BASE]['files']==old['files'] and newg[BASE]['publishedAt']==R['publishedAt'] and all(newg[k]==oldg[k]for k in oldg.keys()&newg.keys())
 assert registry(final)==union and inv(final['files'])==active and final['publishedRetention']==old['publishedRetention']
 assert {k:v for k,v in final.items()if k not in HISTORY}=={k:v for k,v in normal.items()if k not in HISTORY}
 assert all(fact(read(b,k))==v for k,v in union.items()) and all(read(b,k)==v for k,v in files.items()if k!=MAN)
 assert set(git(b,'diff','--no-renames','--name-status',BASE).splitlines())=={'M\t'+p for p in MODS}
 assert set(git(b,'ls-files','--others','--exclude-standard').splitlines())==ADD
 git(b,'add','--',*sorted(ADD|MODS))
 assert set(git(b,'diff','--cached','--name-status','--no-renames',BASE).splitlines())=={'M\t'+p for p in MODS}|{'A\t'+p for p in ADD}
 assert not git(b,'diff','--name-only') and not git(b,'ls-files','--others','--exclude-standard')
 for k in ADD|MODS:
  line=git(b,'ls-files','--stage','--',k).split()
  assert line[:3]==['100644',blob(read(b,k)),'0']
 note={'status':'EXACT_DETACHED_STAGE44_ASSEMBLY_NO_DEPLOY','base':BASE,'sources':[SRC],'approvalScope':P['scopeApproval'],'oldStrictProofStaysHold':True,'oldURLBytes':len(oldreg),'newURLBytes':len(union),'keptPublicGraphs':len(newg),'previousGraphs':len(oldg),'expiredOrDeduplicatedMetadataOnly':sorted(oldg.keys()-newg.keys()),'retentionWallClockUTC':[datetime.fromtimestamp(n/1000,timezone.utc).isoformat()for n in (nowA,nowB)],'manifest':full(read(b,MAN)),'add':sorted(ADD),'modify':sorted(MODS)}
 save(work/'ASSEMBLY.json',note);print(json.dumps(note))
if __name__=='__main__':
 a=Path(sys.argv[2]).resolve()
 if sys.argv[1]=='verify':
  fs,src=verified(a.read_bytes());print(json.dumps({'status':'VERIFIED_ARCHIVE_ONLY','normal':{k:full(b)for k,b in fs.items()},'source':full(src),'add':sorted(ADD),'modify':sorted(MODS)},indent=2))
 else:
  assert a.parent==Path(os.environ['RUNNER_TEMP']).resolve() and a.name=='stage44-root-floor-release'
  {'acquire':acquire,'assemble':assemble}[sys.argv[1]](a)
