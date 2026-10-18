"""Prepare the single finite Stage5 granite face; water stays dynamic."""
from pathlib import Path
import json
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];base=ROOT/'shared/assets/environment/stage5'
im=Image.open(base/'source/cliff.png').convert('RGB');im.thumbnail((1024,1536),Image.Resampling.LANCZOS)
im.save(base/'cliff.webp',quality=89,method=6)
water=Image.open(base/'source/water.png').convert('RGBA');water.thumbnail((512,1536),Image.Resampling.LANCZOS);water.save(base/'water.webp',quality=88,method=6)
(base/'manifest.json').write_text(json.dumps({'water':{'width':water.width,'height':water.height,'bytes':(base/'water.webp').stat().st_size,'role':'Single finite water sheet source for two cached flow states; dynamic ribbons remain separate'},'cliff':{'width':im.width,'height':im.height,'bytes':(base/'cliff.webp').stat().st_size,'role':'One finite nonrepeating geological face; actual polygon supplies cliff/cave boundaries; water separate'}},indent=2)+'\n')
