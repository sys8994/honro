import hashlib,json,os,re,subprocess,sys,zipfile
from pathlib import Path
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes());MAN='web/manifest.json';SRC=P['source'];SHELL={'HONRO.html','HONRO_WORKSHOP.html','index.html'}
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def stamp(b):return {**fact(b),'git':hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()}
def need(ok,msg):
 if not ok:raise RuntimeError(msg)
def git(r,*s):return subprocess.check_output(['git','-C',str(r),*s],timeout=90,text=True).strip()
def read(r,k):
 p=r/k;need(p.is_file() and not p.is_symlink() and p.resolve().is_relative_to(r.resolve()),('unsafe path',k))
 return p.read_bytes()
def save(w,k,o):(w/'out'/k).write_text(json.dumps(o,indent=2)+'\n')
def pre(w):
 a=P['release'];base=a['head'];repo=Path(os.environ['GITHUB_WORKSPACE']);head=os.environ['GITHUB_SHA']
 need(P['enabled'] and not(os.getenv('GH_TOKEN') or os.getenv('GITHUB_TOKEN')),'unarmed or unexpectedly credentialed')
 need((os.getenv('GITHUB_REPOSITORY'),os.getenv('GITHUB_EVENT_NAME'),os.getenv('GITHUB_REF'))==
      ('sys8994/honro','push',P['qaRef']),'wrong repo/event/ref')
 fs={'.github/workflows/stage7-east-onebuild.yml',*(str(D.relative_to(repo)/k)for k in ('PINS.json','guard.py','capture.py','observer.json','candidate.js'))}
 need(git(repo,'rev-list','--parents','-1','HEAD').split()==[head,base] and git(repo,'rev-parse',base+'^{tree}')==a['tree']
      and a['pages']['head']==base and a['pages']['conclusion']=='success' and not git(repo,'status','--porcelain')
      and set(git(repo,'diff','--no-renames','--name-status',base,head).splitlines())=={'A\t'+n for n in fs},
      'not the expected add-only QA child')
 for k in ('A','B'):git(repo,'worktree','add','--detach',str(w/k),base)
 A=w/'A';B=w/'B';c=read(D,'candidate.js')
 need(stamp(read(A,SRC))==P['stock'] and stamp(c)==P['candidate'] and stamp(read(A,MAN))=={**a['manifest'],'git':P['oldManifestGit']}
      and stamp(read(A,P['oldRuntime']))['git']==P['oldRuntimeGit'],'active published base or approved source mismatch')
 (B/SRC).write_bytes(c);need(git(B,'diff','--name-status')=='M\t'+SRC,'more than one source path changed')
 save(w,'SOURCE.json',{'base':base,'tree':a['tree'],'head':head,'path':SRC,'old':P['stock'],'candidate':P['candidate']})
def mini(b,src):
 js="""import fs from 'node:fs';import {minify} from 'terser';
const raw=fs.readFileSync(process.argv[1],'utf8').replace(/\\r\\n/g,'\\n');
const r=await minify("(()=>{\\n'use strict';\\n"+raw+"\\n})();\\nawait yieldIfNeeded();\\n",{module:true,compress:false,mangle:false,format:{comments:false}});
process.stdout.write(r.code);"""
 return subprocess.check_output(['node','--input-type=module','-e',js,str(src)],cwd=b,timeout=40)
def inv(m):
 d={x['path']:{k:x[k]for k in ('bytes','sha256')}for x in m['files']}
 need(len(d)==len(m['files'])==810,'manifest active count drift')
 return d
def runtime_path(k):return re.fullmatch(r'web/runtime/ordered-common-[0-9]+\.[a-f0-9]{16}\.js',k) is not None
def observe(w):
 a,b=w/'A',w/'B';m,n=(json.loads(read(t,MAN))for t in (a,b)); inventories=tuple(map(inv,(m,n)))
 ma,mb=(mini(b,t/SRC)for t in (a,b))
 need(ma!=mb,'source patch did not compile to a different script')
 routes=[];owners=[]
 for root,manifest,mini_src,inventory in zip((a,b),(m,n),(ma,mb),inventories):
  common=manifest['common']
  matches=[k for k in common if runtime_path(k) and read(root,k).count(mini_src)]
  need(len(matches)==1 and read(root,matches[0]).count(mini_src)==1,'unique actual native target not present')
  owners.append(matches[0]); keys={P['map'],P['packet'],manifest['project'],'HONRO.html',matches[0],manifest['gameEntry'].split('?')[0]}
  routes.append({k:fact(read(root,k))for k in sorted(keys)})
  need(all(inventory[k]==routes[-1][k] for k in keys-{'HONRO.html'}),'native observed manifest mismatch')
 need(owners[0]==P['oldRuntime'],'active public owner differs')
 report={'owners':owners,'routes':dict(zip('AB',routes)),'commonA':m['common'],'commonB':n['common'],
  'gameOnlyEqual':m['gameOnly']==n['gameOnly'],'extra':sorted(inventories[1].keys()-inventories[0].keys()),
  'missing':sorted(inventories[0].keys()-inventories[1].keys()),'mustObserveB':sorted(routes[1])}
 save(w,'NATIVE-ROUTES.json',report)
def flat_ordered(root,span):
 data=[]
 header=re.compile(rb'import\{yieldIfNeeded\}from"./load-data\.[a-f0-9]{16}\.js";')
 for k in span:
  raw=read(root,k); h=header.match(raw)
  need(h is not None and raw.endswith(b'await yieldIfNeeded();\n'),'unexpected compiler wrapper')
  data.append((h[0],raw[h.end():-1]))
 need(len({h for h,_ in data})==1,'loader boundary changed')
 return data[0][0],b''.join(x for _,x in data)
def build(w):
 a,b=w/'A',w/'B';m,n=(json.loads(read(t,MAN))for t in (a,b));A,B=map(inv,(m,n))
 obs=json.loads(read(w/'out','NATIVE-ROUTES.json'))
 need(stamp(read(a,SRC))==P['stock'] and stamp(read(b,SRC))==P['candidate'],'source changed after compile')
 need(all(k in SHELL|{SRC} or k.startswith('web/') for k in git(b,'diff','--name-only').splitlines()),'non-target code changed')
 q=list(zip(m['common'],n['common']))
 dif=[(x,y)for x,y in q if x!=y]
 print(json.dumps({'exactRuntimeDiff':dif,'gameOnlyEqual':obs['gameOnlyEqual'],'owners':obs['owners']}),flush=True)
 changed=[i for i,(x,y) in enumerate(q)if x!=y]
 need(len(m['common'])==len(n['common']) and m['gameOnly']==n['gameOnly'] and 1<=len(changed)<=2
      and changed==list(range(changed[0],changed[-1]+1)) and all(runtime_path(x)and runtime_path(y) for x,y in dif)
      and obs['owners'][0] in {x for x,_ in dif} and obs['owners'][1] in {y for _,y in dif},
      'outside at most two neighboring ordered common groups changed (not qualified for writer)')
 hp,aa=flat_ordered(a,[x for x,_ in dif]);hn,bb=flat_ordered(b,[y for _,y in dif]);ma,mb=(mini(b,t/SRC)for t in (a,b))
 need(hp==hn and aa.count(ma)==1 and aa.replace(ma,mb,1)==bb,'additional logical change inside the re-chunked ordered scripts')
 pairs=dif+[(m[k].split('?')[0],n[k].split('?')[0])for k in ('gameEntry','workshopEntry','playtest')]
 need(len({x for x,_ in pairs})==len({y for _,y in pairs})==len(pairs) and all(x!=y for x,y in pairs),'unexpected alias closure')
 need(A.keys()-B.keys()=={x for x,_ in pairs} and B.keys()-A.keys()=={y for _,y in pairs} and all(A[k]==B[k]for k in A.keys()&B.keys()),'unrelated active asset bytes changed')
 need(all(A[x]==fact(read(a,x)) and B[y]==fact(read(b,y))for x,y in pairs),'compiled module bytes do not match manifest')
 need(m['project']==n['project'] and A[m['project']]==B[n['project']],'campaign packet changed')
 c=json.loads(read(a,m['project']));maps,pack=c['stages'],c['stageLibraries']
 need(len(set(maps))==len(set(pack))==50 and maps[6]==P['map'] and pack[6]==P['packet']
      and all(fact(read(a,k))==fact(read(b,k))==A[k] for k in maps+pack),'map/collision or art packet changed')
 def norm(z):
  for x,y in pairs:z=z.replace(y.encode(),x.encode()).replace(Path(y).name.encode(),Path(x).name.encode())
  return z
 need(all(norm(read(b,k))==read(a,k) for k in SHELL) and all(norm(read(b,y))==read(a,x)for x,y in pairs[len(dif):]),'alias-normalized shell not exact')
 paths=sorted({y for _,y in pairs}|SHELL|{MAN});need(len(paths)==len(dif)+7,'wrong exact stored closure')
 save(w,'GRAPH.json',{'activeAssetsAnd50MapsExact':True,'orderedModulesExactOutsideReadability':True,'mapCount':50,'assetPacketCount':50,
  'repacked':[list(d)for d in dif],'owners':obs['owners'],'allRenamedPaths':pairs,'routes':obs['routes'],'mustObserveB':obs['mustObserveB'],
  'B':{**B,**{k:fact(read(b,k))for k in SHELL|{MAN}}}})
def seal(w):
 o=w/'out';b=w/'B';h=json.loads((o/'BROWSER.json').read_bytes());g=json.loads((o/'GRAPH.json').read_bytes())
 need(h['status']=='PASS_STAGE7_ACTUAL_TWO_DEVICE_SE_SCOPE_PENDING_VISUAL_REVIEW','normal candidate did not check all four images')
 for side in ('PC','M'):
  for arm in 'AB':
   f=h['views'][side][arm]['PNG'];need(fact(read(o,f['path']))==f['fact'],'actual captured image bytes changed')
 paths=sorted({y for _,y in g['allRenamedPaths']}|SHELL|{MAN});d=o/'B-generated-pending-art';d.mkdir()
 z=d/'B-EXACT-NORMAL-GENERATED-NO-DEPLOY.zip';files={}
 with zipfile.ZipFile(z,'x',compression=zipfile.ZIP_DEFLATED)as f:
  for k in paths:
   v=read(b,k);need(fact(v)==g['B'][k],'after capture generated payload changed')
   files[k]=stamp(v);f.writestr(k,v)
 (d/'SEAL.json').write_text(json.dumps({'status':h['status'],'authorPath':SRC,'author':P['candidate'],'base':P['release']['head'],
  'noDeployAuthorized':True,'requiresPublishedRetention':True,'files':files,'zip':fact(z.read_bytes()),
  'browser':fact(read(o,'BROWSER.json')),'graph':fact(read(o,'GRAPH.json'))},indent=2)+'\n')
if __name__=='__main__':{'pre':pre,'observe':observe,'build':build,'seal':seal}[sys.argv[1]](Path(sys.argv[2]))
