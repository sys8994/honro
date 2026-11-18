import json
from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np
p=Path('stage7-combined-final-chrome/evidence');rows=[]
for n in ['reported-left','overview','left-native','left-phone','right-control','lower-join-native']:
 def im(k,v):return np.array(Image.open(p/f'{v}-{n}-{k}-mask.png').convert('RGBA'))
 a,b=im('body','baseline'),im('body','candidate');r=im('allowedEdit','candidate');cap=im('caps','candidate');allowed=r[:,:,3]>0;guard=np.array(Image.fromarray((allowed*255).astype('uint8')).filter(ImageFilter.MaxFilter(7)))>0;diff=np.max(abs(a.astype(int)-b.astype(int)),2);mask=(diff>0)&~allowed;ys,xs=np.where(mask);row=dict(view=n,bodyChanged=int((diff>0).sum()),alphaChanged=int((a[:,:,3]!=b[:,:,3]).sum()),capsChanged=int(((diff>0)&(cap[:,:,3]>0)).sum()),bodyOutside=int(mask.sum()),bodyOutsideMax=int(diff[mask].max()) if mask.any() else 0,outsideBBox=[int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())] if len(xs) else None,examples=[dict(x=int(x),y=int(y),a=a[y,x].tolist(),b=b[y,x].tolist(),region=r[y,x].tolist()) for x,y in list(zip(xs,ys))[:20]])
 for k in ['terrain','readabilityOff','rimOnly','normal']:
  if k=='normal':a1,b1=[np.array(Image.open(p/f'{v}-{n}.png').convert('RGBA')) for v in ['baseline','candidate']]
  else:a1,b1=im(k,'baseline'),im(k,'candidate')
  d=np.max(abs(a1.astype(int)-b1.astype(int)),2);m=(d>0)&~guard;row[k]=dict(total=int((d>0).sum()),outsideGuard=int(m.sum()),maxOutside=int(d[m].max()) if m.any() else 0)
 rows.append(row)
Path('stage7-p-failure-analysis/result.json').write_text(json.dumps(rows,indent=2));print(json.dumps([{k:v for k,v in r.items() if k!='examples'} for r in rows],indent=2))
