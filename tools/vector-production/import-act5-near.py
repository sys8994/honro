"""Convert the approved SVG package without editing path geometry.

Run from the repository root with the extracted handoff's terrain directory.
The compiler splits only oversized compounds at existing subpath boundaries.
"""
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as xml
from pathlib import Path


def tag(node):
    return node.tag.rsplit('}', 1)[-1]


def paint(node):
    kind = tag(node)
    if kind == 'path':
        keys = {'fill-rule': 'fillRule', 'stroke-width': 'lineWidth'}
        style = dict(part.split(':', 1) for part in node.attrib.get('style', '').split(';') if part)
        extra = set(style) - {'fill', 'fill-rule', 'stroke', 'stroke-width', 'opacity'}
        if extra:
            raise ValueError(f'Unsupported path styles: {extra}')
        return {
            'tag': 'path',
            'sourcePath': node.attrib['d'],
            **{keys.get(key, key): float(value) if key in {'opacity', 'stroke-width'} else value
               for key, value in style.items()}
        }

    if kind == 'use':
        href = node.attrib.get('href') or node.attrib['{http://www.w3.org/1999/xlink}href']
        if not href.startswith('#'):
            raise ValueError(f'Unsupported reference: {href}')
        output = {'tag': 'use', 'symbol': href[1:]}
    elif kind in {'svg', 'g'}:
        output = {'tag': 'g', 'children': [paint(child) for child in node if tag(child) != 'defs']}
    else:
        raise ValueError(f'Unsupported SVG element: {kind}')

    if 'clip-path' in node.attrib:
        output['clipPath'] = re.fullmatch(r'url\(#([^)]*)\)', node.attrib['clip-path']).group(1)
    if 'transform' in node.attrib:
        kind, values = re.fullmatch(r'(scale|matrix)\(([^)]*)\)', node.attrib['transform']).groups()
        numbers = [float(value) for value in re.split(r'[ ,]+', values)]
        output['transform'] = numbers if kind == 'matrix' else [numbers[0], 0, 0, numbers[-1], 0, 0]
    return output


def extract(terrain_dir):
    output = []
    for chapter in range(1, 11):
        svg = (terrain_dir / f'stage{chapter:02}' / 'near.svg').read_bytes()
        root = xml.fromstring(svg)
        clips, symbols = {}, {}
        for section in (element for element in root.iter() if tag(element) == 'defs'):
            for item in section:
                key = item.attrib['id']
                if tag(item) == 'clipPath':
                    clips[key] = [element.attrib['d'] for element in item]
                else:
                    symbols[key] = paint(item)
        output.append({'id': chapter + 40, 'sha256': hashlib.sha256(svg).hexdigest(), 'vector': {
            'version': 1, 'viewBox': [float(value) for value in root.attrib['viewBox'].split()],
            'root': paint(root), 'clips': clips, 'symbols': symbols
        }})
    return output


if __name__ == '__main__':
    target = Path('shared/assets/environment/act5/near-import.json')
    target.write_text(json.dumps(extract(Path(sys.argv[1])), separators=(',', ':')), encoding='utf-8')
