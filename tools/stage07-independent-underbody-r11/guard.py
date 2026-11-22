import os,json,re,sys,subprocess,hashlib,gzip,urllib.request
from pathlib import Path
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_text());SRC=P['productTrackedScratchOnly'];MAN='web/manifest.json'
SHELL={'HONRO.html','HONRO_WORKSHOP.html','index.html'}
MAP='web/data/chapter-07.28f7bf612a598aeb.json';PKT='web/data/chapter-07-assets.7068fa05c6ce1c2e.json'
TAG='refs/heads/qa/stage07-independent-underbody-r11-342a7aa-r2'
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
 A=w/'A';B=w/'B';x=stamp(read(A,MAN));need(x==P['release']['manifest'],'stock manifest pinned Git identity differs')
 pg=P['release']['pages'];need(pg and pg['head']==base and pg['conclusion']=='success','current Pages success prerequisite unavailable')
 # Compare public bytes exactly once at the normal origin; never fall back to another release.
 public='https://sys8994.github.io/honro/web/manifest.json'
 req=urllib.request.Request(public,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache','User-Agent':'Mozilla/5.0 HONRO actual Stage7 R2'})
 with urllib.request.urlopen(req,timeout=45)as response:
  require=response.read(P['release']['manifest']['bytes']+1)
  need(response.status==200 and response.geturl()==public and stamp(require)==x,'public candidate baseline did not match exact 342 authority')
 c12=P['release']['common12'];p12=c12['path'];oldprofile=P['release']['profile']
 need(stamp(read(A,p12))=={k:v for k,v in c12.items() if k!='path'},'342 save-hotfix compiled common12 identity changed')
 need(all(stamp(read(A,oldprofile['path']))[k]==oldprofile[k]for k in ('git','bytes')),'342 profile-store source identity changed')
 need(stamp(read(A,SRC))==P['fileA'] and stamp(read(D,'candidate-terrain-domain.js'))==P['fileB'],'source pins changed')
 need(all(fact(read(A,p))['sha256']==P['stage07Stock'][k] for k,p in [('map',MAP),('packet',PKT)]),'canonical Stage7 bytes changed')
 subprocess.run(['node',str(D/'preflight.cjs'),str(A/PKT)],check=True)
 (B/SRC).write_bytes(read(D,'candidate-terrain-domain.js'))
 need(git(B,'diff','--name-status')=='M\t'+SRC,'unexpected QA product content')
 save(w,'SOURCE.json',{'base':base,'tree':P['tree'],'head':sha,'publisherManifestGit':x,'A':P['fileA'],'B':P['fileB'],'modifiedTrackedInScratchOnly':[SRC]})
def minify(b,path):
 js="""import fs from 'node:fs';import {minify} from 'terser';const raw=fs.readFileSync(process.argv[1],'utf8').replace(/\\r\\n/g,'\\n');const r=await minify("(()=>{\\n'use strict';\\n"+raw+"\\n})();\\nawait yieldIfNeeded();\\n",{module:true,compress:false,mangle:false,format:{comments:false}});process.stdout.write(r.code);"""
 return subprocess.check_output(['node','--input-type=module','-e',js,str(path)],cwd=b,timeout=45)
def ordered(k):
 m=re.fullmatch(r'web/runtime/ordered-(common|game)-([1-9][0-9]*)\.([a-f0-9]{16})\.js',k)
 return (m[1],int(m[2]),m[3]) if m else None
def runs(xs,kind):
 answer=[]
 for p in xs:
  m=ordered(p)
  if m:
   need(m[0]==kind,'ordered chunk in wrong track')
   if answer and answer[-1][0]=='ordered':answer[-1][1].append(p)
   else:answer.append(('ordered',[p]))
  else:answer.append(('fixed',p))
 return answer
def check_numbering(m):
 vals=[ordered(p)[1]for k in ('common','gameOnly')for p in m[k]if ordered(p)]
 need(vals==list(range(1,len(vals)+1)),'out-of-order native pack ordinal')
 return vals
def bridge(a,b,A,B,ia,ib,ma,mb):
 # Reassemble the native IIFE sequence, respecting exact nonordered module/async barriers.
 # Renumbering alone can never change reassembled bytes.
 paired=[];hits=0;ownerA=[];ownerB=[]
 for f,k in [('common','common'),('gameOnly','game')]:
  x,y=runs(a[f],k),runs(b[f],k)
  need(len(x)==len(y),'different barrier tracks')
  for ra,rb in zip(x,y):
   need(ra[0]==rb[0],'fixed native transform across a script barrier')
   if ra[0]=='fixed':
    v=ra[1];need(v==rb[1] and ia[v]==ib[v] and read(A,v)==read(B,v),'non-ordered sibling moved or changed')
    continue
   xx,yy=ra[1],rb[1]
   for root,inv_,ls in [(A,ia,xx),(B,ib,yy)]:
    for p in ls:
     raw=read(root,p);v=fact(raw)
     need(inv_[p]==v and ordered(p)[2]==v['sha256'][:16],'ordered content address differs from actual')
   hx,s=flat(A,xx);hy,z=flat(B,yy)
   need(hx==hy,'loader header mismatch')
   if s==z:
    need(len(xx)==len(yy) and all(read(A,j)==read(B,n) for j,n in zip(xx,yy)),'unapproved chunk layout change in unchanged ordered run')
   else:
    need(f=='common' and s.count(ma)==z.count(mb)==1 and s.replace(ma,mb,1)==z,'one signed terrain-domain source expected')
    hits+=1;ownerA.extend(v for v in xx if read(A,v).count(ma)==1);ownerB.extend(v for v in yy if read(B,v).count(mb)==1)
   if xx!=yy:paired.append((xx,yy))
 need(hits==len(ownerA)==len(ownerB)==1,'single authored source replacement has no exact holder')
 return paired,ownerA[0],ownerB[0]
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
 known={'common','gameOnly','files','gameEntry','workshopEntry','playtest','previousFiles','previousGenerations'}
 need(set(a)==set(b) and all(a[k]==b[k]for k in a if k not in known),'unrelated manifest/decode aliases changed')
 ixa={q['path']:q for q in a['files']};ixb={q['path']:q for q in b['files']}
 need(all(ixa[k]==ixb[k]for k in ixa.keys()&ixb.keys()),'unexpected manifest file metadata change')
 # Emit exact old/new URLs, repository bytes and numeric adapter before any graph adjudication.
 saves=[]
 for arm,root,m,i in [('A',A,a,ia),('B',B,b,ib)]:
  for k in ('common','gameOnly'):
   for at,p in enumerate(m[k]):
    raw=read(root,p)
    saves.append({'arm':arm,'track':k,'logicalIndex':at,'path':p,'hash':fact(raw),'declared':i[p],'ordered':ordered(p)})
 save(w,'ORDERED-ROUTES-UNADJUDICATED.json',{'scope':'observations only','partials':saves,'master':P['base']})
 check_numbering(a);check_numbering(b)
 ma,mb=minify(B,A/SRC),minify(B,B/SRC)
 pairs,ownerA,ownerB=bridge(a,b,A,B,ia,ib,ma,mb)
 links=[(a[k].split('?')[0],b[k].split('?')[0])for k in ('gameEntry','workshopEntry','playtest')]
 need(a['gameEntry'].split('?')[0]==P['stage07Stock']['shellEntry'],'stock entry authority changed')
 lost={k for x,y in pairs for k in x if k not in ib};more={k for x,y in pairs for k in y if k not in ia}
 need(ia.keys()-ib.keys()==lost|{g for g,h in links if g!=h} and ib.keys()-ia.keys()==more|{h for g,h in links if g!=h} and all(ia[k]==ib[k]for k in ia.keys()&ib.keys()),'non-target active modules/assets changed')
 # Known bootstrap builds exactly one modules array. Replace signed full ordered runs within it,
 # including runs whose structural file names merely shifted; do not normalize opaque program text.
 c12=P['release']['common12'];path12=c12['path'];profile=P['release']['profile']
 need(path12 in a['common'] and path12 in b['common'] and a['common'].index(path12)==b['common'].index(path12) and stamp(read(B,path12))=={k:v for k,v in c12.items()if k!='path'} and read(A,path12)==read(B,path12),'Stage33 legacy compatibility common12 must stay exact, same ordinal and position')
 need(read(A,profile['path'])==read(B,profile['path']),'unrelated profile store source diff')
 def entry(v,side):
  def span(seq):
   return ','.join('new URL("../runtime/'+Path(p).name+'",import.meta.url).href' for p in seq).encode()
  m=re.search(rb'\bmodules=\[([^\]]*)\]',v);need(m,'native entry modules array not found')
  text=m.group(1)
  for i,r in enumerate(pairs):
   names=span(r[side])
   if text.count(names)==0:continue # workshop does not import the game-only track.
   need(text.count(names)==1,'ambiguous ordered run in loader array');text=text.replace(names,b'@@'+str(i).encode()+b'@@',1)
  v=v[:m.start(1)]+text+v[m.end(1):]
  # Published Workshop links to the actual Playtest document. Permit only the separately known exact link.
  old,new=links[2]
  if side==1:
   n=v.count(new.encode());need(n<=1,'ambiguous playtest alias');v=v.replace(new.encode(),old.encode(),1)
  return v
 for i,(a1,b1) in enumerate(links):
  zz=read(A,a1);q=read(B,b1)
  need(ia[a1]==fact(zz) and ib[b1]==fact(q),'entry addresses differ from manifest')
  if i<2:need(entry(zz,0)==entry(q,1),'non-address bytes changed in regular entry scripts')
  else:
   old,new=links[0];nn=Path(new).name.encode();oo=Path(old).name.encode()
   need(q.count(nn)==zz.count(oo)==1 and q.replace(nn,oo,1)==zz,'playtest route new opaque bytes')
 for k in SHELL:
  q=read(B,k)
  for a1,b1 in links:q=q.replace(Path(b1).name.encode(),Path(a1).name.encode())
  need(q==read(A,k),'outer shell opaque change')
 routes={}
 for arm,root,m,one in [('A',A,a,ownerA),('B',B,b,ownerB)]:
  keys=['HONRO.html',m['gameEntry'].split('?')[0],m['project'],MAP,PKT,one,P['stage07Stock']['campaignWrapper'],path12]
  routes[arm]={k:fact(read(root,k))for k in keys}
 save(w,'GRAPH.json',{'canonicalMapsAndPacketsExact':True,'activeMapRoute':MAP,'activeAssetRoute':PKT,'affectedOrderedPaths':pairs,'routes':routes,'authority':P['base'],'compiledIsolatedModule':{'oldBytes':len(ma),'newBytes':len(mb),'oldGzip':len(gzip.compress(ma,mtime=0)),'newGzip':len(gzip.compress(mb,mtime=0))},'oldManifest':stamp(read(A,MAN)),'newManifest':stamp(read(B,MAN)),'sameActiveCampaignDependencyGraphExceptExactRuntimeAndThreeEntryAliases':True,'legacy33CompatExact':c12,'noDeploy':True})
if __name__=='__main__':{'pre':pre,'closure':closure}[sys.argv[1]](Path(sys.argv[2]))
