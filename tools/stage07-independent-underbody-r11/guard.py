import os,json,re,sys,subprocess,hashlib
from pathlib import Path
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_text());SRC=P['productTrackedScratchOnly'];MAN='web/manifest.json'
SHELL={'HONRO.html','HONRO_WORKSHOP.html','index.html'}
MAP='web/data/chapter-07.28f7bf612a598aeb.json';PKT='web/data/chapter-07-assets.7068fa05c6ce1c2e.json'
TAG='refs/heads/qa/stage07-independent-underbody-r11-733d5'
def fact(b):return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
def stamp(b):return {**fact(b),'git':hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()}
def need(ok,msg):
 if not ok:raise RuntimeError(msg)
def git(r,*x):return subprocess.check_output(['git','-C',str(r),*x],timeout=90,text=True).strip()
def read(r,k):
 p=r/k;need(p.is_file() and not p.is_symlink() and p.resolve().is_relative_to(r.resolve()),('invalid path',k))
 return p.read_bytes()
def save(w,k,v):(w/'out'/k).write_text(json.dumps(v,indent=2)+'\n')
def pre(w):
 repo=Path(os.environ['GITHUB_WORKSPACE']);sha=os.environ['GITHUB_SHA'];base=P['base']
 need(P['enabled'] is True and P['qaOnly'] is True and P['remote'] is False,'disabled guard; exact local review mandatory')
 need((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',TAG),'wrong admitted run authority')
 fs={'PINS.json','POSES.json','guard.py','capture.py','observer.json','candidate-terrain-domain.js','art-payload.json','preflight.cjs'}
 expected={'.github/workflows/stage07-independent-underbody-r11.yml',*(f'tools/stage07-independent-underbody-r11/{f}' for f in fs)}
 need(git(repo,'rev-list','--parents','-1','HEAD').split()==[sha,base] and git(repo,'rev-parse',base+'^{tree}')==P['tree'] and not git(repo,'status','--porcelain') and set(git(repo,'diff','--no-renames','--name-status',base,sha).splitlines())=={'A\t'+x for x in expected},'not exact added-only reviewed transport')
 for k in 'AB':git(repo,'worktree','add','--detach',str(w/k),base)
 A=w/'A';B=w/'B';x=stamp(read(A,MAN));need(x['git']=='10d3c091c96dccbc2a92bbe4434a00f128abb56e' and x['bytes']==7994676,'stock manifest pinned Git identity differs')
 need(stamp(read(A,SRC))==P['fileA'] and stamp(read(D,'candidate-terrain-domain.js'))==P['fileB'],'source pins changed')
 need(all(fact(read(A,p))['sha256']==P['stage07Stock'][k] for k,p in [('map',MAP),('packet',PKT)]),'canonical Stage7 bytes changed')
 subprocess.run(['node',str(D/'preflight.cjs'),str(A/PKT)],check=True)
 (B/SRC).write_bytes(read(D,'candidate-terrain-domain.js'))
 need(git(B,'diff','--name-status')=='M\t'+SRC,'unexpected QA product content')
 save(w,'SOURCE.json',{'base':base,'tree':P['tree'],'head':sha,'publisherManifestGit':x,'A':P['fileA'],'B':P['fileB'],'modifiedTrackedInScratchOnly':[SRC]})
def minify(b,path):
 js="""import fs from 'node:fs';import {minify} from 'terser';const raw=fs.readFileSync(process.argv[1],'utf8').replace(/\\r\\n/g,'\\n');const r=await minify("(()=>{\\n'use strict';\\n"+raw+"\\n})();\\nawait yieldIfNeeded();\\n",{module:true,compress:false,mangle:false,format:{comments:false}});process.stdout.write(r.code);"""
 return subprocess.check_output(['node','--input-type=module','-e',js,str(path)],cwd=b,timeout=45)
def runtime(k):return re.fullmatch(r'web/runtime/ordered-common-[0-9]+\.[a-f0-9]{16}\.js',k) is not None
def inv(m):
 a={x['path']:{k:x[k]for k in ('bytes','sha256')}for x in m['files']}
 need(len(a)==len(m['files']),'duplicate active paths')
 return a
def flat(base,keys):
 data=[];re_header=re.compile(rb'import\{yieldIfNeeded\}from"./load-data\.[a-f0-9]{16}\.js";')
 for k in keys:
  raw=read(base,k);h=re_header.match(raw)
  need(h and raw.endswith(b'await yieldIfNeeded();\n'),'wrong chunk envelope')
  data.append((h[0],raw[h.end():-1]))
 need(data and len({x[0]for x in data})==1,'loader header changed')
 return data[0][0],b''.join(x[1]for x in data)
def closure(w):
 A=w/'A';B=w/'B';a,b=(json.loads(read(root,MAN))for root in(A,B));ia,ib=map(inv,(a,b))
 need(stamp(read(A,SRC))==P['fileA'] and stamp(read(B,SRC))==P['fileB'],'built source drifted')
 need(a['project']==b['project'] and a['project']==P['stage07Stock']['campaignDescriptor'],'physical campaign descriptor changed')
 proj=json.loads(read(A,a['project']));maps=proj['stages'];pack=proj['stageLibraries']
 need(len(maps)==len(pack)==50 and maps[6]==MAP and pack[6]==PKT,'current authority changed')
 need(all(read(A,k)==read(B,k)for k in [a['project'],*maps,*pack]),'canonical stage data/packet modified')
 x=a['common'][:];y=b['common'][:]
 while x and y and x[0]==y[0]:x.pop(0);y.pop(0)
 while x and y and x[-1]==y[-1]:x.pop();y.pop()
 need(x and y and all(runtime(k) for k in [*x,*y]) and a['gameOnly']==b['gameOnly'],'non-target runtime partition changed')
 aa,bb=minify(B,A/SRC),minify(B,B/SRC)
 ha,ta=flat(A,x);hb,tb=flat(B,y)
 ma=[k for k in x if read(A,k).count(aa)==1];mb=[k for k in y if read(B,k).count(bb)==1]
 need(ha==hb and ta.count(aa)==1 and ta.replace(aa,bb,1)==tb and len(ma)==len(mb)==1,'nonlocal code changed in packed graph')
 links=[(a[k].split('?')[0],b[k].split('?')[0])for k in ('gameEntry','workshopEntry','playtest')]
 need(a['gameEntry'].split('?')[0]==P['stage07Stock']['shellEntry'],'stock entry authority changed')
 need(ia.keys()-ib.keys()==set(x)|{k for k,_ in links} and ib.keys()-ia.keys()==set(y)|{k for _,k in links} and all(ia[k]==ib[k]for k in ia.keys()&ib.keys()),'non-target active modules/assets changed')
 need(all(ia[k]==fact(read(A,k)) for k in x)and all(ib[k]==fact(read(B,k)) for k in y),'packed file content-address disagreement')
 # The builder may split at a different width. Compare each full entry after only
 # replacing its exact ordered import arrays and shell entry pointers.
 def span(raw,seq):
  names=','.join('new URL("../runtime/'+Path(k).name+'",import.meta.url).href' for k in seq).encode()
  need(raw.count(names)==1,'exact ordered packed span not uniquely in entry')
  return raw.replace(names,b'@@EXACT_SEMANTIC_ORDERED_MODULE_SPAN@@',1)
 for i,(a1,b1) in enumerate(links):
  z=read(A,a1);q=read(B,b1)
  need(ia[a1]==fact(z) and ib[b1]==fact(q),'entry addresses differ from manifest')
  if i<2:
   need(span(z,x)==span(q,y),'changed bytes in normal entries outside the exact ordered module array')
  else:
   old,new=links[0]
   nn=Path(new).name.encode();oo=Path(old).name.encode()
   need(q.count(nn)==z.count(oo)==1 and q.replace(nn,oo,1)==z,'playtest route new opaque bytes')
 for k in SHELL:
  q=read(B,k)
  for a1,b1 in links:q=q.replace(Path(b1).name.encode(),Path(a1).name.encode())
  need(q==read(A,k),'outer shell opaque change')
 routes={}
 for arm,root,m,one in [('A',A,a,ma[0]),('B',B,b,mb[0])]:
  keys=['HONRO.html',m['gameEntry'].split('?')[0],m['project'],MAP,PKT,one,P['stage07Stock']['campaignWrapper']]
  routes[arm]={k:fact(read(root,k))for k in keys}
 save(w,'GRAPH.json',{'canonicalMapsAndPacketsExact':True,'activeMapRoute':MAP,'activeAssetRoute':PKT,'affectedOrderedPaths':{'A':x,'B':y},'routes':routes,'authority':P['base'],'noDeploy':True})
if __name__=='__main__':{'pre':pre,'closure':closure}[sys.argv[1]](Path(sys.argv[2]))
