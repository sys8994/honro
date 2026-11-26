"""Create fitting/tracing inputs from the eight approved concept-sheet regions."""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT=Path(__file__).parent
REGIONS=[
 ('grot_hanging','f3040e46',(210,0,615,505)),('grot_hands','f3040e46',(828,0,1499,508)),
 ('grot_door','f3040e46',(33,505,688,1024)),('boss_daedosa','f3040e46',(742,510,1536,1024)),
 ('wonhon','05c85a45',(8,0,716,422)),('wonhon_knotted','05c85a45',(681,0,1536,452)),
 ('gate_armor','05c85a45',(77,414,562,1024)),('forepaw','05c85a45',(529,561,1511,1001))]
for name,sheet,box in REGIONS:
 source=next((ROOT/'sources').glob('exec-'+sheet+'-*.png'))
 im=Image.open(source).convert('RGB').crop(box)
 im.thumbnail((310,290),Image.Resampling.LANCZOS)
 a=np.asarray(im,dtype=np.int16)
 corners=np.concatenate([b.reshape(-1,3) for b in (a[:5,:5],a[:5,-5:],a[-5:,:5],a[-5:,-5:])])
 bg=np.median(corners,axis=0)
 # Low-threshold alpha grown only around the dominant illustration preserves fine ribbons.
 dist=np.linalg.norm(a-bg,axis=-1)
 clean=(dist>27)
 components,k=ndi.label(clean)
 areas=np.bincount(components.ravel()); areas[0]=0
 core=components==areas.argmax()
 eligible=ndi.binary_dilation(core,iterations=4) & (dist>21)
 trim=ndi.binary_closing(eligible,iterations=1,border_value=0) | eligible
 rgba=np.dstack([a.astype(np.uint8), trim.astype(np.uint8)*255])
 visual=Image.fromarray(rgba); bbox=visual.getbbox()
 assert bbox, name
 x0,y0,x1,y1=bbox; visual=visual.crop((x0,y0,x1,y1))
 dst=Image.new('RGBA',(visual.width+4,visual.height+4))
 dst.alpha_composite(visual,(2,2))
 (ROOT/'cutouts').mkdir(exist_ok=True); dst.save(ROOT/'cutouts'/f'{name}.png')
 print(name,dst.size,int(trim.sum()))
