"""Extract painted figures using artist-registered source coordinates."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
def registered_cells(name):
    spec = json.loads((ROOT/'editable/pose-cells.json').read_text())[name]
    image = Image.open(ROOT/'assets/source'/name).convert('RGBA')
    if list(image.size) != spec['size']:
        raise ValueError(f'Register the new source size: {name}')
    uncovered = image.getchannel('A').point(lambda a: 255 if a >= 65 else 0)
    cells = []
    for row in spec['bounds']:
        if len(row) != spec['width']:
            raise ValueError(f'Missing pose in {name}')
        for rect in row:
            uncovered.paste(0, rect)
            cell = image.crop(rect)
            alpha = cell.getchannel('A')
            ink = alpha.point(lambda a: 255 if a >= 65 else 0).getbbox()
            if not ink or min(ink[:2]) < 1 or ink[2]>=cell.width or ink[3]>=cell.height:
                raise ValueError(f'Paint meets the extraction edge in {name}, {rect}')
            cell.putalpha(alpha.point(lambda a: 0 if a<16 else a))
            cells.append(cell.crop(ink))
    if len(cells) != spec['width']*spec['height']:
        raise ValueError(f'Incomplete rows in {name}')
    if uncovered.getbbox():
        raise ValueError(f'Paint outside the registered cells in {name}: {uncovered.getbbox()}')
    return cells
