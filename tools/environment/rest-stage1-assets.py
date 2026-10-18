"""Prepare the small Stage1 rest inn only. Existing location images are shared."""
from pathlib import Path
import json
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
base=ROOT/'shared/assets/environment/rest-stage1'
im=Image.open(base/'source/inn.png').convert('RGBA')
box=im.getchannel('A').point(lambda v:255 if v>=20 else 0).getbbox()
im=im.crop(box);im.thumbnail((1024,768),Image.Resampling.LANCZOS)
im.save(base/'inn.webp',quality=89,method=6)
(base/'manifest.json').write_text(json.dumps({'inn':{'width':im.width,'height':im.height,'sourceBounds':list(box),'reference':'stage3/workbay.webp'}},indent=2)+'\n')
print(im.size,(base/'inn.webp').stat().st_size)
