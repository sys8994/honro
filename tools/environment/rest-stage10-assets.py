"""Retain the complete low root/stair silhouette; trim alpha margins only."""
from pathlib import Path
from PIL import Image
import json
base=Path(__file__).resolve().parents[2]/'shared/assets/environment/rest-stage10'
im=Image.open(base/'source/root-stairs.png').convert('RGBA')
box=im.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
im=im.crop(box);im.thumbnail((1536,640),Image.Resampling.LANCZOS)
im.save(base/'root-stairs.webp',quality=89,method=6)
(base/'manifest.json').write_text(json.dumps({'root-stairs':{'width':im.width,'height':im.height,'sourceCrop':box,'bytes':(base/'root-stairs.webp').stat().st_size}},indent=2)+'\n')
print(im.size,box)
