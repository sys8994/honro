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
def load(root):
 h=(root/'HONRO.html').read_text()
 entry=one(r'web/entries/game\.[0-9a-f]{16}\.js',h)
 script=(root/entry).read_text()
 manifest=one(r'web/data/campaign\.[0-9a-f]{16}\.json',script)
 d=json.loads((root/manifest).read_bytes())
 compact=one(r'web/data/HONRO_ACT2_COMPACT_PACKAGES-parts\.[0-9a-f]{16}\.json',script)
 compactjs=one(r'\.\./runtime/HONRO_ACT2_COMPACT_PACKAGES\.[0-9a-f]{16}\.js',script)
 return dict(root=root,h=h,entry=entry,script=script,manifest=manifest,c=d,compact=compact,compactjs=compactjs)
def jsonparts(ctx):
 root=ctx['root']; d=json.loads((root/ctx['compact']).read_bytes())
 assert d['$honroJsonParts']==1
 chunks=[]
 for p in d['parts']:
  b=(root/p['path']).read_bytes()
  assert len(b)==p['bytes'] and p['sha256']==sha256(b)
  chunks.append(b)
 b=b''.join(chunks)
 assert len(b)==d['bytes'] and d['sha256']==sha256(b)
 return json.loads(b),sha256(b)
a,b,c=map(load,(S,M,T))
k13,k18,k21,k22=(12,17,20,21)
def scope(u,v,permitted,compact_changes):
 uu,vv=u['c'],v['c']; aliases=[]
 changes=[]
 for k,i in permitted:
  f,g=uu[k][i],vv[k][i];assert f!=g,(k,i)
  aliases.append((f,g));changes.append([k,i+1,f,g])
 norm=json.loads(json.dumps(vv))
 for k,i in permitted:norm[k][i]=uu[k][i]
 assert uu==norm,'Active manifest changed outside named files'
 assert u['h'].replace(u['entry'],v['entry'])==v['h']
 pr=u['script'].replace(u['manifest'],v['manifest'])
 if compact_changes:pr=pr.replace(u['compact'],v['compact']).replace(u['compactjs'],v['compactjs'])
 assert pr==v['script'],'Unapproved game entry change'
 def urls(vv):
  if isinstance(vv,str):
   if vv.startswith('web/') and not vv.endswith('/') and '\n' not in vv:yield vv
  elif isinstance(vv,list):
   for z in vv:yield from urls(z)
  elif isinstance(vv,dict):
   for z in vv.values():yield from urls(z)
 refs=(set(urls(uu))|set(re.findall(r'web/data/[\w.\-]+',u['script']))|{str(Path('web/runtime')/p) for p in re.findall(r'\.\./runtime/([\w.\-]+\.js)',u['script'])})-{u['manifest'],*(f for f,g in aliases)}
 if compact_changes:refs-={u['compact'],str(Path('web/runtime')/Path(u['compactjs']).name)}
 checked=[]
 for f in sorted(refs):
  x,y=u['root']/f,v['root']/f
  if not x.is_file() and not y.is_file():continue
  assert x.is_file() and y.is_file() and x.read_bytes()==y.read_bytes(),f
  checked.append(f)
 return {'changes':changes,'unchangedActiveReferenceCount':len(checked),'unchangedActiveRefNamesSHA256':sha256('\n'.join(checked).encode())}
ab=scope(a,b,[('stageLibraries',k13),('stages',k18),('stages',k21)],True)
bc=scope(b,c,[('stages',k22)],False)
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
assert packa==packb,'Production Act2 compact bundle unrelated edits'
proof={'stockToMetadata':ab,'metadataToTarget':bc,'knownPriorStage22AppRun':44651995224,
 'priorStage22PacketExactMatch':True,'stockTargetStage22SHA256':[sha256(b22),sha256(c22)],
 'stage13AssetSHA256':[sha256(a13),sha256(b13)],'stage18MapSHA256':[sha256(a18),sha256(b18)],'stage18CompactPartsSHA256':[h1,h2,h3],
 'stage21MapSHA256':[sha256(a21),sha256(b21)],'actualStage22PhysicsControls':'Terrain source and placements exact; App A/B independent'}
(O/'build-proof.json').write_text(json.dumps(proof,indent=2))
s=json.loads(b22); poly=next(t['points'] for t in s['terrains'] if t['id']=='v22-lower-court')
(O/'mask-geometry.private.json').write_text(json.dumps(poly))
