"""Prepare complete Korean Stage4 structures and its one distant family."""
from pathlib import Path
import json
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
base=ROOT/'shared/assets/environment/stage4'
meta={}
for name,size in [('gate',(1280,768)),('watch',(1024,1024)),('burned',(1024,640))]:
    im=Image.open(base/'source'/f'{name}.png').convert('RGBA')
    box=im.getchannel('A').point(lambda v:255 if v>=20 else 0).getbbox()
    im=im.crop(box);im.thumbnail(size,Image.Resampling.LANCZOS)
    im.save(base/f'{name}.webp',quality=89,method=6)
    meta[name]={'width':im.width,'height':im.height,'sourceBounds':list(box),'bytes':(base/f'{name}.webp').stat().st_size}
im=Image.open(ROOT/'shared/assets/environment/location-far/source/mountain-still-night.png').convert('RGB')
im.thumbnail((2048,1024),Image.Resampling.LANCZOS);im.save(base/'still-night.webp',quality=88,method=6)
meta['far']={'width':im.width,'height':im.height,'source':'location-far/source/mountain-still-night.png','bytes':(base/'still-night.webp').stat().st_size}
(base/'manifest.json').write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps(meta))
