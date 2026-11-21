"""Exact compiled candidate B against tracked active A. No output for publishing."""
import hashlib,json,os,re,sys,subprocess
from pathlib import Path
Q=Path(__file__).resolve().parent; P=json.loads((Q/'PINS.json').read_bytes())
W=Path(sys.argv[2]);OUT=W/'out'
MF='web/manifest.json'; SHELL={'HONRO.html','HONRO_WORKSHOP.html','index.html'}
BASE=P['base']; TREE=P['tree']; CAND=P['sourceCommit']; CTREE=P['sourceTree']
QA={'.github/workflows/stage7-root-floor-closure.yml',*(f'tools/stage7-root-floor-closure/{k}'for k in ('PINS.json','entry.json','guard.py','views.py'))}
PROD=P['productGit']; BR='refs/heads/qa/stage7-root-floor-closure-9ac-r2'
R1='b86d5c9bd0f5bb4933337162fd94d4e711571f50'
R2_SCOPE={'.github/workflows/stage7-root-floor-closure.yml','tools/stage7-root-floor-closure/guard.py','tools/stage7-root-floor-closure/views.py'}
UNCHANGED={'tools/stage7-root-floor-closure/PINS.json':'2dd660ab1e035b2d3dc81917590057e91e53e127','tools/stage7-root-floor-closure/entry.json':'777162fb3fa8d0501d166c6a6cb4ea9e5a204a4f'}
def sha(s):return hashlib.sha256(s).hexdigest()
def blob(s):return hashlib.sha1(f'blob {len(s)}\0'.encode()+s).hexdigest()
def facts(s):return {'bytes':len(s),'sha256':sha(s)}
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a])
def read(root,path):
 assert not path.startswith('/') and '?' not in path and '#' not in path and '..' not in Path(path).parts
 return (root/path).read_bytes()
def emit(name,data):(OUT/name).write_text(json.dumps(data,indent=2)+'\n')
def inv(m):
 a={x['path']:{k:x[k]for k in ('bytes','sha256')}for x in m['files']}
 assert len(a)==len(m['files'])==810
 return a
def pre():
 assert P['enable'] is True,'Disabled until exact isolated validation approval'
 root=Path(os.environ['GITHUB_WORKSPACE']);head=os.environ['GITHUB_SHA']
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',BR)
 assert git(root,'rev-list','--parents','-n1','HEAD').decode().split()==[head,R1]
 assert git(root,'rev-list','--parents','-n1',R1).decode().split()==[R1,CAND]
 assert git(root,'rev-list','--parents','-n1',CAND).decode().split()==[CAND,BASE]
 assert git(root,'rev-parse',CAND+'^{tree}').decode().strip()==CTREE
 assert git(root,'rev-parse',BASE+'^{tree}').decode().strip()==TREE
 assert not git(root,'status','--porcelain=v1','-z')
 assert set(git(root,'diff','--name-status','--no-renames',BASE,CAND).decode().splitlines())=={
    'M\tshared/runtime/terrain-readability.js','A\ttests/stage7-root-floor-closure.mjs'}
 assert set(git(root,'diff','--name-status','--no-renames',CAND,R1).decode().splitlines())=={f'A\t{k}'for k in QA}
 assert set(git(root,'diff','--name-status','--no-renames',R1,head).decode().splitlines())=={f'M\t{k}'for k in R2_SCOPE}
 assert all(blob(read(root,k))==blob(git(root,'show',R1+':'+k))==v for k,v in UNCHANGED.items())
 assert all(blob(read(root,k))==blob(git(root,'show',CAND+':'+k))==v for k,v in PROD.items())
 stock=git(root,'show',BASE+':'+MF); pin=P['stockManifest']
 assert facts(stock)=={k:pin[k]for k in ('bytes','sha256')} and blob(stock)==pin['git']
 assert blob(git(root,'show',BASE+':shared/runtime/terrain-readability.js'))==P['requiredStockReadabilityGit']
 for name,h in [('A',BASE),('B',CAND)]:
  target=W/name;git(root,'worktree','add','--detach',str(target),h)
  assert git(target,'rev-parse','HEAD').decode().strip()==h and not git(target,'status','--porcelain=v1','-z')
 emit('SOURCE.json',{'stock':BASE,'stockTree':TREE,'qaHead':head,'r1QAHead':R1,'candidate':CAND,'candidateTree':CTREE,'productOnly':PROD,'A':'exact checked-in static, no rebuild','B':'isolated normal compilation only'})
def normalize(b,pairs):
 for x,y in sorted(set(pairs),key=lambda v:-len(v[1])):
  b=b.replace(y.encode(),x.encode())
  b=b.replace(Path(y).name.encode(),Path(x).name.encode())
 return b
def role(path):
 m=re.fullmatch(r'web/runtime/ordered-(common|game)-(\d+)\.[a-f0-9]{16}\.js',path)
 return m.groups() if m else None
def mini(b,src):
 js="""import fs from 'node:fs';import {minify} from 'terser';
const raw=fs.readFileSync(process.argv[1],'utf8').replace(/\\r\\n/g,'\\n');
const res=await minify("(()=>{\\n'use strict';\\n"+raw+"\\n})();\\nawait yieldIfNeeded();\\n",{module:true,compress:false,mangle:false,format:{comments:false}});
process.stdout.write(res.code);
"""
 return subprocess.check_output(['node','--input-type=module','-e',js,str(src)],cwd=b,timeout=40)
def stream(root,paths,section):
 p=[]
 for k in paths:
  if not role(k) or role(k)[0]!=section:continue
  raw=read(root,k)
  s=re.fullmatch(br'import\{yieldIfNeeded\}from"(\./[^"]+)";(.+)\n?',raw,re.DOTALL)
  assert s and s[1].startswith(b'./load-data.'),('ordered wrapper missing',k)
  p.append((s[1],s[2].rstrip(b'\n')))
 assert p and len({i[0]for i in p})==1
 return p[0][0],b''.join(j for _,j in p)
def built():
 a,b=W/'A',W/'B';A=json.loads(read(a,MF));B=json.loads(read(b,MF))
 aa,bb=inv(A),inv(B)
 assert facts(read(a,MF))=={k:P['stockManifest'][k]for k in ('bytes','sha256')}
 assert not git(a,'status','--porcelain=v1','-z') and git(a,'rev-parse','HEAD').decode().strip()==BASE
 assert git(b,'rev-parse','HEAD').decode().strip()==CAND
 tracked=git(b,'diff','--name-only','-z').decode().strip('\0').split('\0')
 assert all(not n or n.startswith('web/') or n in SHELL for n in tracked),'build changed checked-in sources'
 assert all(blob(read(b,k))==v for k,v in PROD.items())
 for root,pins in ((a,aa),(b,bb)):
  for k,v in pins.items():assert facts(read(root,k))==v,k
 assert all(facts(read(a,k))==v for k,v in P['stockShells'].items())
 assert all(aa[k]==bb[k]==p for k,p in P['bakedStage7'].items())
 assert A['project']==B['project'] and read(a,A['project'])==read(b,B['project'])
 camp=json.loads(read(a,A['project']))
 assert len(camp['stages'])==len(camp['stageLibraries'])==50
 data=lambda d:{k:v for k,v in d.items() if k.startswith('web/data/') or k.startswith('web/graphics/')}
 assert data(aa)==data(bb),'serialized campaign or paint changed'
 pairs=[]; repacked=[]
 for section in ('common','gameOnly'):
  assert len(A[section])==len(B[section]),('unexpected separate bundle role cardinality',section)
  for x,y in zip(A[section],B[section]):
   if x==y:continue
   assert role(x)==role(y) and role(x) is not None,('unplanned runtime role',x,y)
   repacked.append((x,y));pairs.append((x,y))
 old_16=P['oldCommon16']
 assert old_16 in aa and old_16 in {x for x,_ in repacked}
 mini_a=mini(b,a/'shared/runtime/terrain-readability.js');mini_b=mini(b,b/'shared/runtime/terrain-readability.js')
 assert mini_a!=mini_b and b'5069.18' in mini_b and b'5732.24' in mini_b
 assert read(a,old_16).count(mini_a)==1,'isolated transformed source did not bind to exact existing emitted stock'
 for sect,secname in [('common','common'),('gameOnly','game')]:
  ia,sa=stream(a,A[sect],secname);ib,sb=stream(b,B[sect],secname)
  assert ia==ib
  if sect=='common':
   assert sa.count(mini_a)==sb.count(mini_b)==1 and sa.replace(mini_a,mini_b)==sb,'non-target module bytes/order changed'
  else:assert sa==sb,'unrelated ordered gameplay module changed'
 for k in ('gameEntry','workshopEntry','playtest'):
  x,y=A[k].split('?')[0],B[k].split('?')[0]
  if x!=y:pairs.append((x,y))
 assert len(pairs)==len({x for x,_ in pairs})==len({y for _,y in pairs})
 assert set(aa)-set(bb)=={x for x,_ in pairs} and set(bb)-set(aa)=={y for _,y in pairs}
 assert all(aa[k]==bb[k]for k in aa.keys()&bb.keys())
 for k in SHELL:assert normalize(read(b,k),pairs)==read(a,k),('stable shell not just rewritten content URLs',k)
 for x,y in pairs[len(repacked):]:
  assert normalize(read(b,y),pairs)==read(a,x),('bootstrap payload changed beyond graph URLs',x,y)
 skip={'files','previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
 def roles(d):return {k:v for k,v in d.items() if k not in skip}
 assert json.loads(normalize(json.dumps(roles(B),sort_keys=True).encode(),pairs))==roles(A)
 baseline_roles={**aa,**{k:facts(read(a,k))for k in SHELL|{MF}}}
 candidate_roles={**bb,**{k:facts(read(b,k))for k in SHELL|{MF}}}
 must_common={'HONRO.html','web/data/chapter-07.28f7bf612a598aeb.json','web/data/chapter-07-assets.7068fa05c6ce1c2e.json',
    'web/graphics/honro_authored_far-images-act1Site7.9ab1f4843007e530.webp',A['gameEntry'],A['project'],old_16}
 assert must_common<=baseline_roles.keys()
 translate=dict(pairs)
 emit('GRAPH.json',{'A':baseline_roles,'B':candidate_roles,'activeAssetsAnd50MapsExact':True,'orderedModulesExactOutsideReadability':True,
     'repacked':repacked,'allRenamedPaths':pairs,'oldReadabilityMinified':facts(mini_a),'newReadabilityMinified':facts(mini_b),
     'stage7MustObserveA':sorted(must_common),'stage7MustObserveB':sorted(translate.get(k,k)for k in must_common)})
if __name__=='__main__':{'pre':pre,'built':built}[sys.argv[1]]()
