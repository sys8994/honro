"""Exact author data fixture. Never apply to a tracked worktree."""
import ast,json,sys,hashlib
from pathlib import Path
from copy import deepcopy
D=Path(__file__).resolve().parent
PACKAGE='shared/data/act2/stage15-compact-package.json'
PACK_BLOB='ac4fb9854c5bf713507564755848b6c2af1f8f1b'
OUT_BLOB='44bb7e720c603585e5aa204b2744e940c7aec6bc'
BASE_SHA='95670e362e5ff59f375cea933eb1f8bf70a7e4c1442239a98e21854d2e5a6799'
OUT_SHA='8746d57209215584dce52ad72205a52a6a5f158160174e7d377736e83c921e8f'
STUDY=json.loads((D/'floor-v3-pins.json').read_bytes())
p=STUDY['polygons']
assert len(p)==9
from patch import gitsha
aid='act2-compact:stage15-act2-stage15-traced-outer-v1-1'
sym='compact15-source-world'
clip='stage15-local-flooring-paper'
def outer(pack):
    candidates=[x for x in pack['assets'] if x['id']==aid]
    assert len(candidates)==1
    return candidates[0]
def vector(pack): return outer(pack)['vector']
def fixture(old):
    out=deepcopy(old)
    v=vector(out)
    assert list(v['symbols'])==[sym] and len(v['root']['children'])==11
    assert all(n['children']==[{'tag':'use','symbol':sym}] for n in v['root']['children'])
    strip=v['root']['children'][1]
    assert strip['transform']==[.7,0,0,1,0,-1600]
    assert strip['pixelSnapClip'] is True and strip['clipPath']=='compact15-strip-1'
    assert set(v['clips']['compact15-strip-0'])=={'M-6000 -502H0V8002H-6000Z'}
    assert set(v['clips']['compact15-strip-1'])=={'M0 -502H1000V8002H0Z'}
    assert set(v['clips']['compact15-strip-2'])=={'M1000 -502H2000V8002H1000Z'}
    canonical=v['symbols'][sym]['children'][0]
    assert canonical['clipPath']=='canonicalSolid'
    c=canonical['children'][0]; assert c['clipPath']=='contactInset'
    outerflat,trace=c['children']; assert outerflat['fill']=='#283b46'
    inner=trace['children'][0]['children']
    assert [n['children'][0]['fill'] for n in inner]==['#283b46','#38505b','#4d6570']
    xx,b,cc,yy,dx,dy=trace['transform']; assert b==cc==0
    sx,sy,left,top=.7*xx,yy,.7*dx,dy-1600
    inv=[1/sx,0,0,1/sy,-left/sx,-top/sy]
    nativeX=[x/.7 for _,poly in p for x,y in poly]
    assert min(nativeX)>40 and max(nativeX)<785
    assert all(2070<=y<=2505 for _,poly in p for x,y in poly)
    node={'tag':'g','clipPath':clip,'children':[{'tag':'g','transform':inv,'children':[
       {'tag':'path','fillRule':'nonzero','fill':color,'d':'M'+'L'.join(f'{x},{y}'for x,y in poly)+'Z'}for color,poly in p]}]}
    assert clip not in v['clips']
    face=inner[0]['children'][0]
    assert face.get('fill')=='#283b46' and face.get('fillRule')=='nonzero'
    v['clips'][clip]=[face['d']]
    inner.insert(1,node)
    return out,node
def claim(pack):
    stage=pack['stage']; owner=outer(pack)
    assert (pack['mapRevision'],stage['metadata']['stageId'],stage['width'],stage['height'])==(615,15,5800,4200)
    place=[e for e in stage['elements']if e['assetId']==aid]
    assert len(place)==1 and tuple(place[0][k] for k in ('x','y','scale','rotation','layer','depthLayer','visualRole'))==(0,0,1,0,'prop','L1','scenery')
    assert owner['anchor']=={'x':0,'y':0} and owner['collision']==[]
    assert owner['params']['semanticLayer']=='BODY' and owner['params']['silhouetteUnderpaint'] is False
    floor,=[t for t in stage['terrains'] if t['id']=='act2-floor']
    assert sorted([r['x'],r['y']] for r in floor['points'] if 0<=r['x']<=700 and r['y']<4200)==STUDY['playContact']
def verify(old,new):
    claim(old);claim(new)
    expected,n=fixture(old)
    assert expected==new
    undone=deepcopy(new)
    v=vector(undone)
    child=v['symbols'][sym]['children'][0]['children'][0]['children'][1]['children'][0]['children']
    removed=child.pop(1); assert removed==n
    assert v['clips'].pop(clip)==[child[0]['children'][0]['d']]
    assert undone==old
    return {'strictOuterSingleSymbolRestoredEquality':True,'physicsAuthorSourceExact':True}

fmt=lambda x:json.dumps(x,ensure_ascii=False,separators=(',',':'))
def make(raw):
    assert gitsha(raw)==PACK_BLOB and hashlib.sha256(raw).hexdigest()==BASE_SHA
    old=json.loads(raw)
    new,node=fixture(old)
    verify(old,new)
    v=vector(new)
    # Locate two unique exact positions inside this one stock art identity.
    text=raw.decode()
    loc=text.index('"id":'+fmt(aid))
    vector_marker=text.index('"vector":',loc)+len('"vector":')
    parsed,end=json.JSONDecoder().raw_decode(text,vector_marker)
    assert parsed==vector(old)
    token=text[vector_marker:end]
    orig=v['symbols'][sym]['children'][0]['children'][0]['children'][1]['children'][0]['children']
    f0,f2=fmt(orig[0]),fmt(orig[2])
    old_join=f0+','+f2
    assert token.count(old_join)==1 and token.count('"clips":{')==1
    old_clip='"clips":{'; add_clip=old_clip+fmt(clip)+':'+fmt(v['clips'][clip])+','
    new_join=f0+','+fmt(node)+','+f2
    changed=token.replace(old_join,new_join).replace(old_clip,add_clip)
    assert changed.replace(new_join,old_join).replace(add_clip,old_clip)==token
    b=(text[:vector_marker]+changed+text[end:]).encode()
    assert json.loads(b)==new
    return b
if __name__=='__main__':
    A,V=[Path(x) for x in sys.argv[1:]]
    old=(A/PACKAGE).read_bytes()
    target=V/PACKAGE
    assert target.read_bytes()==old
    new=make(old)
    assert gitsha(new)==OUT_BLOB and hashlib.sha256(new).hexdigest()==OUT_SHA
    target.write_bytes(new)
    print(json.dumps({'beforeGitBlob':PACK_BLOB,'afterGitBlob':OUT_BLOB,'afterSHA256':OUT_SHA,
          **verify(json.loads(old),json.loads(new))}))
