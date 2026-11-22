"""One standard Stage26 candidate build, stock public A. Disabled until exact Pages authority."""
import hashlib,json,os,re,subprocess,sys,zipfile
from pathlib import Path
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes());M='web/manifest.json';SRC=P['source'];OPT=P['optimizer']
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def stamp(b):return {**fact(b),'git':hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()}
def need(ok,msg):
 if not ok:raise RuntimeError(msg)
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a],timeout=90,text=True).strip()
def rd(r,k):
 p=(r/k);need(p.is_file() and p.resolve().is_relative_to(r.resolve()),('unsafe path',k))
 return p.read_bytes()
def save(w,k,o):(w/'out'/k).write_text(json.dumps(o,indent=2)+'\n')
def clipChange(a):
 old=a['vector']['clips']['b'][0];L,R=P['clipOffset'];e=old[L:R]
 need(L==11667 and R==13469 and e.startswith('m593.3 152.3-5.2-.3')and e.endswith('z')and old[R:].startswith('m19-96.3'),'wrong original clip subpath')
 return old.encode(),(old[:L]+'m593.3 152.3z'+old[R:]).encode()
def splice(raw,a,b):
 need(raw.count(a)==1,'expected unique stock source token')
 return raw.replace(a,b,1)
def vectorHash(a):
 # Test input numbers against Node's canonical serialization, not Python's float spelling.
 return sha(subprocess.check_output(['node','-e','process.stdout.write(JSON.stringify(JSON.parse(require("fs").readFileSync(0)).vector))'],input=a,timeout=25))
def pre(w):
 a=P['release'];base=a['head'];repo=Path(os.environ['GITHUB_WORKSPACE']);h=os.environ['GITHUB_SHA']
 need(P['enabled']is True and isinstance(a['pages'],dict) and not (os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN')),'disabled or unexpectedly credentialed')
 dep=a['pages'];need(dep.get('head')==base and dep.get('branch')=='master' and dep.get('conclusion')=='success'
     and all(type(dep.get(k))is int and dep[k]>0 for k in ('run','job')) and re.fullmatch(r'2026-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z', dep.get('publishedAt','')),'current actual Pages receipt not bound')
 fs={'.github/workflows/stage26-east-stump-onebuild.yml',*(str(D.relative_to(repo)/n)for n in ('PINS.json','guard.py','capture.py','observer.json'))}
 need((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',P['qaRef']),'wrong repo/event/ref')
 need(git(repo,'rev-list','--parents','-1','HEAD').split()==[h,base] and git(repo,'rev-parse',base+'^{tree}')==a['tree']
      and not git(repo,'status','--porcelain=v1')
      and set(git(repo,'diff','--no-renames','--name-status',base,h).splitlines())=={'A\t'+n for n in fs},'unexpected QA child')
 A=repo;B=w/'B';git(repo,'worktree','add','--detach',str(B),base)
 need(stamp(rd(A,M))=={**a['manifest'],'git':a['manifestGit']},'wrong exact released manifest')
 old=rd(A,SRC);need(stamp(old)==P['stock'] and vectorHash(old)==P['vectorA'],'wrong current source')
 x,y=clipChange(json.loads(old));new=splice(old,x,y)
 need(stamp(new)==P['candidate'] and vectorHash(new)==P['vectorB'],'wrong intended source')
 opt=rd(A,OPT);need(stamp(opt)['git']==P['optimizerGitA'],'wrong exact optimizer input');q=json.loads(opt);options=[v for v in q if v['id']==P['assetID']]
 need(len(options)==1 and options[0]['original']==P['vectorA'] and len(options[0]['paths'])==16,'unexpected approved Stage26 optimization')
 for path,key,val in options[0]['paths']:
  need(path[0]=='root' and key=='d','optimizer must never touch the clip or contacts')
 change=splice(opt,P['vectorA'].encode(),P['vectorB'].encode());options[0]['original']=P['vectorB']
 need(json.loads(change)==q,'not digest-only metadata')
 (B/SRC).write_bytes(new);(B/OPT).write_bytes(change)
 need(set(git(B,'diff','--name-status').splitlines())=={'M\t'+SRC,'M\t'+OPT},'other source changed')
 save(w,'SOURCE.json',{'head':h,'release':a,'source':P['candidate'],'optimizerBefore':stamp(opt),'optimizerAfter':stamp(change),'strict16PathsUnchanged':True})
def observe(w):
 A=Path(os.environ['GITHUB_WORKSPACE']);B=w/'B';ms=[json.loads(rd(t,M))for t in (A,B)]
 old=rd(A,SRC);x,y=clipChange(json.loads(old))
 cs=[json.loads(rd(t,v['project']))for (t,v)in zip((A,B),ms)]
 pb=cs[1]['stageLibraries'][25];pa=P['packetA'];mp=P['map']
 need(cs[0]['stages']==cs[1]['stages'] and cs[0]['stages'][25]==mp and len(cs[0]['stages'])==50,'other compiled map or collider URI differs')
 need(cs[0]['stageLibraries'][25]==pa and pb!=pa and re.fullmatch(r'web/data/chapter-26-assets\.[a-f0-9]{16}\.json',pb),'wrong Stage26 packet')
 need(cs[0]['stageLibraries'][:25]+cs[0]['stageLibraries'][26:]==cs[1]['stageLibraries'][:25]+cs[1]['stageLibraries'][26:],'other stage packet URI changed')
 a,b=rd(A,pa),rd(B,pb);need(splice(a,x,y)==b and rd(A,mp)==rd(B,mp),'active packet diff not exact source-only contour / map changed')
 need(stamp(rd(B,SRC))==P['candidate'],'built source drift')
 routes={}
 for k,t,v,pn in zip('AB',(A,B),ms,(pa,pb)):
  inv={r['path']:{n:r[n]for n in ('bytes','sha256')}for r in v['files']}
  entry=v['gameEntry'].split('?')[0];p=v['project']
  wrapper=re.findall(rb'\.\./runtime/(campaign\.[a-f0-9]{16}\.js)',rd(t,entry))
  need(len(wrapper)==1,'no unique active campaign wrapper')
  u='web/runtime/'+wrapper[0].decode();need(Path(p).name.encode() in rd(t,u),'wrong active campaign wrapper')
  keys={mp,pn,p,entry,u,'HONRO.html'}
  routes[k]={n:fact(rd(t,n))for n in sorted(keys)}
  need(all(inv[n]==routes[k][n]for n in keys-{'HONRO.html'}),'wrong build address attachment')
  need(pn.endswith(routes[k][pn]['sha256'][:16]+'.json'),'wrong asset hash URL')
 save(w,'NATIVE-ROUTES.json',{'routes':routes,'assetClipOnly':True,'mapBytesUnchanged':True,'otherStagePointersUnchanged':True,'notReleaseApproval':True})
def seal(w):
 A=Path(os.environ['GITHUB_WORKSPACE']);B=w/'B';o=w/'out'
 cap=json.loads(rd(o,'BROWSER.json')); obs=json.loads(rd(o,'NATIVE-ROUTES.json'))
 need(cap['status']=='PASS_STAGE26_ACTUAL_TWO_DEVICE_EAST_STUMP_SCOPE_PENDING_VISUAL_REVIEW','actual visual packet failed')
 old,new=(json.loads(rd(r,M)) for r in (A,B))
 ia,ib=({x['path']:fact(rd(t,x['path'])) for x in v['files']}for t,v in ((A,old),(B,new)))
 added=sorted(set(ib)-set(ia)); dropped=sorted(set(ia)-set(ib))
 need(len(added)<=12 and len(added)==len(dropped) and len(ib)==len(ia)==810 and
      all(ia[k]==ib[k] for k in set(ia)&set(ib)), 'unexpected active asset change')
 need(all(k.startswith(('web/data/chapter-26-assets.','web/data/campaign.','web/runtime/campaign.','web/entries/'))for k in added+dropped),'unrelated new or displaced active asset')
 need(set(obs['routes']['B'])-{'HONRO.html'}<=set(ib) and all(ib[k]==v for k,v in obs['routes']['B'].items() if k!='HONRO.html'),'verified routes did not seal')
 d=o/'B-generated-pending-art';d.mkdir()
 z=d/'B-EXACT-NORMAL-GENERATED-NO-DEPLOY.zip';files={}
 with zipfile.ZipFile(z,'x',compression=zipfile.ZIP_DEFLATED)as f:
  for k in [*added,*sorted({M,SRC,OPT,'HONRO.html','HONRO_WORKSHOP.html','index.html'})]:
   v=rd(B,k);files[k]=stamp(v);f.writestr(k,v)
 (d/'SEAL.json').write_text(json.dumps({'status':cap['status'],'base':P['release']['head'],'files':files,
   'add':added,'displaced':dropped,'zip':fact(z.read_bytes()),'visual':fact(rd(o,'BROWSER.json')),
   'routes':fact(rd(o,'NATIVE-ROUTES.json')),'released':False},indent=2)+'\n')
if __name__=='__main__':{'pre':pre,'observe':observe,'seal':seal}[sys.argv[1]](Path(sys.argv[2]))
