"""Stage17 local normal-build graph check; no external calls or mutation of roots."""
import hashlib,json,re,sys
from pathlib import Path
H=Path(__file__).resolve().parent
REC=json.loads((H/'CANDIDATE-RECEIPT.json').read_bytes())
ID=REC['sourceAsset']['id'];EL=REC['addedPlacement']['id']
def fact(b):return(len(b),hashlib.sha256(b).hexdigest())
def signature(b):return{'bytes':len(b),'sha256':fact(b)[1]}
def stable(q):return json.dumps(q,ensure_ascii=False,separators=(',',':')).encode()
def read_graph(root):
    manifest=json.loads((root/'web/manifest.json').read_bytes())
    active={x['path']:x for x in manifest['files']}
    def read(rel):
        q=active[rel];b=(root/rel).read_bytes();assert signature(b)=={k:q[k]for k in ('bytes','sha256')},rel
        return b
    (desc,)=sorted(p for p in active if re.fullmatch(r'web/data/HONRO_ACT2_COMPACT_PACKAGES-parts\.[0-9a-f]{16}\.json',p))
    (loader,)=sorted(p for p in active if re.fullmatch(r'web/runtime/HONRO_ACT2_COMPACT_PACKAGES\.[0-9a-f]{16}\.js',p))
    dr=json.loads(read(desc));assert dr['$honroJsonParts']==1 and len(dr['parts'])==2
    b=[]
    for r in dr['parts']:
        p=r['path'];v=read(p);assert signature(v)=={k:r[k]for k in ('bytes','sha256')};b.append(v)
    joined=b''.join(b);assert signature(joined)=={k:dr[k]for k in ('bytes','sha256')}
    # Include byte-bound loader for honest actual HTTP checks; do not infer descriptor binding.
    read(loader)
    keys={desc,loader,*(p['path']for p in dr['parts'])}
    return json.loads(joined),{p:active[p]for p in keys},active
def validate_compact(a,b):
    assert list(a)==list(b) and '17'in a
    assert all(stable(a[k])==stable(b[k])for k in a if k!='17')
    a,b=a['17'],b['17']
    assert a['mapRevision']==b['mapRevision']==617
    assert all(x['id']!=ID for x in a['assets']) and all(x['id']!=EL for x in a['stage']['elements'])
    (native,)=[x for x in b['assets'] if x['id']==ID]
    (element,)=[x for x in b['stage']['elements'] if x['id']==EL]
    assert native==REC['sourceAsset'] and element==REC['addedPlacement'],'normal build modified or pruned registered paint'
    b['assets'].remove(native);b['stage']['elements'].remove(element)
    assert stable(a)==stable(b),'any existing stage17 app-bound draw owner or metadata/terrain/units changed'
    return {'revision':617,'role':'rear only','id':ID,'knownOtherCompactStagesExact':True,'originalStage17PayloadExactAfterInverse':True}
def main(paths):
    A,B=(read_graph(Path(p))for p in paths)
    qa=validate_compact(A[0],B[0])
    carried,built=set(A[1]),set(B[1])
    unrelated_delta=sorted((set(A[2])^set(B[2]))-carried-built)
    changed_common=sorted(p for p in set(A[2])&set(B[2]) if any(A[2][p][j]!=B[2][p][j]for j in ('bytes','sha256')))
    assert not unrelated_delta and not changed_common,{'addedOrMissing':unrelated_delta,'commonContentChanged':changed_common}
    print(json.dumps({'A':A[1],'B':B[1],'compact':qa},ensure_ascii=False,indent=2))
if __name__=='__main__':main(sys.argv[1:])
