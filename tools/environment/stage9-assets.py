"""Trim only transparent margins; retain whole architecture and proportions."""
from pathlib import Path
from PIL import Image
import json
base=Path(__file__).resolve().parents[2]/'shared/assets/environment/stage9';rows={}
for name,limit in [('corridor',(1536,700)),('gate',(1152,800))]:
 im=Image.open(base/'source'/f'{name}.png').convert('RGBA');box=im.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox();im=im.crop(box);im.thumbnail(limit,Image.Resampling.LANCZOS);im.save(base/f'{name}.webp',quality=89,method=6);rows[name]={'width':im.width,'height':im.height,'sourceCrop':box,'bytes':(base/f'{name}.webp').stat().st_size}
(base/'manifest.json').write_text(json.dumps(rows,indent=2)+'\n')
