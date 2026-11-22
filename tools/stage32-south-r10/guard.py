"""Fail closed / no write beyond detached build and QA output. Not a release writer."""
import copy,hashlib,json,os,re,subprocess,sys,zipfile
from pathlib import Path
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_bytes()); M='web/manifest.json'
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return dict(bytes=len(b),sha256=sha(b))
def stamp(b):return {**fact(b),'git':hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()}
def need(x,msg):
 if not x:raise RuntimeError(msg)
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a],timeout=120,text=True).strip()
def rd(r,k):
 p=r/k;need(p.is_file() and p.resolve().is_relative_to(r.resolve()),('unsafe path',k));return p.read_bytes()
def save(w,k,o):(w/'out'/k).write_text(json.dumps(o,indent=2)+'\n')
def records(root,path):
 ix=json.loads(rd(root,path));parts=ix['parts'];need(ix['$honroJsonParts']==1 and len(parts)==2,'unexpected Stage32 split schema')
 data=[]
 for i,item in enumerate(parts):
  k=item['path'];need(re.fullmatch(fr'web/data/chapter-32-assets-part-{i:03d}\.[a-f0-9]{{16}}\.bin',k)!=None,'wrong split index')
  b=rd(root,k);need(fact(b)=={n:item[n]for n in ('bytes','sha256')} and k.endswith(item['sha256'][:16]+'.bin'),'split bytes/address mismatch');data.append(b)
 b=b''.join(data);need(fact(b)=={n:ix[n]for n in ('bytes','sha256')},'split join SHA')
 return json.loads(b),[path,*(t['path']for t in parts)]
def node(a,role):
 r=a['vector']['root']
 if role=='F':
  need(r.get('clipPath')=='portApron','expected current F world clip')
  return r['children'][0]['children']
 need(r['children'][0].get('clipPath')=='source-alpha-silhouette','expected current B local clip')
 return r['children'][0]['children'][0]['children']
def expected(a):
 c=copy.deepcopy(a);q=json.loads((D/'stage32-south-r10.json').read_bytes())
 ids={x['id']:x for x in c};need(len(ids)==len(c),'duplicated registered asset')
 for role,name in P['assets'].items():node(ids[name],role).append(q[role])
 return c
def pre(w):
 a=Path(os.environ['GITHUB_WORKSPACE']);h=os.environ['GITHUB_SHA']
 need(P['enabled'] is True and not (os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN')),'disabled or unexpected credentials')
 need((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',P['qaRef']),'unauthorized QA ref/event')
 paths={'.github/workflows/stage32-south-r10.yml',*(str(D.relative_to(a)/n)for n in ('PINS.json','guard.py','capture.py','observer.json','act4-handoff-art-r10.mjs','stage32-south-r10.json'))}
 need(git(a,'rev-list','--parents','-1','HEAD').split()==[h,P['head']] and git(a,'rev-parse',P['head']+'^{tree}')==P['tree'] and not git(a,'status','--porcelain=v1') and set(git(a,'diff','--no-renames','--name-status',P['head'],h).splitlines())=={'A\t'+n for n in paths},'head is not exact add-only QA child')
 for k,j in ((M,'manifest'),(P['map'],'mapPin'),(P['source'],'sourceStock'),(P['oldIdx'],'oldPin')):need(stamp(rd(a,k))==P[j],('wrong tracked stock bytes',k))
 need(git(a,'rev-parse','HEAD:shared/data/act4/handoff-art/32.json')==P['authoredBodyStockGit'],'legacy F authoring pack identity')
 for k,j in (('act4-handoff-art-r10.mjs','sourceB'),('stage32-south-r10.json','paint'),('observer.json','observer')):need(stamp(rd(D,k))==P[j],('wrong transport bytes',k))
 b=w/'B';git(a,'worktree','add','--detach',str(b),P['head'])
 need(not (b/P['paintPath']).exists(),'chosen authored source may not overwrite stock')
 (b/P['source']).write_bytes(rd(D,'act4-handoff-art-r10.mjs'));(b/P['paintPath']).write_bytes(rd(D,'stage32-south-r10.json'))
 need({l.strip() for l in git(b,'status','--porcelain=v1').splitlines()}=={'M '+P['source'],'?? '+P['paintPath']},'unexpected detach writes')
 save(w,'SOURCE.json',{'head':h,'base':P['head'],'tree':P['tree'],'stockCompiler':P['sourceStock'],'candidateCompiler':P['sourceB'],'candidatePaint':P['paint'],'productScope':[P['source'],P['paintPath']]})
def observe(w):
 a=Path(os.environ['GITHUB_WORKSPACE']);b=w/'B'
 roots=(a,b);ms=[json.loads(rd(t,M))for t in roots];cs=[json.loads(rd(t,v['project']))for t,v in zip(roots,ms)]
 i=31; ca,cb=cs
 need(ca['stages']==cb['stages'] and len(ca['stages'])==50 and ca['stages'][i]==P['map'],'compiled map addresses changed')
 need(ca['stageLibraries'][i]==P['oldIdx'] and ca['stageLibraries'][:i]+ca['stageLibraries'][i+1:]==cb['stageLibraries'][:i]+cb['stageLibraries'][i+1:],'unrelated compiled asset addresses changed')
 ix=cb['stageLibraries'][i];need(ix!=P['oldIdx'] and re.fullmatch(r'web/data/chapter-32-assets-parts\.[a-f0-9]{16}\.json',ix)!=None and
      ix.endswith(sha(rd(b,ix))[:16]+'.json'),'new slot missing or hash not attached')
 old,ar=records(a,P['oldIdx']);new,br=records(b,ix)
 need(expected(old)==new,'normal compiled asset delta not exactly the two approved vector groups')
 need(rd(a,P['map'])==rd(b,P['map']) and stamp(rd(b,P['source']))==P['sourceB'] and stamp(rd(b,P['paintPath']))==P['paint'],'stock map or compiled source drift')
 routes={}; peers={}
 for id in (21,33):
  k=id-1; extras=[]
  p=ca['stageLibraries'][k]
  ix=json.loads(rd(a,p));extras=[q['path']for q in ix.get('parts',[])] if isinstance(ix,dict) else []
  paths={ca['stages'][k],p,*extras, 'web/runtime/ordered-common-17.93673f3a14672979.js'}
  peers[str(id)]={j:fact(rd(a,j))for j in paths}
  need(all(fact(rd(b,j))==v for j,v in peers[str(id)].items()),'other chapter peer bytes changed')
 for role,t,v,pack in zip('AB',roots,ms,(ar,br)):
  inv={q['path']:{k:q[k]for k in ('bytes','sha256')}for q in v['files']}
  e=v['gameEntry'].split('?')[0];project=v['project'];wrapper=re.findall(rb'\.\./runtime/(campaign\.[a-f0-9]{16}\.js)',rd(t,e))
  need(len(wrapper)==1,'unique campaign wrapper expected')
  u='web/runtime/'+wrapper[0].decode();need(Path(project).name.encode() in rd(t,u),'wrong active project in wrapper')
  keys={P['map'],*pack,project,e,u,'HONRO.html'}
  routes[role]={k:fact(rd(t,k)) for k in sorted(keys)}
  need(all(routes[role][k]==inv[k]for k in keys-{'HONRO.html'}),'active route did not match manifest')
 oldA,newB=({x['path']:x['sha256']for x in v['files']}for v in ms)
 plus=sorted(set(newB)-set(oldA)); minus=sorted(set(oldA)-set(newB))
 if len(oldA)!=len(newB)or len(oldA)!=P['active'] or len(plus)!=len(minus) or not 1<=len(plus)<=10 or any(oldA[k]!=newB[k] for k in set(oldA)&set(newB)) or not all(k.startswith(('web/data/chapter-32-assets-part','web/data/campaign.','web/runtime/campaign.','web/entries/'))for k in plus+minus):
  save(w,'UNSEALED-GRAPH.json',{'plus':plus,'minus':minus,'sharedDelta':[k for k in set(oldA)&set(newB) if oldA[k]!=newB[k]],'active':[len(oldA),len(newB)]});need(False,'unexpected active graph drift')
 save(w,'NATIVE-ROUTES.json',{'routes':routes,'peerRoutes':peers,'activeAdded':plus,'activeRemoved':minus,'ownersExact':True})
def seal(w):
 b=w/'B';o=w/'out';q=json.loads(rd(o,'BROWSER.json'));n=json.loads(rd(o,'NATIVE-ROUTES.json'))
 need(q['status']=='PASS_ACTUAL_R10_PENDING_ART_REVIEW','actual proof scope did not pass')
 files={}
 with zipfile.ZipFile(o/'B-NORMAL-STAGE32-NO-DEPLOY.zip','x',compression=zipfile.ZIP_DEFLATED)as z:
  for k in sorted({*n['activeAdded'],P['source'],P['paintPath'],M,'HONRO.html','HONRO_WORKSHOP.html','index.html'}):
   v=rd(b,k);files[k]=stamp(v);z.writestr(k,v)
 save(w,'SEAL.json',{'status':q['status'],'files':files,'zip':stamp(rd(o,'B-NORMAL-STAGE32-NO-DEPLOY.zip')),'routes':stamp(rd(o,'NATIVE-ROUTES.json')),'proof':stamp(rd(o,'BROWSER.json')),'noDeploy':True,'base':P['head']})
if __name__=='__main__':{'pre':pre,'observe':observe,'seal':seal}[sys.argv[1]](Path(sys.argv[2]))
