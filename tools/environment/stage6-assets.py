"""Trim transparent export padding, preserving the single bridge's proportions."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[2];base=root/'shared/assets/environment/stage6'
im=Image.open(base/'source/bridge.png').convert('RGBA');im=im.crop((0,200,2172,600));im.save(base/'bridge.webp',quality=90,method=6)
(base/'manifest.json').write_text(json.dumps({'bridge':{'width':im.width,'height':im.height,'bytes':(base/'bridge.webp').stat().st_size,'sourceCrop':[0,200,2172,600],'role':'Complete finite three-span timber bridge with two fractured deck gaps and rear masonry piers; uniform world scale'}},indent=2)+'\n')
