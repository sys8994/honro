"""Split concept into planned motion groups; preserve an explicit uncovered witness."""
from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np,json
from scipy.ndimage import distance_transform_edt
a=np.asarray(Image.open('cutouts/boss_daedosa.png').convert('RGBA'));h,w=a.shape[:2]
assert (w,h)==(304,202)
# Finish the open lower contour at the actual folds. No separate flat shelf.
y,x=np.ogrid[:h,:w]
edge=np.array([(0,183),(20,183),(35,187),(53,183),(67,194),(81,189),(93,196),
 (107,200),(117,192),(134,197),(150,200),(158,196),(169,199),(185,197),
 (199,193),(209,197),(218,189),(230,194),(247,186),(260,196),(274,193),(289,180),(304,182)])
trim=y<=np.interp(x,edge[:,0],edge[:,1])
a=a.copy();a[:,:,3]*=trim
out=Path('rig-parts/boss_daedosa');out.mkdir(parents=True,exist_ok=True)
parts=[
 ('robe',[(100,56),(130,49),(165,45),(184,66),(215,78),(232,120),(247,149),(283,201),(1,201),(37,167),(78,117)],(152,123),None),
 ('farArm',[(179,66),(205,74),(235,80),(251,81),(299,93),(303,123),(283,132),(258,111),(253,127),(264,143),(296,156),(303,181),(282,179),(264,171),(244,156),(227,146),(217,115),(187,105)],(201,86),'robe'),
 ('nearArm',[(136,56),(113,57),(84,64),(44,89),(5,115),(2,183),(15,185),(43,169),(76,144),(95,141),(115,123),(127,90)],(113,73),'robe'),
 ('head',[(133,31),(145,16),(169,12),(181,41),(225,59),(211,68),(182,60),(172,72),(151,65),(136,56),(128,45)],(154,61),'robe'),
 ('ribbons',[(18,72),(33,54),(59,39),(86,25),(89,15),(120,17),(132,0),(171,0),(178,25),(165,35),(149,27),(121,25),(102,48),(66,63),(31,87),(18,95)],(150,25),'head')
]
masks=[];rigs=[]
for n,poly,pivot,parent in parts:
    im=Image.new('L',(w,h));ImageDraw.Draw(im).polygon(poly,fill=255)
    mask=(np.asarray(im)>0)&(a[:,:,3]>0); masks.append(mask)
    rigs.append(dict(id=n,pivot=pivot,parent=parent))
# Pole-shaped crown stays attached to the head; only loose cloth moves with ribbons.
cap=((x>=138) & (x<=178) & (y<33) & (a[:,:,3]>0))
masks[3] |= cap
masks[4] &= ~cap
seen=np.logical_or.reduce(masks)

missing=(a[:,:,3]>0)&~seen
near=np.argmin([distance_transform_edt(~mask) for mask in masks],axis=0)
for i, mask in enumerate(masks):
    mask |= missing & (near==i)
    z=a.copy();z[:,:,3]=mask.astype(np.uint8)*255
    Image.fromarray(z).save(out/(rigs[i]['id']+'.png'))
z=a.copy();z[:,:,3]=missing.astype(np.uint8)*255;Image.fromarray(z).save(out/'uncovered-semantic-mask.png')
(out/'parts.json').write_text(json.dumps(rigs,indent=2)+'\n')
assert np.array_equal(np.logical_or.reduce(masks),a[:,:,3]>0)
print('Coverage 100%, with',int(missing.sum()),'minor or border pixels assigned to closest pin')
