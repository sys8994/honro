"""Reproduce pinned source-only clip pruning from immutable index/chunk witness. No source writes."""
from pathlib import Path
import copy,json,re,hashlib,sys
root,out=map(Path,sys.argv[1:3]);out.mkdir(parents=True,exist_ok=True)
m=json.loads((Path(__file__).parent/'clip-removal-manifest.json').read_text())
def encode(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
def sha(x):return hashlib.sha256(x).hexdigest()
base={'assets':[json.loads((root/'shared/assets/environment/act5'/n).read_text())for n in ['stage42-registered-body.json','stage42-surface.json']]}
assert sha(encode(base))==m['baselineSha256'],'Pinned baseline mismatch'
mod=copy.deepcopy(base);drop=set(m['drop']);assert len(drop)==len(m['drop'])==1331
seen=set();counter=[-1];removed=[0,0]
def visit(n,k):
 if n.get('tag')=='path':
  counter[0]+=1;ix=counter[0];assert ix<len(m['paths']);spec=m['paths'][ix]
  key='dParts' if n.get('dParts')else'd';chunks=n[key]if key=='dParts'else[n[key]]
  assert spec['assetIndex']==k and spec['key']==key and len(spec['chunks'])==len(chunks)
  ring=0;updated=[]
  for text,expected in zip(chunks,spec['chunks']):
   assert sha(text.encode())==expected['sha256'],'Chunk mismatch'
   parts=re.findall('[Mm][^Mm]*',text);assert len(parts)==expected['rings'] and all(q.startswith('M') for q in parts)
   keep=[]
   for q in parts:
    token=f'{ix}:{ring}';ring+=1
    if token in drop:
     assert k==1 and q.rstrip().lower().endswith('z'),'Only closed SURFACE contours may be removed'
     seen.add(token);removed[k]+=1
    else:keep.append(q)
   if len(keep)==len(parts):updated.append(text)
   elif keep:updated.append(' '.join(q.strip()for q in keep))
  assert updated,'Whole path deletion prohibited';n[key]=updated if key=='dParts'else updated[0]
 for ch in n.get('children',[]):visit(ch,k)
for k,a in enumerate(mod['assets']):visit(a['vector']['root'],k)
assert counter[0]+1==len(m['paths']) and seen==drop and removed==[0,1331]
assert mod['assets'][0]==base['assets'][0],'BODY changed'
assert sha(encode(mod))==m['candidateSha256'],'Candidate reconstruction mismatch'
(out/'baseline-package.json').write_bytes(encode(base));(out/'clip-only-candidate.json').write_bytes(encode(mod))
(out/'clip-only-reconstruction.json').write_text(json.dumps({'sourceCommit':m['sourceCommit'],'baselineSha256':sha(encode(base)),'candidateSha256':sha(encode(mod)),'removed':removed,'baselineBytes':len(encode(base)),'candidateBytes':len(encode(mod)),'strictChunkAndPathBounds':True,'allDropIndicesConsumed':True,'bodyUnchanged':True},indent=2))
