"""Adapted exact stock/candidate split from Stage14 official capture. Never ship."""
import datetime as dt
import json,hashlib,os,re,sys,subprocess
from pathlib import Path
import wire
H=Path(__file__).resolve().parent
PINS=json.loads((H/'PINS.json').read_bytes())
B=PINS['expectedBase'];TREE=PINS['expectedBaseTree']
REF='refs/heads/qa/stage17-rebind-stage33';REPO='sys8994/honro'
ROOT=Path(os.environ.get('GITHUB_WORKSPACE','.')).resolve()
SRC='shared/data/act2/stage17-compact-package.json';MF='web/manifest.json'
OLD='1a67aaa67a107f9defce4cf3c61599e82bbca0f6';NEW='82b0ea3083bdbd1d23e5dc8127392c225c961a3e';MAN=PINS['expectedBaseManifest']['git']
QA={'.github/workflows/stage17-rebind.yml',*['tools/stage17-rebind/'+s for s in ('CANDIDATE-RECEIPT.json','SCOPE.json','PINS.json','guard.py','native.py','wire.py','park.js','observer.json','rect-atlas.js','pack.py')]}
SHELL={'HONRO.html','index.html','HONRO_WORKSHOP.html'}
PIN=wire.REC
def rd(root,p):return (root/p).read_bytes()
fact=wire.signature
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\x00'+b).hexdigest()
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a],timeout=110)
def save(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def ready():
 assert PINS['enabled'] is True,'DISABLED: Stage33 is a sealed candidate, not an authenticated current Pages release'
 p=PINS['publicPagesProof'];d=PINS['independentRootApproval']
 assert isinstance(p,dict) and type(p['run'])is int and type(p['job'])is int and type(p['publishedAt'])is str
 assert (p['head'],p['tree'],p['manifestSHA256'])==(B,TREE,PINS['expectedBaseManifest']['sha256'])
 assert d=={'decision':'ALLOW_CURRENT_STAGE17_NORMAL_REBIND_QA_ONLY','base':B,'pages':p['run'],'independentPriorEvidenceSHA256':PINS['independentFootprintDOMReceiptSHA256']}
 return p
def shape(w):
 p=ready()
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==(REPO,'push',REF)
 assert w.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
 h=os.environ['GITHUB_SHA']
 assert git(ROOT,'rev-parse','HEAD').decode().strip()==h
 assert git(ROOT,'rev-list','--parents','-n1',h).decode().split()==[h,B]
 assert git(ROOT,'rev-parse',B+'^{tree}').decode().strip()==TREE
 assert git(ROOT,'status','--porcelain=v1','-z')==b''
 assert set(git(ROOT,'diff','--no-renames','--name-status',B,h).decode().splitlines())=={'A\t'+x for x in QA}
 assert all(git(ROOT,'ls-tree',h,'--',v).decode().split()[:2]==['100644','blob']for v in QA)
 assert fact(rd(ROOT,MF))=={k:PINS['expectedBaseManifest'][k]for k in ('bytes','sha256')} and blob(rd(ROOT,MF))==MAN
 assert all(git(ROOT,'rev-parse',B+':'+k).decode().strip()==v['git']for k,v in PINS['stage33Protected'].items())
 return h,p
def verify(w):
 # Named, standard read-only API call only in the separate authority step.
 h,p=shape(w)
 assert os.getenv('GH_TOKEN') and not os.getenv('GITHUB_TOKEN')
 def gh(endpoint):return json.loads(subprocess.check_output(['gh','api',f'repos/{REPO}/'+endpoint],timeout=90))
 assert gh('git/ref/heads/master')['object']['sha']==B
 run,job=gh(f"actions/runs/{p['run']}"),gh(f"actions/jobs/{p['job']}")
 assert (run['id'],run['head_sha'],run['head_branch'],run['name'],run['conclusion'])==(p['run'],B,'master','pages build and deployment','success')
 assert run['repository']['full_name']==run['head_repository']['full_name']==REPO
 assert (job['id'],job['run_id'],job['name'],job['head_sha'],job['conclusion'])==(p['job'],p['run'],'deploy',B,'success')
 (st,)= [s for s in job['steps'] if s['name']=='Deploy to GitHub Pages']
 stamp=dt.datetime.fromisoformat(p['publishedAt'])
 assert st['conclusion']=='success' and dt.datetime.fromisoformat(st['started_at'])<=stamp<=dt.datetime.fromisoformat(job['completed_at'])+dt.timedelta(seconds=1)
 sm,sj=gh(f"actions/runs/{p['publicSmokeRun']}"),gh(f"actions/jobs/{p['publicSmokeJob']}")
 assert (sm['head_sha'],sm['head_branch'],sm['conclusion'])==('099d8f4830a629e372b57d10ce6f92fa414ed823','qa/stage33-r3-2c4-public','success')
 assert (sj['run_id'],sj['name'],sj['conclusion'])==(p['publicSmokeRun'],'stage33-anonymous','success')
 assert all(x['conclusion']=='success'for x in sj['steps'] if 3<=x['number']<=5)
 (sa,)=gh(f"actions/runs/{p['publicSmokeRun']}/artifacts")['artifacts']
 assert (sa['id'],sa['name'],sa['size_in_bytes'],sa['digest'],sa['expired'])==(p['publicSmokeArtifact'],'honro-stage33-scoped-anonymous-public-proof-only',10108561,
         'sha256:b33a3cec4c2c2d7322cd5d1dcd2b2bf166cfb6973f6c7dfe041f467928dd7f43',False)
 save(w/'out/AUTHORITY.json',{'base':B,'baseTree':TREE,'head':h,'qaTree':git(ROOT,'rev-parse',h+'^{tree}').decode().strip(),
  'qaWorkflowGit':git(ROOT,'rev-parse',h+':.github/workflows/stage17-rebind.yml').decode().strip(),
  'run':int(os.environ['GITHUB_RUN_ID']),'attempt':int(os.environ['GITHUB_RUN_ATTEMPT']),'pages':p,'manifest':PINS['expectedBaseManifest'],'scope':'QA_ONLY'})
def auth(w):
 assert not(os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 h,p=shape(w);a=json.loads(rd(w,'out/AUTHORITY.json'))
 assert (a['base'],a['head'],a['run'],a['attempt'],a['pages'],a['manifest'])==(B,h,int(os.environ['GITHUB_RUN_ID']),int(os.environ['GITHUB_RUN_ATTEMPT']),p,PINS['expectedBaseManifest'])
 return h
def splice(orig):
 assert blob(orig)==OLD and fact(orig)=={'bytes':PIN['old']['bytes'],'sha256':PIN['old']['sha']}
 a,b=(q['offset'] for q in PIN['changedOnly'])
 e=wire.stable(PIN['addedPlacement'])+b',';s=wire.stable(PIN['sourceAsset'])+b','
 out=orig[:a]+e+orig[a:b]+s+orig[b:]
 assert blob(out)==NEW and fact(out)=={'bytes':PIN['new']['bytes'],'sha256':PIN['new']['sha']}
 chk=json.loads(out);before=json.loads(orig)
 wire.validate_compact({'17':before},{'17':chk})
 return out
def pre(w):
 h=auth(w);a,b=w/'A',w/'B'
 for r in (a,b):
  git(ROOT,'worktree','add','--detach',str(r),B)
  assert git(r,'status','--porcelain=v1','-z')==b'' and blob(rd(r,MF))==MAN
 raw=rd(a,SRC);p=splice(raw);(b/SRC).write_bytes(p)
 assert git(b,'status','--porcelain=v1','-z')==(' M '+SRC+'\0').encode()
 save(w/'out/SOURCE.json',{'base':B,'tree':TREE,'head':h,'path':SRC,'A':{**fact(raw),'git':OLD},'B':{**fact(p),'git':NEW},'QAOnly':True})
def normalize(v,aliases):
 for a,b in aliases.items():
  if a==b:continue
  v=v.replace(b.encode(),a.encode()).replace(Path(b).name.encode(),Path(a).name.encode())
 return v
def compiled(w,write=True):
 auth(w);a,b=w/'A',w/'B'
 assert blob(rd(a,MF))==MAN and blob(rd(a,SRC))==OLD and rd(b,SRC)==splice(rd(a,SRC))
 assert git(a,'status','--porcelain=v1','-z')==b''
 assert git(b,'diff','--no-renames','--name-only','--','shared','game/src','game/engine','workshop/src','tests','tools').decode().splitlines()==[SRC]
 def read(r):
  obj,roles,fi=wire.read_graph(r)
  m=json.loads(rd(r,MF)); assert len(fi)==len(m['files'])==810
  active={k:{j:v[j]for j in ('sha256','bytes')}for k,v in fi.items()}
  for k,v in active.items():assert fact(rd(r,k))==v,k
  desc=next(k for k in roles if '-parts.'in k);js=next(k for k in roles if k.endswith('.js'))
  const=rd(r,js);assert const.count(('"'+desc+'"').encode())==1,'unbound loader'
  dr=json.loads(rd(r,desc));shape=[*(x['path']for x in dr['parts']),desc,js]
  return obj,shape,m,active
 ax,ar,am,ai=read(a);bx,br,bm,bi=read(b)
 assert {k:ai[k]for k in ar}==PINS['immutableStage17OldCompactChunks']
 assert {k:bi[k]for k in br}==PINS['verifiedStage17CandidateCompactChunks']
 assert all(am[k]==v for k,v in PINS['expectedBaseEntryOldRole'].items())
 for k,p in PINS['stage33Protected'].items():
  assert all(fact(rd(root,k))=={j:p[j]for j in ('bytes','sha256')}and blob(rd(root,k))==p['git']for root in (a,b)),k
  if k.startswith('web/'):assert ai[k]==bi[k]=={j:p[j]for j in ('bytes','sha256')}
 assert len(set(ai)&set(bi))==803
 compactB=bx['17']; compactA=ax['17']
 def witness(pkg):
  s=pkg['stage']
  return {'revision':pkg['mapRevision'],'width':s['width'],'height':s['height'],'status':s['metadata'].get('compactStatus'),'packageAssetIDs':[r['id']for r in pkg['assets']]}
 aw,bw=witness(compactA),witness(compactB)
 check=wire.validate_compact(ax,bx)
 corr=dict(zip(ar,br));assert len(corr)==4 and len(set(corr.values()))==4
 assert ar[-1]!=br[-1] and normalize(rd(b,br[-1]),corr)==rd(a,ar[-1])
 for role in ('gameEntry','workshopEntry','playtest'):
  x,y=(m[role].split('?')[0]for m in (am,bm));assert x not in corr;corr[x]=y
 delta={x:y for x,y in corr.items()if x!=y}
 assert set(ai)-set(bi)==set(delta) and set(bi)-set(ai)==set(delta.values())
 assert all(ai[k]==bi[k]for k in ai.keys()&bi.keys())
 for x,y in delta.items():
  if x not in ar:assert normalize(rd(b,y),corr)==rd(a,x),x
 for k in SHELL:assert normalize(rd(b,k),corr)==rd(a,k),k
 ignore={'files','previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
 assert set(am)-ignore==set(bm)-ignore
 assert all(json.loads(normalize(wire.stable(bm[k]),corr))==am[k]for k in set(am)-ignore), 'graph role outside Compact route differs'
 assert am['project']==bm['project']
 camp=json.loads(rd(a,am['project']));assert len(camp['stages'])==len(camp['stageLibraries'])==50
 def scope(r,i):return {**i,**{k:fact(rd(r,k))for k in SHELL|{MF}}}
 # Exact loaded Stage17 descriptor/map, matching build root, and active Compact checked natively.
 graph={'activeA':scope(a,ai),'activeB':scope(b,bi),'aliases':corr,'compactA':aw,'compactB':bw,'wire':check,
                         'requiredA':[am['gameEntry'],am['project'],camp['stages'][16],camp['stageLibraries'][16],*ar], 'requiredB':[bm['gameEntry'],bm['project'],camp['stages'][16],camp['stageLibraries'][16],*br], 'basis':B,'stage33ProtectedExact':PINS['stage33Protected']}
 if write:save(w/'out/GRAPH.json',graph)
 return graph
if __name__=='__main__':{'verify':verify,'pre':pre,'built':compiled}[sys.argv[1]](Path(sys.argv[2]).resolve())
