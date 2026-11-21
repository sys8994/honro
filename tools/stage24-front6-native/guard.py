"""Audit one detached Stage24 product-art perturbation; never runtime patch/public site."""
import os, re, hashlib, json, subprocess, sys, zipfile
from pathlib import Path
BASE='b79ea7fd87fda5586d78eae0a7052996b8e71fb5'
TREE='1e55d910bbabc43919c20a14d1a06002b20f4977'
BRANCH='refs/heads/qa/stage24-front6-side-face-b79-r2'
DIR='tools/stage24-front6-native/'
FILES={'.github/workflows/stage24-front6-side-face.yml',*(DIR+k for k in ('guard.py','prepare.mjs','capture.py','POSES.json'))}
SOURCE={'shared/data/campaign.json','tools/map-forge/stage24-family-compound.mjs'}
CANON='web/manifest.json'; DOCS=('HONRO.html','HONRO_WORKSHOP.html','index.html')
MAN0={'bytes':6774523,'sha256':'0bf1527b6aa52fa5f4f22eb1b90102df5f1c6ea0cb791d664b1b94081c1b65cf'}
PACK0='web/data/chapter-24-assets.9da653528c6235b1.json'
PACK1='web/data/chapter-24-assets.ce7ebb4afb9889f8.json'
HASH1='ce7ebb4afb9889f8a428bb29bc19aac6c1ce036b85ad3bea2747e7f1e150954f'
VEC1='a1c2cd901cb96494d00542fc4dca168cc80fa838c100b3d326e24a96274247b5'
ID='family24:retaining-earth-faces'
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
def save(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def arms(w):
 for k in ('A','B'):
  r=w/k;assert git(r,'rev-parse','HEAD').decode().strip()==BASE and not git(r,'branch','--show-current').strip()
  assert git(r,'rev-parse','HEAD^{tree}').decode().strip()==TREE
def pre(w):
 r=Path(os.environ['GITHUB_WORKSPACE']);head=os.environ['GITHUB_SHA']
 assert os.environ['GITHUB_REF']==BRANCH and os.environ['GITHUB_REPOSITORY']=='sys8994/honro'
 assert w.resolve().is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
 assert git(r,'rev-list','--parents','-n1','HEAD').decode().split()==[head,BASE]
 assert git(r,'rev-parse',BASE+'^{tree}').decode().strip()==TREE
 assert git(r,'status','--porcelain=v1','-z')==b''
 assert set(git(r,'diff','--name-status','--no-renames',BASE,head).decode().splitlines())=={'A\t'+f for f in FILES}
 for f in FILES:
  row=git(r,'ls-tree',head,'--',f).decode().split()
  assert row[:2]==['100644','blob'],(f,row)
 assert facts(git(r,'show',BASE+':'+CANON))==MAN0
 for k in ('A','B'):git(r,'worktree','add','--detach',str(w/k),BASE)
 arms(w)
 save(w/'out'/'GATE.json',{'parent':BASE,'tree':TREE,'testHead':head,'addOnly':sorted(FILES),'scope':'no app state beyond same clean diagnostic Stage24 launcher and allowed camera parking; exact temporary canonical authored-source diff'})
def inventory(z):
 out={r['path']:{k:r[k]for k in ('bytes','sha256')}for r in z['files']}
 assert len(out)==len(z['files'])==810
 return out
def role(path):
 for k,q in [('packet',r'web/data/chapter-24-assets\.[\da-f]{16}\.json'),
  ('campaign',r'web/data/campaign\.[\da-f]{16}\.json'),('campaign-js',r'web/runtime/campaign\.[\da-f]{16}\.js'),
  ('game-js',r'web/entries/game\.[\da-f]{16}\.js'),('game-html',r'web/entries/game\.[\da-f]{16}\.html'),
  ('workshop-js',r'web/entries/workshop\.[\da-f]{16}\.js')]:
  if re.fullmatch(q,path):return k
 raise AssertionError(('unexpected changed released alias',path))
def register(paths):
 p={}
 for x in paths:
  k=role(x);assert k not in p;p[k]=x
 return p
def as_old(t,aliases):
 for a,b in aliases.items():
  t=t.replace(b.encode(),a.encode()).replace(Path(b).name.encode(),Path(a).name.encode())
 return t
def restore(v,aliases):
 if isinstance(v,dict):return {k:restore(x,aliases) for k,x in v.items()}
 if isinstance(v,list):return [restore(x,aliases) for x in v]
 if isinstance(v,str):
  for a,b in aliases.items():
   if v==b or v.startswith(b+'?'):return a+v[len(b):]
 return v
def built(w):
 a,b=w/'A',w/'B';arms(w)
 src=obj(read(w/'out','CANDIDATE-SOURCE.json'))
 assert src['registeredVectorHash']==VEC1 and set(src['after'])==SOURCE
 for f,v in src['after'].items():assert git(b,'hash-object',f).decode().strip()==v
 scoped=('shared','game/engine','game/src','tests','tools','workshop/src','package.json','package-lock.json','game/package.json','game/package-lock.json')
 assert not git(a,'status','--porcelain=v1','-z','--',*scoped)
 assert set(git(b,'status','--porcelain=v1','--untracked-files=no','--',*scoped).decode().splitlines())=={' M '+p for p in SOURCE}
 am,bm=[obj(read(r,CANON)) for r in (a,b)]; ai,bi=map(inventory,(am,bm))
 assert facts(read(a,CANON))==MAN0
 for root,pool in ((a,ai),(b,bi)):
  for path,info in pool.items():assert facts(read(root,path))==info,(root.name,path)
 assert all(ai[k]==bi[k] for k in ai.keys()&bi.keys())
 ar,br=register(ai.keys()-bi.keys()),register(bi.keys()-ai.keys())
 assert ar.keys()==br.keys()=={'packet','campaign','campaign-js','game-js','game-html','workshop-js'},(ar,br)
 ab={ar[k]:br[k] for k in ar}
 assert ar['packet']==PACK0 and br['packet']==PACK1 and bi[PACK1]=={'bytes':490927,'sha256':HASH1}
 for k in ('campaign-js','game-js','game-html','workshop-js'):
  assert read(a,ar[k])==as_old(read(b,br[k]),ab),('alias body beyond binding',k)
 for p in DOCS:assert read(a,p)==as_old(read(b,p),ab),('wrong stable shell',p)
 for k in ('project','playtest','gameEntry','workshopEntry','common','gameOnly','optionalModules','styles'):
  assert am[k]==restore(bm[k],ab),('module graph',k)
 ac,bc=obj(read(a,ar['campaign'])),obj(read(b,br['campaign']))
 assert len(ac['stages'])==len(ac['stageLibraries'])==50
 assert ac['assetEncodings']['stageLibraries'][23]==bc['assetEncodings']['stageLibraries'][23]=='json'
 assert ac['stageLibraries'][23]==PACK0 and bc['stageLibraries'][23]==PACK1
 assert {**bc,'stageLibraries':[PACK0 if i==23 else p for i,p in enumerate(bc['stageLibraries'])]}==ac
 xa,xb=map(obj,(read(a,PACK0),read(b,PACK1))); i=next(i for i,v in enumerate(xa) if v['id']==ID)
 assert xb[i]['id']==ID and xb[i]['vector']==src['registeredVector']
 assert {**xb[i],'vector':xa[i]['vector']}==xa[i]
 assert xb[:i]+[xa[i]]+xb[i+1:]==xa
 save(w/'out'/'GRAPH.json',{r.name:{'origin':f'http://127.0.0.1:{18861+n}/','manifest':facts(read(r,CANON)),'shell':facts(read(r,'HONRO.html')),'active':v,
      'paths':{'project':(am if n==0 else bm)['project'],'entry':(am if n==0 else bm)['gameEntry'],'packet':(PACK0 if n==0 else PACK1),'campaignJS':(ar if n==0 else br)['campaign-js']}} for n,(r,v) in enumerate(((a,ai),(b,bi)))})
 save(w/'out'/'GRAPH-DELTA.json',{'sourceOnlyTwo':sorted(SOURCE),'aliases':ab,'allStageMaps':50,'otherAssetPackets':49,'activeFiles':810,'sharedActiveExact':len(ai.keys()&bi.keys()),'scope':'No publication. Reuse normal compiler and original aliases; no derived source committed.'})
def archive(w):
 out=w/'out'; arm=w/'B'; status=obj(read(out,'RECEIPT.json'))
 assert status['status']=='PASS_EXACT_STAGE24_VISUAL_SCOPE_AND_CONTRAST_PENDING_HUMAN_REVIEW'
 assert len(status['frames'])==20 and len(status['comparisons'])==10 and all(v['status']=='CAPTURED' for v in status['visits'])
 assert all(c[k]['strict'] for c in status['comparisons'].values() for k in ('raw','dom'))
 graph=obj(read(out,'GRAPH.json'))['B']; delta=obj(read(out,'GRAPH-DELTA.json'))
 source=obj(read(out,'CANDIDATE-SOURCE.json')); assert set(source['after'])==SOURCE
 assert facts(read(arm,CANON))==graph['manifest']
 aliases=set(delta['aliases'].values());assert len(aliases)==6 and PACK1 in aliases
 armfiles=sorted(aliases|set(DOCS)|{CANON});assert len(armfiles)==10
 pack=out/'B-verified-normal-delta-review-only';pack.mkdir()
 z=pack/'B-exact-normal-generated-review-only.zip'; files={}
 with zipfile.ZipFile(z,'x',compression=zipfile.ZIP_DEFLATED) as outz:
  for f in armfiles:
   b=read(arm,f); files[f]=facts(b)
   if f in aliases:assert files[f]==graph['active'][f]
   if f=='HONRO.html':assert files[f]==graph['shell']
   outz.writestr(f,b)
 with zipfile.ZipFile(z) as zin:assert zin.testzip() is None and set(zin.namelist())==set(armfiles)
 p=Path(__file__).resolve().parent/'prepare.mjs'
 save(pack/'SEAL.json',{'scope':'review-only normal evidence; no release manifest retention adjustment or deploy; no canonical source duplicate',
  'files':files,'zip':facts(z.read_bytes()),'authoringAfterGit':source['after'],'authoredFrom':source['old'],
  'sourceRecipe':facts(p.read_bytes()),'proof':facts(read(out,'RECEIPT.json')),'graph':facts(read(out,'GRAPH.json'))})
if __name__=='__main__':globals()[sys.argv[1]](Path(sys.argv[2]))
