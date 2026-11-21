"""No release/write authority: exact old detached app and normal candidate graph."""
import hashlib,json,os,re,subprocess,sys,zipfile
from pathlib import Path
T=Path(__file__).resolve().parent
P=json.loads((T/'PINS.json').read_bytes())
PRODUCT=P['product']; A=P['authority']['release']; B=PRODUCT['commit']
REF='refs/heads/qa/stage21-west-bedrock-normal-9ac'; DIR='tools/stage21-r1-normal-qa'
FILES={'.github/workflows/stage21-r1-normal-qa.yml',*(DIR+'/'+f for f in ('PINS.json','guard.py','capture.py','native-witness.js'))}
SHELLS=['HONRO.html','HONRO_WORKSHOP.html','index.html']
M='web/manifest.json'
def sha(x):return hashlib.sha256(x).hexdigest()
def facts(b):return {'bytes':len(b),'sha256':sha(b)}
def save(dest,name,x): (dest/name).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def read(r,rel):
 assert not rel.startswith('/') and '..' not in Path(rel).parts and '?' not in rel and '#' not in rel
 return (r/rel).read_bytes()
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a])
def required(s):
 return set(P['required'])
def required_observed(s):
 return required(s)-{'web/runtime/shared-runtime-skill-preview.0873a72c3e01c88c.js','web/runtime/shared-runtime-training.84c5e6034d5b7c0b.js','web/manifest.json'}
def guard_arm(r,rev):
 assert git(r,'rev-parse','HEAD').decode().strip()==rev and not git(r,'branch','--show-current').strip()
 assert git(r,'status','--porcelain=v1','-z','--','shared','game/engine','game/src','tests','tools','workshop/src','package.json','package-lock.json','game/package.json','game/package-lock.json')==b'',('build mutated author',rev)
def pre(w):
 r=Path(os.environ['GITHUB_WORKSPACE']); head=os.environ['GITHUB_SHA']
 assert os.environ['GITHUB_REF']==REF and os.environ['GITHUB_REPOSITORY']=='sys8994/honro'
 assert git(r,'rev-list','--parents','-n1','HEAD').decode().split()==[head,B]
 assert git(r,'rev-list','--parents','-n1',B).decode().split()==[B,A]
 assert git(r,'rev-parse',A+'^{tree}').decode().strip()==P['authority']['tree']
 assert git(r,'rev-parse',B+'^{tree}').decode().strip()==PRODUCT['tree']
 assert git(r,'status','--porcelain=v1','-z')==b''
 assert set(git(r,'diff','--name-status','--no-renames',B,head).decode().splitlines())=={'A\t'+f for f in FILES}
 assert set(git(r,'diff','--name-status','--no-renames',A,B).decode().splitlines())=={'M\tshared/runtime/act3-handoff-art.js','A\ttests/stage21-west-bedrock-source.mjs'}
 for k,v in PRODUCT['next'].items():
  assert git(r,'rev-parse',B+':'+k).decode().strip()==v['git']
  assert sha(git(r,'show',B+':'+k))==v['sha256']
 for k,v in PRODUCT['immutableCanonicalSource'].items():
  old,new=(git(r,'show',c+':'+k) for c in (A,B))
  assert old==new and facts(old)=={q:v[q] for q in ('bytes','sha256')},k
 assert facts(git(r,'show',A+':'+M))==P['manifest']
 for side,rev in [('A',A),('B',B)]:
  git(r,'worktree','add','--detach',str(w/side),rev);guard_arm(w/side,rev)
 save(w/'out','SOURCE.json',{'base':A,'candidate':B,'candidateTree':PRODUCT['tree'],'transport':head,'source':PRODUCT})
def inventory(m):
 x={f['path']:{k:f[k] for k in ('bytes','sha256')} for f in m['files']}
 assert len(x)==len(m['files']);return x
def role(p):
 for k,x in [('common',r'web/runtime/ordered-common-(\d+)\.[\da-f]{16}\.js'),
             ('game-js',r'web/entries/game\.[\da-f]{16}\.js'),
             ('game-html',r'web/entries/game\.[\da-f]{16}\.html'),
             ('workshop-js',r'web/entries/workshop\.[\da-f]{16}\.js')]:
  m=re.fullmatch(x,p)
  if m:return 'common-'+m[1] if k=='common' else k
 raise AssertionError(('unexpected generated path',p))
def reg(paths):
 out={}
 for p in paths:
  k=role(p);assert k not in out;out[k]=p
 return out
def normalize(text,mapping):
 for k,v in sorted(mapping.items()):
  text=text.replace(v.encode(),k.encode())
  text=text.replace(Path(v).name.encode(),Path(k).name.encode())
 return text
def ordered(data):
 header, tail=data.split(b';',1)
 assert re.fullmatch(rb'import\{yieldIfNeeded\}from"\./load-data\.[\da-f]{16}\.js"',header)
 sep=b'await yieldIfNeeded();'
 parts=tail.split(sep)
 assert len(parts)>1 and parts.pop().strip()==b''
 assert all(x.lstrip().startswith(b'(()=>{"use strict";') and x.rstrip().endswith(b'})();') for x in parts)
 return header,[x.strip() for x in parts]
def built(w):
 a,b=w/'A',w/'B';guard_arm(a,A);guard_arm(b,B)
 am,bm=[json.loads(read(r,M)) for r in (a,b)]; aa,ba=[inventory(m) for m in (am,bm)]
 assert facts(read(a,M))==P['manifest'] and len(aa)==len(ba)==810
 for r,active in [(a,aa),(b,ba)]:
  for p,v in active.items():assert facts(read(r,p))==v,('registered bytes',r.name,p)
 assert all(aa[p]==ba[p] for p in aa.keys()&ba.keys())
 ga,gb=reg(aa.keys()-ba.keys()),reg(ba.keys()-aa.keys())
 assert ga.keys()==gb.keys() and set(ga)-{'game-js','game-html','workshop-js'}=={'common-17'},(ga,gb)
 aliases={v:gb[k] for k,v in ga.items()}
 assert set(ga)=={'common-17','game-js','game-html','workshop-js'},ga
 H1,W1=ordered(read(a,ga['common-17']));H2,W2=ordered(read(b,gb['common-17']))
 assert H1==H2 and len(W1)==len(W2)
 index=[i for i,(old,new) in enumerate(zip(W1,W2)) if old!=new]
 assert len(index)==1
 old,new=W1[index[0]],W2[index[0]]
 assert b'act3-handoff:26:kiln-foundation' in old and b'act3-handoff:26:kiln-foundation' in new
 assert b'eup21:foundations' not in old and b'eup21:foundations' in new and b'upper-split-return' in new
 for k in ('game-js','game-html','workshop-js'):
  assert read(a,ga[k])==normalize(read(b,gb[k]),aliases),('entry pointer-only normalization',k)
 for path in SHELLS:
  assert read(a,path)==normalize(read(b,path),aliases),('stable shell pointer-only normalization',path)
 for k in ('gameEntry','workshopEntry','common','gameOnly','optionalModules','styles','project'):
  def expand(v):
   if isinstance(v,dict):return {k:expand(x) for k,x in v.items()}
   if isinstance(v,list):return [expand(x) for x in v]
   return {v:k for k,v in aliases.items()}.get(v,v)
  assert am[k]==expand(bm[k]),('registered module graph',k)
 assert read(a,am['project'])==read(b,bm['project'])
 c=json.loads(read(a,am['project']));assert len(c['stages'])==len(c['stageLibraries'])==50
 for p in [c['base'],c['shared'],*c['stages'],*c['stageLibraries']]:assert aa[p]==ba[p]
 save(w/'out','GRAPH.json',{'A':{'origin':'http://127.0.0.1:18841/','manifest':facts(read(a,M)),'shell':facts(read(a,'HONRO.html')),'active':aa},
   'B':{'origin':'http://127.0.0.1:18842/','manifest':facts(read(b,M)),'shell':facts(read(b,'HONRO.html')),'active':ba},
   'aliases':aliases,'chapter21Index':20,'chapter26Index':25,'campaignManifest':facts(read(a,am['project'])),
   'normalBodyOnly':{'wrapperIndex':index[0],'before':facts(old),'after':facts(new)},
   'noneOf50ChapterMapOrAssetPacketsChanged':True,'stableSource':PRODUCT['immutableCanonicalSource']})
def archive(w):
 x=json.loads(read(w/'out','proof.json'));assert x['complete'] and x['oldSave']['verified'] and x['stage26Control']['verified']
 g=json.loads(read(w/'out','GRAPH.json')); b=w/'B'
 with zipfile.ZipFile(w/'out'/'B-EXACT-NORMAL-GENERATED-DELTA-NOT-DEPLOYED.zip','w',compression=zipfile.ZIP_DEFLATED) as z:
  for p in sorted({*g['aliases'].values(),*SHELLS,M}):
   v=read(b,p)
   if p in g['B']['active']:assert facts(v)==g['B']['active'][p]
   z.writestr(p,v)
if __name__=='__main__':
 globals()[sys.argv[1]](Path(sys.argv[2]))
