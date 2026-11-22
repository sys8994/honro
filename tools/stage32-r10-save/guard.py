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
def records(root,path,count=2):
 ix=json.loads(rd(root,path));parts=ix['parts'];need(ix['$honroJsonParts']==1 and len(parts)==count,'unexpected Stage32 split schema')
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
 c=copy.deepcopy(a);src=(D/'author-stage32-south.mjs').read_text();head=src.split('export const stage32SouthFacies = ',1)[1].split(';\n\nconst stamp',1)[0];q=json.loads(head)
 need(q['version']==1 and q['stage']==32 and all(len(q[k]['children'])==17 for k in ('F','B')),'wrong scope payload')
 ids={x['id']:x for x in c};need(len(ids)==len(c),'duplicated registered asset')
 for role,name in P['assets'].items():node(ids[name],role).append(q[role])
 return c
def pre(w):
 a=Path(os.environ['GITHUB_WORKSPACE']);h=os.environ['GITHUB_SHA']
 need(P['enabled'] is True and not (os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN')),'disabled or unexpected credentials')
 need((os.environ['GITHUB_REPOSITORY'],os.environ['GITHUB_EVENT_NAME'],os.environ['GITHUB_REF'])==('sys8994/honro','push',P['qaRef']),'unauthorized QA ref/event')
 paths={'.github/workflows/stage32-r10-save-remediation.yml',*(str(D.relative_to(a)/n)for n in ('PINS.json','guard.py','capture.py','resume.py','observer.json','build.mjs','author-stage32-south.mjs'))}
 need(git(a,'rev-list','--parents','-1','HEAD').split()==[h,P['head']] and git(a,'rev-parse',P['head']+'^{tree}')==P['tree'] and not git(a,'status','--porcelain=v1') and set(git(a,'diff','--no-renames','--name-status',P['head'],h).splitlines())=={'A\t'+n for n in paths},'head is not exact add-only QA child')
 for k,j in ((M,'manifest'),(P['map'],'mapPin'),(P['source'],'sourceStock'),(P['oldIdx'],'oldPin')):need(stamp(rd(a,k))==P[j],('wrong tracked stock bytes',k))
 need(git(a,'rev-parse','HEAD:shared/data/act4/handoff-art/32.json')==P['authoredBodyStockGit'],'legacy F authoring pack identity')
 for k,gitid in P['unchangedOptimizer'].items():need(stamp(rd(a,k))['git']==gitid,('optimizer or legacy input changed',k))
 for k,j in (('build.mjs','sourceB'),('author-stage32-south.mjs','paint'),('observer.json','observer')):need(stamp(rd(D,k))==P[j],('wrong transport bytes',k))
 need(P['pages']['conclusion']=='success' and P['pages']['head']==P['head'],'not a published base')
 h=P['realHistorical'];hist=w/'H'
 need(git(a,'rev-parse',h['head']+'^{tree}')==h['tree'],'exact historical stage pre-optimization')
 git(a,'worktree','add','--detach',str(hist),h['head'])
 need(stamp(rd(hist,M))['git']==h['manifestGit'] and len(rd(hist,M))==h['manifestBytes'],'historical manifest drift')
 desc=rd(hist,h['descriptor'])
 need(stamp(desc)['git']==h['descriptorGit'] and json.loads(desc)['sha256']==h['packetSHA'] and json.loads(desc)['bytes']==h['packetBytes'],'historical descriptor drift')
 records(hist,h['descriptor'],3)
 fixed=w/'A';git(a,'worktree','add','--detach',str(fixed),P['head'])
 need(git(fixed,'rev-parse','HEAD')==P['head'] and git(fixed,'rev-parse','HEAD^{tree}')==P['tree'] and not git(fixed,'status','--porcelain=v1') and stamp(rd(fixed,M))==P['manifest'],'verified archived Pages clone')
 b=w/'B';git(a,'worktree','add','--detach',str(b),P['head'])
 need(not (b/P['paintPath']).exists(),'chosen authored source may not overwrite stock')
 (b/P['source']).write_bytes(rd(D,'build.mjs'));(b/P['paintPath']).write_bytes(rd(D,'author-stage32-south.mjs'))
 need({l.strip() for l in git(b,'status','--porcelain=v1').splitlines()}=={'M '+P['source'],'?? '+P['paintPath']},'unexpected detach writes')
 save(w,'SOURCE.json',{'head':h,'base':P['head'],'tree':P['tree'],'stockCompiler':P['sourceStock'],'candidateCompiler':P['sourceB'],'candidatePaint':P['paint'],'productScope':[P['source'],P['paintPath']]})
def observe(w):
 a=w/'A';b=w/'B'
 need(git(a,'rev-parse','HEAD^{tree}')==P['tree'] and not git(a,'status','--porcelain=v1') and stamp(rd(a,M))==P['manifest'],'immutable tracked archived A')
 roots=(a,b);ms=[json.loads(rd(t,M))for t in roots];cs=[json.loads(rd(t,v['project']))for t,v in zip(roots,ms)]
 i=31; ca,cb=cs
 need(ca['stages']==cb['stages'] and len(ca['stages'])==50 and ca['stages'][i]==P['map'],'compiled map addresses changed')
 need(ca['stageLibraries'][i]==P['oldIdx'] and ca['stageLibraries'][:i]+ca['stageLibraries'][i+1:]==cb['stageLibraries'][:i]+cb['stageLibraries'][i+1:],'unrelated compiled asset addresses changed')
 ix=cb['stageLibraries'][i];need(ix!=P['oldIdx'] and re.fullmatch(r'web/data/chapter-32-assets-parts\.[a-f0-9]{16}\.json',ix)!=None and
      ix.endswith(sha(rd(b,ix))[:16]+'.json'),'new slot missing or hash not attached')
 hist=w/'H';h=P['realHistorical']
 historical,hr=records(hist,h['descriptor'],3)
 old,ar=records(a,P['oldIdx']);new,br=records(b,ix)
 need(json.loads(rd(a,P['oldIdx']))['sha256']==P['stockBeforeR10PacketSHA'],'not exact prior Stage32 art')
 d=json.loads(rd(b,ix))
 need(d['sha256']==P['oldCandidateArtifact']['packetSHA'] and d['bytes']==P['oldCandidateArtifact']['packetBytes'],'R10 proof bundle not exact')
 need(rd(a,P['map'])==rd(hist,P['map']),'historical reference map drift')
 need(expected(old)==new,'normal compiled asset delta not exactly the two approved vector groups')
 for k,old in P['unchangedOptimizer'].items():need(stamp(rd(b,k))['git']==old,('optimizer or legacy input mutated',k))
 need(rd(a,P['map'])==rd(b,P['map']) and stamp(rd(b,P['source']))==P['sourceB'] and stamp(rd(b,P['paintPath']))==P['paint'],'stock map or compiled source drift')
 def read_registry(t,name):
  script=rd(t,name).decode()
  anchor='(()=>{"use strict";globalThis.HONRO_PREVIOUS_TERRAIN_ART='
  end='})();await yieldIfNeeded();'
  need(script.count(anchor)==1,'one exact provider registry assignment wrapper')
  raw=script.split(anchor,1)[1].split(end,1)[0]
  need(raw.startswith('{') and raw.endswith('}'),'actual provider registry data object')
  def only_one(keys):
   answer={}
   for k,v in keys:
    need(k not in answer,'duplicate provider key')
    answer[k]=v
   return answer
  normalized=re.sub(r'([{,])(stage|previous|previousOptimized|current):',r'\1"\2":',raw)
  rows=json.loads(normalized,object_pairs_hook=only_one)
  need(isinstance(rows,dict) and len(rows)>30,'unexpected provider registry population')
  for k,r in rows.items():
   need(isinstance(k,str) and isinstance(r,dict) and set(r) in ({'stage','previous','current'},{'stage','previous','current','previousOptimized'}),'unexpected registry row fields')
   need(type(r['stage']) is int and 31<=r['stage']<=40 and all(re.fullmatch(r'[0-9]+:[0-9a-f]{1,8}',v) for n,v in r.items() if n!='stage'),'malformed exact signature')
  return rows
 ar12=next(k for k in ms[0]['common'] if '/ordered-common-12.'in k)
 br12=next(k for k in ms[1]['common'] if '/ordered-common-12.'in k)
 need(ar12==P['expectedRegistryA'] and ar12!=br12,'exact known registry module slot')
 ar4,br4=[next(k for k in m['common']if '/ordered-common-4.'in k)for m in ms]
 need(ar4==br4 and rd(a,ar4)==rd(b,br4),'existing save runtime changed')
 rowA,rowB=read_registry(a,ar12),read_registry(b,br12)
 need(rowB=={**rowA,**P['rows']} and all(rowB[k]==v for k,v in P['registryRows33'].items()),'registry changed beyond owner scope')
 routes={}; peers={}
 for id in (21,33,40,46):
  k=id-1; extras=[]
  p=ca['stageLibraries'][k]
  ix=json.loads(rd(a,p));extras=[q['path']for q in ix.get('parts',[])] if isinstance(ix,dict) else []
  paths={ca['stages'][k],p,*extras}
  peers[str(id)]={j:fact(rd(a,j))for j in paths}
  need(all(fact(rd(b,j))==v for j,v in peers[str(id)].items()),'other chapter peer bytes changed')
 for role,t,v,pack in zip('AB',roots,ms,(ar,br)):
  inv={q['path']:{k:q[k]for k in ('bytes','sha256')}for q in v['files']}
  e=v['gameEntry'].split('?')[0];project=v['project'];wrapper=re.findall(rb'\.\./runtime/(campaign\.[a-f0-9]{16}\.js)',rd(t,e))
  need(len(wrapper)==1,'unique campaign wrapper expected')
  u='web/runtime/'+wrapper[0].decode();need(Path(project).name.encode() in rd(t,u),'wrong active project in wrapper')
  keys={P['map'],*pack,project,e,u,'HONRO.html',ar4,ar12 if role=='A' else br12}
  routes[role]={k:fact(rd(t,k)) for k in sorted(keys)}
  need(all(routes[role][k]==inv[k]for k in keys-{'HONRO.html'}),'active route did not match manifest')
 mh=json.loads(rd(hist,M));ph=json.loads(rd(hist,h['project']))
 need(mh['project']==h['project'] and mh['gameEntry'].split('?')[0]==h['entry'] and ph['stages'][31]==P['map'] and ph['stageLibraries'][31]==h['descriptor'],'wrong historical active A-old chain')
 need(Path(h['loader']).name.encode() in rd(hist,h['entry']) and Path(h['project']).name.encode() in rd(hist,h['loader']),'historical chain not active')
 routes['H']={x:fact(rd(hist,x)) for x in ('HONRO.html',h['entry'],h['loader'],h['project'],h['profile'],P['map'],*hr)}
 oldA,newB=({x['path']:x['sha256']for x in v['files']}for v in ms)
 plus=sorted(set(newB)-set(oldA)); minus=sorted(set(oldA)-set(newB))
 if len(oldA)!=len(newB)or len(oldA)!=P['active'] or len(plus)!=len(minus) or not 1<=len(plus)<=10 or any(oldA[k]!=newB[k] for k in set(oldA)&set(newB)) or not all(k.startswith(('web/data/chapter-32-assets-part','web/data/campaign.','web/runtime/campaign.','web/entries/','web/runtime/ordered-common-12.'))for k in plus+minus):
  save(w,'UNSEALED-GRAPH.json',{'plus':plus,'minus':minus,'sharedDelta':[k for k in set(oldA)&set(newB) if oldA[k]!=newB[k]],'active':[len(oldA),len(newB)]});need(False,'unexpected active graph drift')
 need(br12 in plus and ar12 in minus,'registry module not proved by active route')
 save(w,'NATIVE-ROUTES.json',{'routes':routes,'peerRoutes':peers,'activeAdded':plus,'activeRemoved':minus,'ownersExact':True,'registryA':rowA,'registryB':rowB,'sameStage33AndOtherExistingRows':True})
if __name__=='__main__':{'pre':pre,'observe':observe}[sys.argv[1]](Path(sys.argv[2]))
