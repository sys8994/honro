#!/usr/bin/env python3
"""Register the traced Stage 32 material field inside the shipped alpha silhouette.

Usage: python3 tools/environment/stage32-foundation-field.py /path/to/04-final.svg
Only writes the separate candidate asset. The old world/provider and BODY remain
untouched. This is material registration, not new terrain or a new outline.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]

def build(svg_bytes, world):
    source = next(a for a in world['library'] if a['id'] == 'approved32:coastal-foundation')
    asset = copy.deepcopy(source)
    root = ET.fromstring(svg_bytes)
    assert root.attrib['viewBox'] == '0 0 1611 976', 'Trace registration changed'
    paths = []
    for node in root.iter():
        tag = node.tag.split('}')[-1]
        assert tag in ('svg', 'defs', 'g', 'path'), 'Unsupported trace node: '+tag
        assert 'transform' not in node.attrib, 'Unexpected nested trace transform'
        if tag != 'path':
            continue
        style = dict(item.split(':', 1) for item in node.attrib.get('style', '').split(';') if item)
        assert set(style) <= {'fill'}, 'Trace must contain only opaque flat fills'
        fill = style.get('fill', node.attrib.get('fill'))
        assert fill and len(fill) == 7 and fill.startswith('#'), 'Nonopaque trace paint'
        paths.append({'tag':'path', 'd':node.attrib['d'], 'fill':fill, 'stroke':'none', 'fillRule':'nonzero'})
    assert paths, 'Missing traced paths'
    # Width-fit is uniform. The traced opaque base covers 1774 x 1074.77;
    # the unchanged original silhouette crops it at its existing bottom 887.
    scale = 1774 / 1611
    assert scale * 976 >= 887
    vector = asset['vector']
    assert vector['root']['transform'] == [7.2,0,0,7.2,0,0]
    mask_group = vector['root']['children'][0]
    assert mask_group['clipPath'] == 'source-alpha-silhouette'
    assert len(mask_group['children']) == 1
    mask_group['children'][0] = {'tag':'g', 'transform':[scale,0,0,scale,0,0], 'children':paths}
    asset['id'] = 'act4-handoff:32:foundation'
    asset['name'] = 'Stage 32 exterior material field — preserved coastal silhouette'
    asset['params'] = {**asset['params'], 'source':'art/stage32-edge-extension-20261117/v3/final.svg',
        'sourceSha256':hashlib.sha256(svg_bytes).hexdigest(),
        'sourceRegistration':{'sourceSize':[1611,976], 'uniformScale':scale, 'targetSourceSize':[1774,887]},
        'preservedProviderId':source['id']}
    return asset

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('svg', type=Path, nargs='?', default=ROOT/'art/stage32-edge-extension-20261117/v3/final.svg')
    parser.add_argument('--output', type=Path, default=ROOT/'shared/data/act4/handoff-art/32-foundation.json')
    args = parser.parse_args()
    asset = build(args.svg.read_bytes(), json.loads((ROOT/'shared/data/act4/world.json').read_text()))
    payload = json.dumps(asset, separators=(',', ':'), ensure_ascii=False)+'\n'
    assert len(payload.encode()) <= 300_000, 'Candidate exceeds asset size budget'
    args.output.write_text(payload)
    print(json.dumps({'output':str(args.output), 'bytes':len(payload.encode()), 'sourceSha256':asset['params']['sourceSha256']}))
