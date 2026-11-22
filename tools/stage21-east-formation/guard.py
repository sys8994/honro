import hashlib,json,os,re,subprocess,sys,zipfile
from pathlib import Path
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes()); M='web/manifest.json'; S=P['source']
def sha(b): return hashlib.sha256(b).hexdigest()
def fact(b):return {'bytes':len(b),'sha256':sha(b)}
def stamp(b):return {**fact(b),'git':hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()}
def need(ok,msg):
 if not ok:raise RuntimeError(msg)
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a],timeout=90,text=True).strip()
def rd(r,k):
 p=r/k;need(p.is_file() and p.resolve().is_relative_to(r.resolve()),('unsafe path',k))
 return p.read_bytes()
def save(w,k,v):(w/'out'/k).write_text(json.dumps(v,indent=2)+'\n')
def pre(w):
 repo=Path(os.environ['GITHUB_WORKSPACE']); head=os.environ['GITHUB_SHA']; a=P['release']; need(P['enabled'] is True and isinstance(a,dict),'disabled: bind new exact live authority first'); b=a['head']
 need(P['enabled'] is True and a['pages']['conclusion']=='success' and not (os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN')),'disabled or credentialed')
 need((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',P['qaRef']),'wrong repo/event/ref')
 fs={'.github/workflows/stage21-east-formation.yml',*(str(D.relative_to(repo)/x) for x in ('PINS.json','observer.json','guard.py','capture.py','candidate.js','footprint.py'))}
 need(git(repo,'rev-list','--parents','-1','HEAD').split()==[head,b] and git(repo,'rev-parse',b+'^{tree}')==a['tree'] and not git(repo,'status','--porcelain=v1')
 and set(git(repo,'diff','--name-status',b,head).splitlines())=={'A\t'+x for x in fs},'not exact QA-only child')
 need(stamp(rd(repo,M))==a['manifest'] and stamp(rd(repo,S))==P['stock'] and stamp(rd(D,'candidate.js'))==P['candidate'],'wrong exact current or candidate bytes')
 B=w/'B';git(repo,'worktree','add','--detach',str(B),b)
 (B/S).write_bytes(rd(D,'candidate.js'))
 need(git(B,'diff','--name-status').splitlines()==['M\t'+S],'non-target source changed')
 save(w,'SOURCE.json',{'baseline':a,'candidate':P['candidate'],'head':head,'sourceOnly':S})
def graph(w,persist=True):
 A=Path(os.environ['GITHUB_WORKSPACE']);B=w/'B';ms=[json.loads(rd(t,M)) for t in (A,B)]
 cs=[rd(t,v['project']) for t,v in zip((A,B),ms)]
 need(cs[0]==cs[1],'campaign contents changed')
 c=json.loads(cs[0]);need(len(c['stages'])==len(c['stageLibraries'])==50 and c['stages'][20]==P['stage21Map'] and c['stageLibraries'][20]==P['stage21Packet'],'wrong campaign Stage21 binding')
 need(stamp(rd(B,S))==P['candidate'],'compiled source drift')
 inv=[{r['path']:{k:r[k]for k in ('bytes','sha256')} for r in m['files']} for m in ms]
 need(len(inv[0])==P['activeA'] and abs(len(inv[1])-len(inv[0]))<=1,'active inventory count unexpected')
 added=sorted(set(inv[1])-set(inv[0]));dropped=sorted(set(inv[0])-set(inv[1]));common=set(inv[0])&set(inv[1])
 need(all(inv[0][k]==inv[1][k] for k in common),'common immutable digests changed')
 need(all(re.fullmatch(r'web/(runtime/ordered-common-\d+|entries/(?:game|workshop|playtest))\.[a-f0-9]{16}\.(?:js|html)',k)for k in added+dropped) and 0<len(added)<=18,'unexpected new file family')
 for k in added:need(fact(rd(B,k))==inv[1][k] and inv[1][k]['sha256'][:16] in k,('B file digest',k))
 routes={}
 for i,(arm,root,msi) in enumerate(zip('AB',(A,B),ms)):
  game=msi['gameEntry'].split('?')[0]; entry=rd(root,game)
  core=[f for f in inv[i] if re.fullmatch(r'web/runtime/ordered-common-\d+\.[a-f0-9]{16}\.js',f) and b'490576173' in rd(root,f) and b'684801009' in rd(root,f)]
  if arm=='A':
   core=[f for f in inv[i] if re.fullmatch(r'web/runtime/ordered-common-\d+\.[a-f0-9]{16}\.js',f) and b'act3-handoff:21:bedrock' in rd(root,f) and b'flowMaterialWest21' in rd(root,f)]
  need(len(core)==1 and Path(core[0]).name.encode() in entry,('native stock or B painter not referenced',arm,core))
  campaign=msi['project'];wrapper=re.findall(rb'\.\./runtime/(campaign\.[a-f0-9]{16}\.js)',entry)
  need(len(wrapper)==1,'missing active campaign wrapper')
  keys={21:{c['stages'][20],c['stageLibraries'][20]},24:{c['stages'][23],c['stageLibraries'][23]}}
  commonAssets={'HONRO.html',game,core[0],campaign,'web/runtime/'+wrapper[0].decode()}
  routes[arm]={str(ch):{f:fact(rd(root,f))for f in sorted(commonAssets|ks)}for ch,ks in keys.items()}
  for sub in routes[arm].values():
   need(all(inv[i][k]==f for k,f in sub.items() if k!='HONRO.html'),'manifest approval does not name actual route bodies')
 out={'routes':routes,'added':added,'displaced':dropped,'mapAndStageAssetAddressesEqual':True,'activeCount':[len(n)for n in inv],'notReleaseApproval':True}
 if persist:save(w,'NATIVE-ROUTES.json',out)
 return out
def seal(w):
 B=w/'B';o=w/'out'; cap=json.loads(rd(o,'BROWSER.json'))
 need(cap['status']=='PASS_STAGE21_SCOPED_ACTUAL_PENDING_VISUAL_REVIEW','actual screen scope pending')
 g=json.loads(rd(o,'NATIVE-ROUTES.json'));z=o/'B-EXACT-NORMAL-GENERATED-NO-DEPLOY.zip';fs={}
 with zipfile.ZipFile(z,'x',compression=zipfile.ZIP_DEFLATED) as ar:
  for k in sorted(set(g['added'])|{S,M,'HONRO.html','HONRO_WORKSHOP.html','index.html'}):
   v=rd(B,k);fs[k]=stamp(v);ar.writestr(k,v)
 save(w,'SEAL.json',{'status':cap['status'],'base':P['release']['head'],'files':fs,'displaced':g['displaced'],'zip':fact(z.read_bytes()),'browser':fact(rd(o,'BROWSER.json')),'released':False})
if __name__=='__main__':{'pre':pre,'observe':graph,'seal':seal}[sys.argv[1]](Path(sys.argv[2]))
