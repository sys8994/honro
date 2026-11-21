"""Only an exact acb production build delta and genuine browser evidence yield a review-only seal."""
import os,re,hashlib,json,subprocess,sys,zipfile
from pathlib import Path
BASE='acb51f4ee1c5afa90751dc256d6ad8d900732779'
TREE='5cc36cfd7ef62fc801dc967605260610596d8061'
R1='573c5b734b6693e10f1b86c8988866cbd3eb8a05'
BRANCH='refs/heads/qa/stage33-warm-lowland-acb-r2'
R2_EDITS={'.github/workflows/stage33-warm-lowland.yml','tools/stage33-warm-normal/capture.py','tools/stage33-warm-normal/guard.py'}
D=Path(__file__).resolve().parent
FILES={'.github/workflows/stage33-warm-lowland.yml',*(f'tools/stage33-warm-normal/{p.name}'for p in D.iterdir() if p.is_file() and p.suffix in ('.py','.mjs','.js','.json'))}
REQ={'guard.py','POSES.json','metrics.py','capture.py','park.js','prepare.mjs','RECIPE.json','signed-apply.mjs'}
SOURCE='shared/data/act4/sideview-art/33-coastal-v2.json'
OLDG='c9c204a0daefb790309b3c7d0917c3e34acf7708'
LOADER='shared/act4-stage33-coastal-art.mjs'
LOADERG='44ffc2a09b5fa6f777498c80072571835dbff66b'
CANON='web/manifest.json'; DOCS=('HONRO.html','HONRO_WORKSHOP.html','index.html')
MAN0={'bytes':6458505,'sha256':'e274ee2d3dbfee5ce35dfccd6055bfa1a898e3804bde80b687fd49f890c4079b'}
PACK0='web/data/chapter-33-assets.4b5df185aa59eb42.json'
PACK1='web/data/chapter-33-assets.0746baae59d383dd.json'
BPACK={'bytes':2842017,'sha256':'0746baae59d383ddfbbfc281bdefeadd4631a9b0d2e1b358fcc41e278cd0f4ac'}
MAP='web/data/chapter-33.a7ce91b7d78fb5f8.json'
MAPFACT={'bytes':34011,'sha256':'a7ce91b7d78fb5f8b0b27a4ea42ce6cf4f54d98556c43176beb87a0789573a5a'}
ID='act4-sideview:33:coastal-v2:lowland'
AO='77e3058c6faead40c865a3264065b8ed81d08c79609e21419e96aea6bd395fe7'
BO='08925f1831abc81bc315c221bef566ebc97d4498f0ce5008e66b0067a0ccba26'
V={'A':'1c376a45daee569c54213d81e44aa24d4044d7476db7373de603240c32007354','B':'a5f49d15fc3a01abb8690d518b24674c4ad97ed6f0a6716ba31ba657d0b83b6d'}
ROLE={'packet':r'web/data/chapter-33-assets\.[0-9a-f]{16}\.json','campaign':r'web/data/campaign\.[0-9a-f]{16}\.json',
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
 r=Path(os.environ['GITHUB_WORKSPACE']);head=os.environ['GITHUB_SHA'];scope={f.rsplit('/',1)[-1]for f in FILES if '/stage33-warm-normal/'in f}
 assert scope==REQ
 assert (os.environ['GITHUB_REF'],os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'])==(BRANCH,'sys8994/honro','push')
 assert txt(r,'rev-list','--parents','-n1','HEAD').split()==[head,R1]
 assert txt(r,'rev-list','--parents','-n1',R1).split()==[R1,BASE]
 assert txt(r,'rev-parse',BASE+'^{tree}')==TREE and not git(r,'status','--porcelain=v1','-z')
 assert set(txt(r,'diff','--name-status','--no-renames',BASE,R1).splitlines())=={'A\t'+f for f in FILES}
 assert set(txt(r,'diff','--name-status','--no-renames',R1,head).splitlines())=={'M\t'+f for f in R2_EDITS}
 assert all(git(r,'show',R1+':'+f)==git(r,'show',head+':'+f)for f in FILES-R2_EDITS)
 assert all(txt(r,'ls-tree',head,'--',f).split()[:2]==['100644','blob']for f in FILES)
 assert facts(git(r,'show',BASE+':'+CANON))==MAN0
 for p,sha0 in ((SOURCE,OLDG),(LOADER,LOADERG)):
  assert txt(r,'ls-tree',BASE,'--',p).split()[:3]==['100644','blob',sha0]
 for k in ('A','B'):git(r,'worktree','add','--detach',str(w/k),BASE)
 arms(w)
 save(w/'out'/'GATE.json',{'parent':BASE,'tree':TREE,'testHead':head,'firstFrameFailedHead':R1,'testOnlyModified':sorted(R2_EDITS),'baseAuthorityNine':sorted(FILES),'status':'SCOPED_ONLY'})
def inventory(z):
 d={r['path']:{k:r[k]for k in ('bytes','sha256')}for r in z['files']};assert len(d)==len(z['files'])==810
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
 ta=obj(read(w/'out','CANDIDATE-SOURCE.json'));assert (ta['path'],ta['oldGit'],ta['ownerA'],ta['ownerB'])==(SOURCE,OLDG,AO,BO)
 assert txt(b,'hash-object',SOURCE)==ta['newGit']
 for arm,need in ((a,[]),(b,[' M '+SOURCE])):
  sc=('shared','game/src','game/engine','workshop/src','tests','tools','package.json','package-lock.json','game/package.json','game/package-lock.json')
  assert git(arm,'status','--porcelain=v1','--untracked-files=no','--',*sc).decode().splitlines()==need
 am,bm=[obj(read(r,CANON)) for r in (a,b)];ai,bi=map(inventory,(am,bm));assert facts(read(a,CANON))==MAN0
 for r,pool in ((a,ai),(b,bi)):
  for path,info in pool.items():assert facts(read(r,path))==info,(r.name,path)
  assert facts(read(r,MAP))==MAPFACT
 assert all(ai[k]==bi[k]for k in ai.keys()&bi.keys())
 ar,br=register(ai.keys()-bi.keys()),register(bi.keys()-ai.keys()); assert ar.keys()==br.keys()==ROLE.keys()
 ab={ar[k]:br[k] for k in ROLE}
 save(w/'out'/'GRAPH-OBSERVED.json',{'A':{k:{'path':p,**ai[p]}for k,p in ar.items()},'B':{k:{'path':p,**bi[p]}for k,p in br.items()},
        'unchanged':len(ai.keys()&bi.keys()),'scope':'pre wire gate; never release proof'})
 assert ar['packet']==PACK0 and br['packet']==PACK1 and bi[PACK1]==BPACK
 subprocess.run(['node',str(D/'prepare.mjs'),'wire',str(w),PACK0,PACK1],check=True,timeout=120)
 for k in ('runtime-campaign','game-js','game-html','workshop-js'):
  assert read(a,ar[k])==as_old(read(b,br[k]),ab),('alias body beyond exact binding',k)
 for p in DOCS:assert read(a,p)==as_old(read(b,p),ab),('stable shell changed beyond reference',p)
 for k in ('project','playtest','gameEntry','workshopEntry','common','gameOnly','optionalModules','styles'):
  assert am[k]==restore(bm[k],ab),('runtime graph',k)
 ac,bc=obj(read(a,ar['campaign'])),obj(read(b,br['campaign']))
 assert len(ac['stages'])==len(ac['stageLibraries'])==50
 assert ac['stageLibraries'][32]==PACK0 and bc['stageLibraries'][32]==PACK1
 assert ac['assetEncodings']['stageLibraries'][32]==bc['assetEncodings']['stageLibraries'][32]=='json'
 assert {**bc,'stageLibraries':[PACK0 if i==32 else p for i,p in enumerate(bc['stageLibraries'])]}==ac
 for i in range(50):assert ac['stages'][i]==bc['stages'][i]
 xa,xb=map(obj,(read(a,PACK0),read(b,PACK1)));[i]=[i for i,x in enumerate(xa)if x['id']==ID]
 assert xb[i]['id']==ID and xa[:i]+xa[i+1:]==xb[:i]+xb[i+1:]
 for p in ('collision','anchor','reference','params','id','visual','sockets'):assert xa[i][p]==xb[i][p]
 def arm(paths,r,mi,inv,n):
  q=obj(read(r,paths['campaign']))
  fixed=['web/data/campaign-base.0c57dcfe7c08d421.json','web/data/campaign-shared.8f8343b5c21518d4.json','web/runtime/load-data.248fb3aada6f16bb.js']
  need=[MAP,*fixed,paths['campaign'],paths['packet'],paths['runtime-campaign'],mi['gameEntry']]
  assert q['base']==fixed[0] and q['shared']==fixed[1] and set(need)<=set(inv)
  return {'origin':f'http://127.0.0.1:{18961+n}/','manifest':facts(read(r,CANON)),'shell':facts(read(r,'HONRO.html')),'active':inv,
   'needs':need,'ownerSHA':AO if n==0 else BO,'vectorSHA':V[r.name],'packet':paths['packet']}
 save(w/'out'/'GRAPH.json',{'A':arm(ar,a,am,ai,0),'B':arm(br,b,bm,bi,1)})
 save(w/'out'/'GRAPH-DELTA.json',{'sourceOnly':SOURCE,'aliases':ab,'mapsExact':50,'otherPacketsExact':49,'allSharedActiveExact':len(ai.keys()&bi.keys())})
def archive(w):
 out=w/'out'; r=w/'B';proof=obj(read(out,'RECEIPT.json'))
 assert proof['status']=='PASS_EXACT_STAGE33_NORMAL_PIXEL_SCOPE_PENDING_HUMAN' and len(proof['frames'])==16 and len(proof['comparisons'])==8
 assert all(c[k]['strict']for c in proof['comparisons'].values()for k in ('raw','dom'))
 captured=set()
 for f in proof['frames'].values():
  for k in ('raw','dom'):
   name=f[k];assert name not in captured and re.fullmatch(r'[AB]-s33-\d+x\d+-(north|south|southwest|southeast)-(raw|dom)\.png',name)
   assert sha(read(out,name))==f[k+'SHA256'];captured.add(name)
 assert len(captured)==32
 a=obj(read(out,'GRAPH.json'))['B'];d=obj(read(out,'GRAPH-DELTA.json')); s=obj(read(out,'CANDIDATE-SOURCE.json'))
 aliases=set(d['aliases'].values()); ps=sorted(aliases|set(DOCS)|{CANON});assert len(ps)==10 and PACK1 in aliases
 dest=out/'B-review-only';dest.mkdir(); z=dest/'B-exact-generated-review-only.zip';files={}
 with zipfile.ZipFile(z,'x',compression=zipfile.ZIP_DEFLATED)as pack:
  for p in ps:
   data=read(r,p);files[p]=facts(data)
   if p in aliases:assert files[p]==a['active'][p]
   if p==CANON:assert files[p]==a['manifest']
   if p=='HONRO.html':assert files[p]==a['shell']
   pack.writestr(p,data)
 with zipfile.ZipFile(z)as pk:assert pk.testzip()is None and set(pk.namelist())==set(ps)
 save(dest/'SEAL.json',{'scope':'Unpublished normal QA only; no retention/no deploy','sourceGit':s['newGit'],'files':files,
   'zip':facts(z.read_bytes()),'actualReceipt':facts(read(out,'RECEIPT.json')),'graph':facts(read(out,'GRAPH.json')),
   'recipe':{p:facts(read(D,p))for p in ('prepare.mjs','RECIPE.json','signed-apply.mjs')}})
if __name__=='__main__':
 w=Path(sys.argv[2]).resolve(); root=Path(os.environ['RUNNER_TEMP']).resolve()
 assert w!=root and w.is_relative_to(root)
 {'pre':pre,'built':built,'archive':archive}[sys.argv[1]](w)
