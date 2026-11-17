from pathlib import Path
import os,json,hashlib,xml.etree.ElementTree as E
import numpy as np
from PIL import Image
from scipy.ndimage import label
V=Path(__file__).parent;P=V.parent/'stage7-svg-study';O=Path(os.environ.get('STUDY_OUTPUT','artifacts/stage7-vector-study'));cfg=json.loads((P/'config.json').read_text());floor=np.array(cfg['rootFloor']);gx0,gy0,gx1,gy1=cfg['gap'];r={'scope':'Actual HonroVectorArt A/B, not HonroScene/campaign/deployment','checks':{},'visualStatus':'not reviewed in Chrome','runtimeStatus':'actual VectorArt only, not a game Scene/playtest','hashes':{}}
r['renderedAssetHashes']={k:hashlib.sha256((V/'generated'/(k+'.json')).read_bytes()).hexdigest() for k in ['original','candidate']}
fail=[]
for kind in ['original','candidate']:
 data=(P/(kind+'.svg')).read_bytes();r['hashes'][kind]=hashlib.sha256(data).hexdigest();root=E.fromstring(data)
 if any(el.tag.rsplit('}',1)[-1] in ('image','script','foreignObject') for el in root.iter()):fail.append(kind+' includes image/script/foreignObject')
 for el in root.iter():
  for k,v in el.attrib.items():
   if k.rsplit('}',1)[-1]=='href' and not v.startswith('#'):fail.append(kind+' external reference')
for v in cfg['views']:
 n=v['name'];a=np.array(Image.open(O/(n+'-candidate.png')).convert('RGBA'));b=np.array(Image.open(O/(n+'-original.png')).convert('RGBA'));H,W=a.shape[:2];x,y,w,h=v['viewBox'];scale=min(W/w,H/h);ox=(W-w*scale)/2;oy=(H-h*scale)/2;xx=(np.arange(W)-ox)/scale+x;yy=(np.arange(H)-oy)/scale+y
 protected=(xx[None,:]>=9)&(xx[None,:]<1434)&(yy[:,None]<=np.interp(xx,floor[:,0],floor[:,1])[None,:]+24)
 footprintGap=(xx[None,:]<=gx1)&(xx[None,:]+1/scale>=gx0)&(yy[:,None]<=gy1)&(yy[:,None]+1/scale>=gy0)
 changed=np.any(a!=b,axis=2);bad=changed&protected&~footprintGap;opaque=changed&protected&(b[:,:,3]==255)
 rows,cols=np.where(bad);check={'protectedSamples':int(protected.sum()),'protectedChanged':int((changed&protected).sum()),'outsideExplicitGapFootprint':int(bad.sum()),'opaqueOriginalProtectedChanged':int(opaque.sum()),'firstFailures':[{'pixel':[int(cx),int(cy)],'sourceOrigin':[float(xx[cx]),float(yy[cy])],'original':b[cy,cx].tolist(),'candidate':a[cy,cx].tolist()} for cy,cx in zip(rows[:20],cols[:20])]}
 oyy,oxx=np.where(opaque)
 check['firstOpaqueFailures']=[{'pixel':[int(cx),int(cy)],'sourceOrigin':[float(xx[cx]),float(yy[cy])],'original':b[cy,cx].tolist(),'candidate':a[cy,cx].tolist()} for cy,cx in zip(oyy[:20],oxx[:20])]
 r['checks'][n]=check
 if bad.any() or opaque.any():fail.append(n+' original protection failed')
 if n=='source-contact':
  lab,_=label(a[:,:,3]>=128);counts=np.bincount(lab.ravel());counts[0]=0;main=counts.argmax();check['support']={}
  for side,lo,hi,sy in [('left',-1200/3.13,8,991),('right',1447,1448+1200/3.13,884)]:
   cols=np.arange(int(np.floor((lo-x)*scale+ox)),int(np.ceil((hi-x)*scale+ox)));rows=np.arange(round((sy-y)*scale+oy),round((sy+24-y)*scale+oy)+1);alpha=a[rows[:,None],cols,3];components=lab[rows[:,None],cols];q={'samples':alpha.size,'alphaGE128':int((alpha>=128).sum()),'connected':bool((components==main).all()),'minAlpha':int(alpha.min())};check['support'][side]=q
   if q['samples']!=q['alphaGE128'] or not q['connected']:fail.append(n+' '+side+' support failed')
r['failures']=fail;r['protectedPixelChecksPassed']=not fail
(O/'protection.json').write_text(json.dumps(r,indent=2));print(json.dumps(r,indent=2))
if fail:raise SystemExit(1)
