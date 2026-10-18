"""Keep complete objects and their proportions; trim only transparent margins."""
from pathlib import Path
from PIL import Image
import json
b=Path(__file__).resolve().parents[2]/'shared/assets/environment/stage7';out={}
for name,limit in [('tree',(1152,1536)),('home',(1200,800))]:
 im=Image.open(b/'source'/f'{name}.png').convert('RGBA');box=im.getchannel('A').point(lambda v:255 if v>32 else 0).getbbox();im=im.crop(box);im.thumbnail(limit,Image.Resampling.LANCZOS);im.save(b/f'{name}.webp',quality=89,method=6);out[name]={'width':im.width,'height':im.height,'sourceCrop':box,'bytes':(b/f'{name}.webp').stat().st_size}
(b/'manifest.json').write_text(json.dumps(out,indent=2)+'\n')
