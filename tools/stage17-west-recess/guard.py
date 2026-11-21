"""Adapted exact stock/candidate split from Stage14 official capture. Never ship."""
import json,hashlib,os,re,sys,subprocess
from pathlib import Path
import wire
H=Path(__file__).resolve().parent
B='2c4e90ff24d1f5aa5d04f01317caa02f89b8194c';TREE='8d90f1fc6737adb025a5bb092b03462e283297ce'
REF='refs/heads/qa/stage17-west-recess-2c4-r2'
ROOT=Path(os.environ.get('GITHUB_WORKSPACE','.')).resolve()
SRC='shared/data/act2/stage17-compact-package.json';MF='web/manifest.json'
OLD='1a67aaa67a107f9defce4cf3c61599e82bbca0f6';NEW='82b0ea3083bdbd1d23e5dc8127392c225c961a3e';MAN='cccb5aeb0d063b1accdc01474048699e6fbb2ef5'
QA={'.github/workflows/stage17-west-recess.yml',*['tools/stage17-west-recess/'+s for s in ('CANDIDATE-RECEIPT.json','QA-POSES.json','guard.py','native.py','wire.py','frames.py','park.js','observer.json')]}
SHELL={'HONRO.html','index.html','HONRO_WORKSHOP.html'}
PIN=wire.REC
def rd(root,p):return (root/p).read_bytes()
fact=wire.signature
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\x00'+b).hexdigest()
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a],timeout=110)
def save(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def auth(w):
 assert not(os.environ.get('GH_TOKEN')or os.environ.get('GITHUB_TOKEN'))
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',REF)
 assert w.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
 h=os.environ['GITHUB_SHA']
 assert git(ROOT,'rev-list','--parents','-n1',h).decode().split()==[h,B]
 assert git(ROOT,'rev-parse',B+'^{tree}').decode().strip()==TREE
 assert git(ROOT,'status','--porcelain=v1','-z')==b''
 assert set(git(ROOT,'diff','--no-renames','--name-status',B,h).decode().splitlines())=={'A\t'+x for x in QA}
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
def compiled(w):
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
 save(w/'out/GRAPH.json',{'activeA':scope(a,ai),'activeB':scope(b,bi),'aliases':corr,'compactA':aw,'compactB':bw,'wire':check,
                         'requiredA':[am['gameEntry'],am['project'],camp['stages'][16],camp['stageLibraries'][16],*ar], 'requiredB':[bm['gameEntry'],bm['project'],camp['stages'][16],camp['stageLibraries'][16],*br]})
if __name__=='__main__':{'pre':pre,'built':compiled}[sys.argv[1]](Path(sys.argv[2]).resolve())
