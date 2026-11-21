"""Strict stage28 source/build checker. Read-only-release A; normal B isolated. No push."""
import hashlib,json,os,re,subprocess,sys,zipfile
from pathlib import Path
Q=Path(__file__).resolve().parent
P=json.loads((Q/'PINS.json').read_bytes())
MF='web/manifest.json';SHELL={'HONRO.html','HONRO_WORKSHOP.html','index.html'}
REL=P['sourcePath'];BASE=P['base'];TREE=P['tree']
R1='dd73e9e758bf50f2fcf2345e0c3cbfbb2e150457'
R2='efbc9a8c6e515935e302ea2e07c7b1c9244943ad'
R3='db8ac19b641c35e03787b0b2046c318a78141d01'
R4='refs/heads/qa/stage28-poster-floor-acb51-r4'
R2_PATHS={'.github/workflows/stage28-poster-native.yml','tools/stage28-poster-native/capture.py','tools/stage28-poster-native/guard.py'}
QA={'.github/workflows/stage28-poster-native.yml',*(f'tools/stage28-poster-native/{k}' for k in ('PINS.json','guard.py','capture.py','stock-observer.json','park.js','observe.js'))}
def sha(b):return hashlib.sha256(b).hexdigest()
def facts(b):return {'bytes':len(b),'sha256':sha(b)}
def blob(b):return hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def stamp(b):return {**facts(b),'git':blob(b)}
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a],timeout=90)
def rd(r,k):
 assert not k.startswith('/') and not ({'?', '#'}&set(k)) and '..' not in Path(k).parts
 f=r/k;assert not f.is_symlink()
 return f.read_bytes()
def save(f,x):f.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
def inv(m):
 a={x['path']:{k:x[k]for k in ('bytes','sha256')}for x in m['files']}
 assert len(a)==len(m['files'])==810
 return a
def patch(stock):
 assert stamp(stock)==P['sourceA']
 for e in P['patch']:
  a,b=e['from'].encode(),e['to'].encode()
  assert stock.count(a)==1 and a!=b;stock=stock.replace(a,b)
 assert stamp(stock)==P['sourceB'];return stock
def pre(w):
 assert not (os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN'))
 root=Path(os.environ['GITHUB_WORKSPACE']);head=os.environ['GITHUB_SHA']
 assert (os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==(P['repo'],'push',R4)
 assert P['branch']=='refs/heads/qa/stage28-poster-floor-acb51'
 assert w.resolve().is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve())
 assert git(root,'rev-list','--parents','-n1','HEAD').decode().split()==[head,R3]
 assert git(root,'rev-list','--parents','-n1',R3).decode().split()==[R3,R2]
 assert git(root,'rev-list','--parents','-n1',R2).decode().split()==[R2,R1]
 assert git(root,'rev-list','--parents','-n1',R1).decode().split()==[R1,BASE]
 assert git(root,'rev-parse',BASE+'^{tree}').decode().strip()==TREE
 assert not git(root,'status','--porcelain=v1','-z')
 assert set(git(root,'diff','--name-status','--no-renames',BASE,R1).decode().splitlines())=={f'A\t{k}'for k in QA}
 assert set(git(root,'diff','--name-status','--no-renames',R1,head).decode().splitlines())=={f'M\t{k}'for k in R2_PATHS}
 assert set(git(root,'diff','--name-status','--no-renames',R1,R2).decode().splitlines())=={f'M\t{k}'for k in R2_PATHS}
 assert set(git(root,'diff','--name-status','--no-renames',R2,head).decode().splitlines())=={f'M\t{k}'for k in R2_PATHS}
 assert set(git(root,'diff','--name-status','--no-renames',R2,R3).decode().splitlines())=={f'M\t{k}'for k in R2_PATHS}
 assert set(git(root,'diff','--name-status','--no-renames',R3,head).decode().splitlines())=={f'M\t{k}'for k in R2_PATHS}
 assert all(git(root,'show',R1+':'+p)==git(root,'show',head+':'+p)for p in QA-R2_PATHS)
 for k in QA:assert git(root,'ls-tree',head,'--',k).decode().split()[:2]==['100644','blob']
 assert stamp(git(root,'show',BASE+':'+MF))==P['manifest']
 for name in ('A','B'):
  t=w/name;git(root,'worktree','add','--detach',str(t),BASE)
  assert git(t,'rev-parse','HEAD').decode().strip()==BASE and not git(t,'status','--porcelain=v1','-z')
  assert stamp(rd(t,REL))==P['sourceA']
 (w/'B'/REL).write_bytes(patch(rd(w/'A',REL)))
 assert git(w/'B','diff','--name-status').decode().splitlines()==['M\t'+REL]
 save(w/'out/SOURCE.json',{'publicBase':BASE,'tree':TREE,'qaHead':head,'originalQAHead':R1,'phasePredecessor':R3,'qaModified':sorted(R2_PATHS),'source':REL,'A':P['sourceA'],'B':P['sourceB'],'meaning':P['sourceOnly'],'publishedAuthority':[P['publishedRun'],P['publishedJob']]})
def role(k):
 m=re.fullmatch(r'web/runtime/ordered-(common|game)-(\d+)\.[a-f0-9]{16}\.js',k)
 return m.groups() if m else None
def mini(b,src):
 js=r"""import fs from 'node:fs';import {minify} from 'terser';
const raw=fs.readFileSync(process.argv[1],'utf8').replace(/\r\n/g,'\n');
const m=await minify("(()=>{\n'use strict';\n"+raw+"\n})();\nawait yieldIfNeeded();\n",{module:true,compress:false,mangle:false,format:{comments:false}});
process.stdout.write(m.code);
"""
 return subprocess.check_output(['node','--input-type=module','-e',js,str(src)],cwd=b,timeout=40)
def stream(root,seq,kind):
 out=[]
 for k in seq:
  if not (role(k) and role(k)[0]==kind):continue
  s=re.fullmatch(br'import\{yieldIfNeeded\}from"(\./[^"]+)";(.+)\n?',rd(root,k),re.S)
  assert s and s[1].startswith(b'./load-data.'),('missing ordered loader',k)
  out.append((s[1],s[2].rstrip(b'\n')))
 assert out and len({a for a,b in out})==1
 return out[0][0],b''.join(b for a,b in out)
def normalize(b,pairs):
 for x,y in sorted(set(pairs),key=lambda v:-len(v[1])):
  b=b.replace(y.encode(),x.encode()).replace(Path(y).name.encode(),Path(x).name.encode())
 return b
def built(w):
 a,b=w/'A',w/'B';o=w/'out'; A=json.loads(rd(a,MF));B=json.loads(rd(b,MF));ai,bi=inv(A),inv(B)
 assert stamp(rd(a,MF))==P['manifest'] and not git(a,'status','--porcelain=v1','-z')
 assert all(git(x,'rev-parse','HEAD^{tree}').decode().strip()==TREE for x in (a,b))
 assert patch(rd(a,REL))==rd(b,REL)
 assert all(facts(rd(a,k))==v for k,v in P['shells'].items())
 ds=git(b,'diff','--name-only','-z').decode().rstrip('\0').split('\0')
 assert REL in ds and all(n==REL or n.startswith('web/')or n in SHELL for n in ds)
 for root,ts in ((a,ai),(b,bi)):
  for k,v in ts.items():assert facts(rd(root,k))==v,(root.name,k)
 assert all(ai[k]==bi[k]for k in ai.keys()&bi.keys())
 assert A['project']==B['project'] and rd(a,A['project'])==rd(b,B['project'])
 campaign=json.loads(rd(a,A['project']));assert len(campaign['stages'])==len(campaign['stageLibraries'])==50
 assert {k:v for k,v in ai.items() if k.startswith(('web/data/','web/graphics/'))}=={k:v for k,v in bi.items() if k.startswith(('web/data/','web/graphics/'))}
 ma,mb=mini(b,a/REL),mini(b,b/REL);assert ma!=mb and b'stage28RenderedFoundation' in mb
 assert rd(a,P['baseCompiledRuntime']).count(ma)==1
 for key,sect in (('common','common'),('gameOnly','game')):
  x,s=stream(a,A[key],sect);y,t=stream(b,B[key],sect);assert x==y
  if sect=='common':assert s.count(ma)==t.count(mb)==1 and s.replace(ma,mb)==t
  else:assert s==t
 # Signed runtime carrier only. Positional alias moves with proof of full JS stream
 # order are accepted only if the other entry references also normalize exactly.
 pairs=[]; runtimes=[]
 for k in ('common','gameOnly'):
  assert len(A[k])==len(B[k])
  for x,y in zip(A[k],B[k]):
   if x==y:continue
   assert k=='common' and role(x)==role(y) and role(x)
   runtimes.append((x,y));pairs.append((x,y))
 assert any(x==P['baseCompiledRuntime'] for x,y in runtimes)
 owners=[y for x,y in runtimes if rd(b,y).count(mb)==1];assert len(owners)==1
 for k in ('gameEntry','workshopEntry','playtest'):
  x,y=A[k].split('?')[0],B[k].split('?')[0]
  if x!=y:pairs.append((x,y))
 assert len(pairs)==len({x for x,y in pairs})==len({y for x,y in pairs})
 assert set(ai)-set(bi)=={x for x,y in pairs} and set(bi)-set(ai)=={y for x,y in pairs}
 for x,y in pairs[len(runtimes):]:assert normalize(rd(b,y),pairs)==rd(a,x),('entry differs beyond aliases',x,y)
 for k in SHELL:assert normalize(rd(b,k),pairs)==rd(a,k),('shell differs beyond aliases',k)
 skip={'files','previousFiles','previousGenerations','publishedGenerations','publishedRetention'}
 for k in B:
  if k in skip:continue
  assert k in A and json.loads(normalize(json.dumps(B[k],sort_keys=True).encode(),pairs))==A[k],k
 assert (set(A)-skip)==(set(B)-skip)
 save(o/'GRAPH.json',{'releaseA':BASE,'activeA':{**ai,**{k:facts(rd(a,k))for k in SHELL|{MF}}},'activeB':{**bi,**{k:facts(rd(b,k))for k in SHELL|{MF}}},
      'runtimeA':P['baseCompiledRuntime'],'runtimeB':owners[0],'aliases':pairs,'modules':{'A':facts(ma),'B':facts(mb)},
      'all50MapsPacketAndGraphicsExact':True,'allCommonAndGameExecutionExceptSingleSignedModuleExact':True})
def archive(w):
 o=w/'out';g=json.loads(rd(o,'GRAPH.json'));x=json.loads(rd(o,'BROWSER.json'))
 assert x['status']=='PASS_ACTUAL_STAGE28_SIGNED_POSTER_ONLY' and len(x['paired'])==len(P['frames']) and all(r['pass']for r in x['paired'].values())
 assert len(x['visits'])==2*len(P['visits'])
 assert all(r['state']=='NETWORK_AND_CAPTURE_EXACT' and r['navigationDocument']['proof']=='exact-main-frame-page.goto-body'
            and set(r['requiredObserved'])-{'HONRO.html'}<=set(r['listenerVerifiedRequired']) for r in x['visits'])
 assert x['phaseWitness']['A-mobile-north-cold-qualified'] and x['phaseWitness']['A-mobile-north-settled-qualified']
 assert len(x['frames'])==2*len(P['frames']) and all(len(f['phases']['repeats'])==2 for f in x['frames'].values())
 assert all(set(z['phases'])=={'phase1','phase2'} and all(p['pass'] for p in z['phases'].values())for z in x['paired'].values())
 b=w/'B';targets=sorted({REL,MF,*SHELL,*(y for x,y in g['aliases'])})
 rows={}
 for k in targets:
  data=rd(b,k)
  if k==REL:assert stamp(data)==P['sourceB']
  else:assert facts(data)==g['activeB'][k]
  rows[k]=stamp(data)
 z=o/'STAGE28-NORMAL-COMPILED-QA-ONLY.zip'
 with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED,compresslevel=8)as q:
  for k in targets:q.writestr(k,rd(b,k))
 save(o/'COMPILED-SEAL.json',{'source':P['sourceB'],'targetPaths':rows,'oldAliases':[x for x,y in g['aliases']],'normalAandBServerOnly':True,'notPublished':True,
      'archive':stamp(z.read_bytes()),'browserReceipt':facts(rd(o,'BROWSER.json'))})
if __name__=='__main__':{'pre':pre,'built':built,'archive':archive}[sys.argv[1]](Path(sys.argv[2]).resolve())
