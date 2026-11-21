"""Pinned normal verification, no commit, remote writes, heading mutation or deployment."""
import hashlib,json,os,re,sys,subprocess,stat
from pathlib import Path
Q=Path(__file__).resolve().parent;P=json.loads((Q/'PINS.json').read_bytes()); W=Path(sys.argv[2]);OUT=W/'out'
MF='web/manifest.json'; SHELL={'HONRO.html','HONRO_WORKSHOP.html','index.html'}
BASE=P['base']; TREE=P['tree']; REL=P['sourcePath']
QA={'.github/workflows/stage44-root-floor-a0.yml',*(f'tools/stage44-root-floor-a0/{k}' for k in ('PINS.json','entry.json','guard.py','views.py','coverage.py','A0-edge.js','A0-readability.js'))}
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
def a0stock():
 b=(Q/'A0-edge.js').read_bytes();r=(Q/'A0-readability.js').read_bytes()
 assert stamp(b)==P['sourceB'] and stamp(r)==P['readabilityB']
 assert b.count(b'localEdges.set(group,{filtered:edge,segment:target[0]})')==1
 assert b'localEdges.set(group,{filtered,segment:target[0]})' not in b
 return b,r
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
 a=git(root,'show',BASE+':'+REL);assert stamp(a)==P['sourceA'];b,r=a0stock()
 assert stamp(git(root,'show',BASE+':'+P['readabilityPath']))==P['readabilityA']
 for name in ('A','B'):
  t=W/name;git(root,'worktree','add','--detach',str(t),BASE)
  assert git(t,'rev-parse','HEAD').decode().strip()==BASE and not git(t,'status','--porcelain=v1','-z')
  assert stamp(read(t,REL))==P['sourceA'] and stamp(read(t,P['readabilityPath']))==P['readabilityA']
 (W/'B'/REL).write_bytes(b);(W/'B'/P['readabilityPath']).write_bytes(r)
 assert set(git(W/'B','diff','--name-status').decode().splitlines())=={'M\t'+REL,'M\t'+P['readabilityPath']}
 emit('SOURCE.json',{'stock':BASE,'stockTree':TREE,'qaHead':head,'sourceA':[P['sourceA'],P['readabilityA']],'sourceA0':[P['sourceB'],P['readabilityB']], 'mode':'A0 no-op diagnostic only, same combined Path2D redrawn, no deployment'})
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
 assert REL in tracked and all(not n or n in (REL,P['readabilityPath']) or n.startswith('web/') or n in SHELL for n in tracked),'build changed source beyond one exact guarded path'
 scoped_test()
 assert all(all(facts(read(root,k))==v for k,v in pins.items())for root,pins in ((a,aa),(b,bb)))
 assert all(facts(read(a,k))==v for k,v in P['stockShells'].items())
 assert all(aa[k]==v for k,v in P['activePins'].items())
 assert all(aa[k]==bb[k]==v for k,v in P['activePins'].items() if k not in (P['oldCommon16'],P['oldCommon18']))
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
 roots={P['oldCommon16']:P['readabilityPath'],P['oldCommon18']:REL}
 assert len(repacked)==2 and {x for x,_ in repacked}==roots.keys(),'unexpected runtime compiled slots'
 slots={}; wrappers={}
 for old,new in repacked:
  path=roots[old];ma,mb=mini(b,a/path),mini(b,b/path)
  assert ma!=mb and read(a,old).count(ma)==read(b,new).count(mb)==1
  assert read(a,old).replace(ma,mb)==read(b,new),'unrelated compiled bytes changed'
  slots[path]={'old':old,'new':new,'moduleA':facts(ma),'moduleA0':facts(mb)}
  wrappers[ma]=mb
  if path==P['readabilityPath']:
   for marker in (b'c.stroke(filtered)',b'c.drawImage(s,lx,ly,ww,hh,L,T,ww,hh)'):
    assert len(re.findall(br'(?<![\w$.])'+re.escape(marker),read(b,new)))==len(re.findall(br'(?<![\w$.])'+re.escape(marker),mb))==1
 for sect,ss in [('common','common'),('gameOnly','game')]:
  ia,sa=stream(a,A[sect],ss);ib,sb=stream(b,B[sect],ss);assert ia==ib
  if ss=='common':
   for ma,mb in wrappers.items():
    assert sa.count(ma)==sb.count(mb)==1
    sa=sa.replace(ma,mb)
  assert sa==sb,'unrelated module order or bytes changed'
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
 must={'HONRO.html','web/data/chapter-44.48354b7c0547c1a7.json','web/data/chapter-44-assets.ddddc05a5f764d6e.json',A['gameEntry'],A['project'],P['oldCommon18'],P['oldCommon16']}
 assert must<=x.keys()
 translate=dict(pairs)
 emit('GRAPH.json',{'A':x,'B':y,'activeAssetsAnd50MapsExact':True,'orderedModulesExactOutsideAct5':True,'repacked':repacked,'allRenamedPaths':pairs,'noOpOnly':True,'slots':slots,'mustObserveA':sorted(must),'mustObserveB':sorted(translate.get(k,k)for k in must)})
def scoped_test():
 for k,an,bn in ((REL,P['sourceA'],P['sourceB']),(P['readabilityPath'],P['readabilityA'],P['readabilityB'])):
  assert stamp(read(W/'A',k))==an and stamp(read(W/'B',k))==bn
 print('Exact A/A0 diagnostic source bytes; no filtered removal path shipped.')
if __name__=='__main__':{'pre':pre,'built':built,'test':scoped_test}[sys.argv[1]]()
