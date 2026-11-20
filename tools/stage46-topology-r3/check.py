import json,sys
from pathlib import Path
from PIL import Image,ImageChops
import numpy as np
p=Path(sys.argv[1]); frames=json.loads((p/'frames.json').read_text());report=[]
def img(m,n):return np.array(Image.open(p/m/(n+'.png')).convert('RGBA'))
a={x['label']:x for x in frames if x['mode']=='stock'};b={x['label']:x for x in frames if x['mode']=='candidate'}
assert len(a)==len(b)==21 and a.keys()==b.keys()
for n,x in a.items():
 y=b[n]; assert all(x[k]==y[k] for k in ['sid','actual','requested','adjusted','css','size','digest','actors'])
 z=x['sid']==46
 if z:
  assert x['ident']['subassets'][0]!=y['ident']['subassets'][0] and x['ident']['subassets'][1:]==y['ident']['subassets'][1:]
  assert x['ident']['other']==y['ident']['other'] and x['ident']['stage']==y['ident']['stage']
 for typ in ['']+(['-landmark'] if z else []):
  d,e=img('stock',n+typ),img('candidate',n+typ); assert d.shape==e.shape
  delta=np.abs(d.astype('int16')-e.astype('int16'))
  rgb=delta[:,:,:3].max(axis=2); o={'label':n,'capture':'landmark' if typ else 'game','rgbPixels':int((rgb>0).sum()),'rgbPixels16':int((rgb>=16).sum()),'maxRgb':int(rgb.max()),'alphaPixels':int((delta[:,:,3]>0).sum()),'emptyMaskFlip':int(((d[:,:,3]==0)!=(e[:,:,3]==0)).sum()),'thresholdMaskFlip':int(((d[:,:,3]>=128)!=(e[:,:,3]>=128)).sum())}
  report.append(o)
(p/'comparison.json').write_text(json.dumps(report,indent=2))
assert not any(q['alphaPixels'] for q in report if q['capture']=='landmark')
assert not any(q['rgbPixels'] for q in report if q['label'].startswith('s42'))
assert any(q['rgbPixels'] for q in report if q['label'].startswith('s46'))
