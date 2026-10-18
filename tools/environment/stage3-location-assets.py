"""Prepare Stage3-only transparent architecture; never change campaign data."""
import json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];base=ROOT/'shared/assets/environment/stage3';meta={}
for key,width in [('warehouse',1536),('shrine',512),('workbay',1024)]:
 im=Image.open(base/'source'/(key+'.png')).convert('RGBA');box=im.getchannel('A').point(lambda p:255 if p>=20 else 0).getbbox();im=im.crop(box);im.thumbnail((width,1024),Image.Resampling.LANCZOS);im.save(base/(key+'.webp'),quality=89,method=6)
 info={'width':im.width,'height':im.height,'sourceBounds':list(box)}
 if key=='warehouse':
  a=im.getchannel('A');n=48;info['roofEave']=round(im.height*.47);info['roofTop']=[]
  for i in range(n):
   cut=a.crop((int(im.width*i/n),0,int(im.width*(i+1)/n),info['roofEave']));q=cut.point(lambda p:255 if p>=40 else 0).getbbox();info['roofTop'].append(q[1] if q else info['roofEave']-1)
 meta[key]=info
(base/'manifest.json').write_text(json.dumps(meta,indent=2)+'\n');print(meta)
