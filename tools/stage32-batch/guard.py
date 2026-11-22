"""Fail closed / no write beyond detached build and QA output. Not a release writer."""
import copy,hashlib,json,os,re,subprocess,sys,zipfile
from pathlib import Path
D=Path(__file__).resolve().parent;P=json.loads((D/'PINS.json').read_bytes()); AUTH=json.loads((D.parent/'stage32-33-batch'/'AUTHORITY.json').read_bytes()); P.update({k:AUTH[k] for k in ('head','tree','pages','manifest','active','expectedRegistryA','sourceB')}); P['lazy'].update(AUTH['lazyBinding']); M='web/manifest.json'
def sha(b):return hashlib.sha256(b).hexdigest()
def fact(b):return dict(bytes=len(b),sha256=sha(b))
def stamp(b):return {**fact(b),'git':hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()}
def need(x,msg):
 if not x:raise RuntimeError(msg)
def git(r,*a):return subprocess.check_output(['git','-C',str(r),*a],timeout=120,text=True).strip()
def rd(r,k):
 p=r/k;need(p.is_file() and p.resolve().is_relative_to(r.resolve()),('unsafe path',k));return p.read_bytes()
def save(w,k,o):(w/'OUT'/'stage32'/k).write_text(json.dumps(o,indent=2)+'\n')
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
 a=w/'A'; h=P['realHistorical']; hist=w/'H'
 r=lambda k: w/k
 for k,u,pins in (('H',hist,h),('S',r('S'),P['nativeArchiveFixtureStock'])):
  need(git(a,'merge-base',pins['head'],P['head'])==pins['head'] and git(a,'rev-parse',pins['head']+'^{tree}')==pins['tree'],('exact historical ancestor',k))
  git(a,'worktree','add','--detach',str(u),pins['head'])
  need(not git(u,'status','--porcelain=v1') and stamp(rd(u,M))['git']==pins['manifestGit'] and len(rd(u,M))==pins['manifestBytes'],('immutable tracked historical origin',k))
 desc=rd(hist,h['descriptor'])
 need(stamp(desc)['git']==h['descriptorGit'] and json.loads(desc)['sha256']==h['packetSHA'] and json.loads(desc)['bytes']==h['packetBytes'],'historical descriptor drift')
 records(hist,h['descriptor'],3)
 p=P['nativeArchiveFixtureStock']
 need(all(fact(rd(r('S'),k))==u for k,u in p['routes'].items()),'exact real old-slot issuer routes changed')
 for k,j in ((M,'manifest'),(P['map'],'mapPin'),(P['oldIdx'],'oldPin')):need(stamp(rd(a,k))==P[j],('wrong tracked stock bytes',k))
 need(stamp(rd(r('B'),P['paintPath']))==P['paint'] and stamp(rd(D,'author-stage32-south.mjs'))==P['paint'] and stamp(rd(D,'observer.json'))==P['observer'],'wrong Stage32 input')
 need(git(a,'rev-parse','HEAD:shared/data/act4/handoff-art/32.json')==P['authoredBodyStockGit'],'legacy F authoring pack identity')
 for k,gitid in P['unchangedOptimizer'].items():need(stamp(rd(a,k))['git']==gitid,('optimizer or legacy input changed',k))
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
 lazy=P['lazy']; expectedB=lazy['expectedSplit']; oldDesc=json.loads(rd(a,P['oldIdx']))
 need({k:oldDesc[k] for k in ('sha256','bytes')}==lazy['activeOld'],'not exact published lazy Stage32 active art')
 d=json.loads(rd(b,ix))
 need({k:d[k] for k in ('sha256','bytes')}==lazy['activeR10Predicted'] and d['parts']==expectedB['parts'] and
   ix==expectedB['descriptor'] and fact(rd(b,ix))=={k:expectedB[k] for k in ('sha256','bytes')},'R10 lazy active split not exact')
 compatibility=lazy['directPath']; direct=rd(a,compatibility)
 need(fact(direct)==lazy['legacyDirectRetained'] and rd(b,compatibility)==direct and
   [x['id'] for x in json.loads(direct)]==lazy['legacyIds'],'exact lazy archive bytes/IDs changed or merged')
 need(ca['compatibility32']==cb['compatibility32']==compatibility and ca['compatibility33']==cb['compatibility33']==lazy['compat33'] and
   ca['stageLibraries'][41]==cb['stageLibraries'][41]==lazy['stage42'] and ms[0]['project']==lazy['publicRoute'],'peer/stable lazy pointers changed')
 canon=copy.deepcopy(cb);canon['stageLibraries'][31]=ca['stageLibraries'][31]
 if 'assetPaths' in canon:
  paths=canon['assetPaths']['stageLibraries']; assert len(paths)==50
  paths[31]=ca['assetPaths']['stageLibraries'][31]
 need(canon==ca,'campaign manifest changed outside Stage32 active split')
 need(rd(a,P['map'])==rd(hist,P['map']),'historical reference map drift')
 need(expected(old)==new,'normal compiled asset delta not exactly the two approved vector groups')
 for k,old in P['unchangedOptimizer'].items():need(stamp(rd(b,k))['git']==old,('optimizer or legacy input mutated',k))
 need(rd(a,P['map'])==rd(b,P['map']) and stamp(rd(b,P['source']))==P['sourceB'] and stamp(rd(b,P['paintPath']))==P['paint'],'stock map or compiled source drift')
 def read_registry(r,name):
  script=rd(r,name).decode()
  anchor='(()=>{"use strict";globalThis.HONRO_PREVIOUS_TERRAIN_ART='
  end='})();await yieldIfNeeded();'
  need(script.count(anchor)==1,'one exact provider registry assignment wrapper')
  tail=script.split(anchor,1)[1]
  raw=tail.split(end,1)[0]
  separator=';globalThis.HonroStage33Restore='
  if r==b:
   need(raw.count(separator)==1 and tail.count(separator)==1,'expected exactly one scoped Stage33 helper after provider registry')
   raw=raw.split(separator,1)[0]
  else:need(separator not in raw,'unexpected active stock Stage33 helper before batch')
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
 need(ar12==P['expectedRegistryA'] and stamp(rd(a,ar12))['git']==lazy['registryBeforeRawGit'] and ar12!=br12,'exact known registry module slot')
 ar4,br4=[next(k for k in m['common']if '/ordered-common-4.'in k)for m in ms]
 need(ar4==lazy['expectedProfileChunk'] and ar4!=br4 and fact(rd(b,br4))==AUTH['approvedR6ProfileBytes'],'existing Stage33 R6 save runtime not exact')
 rowA,rowB=read_registry(a,ar12),read_registry(b,br12)
 need(rowB=={**rowA,**P['rows']} and all(rowB[k]==v for k,v in P['registryRows33'].items()),'registry changed beyond owner scope')
 routes={}; peers={}
 for id in (7,21,33,40,42,46):
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
  keys={P['map'],*pack,project,e,u,'HONRO.html',ar4 if role=='A' else br4,ar12 if role=='A' else br12}
  routes[role]={k:fact(rd(t,k)) for k in sorted(keys)}
  need(all(routes[role][k]==inv[k]for k in keys-{'HONRO.html'}),'active route did not match manifest')
 mh=json.loads(rd(hist,M));ph=json.loads(rd(hist,h['project']))
 need(mh['project']==h['project'] and mh['gameEntry'].split('?')[0]==h['entry'] and ph['stages'][31]==P['map'] and ph['stageLibraries'][31]==h['descriptor'],'wrong historical active A-old chain')
 need(Path(h['loader']).name.encode() in rd(hist,h['entry']) and Path(h['project']).name.encode() in rd(hist,h['loader']),'historical chain not active')
 routes['H']={x:fact(rd(hist,x)) for x in ('HONRO.html',h['entry'],h['loader'],h['project'],h['profile'],P['map'],*hr)}
 routes['S']=P['nativeArchiveFixtureStock']['routes']
 common=json.loads((w/'OUT'/'GRAPH.json').read_bytes())
 plus,minus=common['added'],common['displaced']
 need({ar4,ar12}<=set(minus) and {br4,br12}<=set(plus),'native slots not certified in unified graph')
 save(w,'NATIVE-ROUTES.json',{'routes':routes,'peerRoutes':peers,'activeAdded':plus,'activeRemoved':minus,'ownersExact':True,'registryA':rowA,'registryB':rowB,'sameStage33AndOtherExistingRows':True,'lazyArchive':{compatibility:fact(direct)},'historicalAOnly':True,'other49MapsAndPacketsExact':True})
if __name__=='__main__':{'pre':pre,'observe':observe}[sys.argv[1]](Path(sys.argv[2]))
