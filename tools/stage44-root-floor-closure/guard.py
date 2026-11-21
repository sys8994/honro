"""Pinned normal verification, no commit, remote writes, heading mutation or deployment."""
import hashlib,json,os,re,sys,subprocess,stat
from pathlib import Path
Q=Path(__file__).resolve().parent;P=json.loads((Q/'PINS.json').read_bytes()); W=Path(sys.argv[2]);OUT=W/'out'
MF='web/manifest.json'; SHELL={'HONRO.html','HONRO_WORKSHOP.html','index.html'}
BASE=P['base']; TREE=P['tree']; REL=P['sourcePath']
QA={'.github/workflows/stage44-root-floor-closure.yml',*(f'tools/stage44-root-floor-closure/{k}' for k in ('PINS.json','entry.json','guard.py','views.py'))}
def sha(b):return hashlib.sha256(b).hexdigest()
def facts(b):return {'bytes':len(b),'sha256':sha(b)}
def blob(b):return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
def stamp(b):return {**facts(b),'git':blob(b)}
def git(root,*a):return subprocess.check_output(['git','-C',str(root),*a])
def read(root,path):
 assert not path.startswith('/') and '?' not in path and '#' not in path and '..' not in Path(path).parts
 target=root/path; assert not target.is_symlink()
 return target.read_bytes()
def emit(name,data):(OUT/name).write_text(json.dumps(data,indent=2)+'\n')
def inv(m):
 a={x['path']:{k:x[k]for k in ('bytes','sha256')}for x in m['files']}
 assert len(a)==len(m['files'])==810
 return a
def exact_patch(stock):
 assert stamp(stock)==P['sourceA']
 a=P['exactPatch']['from'].encode();b=P['exactPatch']['to'].encode()
 assert stock.count(a)==1 and a!=b
 out=stock.replace(a,b)
 assert stamp(out)==P['sourceB']
 return out
def pre():
 assert P['enable'] is True
 root=Path(os.environ['GITHUB_WORKSPACE']);head=os.environ['GITHUB_SHA']
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==(P['repo'],'push',P['branch'])
 assert git(root,'rev-list','--parents','-n1','HEAD').decode().split()==[head,BASE]
 assert git(root,'rev-list','--parents','-n1',BASE).decode().split()==[BASE,P['baseParent']]
 for ref,tree in ((BASE,TREE),(P['baseParent'],P['baseParentTree'])):assert git(root,'rev-parse',ref+'^{tree}').decode().strip()==tree
 assert not git(root,'status','--porcelain=v1','-z')
 assert set(git(root,'diff','--name-status','--no-renames',BASE,head).decode().splitlines())=={f'A\t{k}'for k in QA}
 stock=git(root,'show',BASE+':'+MF);assert stamp(stock)==P['stockManifest']
 assert blob(git(root,'show',BASE+':shared/runtime/terrain-readability.js'))==P['stockReadabilityGit']
 a=git(root,'show',BASE+':'+REL);b=exact_patch(a)
 for name in ('A','B'):
  t=W/name;git(root,'worktree','add','--detach',str(t),BASE)
  assert git(t,'rev-parse','HEAD').decode().strip()==BASE and not git(t,'status','--porcelain=v1','-z')
  assert stamp(read(t,REL))==P['sourceA']
 (W/'B'/REL).write_bytes(b)
 assert git(W/'B','diff','--name-status').decode().splitlines()==['M\t'+REL]
 emit('SOURCE.json',{'stock':BASE,'stockTree':TREE,'qaHead':head,'targetSource':REL,'A':P['sourceA'],'B':P['sourceB'],'mode':'B isolated dirty worktree one exact pinned replacement, no product commit/publish','pageAuthorityInput':P['published']})
def normalize(b,pairs):
 for x,y in sorted(set(pairs),key=lambda v:-len(v[1])):
  b=b.replace(y.encode(),x.encode()).replace(Path(y).name.encode(),Path(x).name.encode())
 return b
def role(path):
 m=re.fullmatch(r'web/runtime/ordered-(common|game)-(\d+)\.[a-f0-9]{16}\.js',path)
 return m.groups() if m else None
def mini(b,src):
 js=r"""import fs from 'node:fs';import {minify} from 'terser';
const raw=fs.readFileSync(process.argv[1],'utf8').replace(/\r\n/g,'\n');
const res=await minify("(()=>{\n'use strict';\n"+raw+"\n})();\nawait yieldIfNeeded();\n",{module:true,compress:false,mangle:false,format:{comments:false}});
process.stdout.write(res.code);
"""
 # JSON encoding is not used here; retain the JS escape sequences exactly.
 return subprocess.check_output(['node','--input-type=module','-e',js,str(src)],cwd=b,timeout=40)
def stream(root,paths,section):
 p=[]
 for k in paths:
  if not role(k) or role(k)[0]!=section:continue
  raw=read(root,k);s=re.fullmatch(br'import\{yieldIfNeeded\}from"(\./[^"]+)";(.+)\n?',raw,re.DOTALL)
  assert s and s[1].startswith(b'./load-data.'),('ordered wrapper missing',k)
  p.append((s[1],s[2].rstrip(b'\n')))
 assert p and len({i[0]for i in p})==1
 return p[0][0],b''.join(j for _,j in p)
def built():
 a,b=W/'A',W/'B';A=json.loads(read(a,MF));B=json.loads(read(b,MF));aa,bb=inv(A),inv(B)
 assert stamp(read(a,MF))==P['stockManifest']
 assert not git(a,'status','--porcelain=v1','-z') and git(a,'rev-parse','HEAD').decode().strip()==BASE
 assert git(b,'rev-parse','HEAD').decode().strip()==BASE
 tracked=git(b,'diff','--name-only','-z').decode().strip('\0').split('\0')
 assert REL in tracked and all(not n or n==REL or n.startswith('web/') or n in SHELL for n in tracked),'build changed source beyond one exact guarded path'
 assert stamp(read(a,REL))==P['sourceA'] and stamp(read(b,REL))==P['sourceB']
 assert all(all(facts(read(root,k))==v for k,v in pins.items())for root,pins in ((a,aa),(b,bb)))
 assert all(facts(read(a,k))==v for k,v in P['stockShells'].items())
 assert all(aa[k]==v for k,v in P['activePins'].items())
 assert all(aa[k]==bb[k]==v for k,v in P['activePins'].items() if k!=P['oldCommon18'])
 assert A['project']==B['project'] and read(a,A['project'])==read(b,B['project'])
 camp=json.loads(read(a,A['project']));assert len(camp['stages'])==len(camp['stageLibraries'])==50
 data=lambda d:{k:v for k,v in d.items() if k.startswith('web/data/') or k.startswith('web/graphics/')}
 assert data(aa)==data(bb),'serialized campaign/paint changed'
 pairs=[];repacked=[]
 for sect in ('common','gameOnly'):
  assert len(A[sect])==len(B[sect])
  for x,y in zip(A[sect],B[sect]):
   if x==y:continue
   assert role(x)==role(y) and role(x) is not None
   repacked.append((x,y));pairs.append((x,y))
 assert len(repacked)==1 and repacked[0][0]==P['oldCommon18'],'unexpected runtime slot(s)'
 ma,mb=mini(b,a/REL),mini(b,b/REL)
 assert ma!=mb and b'6700.39' in mb and b'1733.2' in mb
 assert read(a,repacked[0][0]).count(ma)==1 and read(b,repacked[0][1]).count(mb)==1
 for sect,ss in [('common','common'),('gameOnly','game')]:
  ia,sa=stream(a,A[sect],ss);ib,sb=stream(b,B[sect],ss);assert ia==ib
  if ss=='common':assert sa.count(ma)==sb.count(mb)==1 and sa.replace(ma,mb)==sb,'non-target module bytes/order changed'
  else:assert sa==sb,'unrelated gameplay code changed'
 for k in ('gameEntry','workshopEntry','playtest'):
  x,y=A[k].split('?')[0],B[k].split('?')[0]
  if x!=y:pairs.append((x,y))
 assert len(pairs)==len({x for x,_ in pairs})==len({y for _,y in pairs})
 assert set(aa)-set(bb)=={x for x,_ in pairs} and set(bb)-set(aa)=={y for _,y in pairs}
 assert all(aa[k]==bb[k]for k in aa.keys()&bb.keys())
 for k in SHELL:assert normalize(read(b,k),pairs)==read(a,k),('stable shell not only URLs',k)
 for x,y in pairs[len(repacked):]:assert normalize(read(b,y),pairs)==read(a,x),('bootstrap changed beyond URLs',x,y)
 skip={'files','previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
 strip=lambda d:{k:v for k,v in d.items()if k not in skip}
 assert json.loads(normalize(json.dumps(strip(B),sort_keys=True).encode(),pairs))==strip(A)
 x,y=({**p,**{k:facts(read(rt,k))for k in SHELL|{MF}}}for p,rt in ((aa,a),(bb,b)))
 must={'HONRO.html','web/data/chapter-44.48354b7c0547c1a7.json','web/data/chapter-44-assets.ddddc05a5f764d6e.json',A['gameEntry'],A['project'],P['oldCommon18']}
 assert must<=x.keys()
 translate=dict(pairs)
 emit('GRAPH.json',{'A':x,'B':y,'activeAssetsAnd50MapsExact':True,'orderedModulesExactOutsideAct5':True,'repacked':repacked,'allRenamedPaths':pairs,'stockAct5':facts(ma),'candidateAct5':facts(mb),'mustObserveA':sorted(must),'mustObserveB':sorted(translate.get(k,k)for k in must)})
def scoped_test():
 a,b=read(W/'A',REL),read(W/'B',REL)
 assert exact_patch(a)==b and stamp(b)==P['sourceB']
 js=r"""
import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const target={a:{x:6700.39,y:1733.2},z:{x:6700.39,y:2269},walkable:false};
const other={a:{x:6700.39,y:2269},z:{x:0,y:2269},walkable:false};
const rim={a:{x:6109.38,y:1812.89},z:{x:6700.39,y:1733.2},walkable:true};
const go=(file, mut)=> {
 class Path { constructor(){this.ops=[]} moveTo(x,y){this.p=[x,y]} lineTo(x,y){this.ops.push([this.p,[x,y]])} }
 const oldPath=new Path(), top=new Path();
 const group={id:'a5-root-floor',edge:oldPath,top,segments:structuredClone([target,other,rim])}, state={groups:[group]};
 const b={honroStage:44,honroCanonical:true,honroCustom:false,honroMapOrigin:'campaign',honroAuthoredId:'stage-44',width:6800,height:2627,terrain:[{id:'a5-root-floor',oneWay:false,broken:false,honroAct5Painted:true}]};
 mut(b,group);
 const original=JSON.stringify(b),source=JSON.stringify(group.segments);
 class Scene {terrainReadability(c,arg,view){assert(arg===b);assert(group.top===top);c.push(...group.edge.ops);}}
 const env={Path2D:Path,HonroScene:Scene,HonroTerrainReadability:{prepare(t){assert(t===b);return state}}};vm.createContext(env);vm.runInContext(fs.readFileSync(file,'utf8'),env);
 const s=new Scene(),out=[];s.terrainReadability(out,b,{});
 assert(group.edge===oldPath);assert.equal(JSON.stringify(b),original);assert.equal(JSON.stringify(group.segments),source);
 return JSON.parse(JSON.stringify({out,qa:env.HonroEdgeClosureQA}));
};
const src=process.argv[1],dst=process.argv[2], pos=()=>{};const A=go(src,pos),B=go(dst,pos);
assert.equal(A.qa.walkableRemoved,0);assert.equal(B.qa.walkableRemoved,0);assert.equal(A.qa.keptWalkableCount,B.qa.keptWalkableCount);
const pairs=[[target.a.x,target.a.y],[target.z.x,target.z.y]],eq=x=>JSON.stringify(x)===JSON.stringify(pairs);
assert.equal(A.out.filter(eq).length,1);assert.equal(B.out.filter(eq).length,0);assert.deepEqual(A.out.filter(x=>!eq(x)),B.out);
assert.deepEqual(B.qa.removed.filter(x=>x.id==='a5-root-floor'&&eq([[x.a.x,x.a.y],[x.z.x,x.z.y]])),[{id:'a5-root-floor',...target}]);
const cases=[
 b=>b.honroStage=43,b=>b.honroStage=45,b=>b.honroStage=46,b=>b.honroCustom=true,b=>b.honroCanonical=false,
 b=>b.honroMapOrigin='workshop',b=>b.honroAuthoredId='stage-44-alt',(b,g)=>{g.id='other';b.terrain[0].id='other'},
 b=>delete b.terrain[0].honroAct5Painted,b=>b.terrain[0].broken=true,b=>b.terrain[0].oneWay=true,
 (_,g)=>g.segments[0].z.y+=1,(_,g)=>{const x=g.segments[0];[x.a,x.z]=[x.z,x.a]}
];
for(const test of cases)assert.deepEqual(go(src,test),go(dst,test));
console.log('exact guarded one directed operation, raw runtime module only; 13 negative cases');
"""
 subprocess.run(['node','--input-type=module','-e',js,str(W/'A'/REL),str(W/'B'/REL)],check=True,timeout=25)
if __name__=='__main__':{'pre':pre,'built':built,'test':scoped_test}[sys.argv[1]]()
