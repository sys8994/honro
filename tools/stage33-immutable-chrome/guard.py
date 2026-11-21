"""Only an exact acb production build delta and genuine browser evidence yield a review-only seal."""
import os,re,hashlib,json,subprocess,sys,zipfile
from pathlib import Path
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_text())
BASE,TREE=P['base'],P['tree']
BRANCH='refs/heads/qa/stage33-immutable-clip-21809dc-r2'
SOURCE='shared/data/act4/sideview-art/33-coastal-v2.json'
LOADER='shared/act4-stage33-coastal-art.mjs'
CANON='web/manifest.json'; DOCS=('HONRO.html','HONRO_WORKSHOP.html','index.html')
MAN0=P['manifest']
ID='act4-sideview:33:coastal-v2:lowland'
DEEP='act4-sideview:33:coastal-v2:lowland-deep-strata'
AO=P['proof']['oldLowSHA'];BO=P['proof']['lowSHA']
V={'A':P['oldLowVec'],'B':P['proof']['lowVectorSHA']}
REQ={'guard.py','POSES.json','PINS.json','metrics.py','capture.py','park.js','prepare.mjs','RECIPE.json'}
FILES={'.github/workflows/stage33-immutable-chrome.yml',*(f'tools/stage33-immutable-chrome/{n}'for n in REQ)}
PACK0='web/data/chapter-33-assets.'+P['oldPack']['sha256'][:16]+'.json'
PACK1='web/data/chapter-33-assets.'+P['newPack']['sha256'][:16]+'.json'
MAP0='web/data/chapter-33.'+P['oldMap']['sha256'][:16]+'.json'
MAP1='web/data/chapter-33.'+P['newMap']['sha256'][:16]+'.json'
ROLE={'map':r'web/data/chapter-33\.[0-9a-f]{16}\.json','packet':r'web/data/chapter-33-assets\.[0-9a-f]{16}\.json','campaign':r'web/data/campaign\.[0-9a-f]{16}\.json',
 'runtime-campaign':r'web/runtime/campaign\.[0-9a-f]{16}\.js','game-js':r'web/entries/game\.[0-9a-f]{16}\.js',
 'game-html':r'web/entries/game\.[0-9a-f]{16}\.html','workshop-js':r'web/entries/workshop\.[0-9a-f]{16}\.js'}
def sha(b):return hashlib.sha256(b).hexdigest()
def facts(b):return {'bytes':len(b),'sha256':sha(b)}
def obj(x):
 def pairs(v):
  p=dict(v);assert len(p)==len(v);return p
 return json.loads(x,object_pairs_hook=pairs)
def read(r,p):
 assert not p.startswith('/') and '?' not in p and '#' not in p and '..' not in Path(p).parts
 return (r/p).read_bytes()
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a],timeout=90)
def txt(r,*a):return git(r,*a).decode().strip()
def save(p,x):
 t=p.with_suffix('.tmp');t.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n');t.replace(p)
def arms(w):
 for k in ('A','B'):
  r=w/k;assert txt(r,'rev-parse','HEAD')==BASE and not txt(r,'branch','--show-current')
  assert txt(r,'rev-parse','HEAD^{tree}')==TREE
def pre(w):
 r=Path(os.environ['GITHUB_WORKSPACE']);head=os.environ['GITHUB_SHA']
 assert (os.environ['GITHUB_REF'],os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'])==(BRANCH,'sys8994/honro','push')
 assert txt(r,'rev-list','--parents','-n1','HEAD').split()==[head,BASE]
 assert txt(r,'rev-parse',BASE+'^{tree}')==TREE and not git(r,'status','--porcelain=v1','-z')
 assert set(txt(r,'diff','--name-status','--no-renames',BASE,head).splitlines())=={'A\t'+f for f in FILES}
 assert all(txt(r,'ls-tree',head,'--',f).split()[:2]==['100644','blob']for f in FILES)
 assert facts(git(r,'show',BASE+':'+CANON))==MAN0
 for p,sha0 in ((SOURCE,P['sourceGit']),(LOADER,P['loaderGit'])):
  assert txt(r,'ls-tree',BASE,'--',p).split()[:3]==['100644','blob',sha0]
 for k in ('A','B'):git(r,'worktree','add','--detach',str(w/k),BASE)
 arms(w)
 save(w/'out'/'GATE.json',{'parent':BASE,'tree':TREE,'testHead':head,'testOnlyAdded':sorted(FILES),'scope':'not publishing; sandbox-only'})
def inventory(z):
 d={r['path']:{k:r[k]for k in ('bytes','sha256')}for r in z['files']};assert len(d)==len(z['files'])
 return d
def register(paths):
 p={}
 for f in paths:
  [k]=[k for k,q in ROLE.items() if re.fullmatch(q,f)];assert k not in p;p[k]=f
 return p
def as_old(t,aliases):
 for a,b in aliases.items():t=t.replace(b.encode(),a.encode()).replace(Path(b).name.encode(),Path(a).name.encode())
 return t
def restore(v,aliases):
 if isinstance(v,dict):return {k:restore(x,aliases)for k,x in v.items()}
 if isinstance(v,list):return [restore(x,aliases)for x in v]
 if isinstance(v,str):
  for a,b in aliases.items():
   if v==b or v.startswith(b+'?'):return a+v[len(b):]
 return v
def built(w):
 a,b=w/'A',w/'B';arms(w)
 ta=obj(read(w/'out','CANDIDATE-SOURCE.json'));assert ta=={'path':SOURCE,**P['proof']}
 assert txt(b,'hash-object',SOURCE)==P['proof']['targetGit']
 for arm,need in ((a,[]),(b,[' M '+SOURCE])):
  sc=('shared','game/src','game/engine','workshop/src','tests','tools','package.json','package-lock.json','game/package.json','game/package-lock.json')
  assert git(arm,'status','--porcelain=v1','--untracked-files=no','--',*sc).decode().splitlines()==need
 am,bm=[obj(read(r,CANON)) for r in (a,b)];ai,bi=map(inventory,(am,bm));assert facts(read(a,CANON))==MAN0
 assert all(ai[k]==v for k,v in P['currentInputs'].items())
 for r,pool in ((a,ai),(b,bi)):
  for path,info in pool.items():assert facts(read(r,path))==info,(r.name,path)
 assert all(ai[k]==bi[k]for k in ai.keys()&bi.keys())
 removed,added=sorted(ai.keys()-bi.keys()),sorted(bi.keys()-ai.keys())
 save(w/'out'/'GRAPH-OBSERVED.json',{'removed':removed,'added':added,'same':len(ai.keys()&bi.keys())})
 ar,br=register(removed),register(added); assert ar.keys()==br.keys()==ROLE.keys()
 ab={ar[k]:br[k] for k in ROLE}
 assert ar['packet']==PACK0 and br['packet']==PACK1 and ai[PACK0]==P['oldPack'] and bi[PACK1]==P['newPack']
 assert ar['map']==MAP0 and br['map']==MAP1 and ai[MAP0]==P['oldMap'] and bi[MAP1]==P['newMap']
 assert ar['campaign']==P['oldCampaign']
 with (w/'out'/'WIRE-RECEIPT.json').open('w') as f:
  subprocess.run(['node',str(D/'prepare.mjs'),'wire',str(w),PACK0,PACK1,MAP0,MAP1],check=True,timeout=120,stdout=f)
 for k in ('runtime-campaign','game-js','game-html','workshop-js'):
  assert read(a,ar[k])==as_old(read(b,br[k]),ab),('alias body beyond exact binding',k)
 for p in DOCS:assert read(a,p)==as_old(read(b,p),ab),('stable shell changed beyond reference',p)
 for k in ('project','playtest','gameEntry','workshopEntry','common','gameOnly','optionalModules','styles'):
  assert am[k]==restore(bm[k],ab),('runtime graph',k)
 ac,bc=obj(read(a,ar['campaign'])),obj(read(b,br['campaign']))
 assert all(len(p)==50 for c in (ac,bc) for p in (c['stages'],c['stageLibraries']))
 assert ac['stageLibraries'][32]==PACK0 and bc['stageLibraries'][32]==PACK1
 assert ac['stages'][32]==MAP0 and bc['stages'][32]==MAP1
 assert ac['assetEncodings']['stageLibraries'][32]==bc['assetEncodings']['stageLibraries'][32]=='json'
 order=bc['libraryOrder'];assert order.count(DEEP)==order.count(ID)==1 and order.index(DEEP)+1==order.index(ID)
 compare=restore(bc,{MAP0:MAP1,PACK0:PACK1})
 assert {**compare,'libraryOrder':[x for x in order if x!=DEEP]}==ac,'campaign envelope beyond exactly one art registration'
 def arm(paths,r,mi,inv,n):
  q=obj(read(r,paths['campaign']))
  fixed=['web/data/campaign-base.0c57dcfe7c08d421.json','web/data/campaign-shared.8f8343b5c21518d4.json','web/runtime/load-data.248fb3aada6f16bb.js']
  need=[paths['map'],*fixed,paths['campaign'],paths['packet'],paths['runtime-campaign'],mi['gameEntry']]
  assert q['base']==fixed[0] and q['shared']==fixed[1] and set(need)<=set(inv)
  return {'origin':f'http://127.0.0.1:{18961+n}/','manifest':facts(read(r,CANON)),'shell':facts(read(r,'HONRO.html')),'active':inv,
   'needs':need,'ownerSHA':AO if n==0 else BO,'vectorSHA':V[r.name],'packet':paths['packet'],'expectDeep':bool(n),'deepSHA':P['proof']['deepSHA'],'deepVectorSHA':P['proof']['deepVectorSHA']}
 save(w/'out'/'GRAPH.json',{'A':arm(ar,a,am,ai,0),'B':arm(br,b,bm,bi,1)})
 save(w/'out'/'GRAPH-DELTA.json',{'sourceOnly':SOURCE,'aliases':ab,'otherMapsExact':49,'otherPacketsExact':49,'allSharedActiveExact':len(ai.keys()&bi.keys()),'scope':'diagnostic output only, never bundling a product artefact'})
if __name__=='__main__':
 w=Path(sys.argv[2]).resolve(); root=Path(os.environ['RUNNER_TEMP']).resolve()
 assert w!=root and w.is_relative_to(root)
 {'pre':pre,'built':built}[sys.argv[1]](w)
