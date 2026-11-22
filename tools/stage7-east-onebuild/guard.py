import hashlib,json,os,subprocess,sys,zipfile
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
def build(w):
 a,b=w/'A',w/'B';m,n=(json.loads(read(t,MAN))for t in (a,b));A,B=map(inv,(m,n))
 need(stamp(read(a,SRC))==P['stock'] and stamp(read(b,SRC))==P['candidate'],'source changed after compile')
 need(all(k in SHELL|{SRC} or k.startswith('web/') for k in git(b,'diff','--name-only').splitlines()),'non-target code changed')
 q=list(zip(m['common'],n['common']))
 dif=[(x,y)for x,y in q if x!=y]
 need(len(m['common'])==len(n['common']) and len(dif)==1 and dif[0][0]==P['oldRuntime'] and dif[0][1].startswith('web/runtime/ordered-common-16.')
      and m['gameOnly']==n['gameOnly'],'outside runtime positions changed')
 old,new=dif[0]; aa,bb=read(a,old),read(b,new);ma,mb=(mini(b,t/SRC)for t in (a,b))
 need(aa.count(ma)==1 and mb!=ma and aa.replace(ma,mb,1)==bb and A[old]==fact(aa) and B[new]==fact(bb),'more than one authored IIFE changed inside common16')
 pairs=[(old,new)]+[(m[k].split('?')[0],n[k].split('?')[0])for k in ('gameEntry','workshopEntry','playtest')]
 need(len({x for x,_ in pairs})==len({y for _,y in pairs})==4 and all(x!=y for x,y in pairs),'unexpected alias closure')
 need(A.keys()-B.keys()=={x for x,_ in pairs} and B.keys()-A.keys()=={y for _,y in pairs} and all(A[k]==B[k]for k in A.keys()&B.keys()),'unrelated active asset bytes changed')
 need(m['project']==n['project'] and A[m['project']]==B[n['project']],'campaign packet changed')
 c=json.loads(read(a,m['project']));maps,pack=c['stages'],c['stageLibraries']
 need(len(set(maps))==len(set(pack))==50 and maps[6]==P['map'] and pack[6]==P['packet']
      and all(fact(read(a,k))==fact(read(b,k))==A[k] for k in maps+pack),'map/collision or art packet changed')
 def norm(z):
  for x,y in pairs:z=z.replace(y.encode(),x.encode()).replace(Path(y).name.encode(),Path(x).name.encode())
  return z
 need(all(norm(read(b,k))==read(a,k) for k in SHELL) and all(norm(read(b,y))==read(a,x)for x,y in pairs[1:]),'alias-normalized shell not exact')
 base={P['map'],P['packet'],m['project'],'HONRO.html'}
 roles=[(base|{old,m['gameEntry'].split('?')[0]}),(base|{new,n['gameEntry'].split('?')[0]})]
 routes=[{k:fact(read(r,k))for k in sorted(keys)}for r,keys in zip((a,b),roles)]
 paths=sorted({y for _,y in pairs}|SHELL|{MAN});need(len(paths)==8,'wrong exact stored closure')
 save(w,'GRAPH.json',{'activeAssetsAnd50MapsExact':True,'orderedModulesExactOutsideReadability':True,'mapCount':50,'assetPacketCount':50,
  'repacked':[[old,new]],'allRenamedPaths':pairs,'routes':dict(zip('AB',routes)),'mustObserveB':sorted(roles[1]),
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
if __name__=='__main__':{'pre':pre,'build':build,'seal':seal}[sys.argv[1]](Path(sys.argv[2]))
