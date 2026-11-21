"""Compare signed actual browser PNGs only; normal A1/A2/B. Not a screenshot simulator."""
import hashlib,json,math,sys
from pathlib import Path
import numpy as np
from PIL import Image
H=Path(__file__).resolve().parent
S=json.loads((H/'QA-POSES.json').read_bytes())
REC=json.loads((H/'CANDIDATE-RECEIPT.json').read_bytes())
ID=REC['sourceAsset']['id']
CHECKS=('actual','viewport','play','terrain','phase','round','sceneTime','dpr','backing','physics','actualTerrainIDs','unitCount','declaredMissing')
def digest(b):return hashlib.sha256(b).hexdigest()
def openpng(root,entry):
    p=root/entry['file'];assert p.resolve().is_relative_to(root.resolve()) and p.is_file()
    assert digest(p.read_bytes())==entry['sha256']
    with Image.open(p)as im:
        assert im.format=='PNG'
        return np.array(im.convert('RGBA'))
def signed(a,b,p):
    assert a.shape==b.shape and [a.shape[1],a.shape[0]]==p['backing']
    Z=p['actual']['scale'];V=p['viewport'];L=V['left'];T=V['top']
    xpx=(0-L)*Z
    yy,xx=np.indices(a.shape[:2]);x=L+(xx+.5)/Z;y=T+(yy+.5)/Z
    xlo=L+xx/Z;xhi=L+(xx+1)/Z;ylo=T+yy/Z;yhi=T+(yy+1)/Z
    K=REC['sourceKnots'];Xys=[r[0]for r in K]
    # Bounds of a monotone face for the entire pixel footprint; no tolerance past signed geometric support.
    top=np.interp(xlo,Xys,[r[1]+9 for r in K]);bottom=np.interp(xhi,Xys,[r[2]-9 for r in K])
    accept=(xhi>-480)&(x<0)&(top<yhi)&(bottom>ylo)
    d=np.any(a!=b,axis=-1)
    r={'changed':int(d.sum()),'outside':int((d&~accept).sum()),'alpha':int((a[:,:,3]!=b[:,:,3]).sum()),'positiveXCenters':int((d&(x>=0)).sum())}
    assert r['outside']==r['alpha']==r['positiveXCenters']==0,r
    if p['direction']=='east':
        assert not r['changed'],r
        return r
    i=math.floor(xpx);rr=(y[:,0]>=1130)&(y[:,0]<=2200)
    assert i>=2 and i+2<a.shape[1] and rr.any(),p
    def score(m):
        v=np.abs(np.diff(m[rr,i-2:i+3,:3].astype('int32'),axis=1)).sum(axis=2).max(axis=1)
        return float(np.median(v)),int(v.max())
    r['jumpMedianAndPeak']=[score(a),score(b)]
    assert r['changed']>0 and r['jumpMedianAndPeak'][1][1]<r['jumpMedianAndPeak'][0][1],r
    if p['device']=='1440x900':assert r['jumpMedianAndPeak'][1][0]<=r['jumpMedianAndPeak'][0][0]/2,r
    return r
def main(root):
    q=json.loads((root/'NATIVE-STAGE17.json').read_bytes())
    assert q['mode']=='NORMAL_BUILT_HTTP_BROWSER_WITHOUT_OVERRIDES'
    assert set(q['visits'])=={'A1','A2','B'}
    out={}
    expected=set(S)|{'1440x900-west-near'}
    for role,case in q['visits'].items():assert set(case)==expected,role
    for k in sorted(expected):
        pin=S.get(k)
        if pin is None:
            n=q['visits']['A1'][k]['frame'];w=S['1440x900-west']
            pin={**w,**n,'direction':'west-near','device':'1440x900','rawSHA256':None}
            assert n['actual']=={'x':80,'y':1650,'scale':.5}
            assert all(n[j]==w[j]for j in ('dpr','backing','physics','actualTerrainIDs','actualDrawOwnerIDs','unitCount','declaredMissing'))
        cases=[]
        for role in ('A1','A2','B'):
            case=q['visits'][role][k];f=case['frame']
            assert case['verifiedServedClosure'] is True
            assert all(pin[j]==f[j]for j in CHECKS),(k,role)
            old=set(pin['actualDrawOwnerIDs']); got=set(f['actualDrawOwnerIDs'])
            assert got==old|({ID}if role=='B'else set()),(k,role,old^got)
            cases.append(case)
        out[k]={}
        for mode in ('RAW','DOM'):
            out[k][mode]={}
            prev=[]
            for phase in ('firstCaptured','settled'):
                A1,A2,B=(openpng(root,c['pngs'][mode][phase])for c in cases)
                assert np.array_equal(A1,A2),(k,mode,phase,'stock not repeatable')
                if mode=='RAW' and pin['rawSHA256']:assert cases[0]['pngs'][mode][phase]['sha256']==pin['rawSHA256'],(k,phase,'stock archive mismatch')
                out[k][mode][phase]=signed(A1,B,pin)
                prev.append((A1,B))
            assert all(np.array_equal(a,b)for a,b in zip(*prev)),(k,mode,'first-captured/settled outputs differ')
    return out
if __name__=='__main__':print(json.dumps(main(Path(sys.argv[1])),indent=2))
