"""Disposable F art substitution only; must reproduce strict B to F asset scope."""
from copy import deepcopy
import hashlib, json, re, sys
from pathlib import Path
Q=Path(__file__).resolve().parent
from patch import gitsha
PACKAGE='shared/data/act2/stage15-compact-package.json'
PACK_BLOB='ac4fb9854c5bf713507564755848b6c2af1f8f1b'
WEST='act2-compact:stage15-act2-stage15-traced-west-flat-v2-1'
SRC='compact15-source-world'
STUDY=json.loads((Q/'study-F-proof.json').read_bytes())
assert STUDY['ownerParentClips']['assetId']==WEST
assert STUDY['ownerParentClips']['rootStripIndices']==[2,3]
assert STUDY['insetWorldFromPhysicalRoofRim']==[32.,16.]
assert STUDY['disjointNewPartitionCells'] and len(STUDY['worldFaceDomains'])==7
def west(p):
    found=[a for a in p['assets'] if a['id']==WEST]
    assert len(found)==1
    return found[0]
def base(p):
    s=p['stage']; a=west(p)
    assert (p['mapRevision'],s['metadata']['stageId'],s['width'],s['height'])==(615,15,5800,4200)
    e=[e for e in s['elements'] if e['assetId']==WEST]
    assert len(e)==1 and tuple(e[0][k] for k in ('x','y','scale','rotation','layer','depthLayer','visualRole'))==(0,0,1,0,'prop','L1','scenery')
    assert a['anchor']=={'x':0,'y':0} and a['collision']==[]
    assert a['params']['semanticLayer']=='BODY' and a['params']['silhouetteUnderpaint'] is False
    return a
def generate(old):
    out=deepcopy(old)
    a=base(out)
    v=a['vector']
    assert v['version']==1 and list(v['symbols'])==[SRC] and len(v['root']['children'])==7
    o=v['symbols'][SRC]
    assert o['children'][0]['clipPath']=='canonicalSolid' and o['children'][0]['children'][0]['clipPath']=='contactInset'
    hidden=o['children'][0]['children'][0]['children'][0]
    x,zb,zc,y,u,t=hidden['transform']
    assert zb==zc==0 and x>0 and y>0
    content=hidden['children'][0]['children']
    assert [g['children'][0]['fill'] for g in content]==['#445c64','#60747c','#88887e']
    trace=[('LongShoulder',content[1]['children'][0],'long fracture returning into the left shoulder'),
           ('RimFlakes',content[2]['children'][0],'diagonal limestone fracture branching near the rim')]
    for label,face,_ in trace:
        assert face['tag']=='path' and not any(k in face for k in ('transform','clipPath','dParts'))
        assert face['fillRule']=='nonzero' and face['stroke']=='none' and face['opacity']==1
        v['clips']['stage15-f-'+label]=[face['d']]
    for i in (2,3):
        strip=v['root']['children'][i]
        assert strip['clipPath']==f'compact15-strip-{i}' and strip['pixelSnapClip'] is True
        j,jb,jc,jy,w,h=strip['transform']
        assert jb==jc==0 and j>0 and jy==1 and h==-1600
        use=strip['children'][0]
        assert len(strip['children'])==1 and use=={'tag':'use','symbol':SRC}
        newname=f'{SRC}-f-{i}'
        dup=deepcopy(o)
        inner=dup['children'][0]['children'][0]['children'][0]['children']
        assert len(inner)==1
        sx,sy,dx,dy=j*x,jy*y,j*u+w,jy*t+h
        inv=[1/sx,0,0,1/sy,-dx/sx,-dy/sy]
        for label,_,owner in trace:
            rows=[r for r in STUDY['worldFaceDomains'] if r['owner']==owner]
            assert len(rows)==(3 if label=='LongShoulder' else 4)
            paths=[{'tag':'path','fill':r['fill'],'d':r['d'],'fillRule':'evenodd'} for r in rows]
            assert all(re.fullmatch(r'[#][0-9a-f]{6}',n['fill']) and re.fullmatch(r'[0-9MLZ.,\- ]+',n['d']) for n in paths)
            inner.append({'tag':'g','clipPath':'stage15-f-'+label,
                          'children':[{'tag':'g','transform':inv,'children':paths}]})
        use['symbol']=newname
        v['symbols'][newname]=dup
    return out
def verify(old,new):
    a,b=base(old),base(new)
    assert generate(old)==new
    v=deepcopy(b['vector'])
    for i in (2,3):
        n=f'{SRC}-f-{i}'
        copy=v['symbols'].pop(n)
        crop=copy['children'][0]['children'][0]['children'][0]['children']
        assert len(crop)==3
        del crop[1:]
        assert copy==a['vector']['symbols'][SRC]
        use=v['root']['children'][i]['children'][0]
        assert use.pop('symbol')==n
        use['symbol']=SRC
    for k in ('LongShoulder','RimFlakes'):v['clips'].pop('stage15-f-'+k)
    assert v==a['vector']
    before,after=deepcopy(old),deepcopy(new)
    west(before).pop('vector');west(after).pop('vector')
    assert before==after
    return {'strictWestSymbolRestoredEquality':True,'physicsAuthorSourceExact':True}
def make(raw):
    assert gitsha(raw)==PACK_BLOB and hashlib.sha256(raw).hexdigest()==STUDY['baselineSourcePakSHA']
    before=json.loads(raw)
    after=generate(before)
    verify(before,after)
    # Preserve original JSON on both sides of the single, exactly signed west vector token.
    a,b=west(before)['vector'],west(after)['vector']
    fmt=lambda v: json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()
    old=fmt(a); new=fmt(b)
    # Input is pretty-printed: locate unique owner and decode exact span without touching any other bytes.
    s=raw.decode()
    start=s.index('"id":'+json.dumps(WEST))
    m=re.search(r'"vector":\s*',s[start:])
    off=start+m.end()
    value,end=json.JSONDecoder().raw_decode(s,off)
    assert value==a
    text=s[:off]+new.decode()+s[end:]
    assert json.loads(text)==after and text[:off]==s[:off] and text[off+len(new.decode()):]==s[end:]
    return text.encode()
if __name__=='__main__':
    A,F=[Path(r) for r in sys.argv[1:]]
    source=(A/PACKAGE).read_bytes(); out=F/PACKAGE
    assert source==out.read_bytes()
    result=make(source)
    out.write_bytes(result)
    body={'scope':'disposable F test only','before':gitsha(source),'after':gitsha(result),
          **verify(json.loads(source),json.loads(result))}
    print(json.dumps(body))
