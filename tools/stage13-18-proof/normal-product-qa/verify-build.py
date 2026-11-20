import re,json,sys
from pathlib import Path
sys.dont_write_bytecode=True
base=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(base/'ci'))
from parser import produce,sha256
from splice import plan as stage18_plan
from range import change
sys.path.insert(0,str(base/'stage21-explicit-defaults'))
from importlib.util import spec_from_file_location,module_from_spec
spec=spec_from_file_location('stage21',base/'stage21-explicit-defaults/splice-stage21.py')
s21=module_from_spec(spec);spec.loader.exec_module(s21)
S,M,T,O=map(Path,sys.argv[1:])
def one(regex,s):
 result=set(re.findall(regex,s))
 assert len(result)==1,(regex,len(result))
 return result.pop()
P=re.compile(r'(?:"|\x27)((?:web/|\.\./runtime/|\./)[A-Za-z0-9_.\-/]+\.[a-f0-9]{16}\.[A-Za-z0-9]+)(?:"|\x27)')
MREF=re.compile(r'^(web/[A-Za-z0-9_.\-/]+)\.([a-f0-9]{16})\.([A-Za-z0-9]+)$')
diagnostics={'schema':'literal-targeted-dag-v2','pairs':{}}
def report(): (O/'build-dag-diff.json').write_text(json.dumps(diagnostics,indent=2)+'\n')
def canon(token,owner):
 if token.startswith('web/'):return token
 return 'web/runtime/'+token.rsplit('/',1)[-1]
from functools import lru_cache
@lru_cache(maxsize=None)
def rec(root,path):
 m=MREF.fullmatch(path)
 assert m,('unrecognizedGeneratedReference',path)
 file=(root/path).resolve()
 assert file.is_relative_to(root.resolve())
 raw=file.read_bytes()
 h=sha256(raw)
 assert h[:16]==m[2],('contentAddressMismatch',path,h)
 return {'path':path,'sha256':h,'bytes':len(raw)}
def ptr(path):return '/'+('/'.join(str(x).replace('~','~0').replace('/','~1') for x in path))
def diffs(a,b,path=()):
 if type(a) is not type(b):
  yield (ptr(path),type(a).__name__,type(b).__name__)
 elif isinstance(a,dict):
  for k in dict.fromkeys([*a,*b]):
   if k not in a or k not in b:yield (ptr((*path,k)),type(a[k]).__name__ if k in a else 'absent',type(b[k]).__name__ if k in b else 'absent')
   else:yield from diffs(a[k],b[k],(*path,k))
 elif isinstance(a,list):
  if len(a)!=len(b):yield (ptr((*path,'@length')),'list','list')
  for i,(x,y) in enumerate(zip(a,b)):yield from diffs(x,y,(*path,i))
 elif a!=b:yield (ptr(path),type(a).__name__,type(b).__name__)
def pack(root,path,summary=None):
 rootrec=rec(root,path)
 d=json.loads((root/path).read_bytes())
 if not isinstance(d,dict) or '$honroJsonParts' not in d:return d
 assert d['$honroJsonParts']==1
 chunks=[]
 for p in d['parts']:
  actual=rec(root,p['path'])
  assert actual['bytes']==p['bytes'] and actual['sha256']==p['sha256']
  chunks.append((root/p['path']).read_bytes())
 b=b''.join(chunks)
 assert len(b)==d['bytes'] and d['sha256']==sha256(b)
 if summary is not None:
  summary.update(root=rootrec,contentSha256=sha256(b),members=[rec(root,p['path']) for p in d['parts']])
 return json.loads(b)
def load(root):
 h=(root/'HONRO.html').read_text()
 entry=one(r'web/entries/game\.[0-9a-f]{16}\.js',h)
 rec(root,entry)
 script=(root/entry).read_text()
 manifest=one(r'web/data/campaign\.[0-9a-f]{16}\.json',script)
 d=pack(root,manifest)
 campaignjs=one(r'\.\./runtime/campaign\.[0-9a-f]{16}\.js',script)
 compact=one(r'web/data/HONRO_ACT2_COMPACT_PACKAGES-parts\.[0-9a-f]{16}\.json',script)
 compactjs=one(r'\.\./runtime/HONRO_ACT2_COMPACT_PACKAGES\.[0-9a-f]{16}\.js',script)
 return dict(root=root,h=h,entry=entry,script=script,manifest=manifest,c=d,compact=compact,compactjs=compactjs,campaignjs=campaignjs)
def bounded_delta(a,b):
 rows=list(diffs(a,b))
 return {'total':len(rows),'first24':[{'path':q,'fromType':f,'toType':t} for q,f,t in rows[:24]]}
def jsonparts(ctx):
 t={}; doc=pack(ctx['root'],ctx['compact'],t);return doc,t['contentSha256']
def closure(root,seeds):
 seen=set()
 def visit(p):
  if p in seen:return
  seen.add(p); rec(root,p)
  if p.endswith('.js'):
   for m in P.finditer((root/p).read_text()):visit(canon(m[1],p))
  elif p.endswith('.json'):
   # Include physical immutable part references as well as links from decoded
   # content; capture graphics behind asset pointers even if not in bootstrap.
   def walk(x):
    if isinstance(x,str):
     if MREF.fullmatch(x):visit(x)
    elif isinstance(x,dict):
     for y in x.values():walk(y)
    elif isinstance(x,list):
     for y in x:walk(y)
   q=json.loads((root/p).read_bytes())
   walk(q)
   if isinstance(q,dict) and '$honroJsonParts' in q:walk(pack(root,p))
 for p in seeds:visit(p)
 return seen
def literal(u,v,body_a,body_b,labels,pairlog,tag,counts=None):
 for label, x,y in labels:
  n=body_a.count(x);m=body_b.count(y)
  assert n==m and n>0 and (counts is None or counts[label]==n),(tag,label,n,m)
  body_a=body_a.replace(x,y)
 residual={'bodyEqual':body_a==body_b,'oldMappedSHA256':sha256(body_a.encode()),'newSHA256':sha256(body_b.encode())}
 if not residual['bodyEqual']:residual['firstDifferentByte']=next((i for i,(a,b) in enumerate(zip(body_a.encode(),body_b.encode())) if a!=b),min(len(body_a.encode()),len(body_b.encode())))
 pairlog[tag]=residual;report()
 assert residual['bodyEqual'],('opaqueUnapprovedContentChange',tag)
a,b,c=map(load,(S,M,T))
k13,k18,k21,k22=(12,17,20,21)
def scope(label,u,v,permitted,compact_changes):
 uu,vv=u['c'],v['c']
 ur,vr=u['root'],v['root']
 dl={};diagnostics['pairs'][label]=dl
 tokens=['manifest','campaignjs']+(['compact','compactjs'] if compact_changes else [])
 dl['allowedDirectLiteralPairs']=[{'kind':k,'old':rec(ur,canon(u[k],None)),'new':rec(vr,canon(v[k],None))} for k in tokens]
 assert all(u[k]!=v[k] for k in tokens)
 if not compact_changes:assert all(u[k]==v[k] for k in ('compact','compactjs'))
 lhs=[canon(m[1],u['entry']) for m in P.finditer(u['script'])]
 rhs=[canon(m[1],v['entry']) for m in P.finditer(v['script'])]
 oldextra=sorted(set(lhs)-set(rhs));newextra=sorted(set(rhs)-set(lhs))
 dl['actualEntryRemovedURLs']=[rec(ur,p) for p in oldextra][:24]
 dl['actualEntryAddedURLs']=[rec(vr,p) for p in newextra][:24]
 dl['actualEntryRemovedCount']=len(oldextra);dl['actualEntryAddedCount']=len(newextra)
 dl['top']=[rec(ur,u['entry']),rec(vr,v['entry'])]
 changes=[]
 norm=json.loads(json.dumps(vv))
 for k,i in permitted:
  f,g=uu[k][i],vv[k][i]; assert f!=g,(k,i)
  changes.append({'manifestPointer':ptr([k,i]),'old':rec(ur,f),'new':rec(vr,g)})
  norm[k][i]=f
 dl['allowedMapAssetPairs']=changes
 delta=[{'path':p,'fromType':a,'toType':b} for p,a,b in diffs(uu,norm)]
 dl['additionalManifestPointerDeltas']=delta[:24];dl['additionalManifestPointerDeltaCount']=len(delta)
 if compact_changes:
  cp={};pack(ur,u['compact'],cp);cq={};pack(vr,v['compact'],cq)
  dl['compactParts']=[cp,cq]
 report()
 assert uu==norm,'Active manifest changed outside named files'
 assert u['h'].count(u['entry'])==v['h'].count(v['entry'])==1 and u['h'].replace(u['entry'],v['entry'])==v['h']
 assert set(oldextra)=={canon(u[k],None) for k in tokens} and set(newextra)=={canon(v[k],None) for k in tokens},'Additional direct URLs outside reviewed edges'
 literal(u,v,u['script'],v['script'],[(k,u[k],v[k]) for k in tokens],dl,'entryLiteralContract',
  {'manifest':1,'campaignjs':1,'compact':1,'compactjs':2})
 def wrapper(k,p,tag):
  ux=(ur/canon(u[k],None)).read_text();vx=(vr/canon(v[k],None)).read_text()
  literal(u,v,ux,vx,[(p,u[p],v[p])],dl,tag,{p:1})
 wrapper('campaignjs','manifest','campaignWrapperSingleManifestPointer')
 if compact_changes:wrapper('compactjs','compact','compactWrapperSingleManifestPointer')
 ua,va=closure(ur,[u['entry']]),closure(vr,[v['entry']])
 all_a={u['entry'],*(canon(u[k],None) for k in tokens),*(r['old']['path'] for r in changes)}
 all_b={v['entry'],*(canon(v[k],None) for k in tokens),*(r['new']['path'] for r in changes)}
 if compact_changes:
  all_a.update(r['path'] for r in dl['compactParts'][0]['members'])
  all_b.update(r['path'] for r in dl['compactParts'][1]['members'])
 extra_a=sorted((ua-all_a)-(va-all_b));extra_b=sorted((va-all_b)-(ua-all_a))
 dl['unlistedTransitiveRemoved']=[rec(ur,p) for p in extra_a[:24]]
 dl['unlistedTransitiveAdded']=[rec(vr,p) for p in extra_b[:24]]
 dl['unlistedTransitiveCount']=[len(extra_a),len(extra_b)]
 report()
 assert not extra_a and not extra_b,'Additional transitive URLs outside reviewed edges'
 checked=sorted((ua-all_a)&(va-all_b))
 for path in checked:
  x,y=rec(ur,path),rec(vr,path)
  if x!=y or (ur/path).read_bytes()!=(vr/path).read_bytes():
   dl['opaqueFileDelta']=[x,y];report()
   raise AssertionError('Content mismatch at protected generated path: '+path)
 dl['unchangedReachablePathCount']=len(checked)
 dl['reachablePathsSHA256']=sha256('\n'.join(checked).encode())
 report()
 return {'changes':changes,'unchangedActiveReferenceCount':len(checked),'unchangedActiveRefNamesSHA256':dl['reachablePathsSHA256'],'campaignWrapperSingleOnly':True}
ab=scope('stockToMetadata',a,b,[('stageLibraries',k13),('stages',k18),('stages',k21)],True)
bc=scope('metadataToTarget',b,c,[('stages',k22)],False)
p=lambda d,key,i:(d['root']/d['c'][key][i]).read_bytes()
a13,b13=(p(d,'stageLibraries',k13) for d in (a,b))
assert change(a13,match_body=False)[0]==b13
a18,b18=(p(d,'stages',k18) for d in (a,b))
assert stage18_plan(a18,'compiled-fixture')[0]==b18
a21,b21=(p(d,'stages',k21) for d in (a,b))
assert s21.plan(a21,'published-compiled-fixture')[0]==b21
b22,c22=(p(d,'stages',k22) for d in (b,c))
assert sha256(b22)=='45371aeca83d76f74dd2b052e445d21d6a510b2d19fc05f4e0db0d43358f197e'
assert produce(b22,'compiled-fixture')[0]==c22
assert sha256(c22)=='a8be99a3221a730acd6692d5c27867e2e46fc6d896404e6092e3948dccd02888'
packa,h1=jsonparts(a);packb,h2=jsonparts(b);packc,h3=jsonparts(c)
diagnostics['compactTargetResidual']=bounded_delta(packb,packc);report()
assert packb==packc and h2==h3
for k in ('source','stage'):
 s,t=packa['18'][k],packb['18'][k]
 actual={u['id'] for u in s['units']}
 old,new=s['encounters'],t['encounters']
 assert len(old)==len(new)==22
 assert sum(uid not in actual for g in old for uid in g['unitIds'])==45
 assert new==[{**r,'unitIds':[x for x in r['unitIds'] if x in actual]} for r in old]
 assert sum(not q['unitIds'] for q in new)==12
 t['encounters']=old
diagnostics['compactMetadataResidual']=bounded_delta(packa,packb);report()
assert packa==packb,'Production Act2 compact bundle unrelated edits'
proof={'stockToMetadata':ab,'metadataToTarget':bc,'knownPriorStage22AppRun':44651995224,
 'priorStage22PacketExactMatch':True,'stockTargetStage22SHA256':[sha256(b22),sha256(c22)],
 'stage13AssetSHA256':[sha256(a13),sha256(b13)],'stage18MapSHA256':[sha256(a18),sha256(b18)],'stage18CompactPartsSHA256':[h1,h2,h3],
 'stage21MapSHA256':[sha256(a21),sha256(b21)],'actualStage22PhysicsControls':'Terrain source and placements exact; App A/B independent'}
(O/'build-proof.json').write_text(json.dumps(proof,indent=2))
s=json.loads(b22); poly=next(t['points'] for t in s['terrains'] if t['id']=='v22-lower-court')
(O/'mask-geometry.private.json').write_text(json.dumps(poly))
