"""Import the supplied stage 3/7 paths, transforms and clips without retracing."""
import hashlib
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

STYLE_NAMES = {'fill': 'fill', 'stroke': 'stroke', 'opacity': 'opacity',
               'stroke-width': 'lineWidth', 'stroke-linejoin': 'lineJoin',
               'stroke-linecap': 'lineCap', 'fill-rule': 'fillRule'}


def tag(node):
    return node.tag.split('}')[-1]


def paint(element):
    kind = tag(element)
    style = {k: v for k, v in element.attrib.items() if k in STYLE_NAMES}
    style.update(dict(item.split(':', 1) for item in element.get('style', '').split(';') if item))
    result = {STYLE_NAMES[k]: float(v) if k in ('opacity', 'stroke-width') else v for k, v in style.items()}
    if kind == 'path':
        result.update(tag='path', sourcePath=element.attrib['d'])
    elif kind in ('svg', 'g'):
        result.update(tag='g', children=[paint(c) for c in element if tag(c) != 'defs'])
    else:
        raise ValueError(f'Unsupported source element {kind}')
    if clip := element.get('clip-path'):
        result['clipPath'] = re.fullmatch(r'url\(#([^)]*)\)', clip)[1]
    if transform := element.get('transform'):
        match = re.fullmatch(r'scale\(([^)]+)\)', transform)
        numbers = [float(n) for n in re.split(r'[ ,]+', match[1])]
        result['transform'] = [numbers[0], 0, 0, numbers[-1], 0, 0]
    return result


def source(file, checksums):
    raw = file.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if checksums[file.relative_to(root).as_posix()] != digest:
        raise ValueError(f'Handoff checksum mismatch for {file}')
    svg = ET.fromstring(raw)
    return {'sha256': digest, 'vector': {'version': 1,
        'viewBox': list(map(float, svg.attrib['viewBox'].split())), 'root': paint(svg),
        'clips': {c.attrib['id']: [p.attrib['d'] for p in c] for c in svg.iter() if tag(c) == 'clipPath'}}}


if __name__ == '__main__':
    root = Path(sys.argv[1])
    checksums = {v['path']: v['sha256'] for v in json.loads((root / 'MANIFEST.json').read_text(encoding='utf-8-sig'))}
    output = Path('shared/assets/environment/act1-sites')
    output.mkdir(parents=True, exist_ok=True)
    for stage in (3, 7):
        folder = root / 'assets' / f'stage{stage:02}'
        files = [folder / 'body.svg', folder / 'landmarks.svg', *sorted((folder / 'props').glob('*.svg'))]
        layout = json.loads((folder / 'layout-preview-only.json').read_text(encoding='utf-8-sig'))
        background = folder / 'background.webp'
        payload = background.read_bytes()
        digest = hashlib.sha256(payload).hexdigest()
        assert digest == checksums[background.relative_to(root).as_posix()]
        (output / f'stage{stage:02}.webp').write_bytes(payload)
        data = {'backgroundSha256': digest, 'layout': layout['landmarks_crops_and_placements'],
                'art': {file.stem: source(file, checksums) for file in files}}
        (output / f'stage{stage:02}.json').write_text(json.dumps(data, separators=(',', ':')), encoding='utf-8')
