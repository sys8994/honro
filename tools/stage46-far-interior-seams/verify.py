import os,json,hashlib
from pathlib import Path
from PIL import Image
import numpy as np
p=Path(os.environ['OUT']);d=json.loads((p/'proof.json').read_text());rows=[]
for f in d['frames']:
 if f['mode']!='original':continue
 stem=f['name'].removesuffix('-original');a=np.array(Image.open(p/(stem+'-original.png')).convert('RGBA'));b=np.array(Image.open(p/(stem+'-candidate.png')).convert('RGBA'))
 x=(f['seamWorldX']-f['scene']['x'])*f['scene']['scale']+f['canvas']['width']/2;ix=round(x);opaque=(a[:,max(0,ix-4):ix+5,3]==255).all(axis=1);changed=np.any(a!=b,axis=2);metrics={}
 for mode,im in [('original',a),('candidate',b)]:
  # projected seam neighborhood vs linear mean of flanks, same rows both modes
  center=im[:,ix-1:ix+2,:3].astype(float).mean(axis=1);flanks=(im[:,ix-4,:3].astype(float)+im[:,ix+4,:3].astype(float))/2
  v=np.abs(center-flanks).mean(axis=1)[opaque];metrics[mode]={'medianRGBDeviation':float(np.median(v)) if len(v) else None,'meanRGBDeviation':float(np.mean(v)) if len(v) else None}
 row={'name':stem,'seamWorldX':f['seamWorldX'],'projectedX':x,'inView':0<=x<a.shape[1],'alphaExact':bool(np.array_equal(a[:,:,3],b[:,:,3])),'originalRGBAsha256':hashlib.sha256(a.tobytes()).hexdigest(),'opaqueSampleRows':int(opaque.sum()),'changedPixels':int(changed.sum()),'seamMetrics':metrics}
 rows.append(row)
(p/'comparison.json').write_text(json.dumps(rows,indent=2));assert len(rows)==12 and all(r['alphaExact'] and r['inView'] for r in rows)
