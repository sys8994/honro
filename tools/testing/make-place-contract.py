"""Pin the explicit place integration source and reversible JSON delta."""
import json,hashlib,subprocess,difflib
from pathlib import Path
base='d7c1f8457dd33decda5481c7c3b57d8505f6f157';source='2314ee6a2ad53606c2e150b2c8c087f54de1af32';root=Path('.');out=Path('_local/reports/place-contract')
read=lambda name:json.loads((out/name).read_text());dump=lambda v:json.dumps(v,ensure_ascii=False,separators=(',',':'));h=lambda v:hashlib.sha256((v if isinstance(v,str) else dump(v)).encode()).hexdigest()
m=read('before-runtime.json');cm=read('before-campaign-manifest.json');sources=read('before-sources.json');sourcechanges=[];extras=[]
def edit(path,old,new):
 return dict(path=path,previousSha256=h(old),sha256=h(new),exactEdits=[dict(beforeLine=i,afterLine=j,before=old.split('\n')[i:i2],after=new.split('\n')[j:j2])for tag,i,i2,j,j2 in difflib.SequenceMatcher(None,old.split('\n'),new.split('\n'),autojunk=False).get_opcodes()if tag!='equal'])
for p,old in sources.items():
 new=Path(p).read_bytes().decode()
 if old==new:continue
 c=edit(p,old,new);before=next(r for r in m['sourceRows']if r['path']==p);after=json.loads(json.dumps(before));after['sha256']=h(new)
 if after['kind']=='unchanged':after['kind']='changed'
 after['provenance'].append(source+' Rebuild Stage22/24/26 places and explicit roof passage policy');c.update(beforeRow=before,afterRow=after);sourcechanges.append(c)
for p in subprocess.check_output(['git','diff','--name-only',base,source,'--','tools'],text=True).splitlines():
 if not p.endswith('.mjs'):continue
 try:old=subprocess.check_output(['git','show',base+':'+p],stderr=subprocess.DEVNULL).decode()
 except subprocess.CalledProcessError:old=''
 new=Path(p).read_bytes().decode();c=edit(p,old,new);c['added']=not old;extras.append(c)
def changes(a,b,path=[]):
 if a==b:return []
 if isinstance(a,dict) and isinstance(b,dict):
  result=[]
  left=[k for k in a if k in b];right=[k for k in b if k in a];kept=set()
  for block in difflib.SequenceMatcher(None,left,right,autojunk=False).get_matching_blocks():kept.update(left[block.a:block.a+block.size])
  moved=set(left)-kept
  for k in a:
   if k in b and k not in moved:result+=changes(a[k],b[k],path+[k])
  for k in reversed(list(a)):
   if k not in b or k in moved:result.append(dict(kind='field',path=path+[k],beforePresent=True,afterPresent=False,before=a[k],beforeKeyIndex=list(a).index(k)))
  for k in b:
   if k not in a or k in moved:result.append(dict(kind='field',path=path+[k],beforePresent=False,afterPresent=True,after=b[k],afterKeyIndex=list(b).index(k)))
  return result
 if isinstance(a,list) and isinstance(b,list):
  # Exact ordered replacement spans; full before/after values are pinned.
  result=[]
  for tag,i,i2,j,j2 in difflib.SequenceMatcher(None,[h(x) for x in a],[h(x) for x in b],autojunk=False).get_opcodes():
   if tag!='equal':result.append(dict(kind='splice',path=path,beforeIndex=i,afterIndex=j,before=a[i:i2],after=b[j:j2]))
  return result
 return [dict(kind='field',path=path,beforePresent=True,afterPresent=True,before=a,after=b)]
def proof(a,b):return dict(beforeSha256=h(a),afterSha256=h(b),changes=changes(a,b))
campaign={}
for variant,file in [('raw','raw'),('runtime','project')]:
 a=read('before-'+file+'.json');b=read('after-'+file+'.json');rows=[]
 for x,y in zip(a['stages'],b['stages']):
  if x!=y:rows.append(dict(stageId=x['metadata']['stageId'],**proof(x,y)))
 assert [r['stageId'] for r in rows]==[22,24,26]
 # Wrap library so the array splice has a nonempty explicit path.
 campaign[variant]=dict(rows=rows,library=proof({'library':a['library']},{'library':b['library']}),beforeLibraryRows=[dict(id=x['id'],sha256=h(x))for x in a['library']],afterLibraryRows=[dict(id=x['id'],sha256=h(x))for x in b['library']])
d=dict(kind='act3-place-and-roof-integration',baseCurrentCommit=base,sourceCommit=source,beforeManifestSha256=h(m),beforeCampaignManifestSha256=h(cm),sourceChanges=sourcechanges,additionalChanges=extras,beforeBuilds=read('before-builds.json'),afterBuilds=read('after-builds.json'),campaign=campaign,projectPart=proof({'part':read('before-project-part.json')['part']},{'part':read('after-project-part.json')['part']}))
original_ids=set(r['id'] for r in cm['raw']['library'])-set(cm['addedAssetIds'])
d['campaignMetadata']={'beforeAddedAssetIds':cm['addedAssetIds'],'afterAddedAssetIds':[r['id'] for r in campaign['raw']['afterLibraryRows'] if r['id'] not in original_ids]}
# Source project part is large; store exact JSON instead of two opaque whole strings.
a=read('before-project-part.json')['part'];b=read('after-project-part.json')['part'];prefix=a[:a.index('{"schema"')];suffix=a[a.rfind('}')+1:];d['projectPart']=dict(prefix=prefix,suffix=suffix,**proof(json.loads(a[len(prefix):-len(suffix)]),json.loads(b[len(prefix):-len(suffix)])))
path=Path('tests/fixtures/act3-place-integration-delta.json');path.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n');print(hashlib.sha256(path.read_bytes()).hexdigest(),path.stat().st_size,'bytes',len(sourcechanges),'sources',len(extras),'authors')
