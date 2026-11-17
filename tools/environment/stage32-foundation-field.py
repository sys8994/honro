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
import re
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]

def build(svg_bytes, world):
    source = next(a for a in world['library'] if a['id'] == 'approved32:coastal-foundation')
    asset = copy.deepcopy(source)
    root = ET.fromstring(svg_bytes)
    assert root.attrib['viewBox'] == '0 0 2172 724', 'Trace registration changed'
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
        shape={'tag':'path', 'fill':fill, 'stroke':'none', 'fillRule':'nonzero'}
        d=node.attrib['d']
        if len(d)<=60000: shape['d']=d
        else:
            parts=[];part=''
            for sub in re.findall(r'[Mm][^Mm]*',d):
                assert len(sub)<=60000
                if len(part)+len(sub)>60000: parts.append(part);part=''
                part+=sub
            if part:parts.append(part)
            assert ''.join(parts)==d
            shape['dParts']=parts
        paths.append(shape)
    assert paths, 'Missing traced paths'
    # Uniform cover of the shipped visible silhouette bbox (0,228,1774,659).
    scale = 659 / 724
    dx = (1774 - 2172 * scale) / 2
    dy = 228
    vector = asset['vector']
    assert vector['root']['transform'] == [7.2,0,0,7.2,0,0]
    mask_group = vector['root']['children'][0]
    assert mask_group['clipPath'] == 'source-alpha-silhouette'
    assert len(mask_group['children']) == 1
    mask_group['children'][0] = {'tag':'g', 'transform':[scale,0,0,scale,dx,dy], 'children':paths}
    asset['id'] = 'act4-handoff:32:foundation'
    asset['name'] = 'Stage 32 exterior material field — preserved coastal silhouette'
    asset['params'] = {**asset['params'], 'source':'art/stage32-edge-extension-20261117/v4/final.svg',
        'sourceSha256':hashlib.sha256(svg_bytes).hexdigest(),
        'sourceRegistration':{'sourceSize':[2172,724], 'uniformScale':scale, 'visibleSourceBbox':[0,228,1774,659], 'translation':[dx,dy]},
        'preservedProviderId':source['id'], 'stage32SharedMaterial':1}
    return asset

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('svg', type=Path, nargs='?', default=ROOT/'art/stage32-edge-extension-20261117/v4/final.svg')
    parser.add_argument('--output', type=Path, default=ROOT/'shared/data/act4/handoff-art/32-foundation.json')
    args = parser.parse_args()
    asset = build(args.svg.read_bytes(), json.loads((ROOT/'shared/data/act4/world.json').read_text()))
    payload = json.dumps(asset, separators=(',', ':'), ensure_ascii=False)+'\n'
    assert len(payload.encode()) <= 750_000, 'Candidate exceeds asset size budget'
    args.output.write_text(payload)
    print(json.dumps({'output':str(args.output), 'bytes':len(payload.encode()), 'sourceSha256':asset['params']['sourceSha256']}))
