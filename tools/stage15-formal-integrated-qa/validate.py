"""Verify only actual observer frames against the immutable independent-composition digest contract."""
import argparse,hashlib,json,math,re
from io import BytesIO
from pathlib import Path
import numpy as np
from PIL import Image

STAGE=15
RELEASE='2939958cc87407ef60b58720bb6e086b8559031b'
BROWSER='151.0.7922.34'
STATE=('key','view','actual','desired','focus','viewport','viewportCSS','css','backing','pixels','zoomLimits',
       'sceneTime','actorCount','physicsSHA256','phase','round','tide','DPR','phaseReceiptValidated')
NORMAL_VIEWS=('ordinary','overview','north','south','west','east','northwest','northeast','southwest','southeast')
VIEWPORTS=('1440x900','390x844')
COMMON={f's15-{v}-{k}'for v in VIEWPORTS for k in NORMAL_VIEWS}
DETAIL={f's15-{v}-{k}-detail':pick for v in VIEWPORTS for k,pick in [('roof','H'),('ground','V4')]}
ALL=COMMON|DETAIL.keys()
MODES={'raw':('raw','rawSHA256'),'DOM':('png','pngSHA256')}
SCOPE_Y={'H':(1200,1464),'V4':(2065,2540),'S':(4440,None)}
SHA=lambda b:hashlib.sha256(b).hexdigest()
def canon(x):
    return json.dumps(x,sort_keys=True,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode()
def state(f):
    p={k:f[k] for k in STATE}
    assert p['phaseReceiptValidated'] is True and p['phase']=='aim' and p['round']==1
    assert p['sceneTime']==2 and p['actorCount']==26 and p['tide'] is None and p['DPR']==1
    assert re.fullmatch('[0-9a-f]{64}',p['physicsSHA256'])
    assert all(type(v) in (int,float) and math.isfinite(v)for obj in ('actual','viewport','focus','css')for v in p[obj].values())
    return SHA(canon(p))
def frame_map(p):
    assert p['complete'] is True and p['stage']==STAGE and p['release']==RELEASE and p['browser']==BROWSER
    fs={f['key']:f for f in p['frames']}
    assert len(fs)==len(p['frames']) and all(f['phaseReceiptValidated'] is True for f in fs.values())
    return fs
def dimensions(f,mode):
    return tuple(f['backing']) if mode=='raw' else (math.ceil(f['css']['w']),math.ceil(f['css']['h']))
def png_frame(f,mode,read):
    n,h=MODES[mode]
    known_name=f['key']+('-raw' if mode=='raw' else '')+'.png'
    assert f[n]==known_name
    data=read(known_name)
    digest=SHA(data)
    assert digest==f[h],(known_name,'claimed PNG digest mismatch')
    with Image.open(BytesIO(data))as im:
        assert im.format=='PNG' and im.size==dimensions(f,mode),(known_name,im.size,dimensions(f,mode))
        img=np.array(im.convert('RGBA'),dtype=np.uint8)
    return img,digest
def rgba_sha(img):
    h,w,d=img.shape
    assert d==4 and img.dtype==np.uint8
    return SHA(f'RGBA8 {w}x{h}\n'.encode()+img.tobytes(order='C'))
def disjoint(before,targets,frame,mode):
    seen=np.zeros(before.shape[:2],dtype=bool)
    out=before.copy(); rows={}
    for role,target in targets.items():
        assert target.shape==before.shape
        for c in (target,before):assert c.dtype==np.uint8
        changed=np.any(target!=before,axis=2)
        overlap=int((seen&changed).sum())
        assert overlap==0,(frame['key'],mode,role,'independent pixels overlap',overlap)
        assert np.array_equal(target[:,:,3],before[:,:,3]),(role,'alpha must match the already signed component')
        assert not np.any(changed&(before[:,:,3]==0)),(role,'independent air changed')
        seen|=changed;out[changed]=target[changed]
        rows[role]=int(changed.sum())
    assert int(seen.sum())==sum(rows.values())
    return out,rows
def validate_state(f,key,row):
    assert f['key']==key and state(f)==row['stateSHA256'],(key,'phase, physics or registered camera drift')
def validate_img(img,png_sha,key,mode,expected):
    got=rgba_sha(img)
    assert got==expected['expectedCombinedRGBA'],(key,mode,'combined screen differs',got,expected['expectedCombinedRGBA'])
    if 'expectedExactComponentPNG' in expected:
        assert png_sha==expected['expectedExactComponentPNG'],(key,mode,'exclusive close PNG bytes differ')
def verify_capture(contract,root):
    proof=json.loads((root/'proof.json').read_bytes())
    fs=frame_map(proof)
    frames=contract['frames']
    assert set(fs)==set(frames)==ALL
    results=[]
    for key,row in frames.items():
        f=fs[key];validate_state(f,key,row)
        for mode,expected in row['modes'].items():
            img,png=png_frame(f,mode,lambda name:(root/name).read_bytes())
            validate_img(img,png,key,mode,expected)
            results.append({'key':key,'mode':mode,'exactRGBA':True,'componentPNGExact':row['kind']!='disjoint',
                'unchangedState':True,'actualPNGSHA256':png})
    return {'scope':'Actual candidate screenshot equivalence only, not seek/play or release approval',
            'pairs':len(results),'stage':STAGE,'results':results}

if __name__=='__main__':
    cmd=argparse.ArgumentParser()
    cmd.add_argument('contract',type=Path)
    cmd.add_argument('contract_sha256')
    cmd.add_argument('actual_capture_dir',type=Path)
    args=cmd.parse_args()
    b=args.contract.read_bytes();assert SHA(b)==args.contract_sha256
    contract=json.loads(b)
    assert (contract['stage'],contract['release'],contract['browser'])==(STAGE,RELEASE,BROWSER)
    assert all(set(row['modes'])==set(MODES)for row in contract['frames'].values())
    r=verify_capture(contract,args.actual_capture_dir)
    r['validatedContractSHA256']=args.contract_sha256
    print(json.dumps(r,indent=2))
