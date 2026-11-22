import os,json,re,sys,subprocess,hashlib,gzip,urllib.request,base64
from pathlib import Path
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_text());SRC=P['productTrackedScratchOnly'];MAN='web/manifest.json'
SHELL={'HONRO.html','HONRO_WORKSHOP.html','index.html'}
MAP='web/data/chapter-07.28f7bf612a598aeb.json';PKT='web/data/chapter-07-assets.7068fa05c6ce1c2e.json'
TAG='refs/heads/qa/stage07-facies-contained-0b9-r2'
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
 fs={'PINS.json','POSES.json','guard.py','capture.py','observer.json','candidate-author.mjs','candidate-terrain-domain.js','art-payload.json','preflight.cjs'}
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
  need(response.status==200 and response.geturl()==public and stamp(require)==x,'public candidate baseline did not match exact 0b9 authority')
 c12=P['release']['common12'];p12=c12['path'];oldprofile=P['release']['profile']
 need(stamp(read(A,p12))=={k:v for k,v in c12.items() if k!='path'},'0b9 save-hotfix compiled common12 identity changed')
 need(all(stamp(read(A,oldprofile['path']))[k]==oldprofile[k]for k in ('git','bytes')),'0b9 profile-store source identity changed')
 for route,expected in P['runtimeFiles'].items():
  need(stamp(read(A,route))['git']==expected,('current unchanged runtime source drift',route))
 need(all(fact(read(A,p))['sha256']==P['stage07Stock'][k] for k,p in [('map',MAP),('packet',PKT)]),'canonical Stage7 bytes changed')
 written=[]
 for route,pin in P['candidateSource'].items():
  src=read(D,pin['local'])
  need(stamp(src)==pin['new'],('candidate exact source',route))
  if pin['old'] is None:need(not (A/route).exists(),('unexpected old attached asset',route))
  else:need(stamp(read(A,route))==pin['old'],('pin original tracked source',route))
  (B/route).write_bytes(src);written.append(('?? ' if pin['old'] is None else ' M ')+route)
 # git's leading directory whitespace must not be lost by the convenience git() wrapper.
 raw=subprocess.check_output(['git','-C',str(B),'status','--porcelain','--untracked-files=all'],timeout=90,text=True)
 need(set(raw.splitlines())==set(written),'unexpected QA product content')
 subprocess.run(['node',str(D/'preflight.cjs'),str(A/PKT)],check=True)
 h=P['legacy33'];hdir=w/'H';hdir.mkdir()
 # One historic unmodified shell using A's exact retained immutable routes. No raw saves exported.
 historic=base64.b64decode(json.loads(read(D,'observer.json'))['LEGACY33']['HISTORIC_SHELL_BASE64'],validate=True)
 need(stamp(historic)==h['oldShell'] and all(fact(read(A,k))==v for k,v in h['oldRoutes'].items()),'c60 historic Stage33 graph identity changed')
 ar=json.loads(read(A,MAN));old=next((x for x in ar['publishedGenerations']if x['sourceSha']==h['old']),None)
 need(old is not None,'c60 old graph not published and retained')
 archived=inv({'files':old['files']})
 need(all(archived[k]==v for k,v in h['oldRoutes'].items()),'archive c60 routes not qualified')
 (hdir/'HONRO.html').write_bytes(historic); (hdir/'web').symlink_to(A/'web',target_is_directory=True)
 save(w,'SOURCE.json',{'base':base,'tree':P['tree'],'head':sha,'publisherManifestGit':x,'A':P['fileA'],'B':P['fileB'],'modifiedTrackedInScratchOnly':list(P['candidateSource'])})
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
def bridge(a,b,A,B,ia,ib,ma,mb,wrap):
 # Reassemble the native IIFE sequence, respecting exact nonordered module/async barriers.
 # Renumbering alone can never change reassembled bytes.
 paired=[];hits=0;ownerA=[];ownerB=[]
 for f,k in [('common','common'),('gameOnly','game')]:
  x,y=runs(a[f],k),runs(b[f],k)
  need(len(x)==len(y),'different barrier tracks')
  for ra,rb in zip(x,y):
   need(ra[0]==rb[0],'fixed native transform across a script barrier')
   if ra[0]=='fixed':
    v,n=ra[1],rb[1]
    if (v,n)==wrap:
     p,q=read(A,v),read(B,n);u,w=(a['project'].encode(),b['project'].encode())
     need(p.count(u)==q.count(w)==1 and p.replace(u,w,1)==q,'campaign wrapper is not pointer-only')
     paired.append(([v],[n]))
    else:need(v==n and ia[v]==ib[v] and read(A,v)==read(B,v),'non-ordered sibling moved or changed')
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
 oldProject=a['project'];newProject=b['project'];need(oldProject==P['stage07Stock']['campaignDescriptor'] and newProject!=oldProject,'campaign descriptor authority')
 projA,projB=[json.loads(read(r,n))for r,n in ((A,oldProject),(B,newProject))]
 maps=projA['stages'];pack=projA['stageLibraries'];mapsB=projB['stages'];packB=projB['stageLibraries'];f=P['newChapter']
 need(len(maps)==len(pack)==len(mapsB)==len(packB)==50 and maps[6]==MAP and pack[6]==PKT and mapsB[6]==f['newMap']['url'] and packB[6]==f['newPacket']['url'],'signed chapter entries mismatch')
 route=[]
 for r,m,d,k in ((A,MAP,PKT,'old'),(B,mapsB[6],packB[6],'new')):
  for p,key in [(m,'Map'),(d,'Packet')]:
   want=f[k+key];need(fact(read(r,p))=={i:want[i]for i in ('bytes','sha256')},('cold stage7 exact bytes differ',r.name,p))
  route.append([m,d])
 need(all(maps[i]==mapsB[i] and pack[i]==packB[i] and read(A,maps[i])==read(B,maps[i]) and read(A,pack[i])==read(B,pack[i]) for i in range(50) if i!=6),'canonical non7 chapter changed')
 ma0,mb0=[json.loads(read(r,m))for r,m in ((A,MAP),(B,mapsB[6]))]
 art='act1-site:7:r7-facies';need(mb0['meta'].pop('r7FaciesAssetId')==art and ma0==mb0,'chapter 7 sent new battle/map fields, not author-only')
 pa,pb=[json.loads(read(r,p))for r,p in ((A,PKT),(B,packB[6]))]
 extra=[o for o in pb if o['id']==art]
 need(len(extra)==1 and [o for o in pb if o['id']!=art]==pa and extra[0]['vector']==json.loads(read(D,'art-payload.json')) and extra[0]['collision']==[],'original compiled Stage7 asset order or provider changed')
 need(art not in projA['libraryOrder'] and projB['libraryOrder'].count(art)==1,'one optional Workshop owner')
 orig=projB['libraryOrder'][:];orig.remove(art)
 need(orig==projA['libraryOrder'] and all(projA[k]==projB[k]for k in projA if k not in ('libraryOrder','stages','stageLibraries')) and set(projA)==set(projB),'unexpected descriptor options/order/catalog/shared compatibility drift')
 c32=P['archive32'];need(projA['compatibility32']==projB['compatibility32']==c32 and read(A,c32)==read(B,c32),'Stage32 archived art changed')
 oldWrap=P['stage07Stock']['campaignWrapper']; token=newProject.encode()
 expected=P['entryPointerWitness']['derivedDescriptor']
 need(newProject==expected['path'] and fact(read(B,newProject))=={k:expected[k]for k in ('bytes','sha256')},'exact observed failed-build campaign descriptor drift')
 choices=[k for k in ib if re.fullmatch(r'web/runtime/campaign\.[a-f0-9]{16}\.js',k) and read(B,k).count(token)==1]
 need(len(choices)==1,'no unique actual signed new campaign wrapper')
 newWrap=choices[0];wrap=(oldWrap,newWrap)
 expected=P['entryPointerWitness']['actualObservedWrapper']
 need(newWrap==expected['path'] and fact(read(B,newWrap))=={k:expected[k]for k in ('bytes','sha256')},'exact already observed campaign preload wrapper drift')
 known={'project','common','gameOnly','files','gameEntry','workshopEntry','playtest','previousFiles','previousGenerations'}
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
 pairs,ownerA,ownerB=bridge(a,b,A,B,ia,ib,ma,mb,wrap)
 links=[(a[k].split('?')[0],b[k].split('?')[0])for k in ('gameEntry','workshopEntry','playtest')]
 need(a['gameEntry'].split('?')[0]==P['stage07Stock']['shellEntry'],'stock entry authority changed')
 lost={k for x,y in pairs for k in x if k not in ib};more={k for x,y in pairs for k in y if k not in ia}
 need(ia.keys()-ib.keys()==lost|{g for g,h in links if g!=h}|{oldProject,MAP,PKT} and ib.keys()-ia.keys()==more|{h for g,h in links if g!=h}|{newProject,mapsB[6],packB[6]} and all(ia[k]==ib[k]for k in ia.keys()&ib.keys()),'non-target active modules/assets changed')
 # Known bootstrap builds exactly one modules array. Replace signed full ordered runs within it,
 # including runs whose structural file names merely shifted; do not normalize opaque program text.
 c12=P['release']['common12'];path12=c12['path'];profile=P['release']['profile'];reg=P['exactRegistryR7']
 old=read(A,path12)
 k,l=reg['stockByteSpan'];body=old[k:l]
 h=2166136261
 for i in body:h=((h^i)*16777619)&0xffffffff
 need(path12 in a['common'] and stamp(old)=={k:v for k,v in c12.items() if k!='path'} and
      fact(body)=={m:reg[m]for m in ('bytes','sha256')} and format(h,'x')==reg['fnv'] and
      all(body.count(token.encode('ascii'))>0 for token in reg['tokens']), 'exact 0b9 existing compatibility table changed')
 found=[(n,read(B,n)) for n in b['common'] if ordered(n) and b'HONRO_PREVIOUS_TERRAIN_ART=' in read(B,n)]
 need(len(found)==1 and found[0][1].count(body)==1 and found[0][1].count(b'globalThis.HONRO_PREVIOUS_TERRAIN_ART=')==1,'existing compatibility table is not present exactly once, byte-exact')
 b13,new=found[0];newRegistry={'path':b13,**fact(new)}
 prof=read(A,profile['path'])
 need(stamp(prof)=={k:v for k,v in profile.items() if k!='path'} and prof==read(B,profile['path']) and all(token.encode('ascii') in prof for token in P['profile46Tokens']),'unrelated profile store source or exact Stage46 tokens changed')
 peer={}
 for case in (32,33,40,42,44,46):
  m=maps[case-1];d=pack[case-1];keys=[m,d]
  if '-parts.' in d:
   desc=json.loads(read(A,d)); rows=desc['parts']; need(rows and all(isinstance(v,dict) and isinstance(v.get('path'),str) for v in rows),'invalid protected split authority')
   for r in rows:
    v=r['path'];rel=v if v.startswith('web/') else str(Path(d).parent/v)
    keys.append(rel)
  rec={k:fact(read(A,k)) for k in keys}
  need([m,d]==P['protectedPeerRoutes'][str(case)],('signed peer route witness identity',case))
  need(all(ia[k]==ib[k]==v and fact(read(B,k))==v for k,v in rec.items()),('protected peer packet split bytes changed',case))
  peer[case]=rec
 def prefetchProof(v,side):
  p=P['entryPointerWitness']; route=(oldProject,newProject)[side]
  target=('prefetchProject('+json.dumps(route)+');').encode('ascii')
  one=(p['oldPrefetch'] if side==0 else p['newPrefetch']).encode('ascii')
  need(target==one and v.count(one)==1 and v.count(b'prefetchProject(')==1,'signed prefetchProject literal not present exactly once')
  return v.replace(one,b'@EXACT_PREFETCH_PROJECT@',1)
 def entry(v,side):
  v=prefetchProof(v,side)
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
  if i<2:
   exp=P['entryPointerWitness']['computedGameJS' if i==0 else 'computedWorkshop']
   need(b1==exp['path'] and fact(q)=={k:exp[k]for k in ('bytes','sha256')},'signed target full entry identity differs')
   need(entry(zz,0)==entry(q,1),'non-address and non-signed-prefetch bytes changed in regular entry scripts')
  else:
   need(b1==P['entryPointerWitness']['actualBObservedPlaytest'],'exact observed B playtest address drift')
   old,new=links[0];nn=Path(new).name.encode();oo=Path(old).name.encode()
   need(q.count(nn)==zz.count(oo)==1 and q.replace(nn,oo,1)==zz,'playtest route new opaque bytes')
 for k in SHELL:
  q=read(B,k)
  for a1,b1 in links:q=q.replace(Path(b1).name.encode(),Path(a1).name.encode())
  need(q==read(A,k),'outer shell opaque change')
 routes={}
 for arm,root,m,one in [('A',A,a,ownerA),('B',B,b,ownerB)]:
  keys=['HONRO.html',m['gameEntry'].split('?')[0],m['project'],*(route[0] if arm=='A' else route[1]),one,oldWrap if arm=='A' else newWrap,path12 if arm=='A' else b13]
  routes[arm]={k:fact(read(root,k))for k in keys}
 save(w,'GRAPH.json',{'otherCanonicalMapsAndPacketsExact':True,'chapterA':route[0],'chapterB':route[1],'workshopOneUnplacedAsset':True,'chapterPoolWitness':P['newChapter'],'exactProtectedPeerLeafProof':peer,'activeMapRoute':MAP,'activeAssetRoute':PKT,'affectedOrderedPaths':pairs,'routes':routes,'authority':P['base'],'compiledIsolatedModule':{'oldBytes':len(ma),'newBytes':len(mb),'oldGzip':len(gzip.compress(ma,mtime=0)),'newGzip':len(gzip.compress(mb,mtime=0))},'oldManifest':stamp(read(A,MAN)),'newManifest':stamp(read(B,MAN)),'sameActiveCampaignDependencyGraphExceptExactRuntimeChapter7AndPointerAliases':True,'legacy33CompatExact':{'A':c12,'B':newRegistry,'block':reg,'stage33Current':P['legacy33']['currentMapFacts']},'noDeploy':True})
if __name__=='__main__':{'pre':pre,'closure':closure}[sys.argv[1]](Path(sys.argv[2]))
