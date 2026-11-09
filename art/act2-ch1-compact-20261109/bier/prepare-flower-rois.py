"""Source-derived floral material masks; no synthetic flower geometry.
The native global trace loses small petal lines. This preserves original RGB
in a local source-derived alpha, ready for separate actual Inkscape tracing.
"""
from pathlib import Path
from PIL import Image
import numpy as np,json,sys
from scipy.ndimage import binary_closing,binary_fill_holes,label
p=Path(__file__).resolve().parent;src=Image.open(p/'source-v1.png').convert('RGBA');out=p/(sys.argv[1] if len(sys.argv)>1 else 'roi-flower-tight-sources');out.mkdir(exist_ok=True)
rois={'center':[601,386,62,52],'west':[300,535,62,70],'east':[890,532,70,75]}
for name,(x,y,w,h) in rois.items():
 a=np.array(src.crop((x,y,x+w,y+h)));rgb=a[:,:,:3].astype(float);r,g,b=rgb.transpose(2,0,1)
 mask=(r>90)&(r/np.maximum(g,1)>1.13)&(g/np.maximum(b,1)>1.25)&(r/np.maximum(g,1)<1.45)
 mask=binary_closing(mask,structure=np.ones((3,3)),border_value=0);components,n=label(mask);sizes=np.bincount(components.ravel());sizes[0]=0;mask=binary_fill_holes(components==int(sizes.argmax()));a[:,:,3]=np.minimum(a[:,:,3],mask.astype('uint8')*255);Image.fromarray(a).save(out/f'{name}.png')
(out/'placements.json').write_text(json.dumps(rois,indent=2))
(out/'mask-method.json').write_text(json.dumps({'method':'Source RGB gold-material selection inside protected flower ROIs: r>90,1.13<r/g<1.45,g/b>1.25. 3x3binary closing, largest connected gold component, then fill_holes include original internal petal lines while excluding separate ornamental border fragments. Original RGB unchanged. Native alpha traced from this mask.','purpose':'Confine native petal detail to floral motif; avoid rectangular ROI background seams. No hand-drawn flower.','rois':rois},indent=2))
