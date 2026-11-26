"""Semantic part inputs for the first native-game rig study, with measured overlap."""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np
p=Path('cutouts/grot_hanging.png')
a=np.array(Image.open(p)); h,w=a.shape[:2]; source=a[:,:,3]>0
out=Path('rig-parts/grot_hanging'); out.mkdir(exist_ok=True,parents=True)
# Order matters: the near sleeve covers the neck/shoulder seam and the far reach is behind hair.
parts=[
 ('garment', [(-2,-2),(119,-2),(118,95),(130,140),(120,151),(110,154),(111,198),(114,247),(135,277),(114,296),(-2,296)],(95,46),None),
 ('farReach', [(141,211),(157,217),(167,216),(183,225),(230,236),(230,274),(191,260),(152,255),(140,235)],(152,225),'garment'),
 ('face',[(114,147),(165,140),(171,173),(164,201),(164,244),(141,241),(117,218),(111,182)],(119,158),'garment'),
 ('nearReach',[(91,143),(119,144),(131,166),(120,210),(130,228),(159,244),(164,291),(127,293),(115,266),(101,252),(83,208),(84,171)],(106,160),'garment')
]
seen=np.zeros((h,w),bool)
layers=[]
for n,poly,pivot,parent in parts:
    im=Image.new('L',(w,h));ImageDraw.Draw(im).polygon(poly,fill=255)
    mask=(np.asarray(im)>0)&source;seen|=mask
    z=a.copy(); z[:,:,3]=mask.astype(np.uint8)*255
    layers.append(dict(id=n,pivot=list(pivot),parent=parent))
    Image.fromarray(z).save(out/(n+'.png'))
# Do not discard unidentified source contours; show them explicitly at QA.
z=a.copy();z[:,:,3]=(source&~seen).astype(np.uint8)*255
Image.fromarray(z).save(out/'uncovered.png')
import json
(out/'parts.json').write_text(json.dumps(layers,indent=2)+'\n')
print('coverage',seen.sum()/source.sum())
