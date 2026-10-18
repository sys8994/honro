"""Prepare the complete small ferry work table used only by the Stage3 rest."""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
base = ROOT / 'shared/assets/environment/rest-stage3'
im = Image.open(base / 'source/worktable.png').convert('RGBA')
box = im.getchannel('A').point(lambda v: 255 if v >= 20 else 0).getbbox()
im = im.crop(box)
im.thumbnail((768, 512), Image.Resampling.LANCZOS)
im.save(base / 'worktable.webp', quality=89, method=6)
(base / 'manifest.json').write_text(json.dumps({
    'worktable': {'width': im.width, 'height': im.height,
                  'sourceBounds': list(box), 'reference': 'stage3/workbay.webp',
                  'role': 'Complete modest ferry work table, no building or ground'}
}, indent=2) + '\n')
print(im.size, (base / 'worktable.webp').stat().st_size)
