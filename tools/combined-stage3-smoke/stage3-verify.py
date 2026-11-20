import json
from pathlib import Path
from PIL import Image
import numpy as np

p=Path('_local/reports/stage3-source')
a=json.loads((p/'baseline/report.json').read_text());b=json.loads((p/'candidate/report.json').read_text())
rows=[]
assert [r['label'] for r in a['rows']]==['west','overview','control4']
for u,v in zip(a['rows'],b['rows'],strict=True):
 for k in ('camera','canvas','gameplaySha256','support','units','stage','projectStage','label'):
  assert u[k]==v[k],(u['label'],k)
 n=u['label'];im,jm=[np.asarray(Image.open(p/tag/f'{n}.png').convert('RGB'),dtype=np.int16) for tag in ('baseline','candidate')]
 delta=np.max(abs(im-jm),axis=2);y,x=np.where(delta>1);bnd=[int(x.min()),int(y.min()),int(x.max())+1,int(y.max())+1] if x.size else None
 if n=='west':
  assert u['camera']=={'x':0,'y':1517.505,'scale':.35} and u['canvas']==[1440,900]
  assert not u['taperPresent'] and v['taperPresent']
  assert bnd is not None and bnd[0]>=195 and bnd[1]>=692 and bnd[2]<=301 and bnd[3]<=844,bnd
 else:assert bnd is None,(n,bnd)
 rows.append({'view':n,'stage':u['stage'],'matchedCameraCollisionUnits':True,'oneLevelNoisePixels':int((delta==1).sum()),'meaningfulPixels':int(x.size),'meaningfulBoundsExclusive':bnd,'maxDelta':int(delta.max())})
(p/'paired-verified.json').write_text(json.dumps(rows,indent=2))
print('Stage3 normal launch: west ROI only; overview and Stage4 no meaningful differences; camera/physics unchanged')
