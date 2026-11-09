"""Firing-rock-specific Inkscape color smooth/speckle cleanup; native alpha remains unfiltered. No artwork invention.

Usage: python trace-compact-native.py SOURCE OUTPUT INKSCAPE [SCANS=16]
Keep raw.svg immutable; optimize separately with the existing vector tools.
"""
import base64, copy, hashlib, json, os, subprocess, sys
from pathlib import Path
from xml.etree import ElementTree as E
import numpy as np
from PIL import Image

source, out, exe = map(lambda s: Path(s).resolve(), sys.argv[1:4])
scans = int(sys.argv[4]) if len(sys.argv) > 4 else 16
out.mkdir(parents=True, exist_ok=True)
NS = 'http://www.w3.org/2000/svg'
E.register_namespace('', NS)
im = Image.open(source).convert('RGBA')
w, h = im.size
rgba = np.asarray(im)
rgb = rgba[:, :, :3].copy()
rgb[rgba[:, :, 3] < 128] = 255
Image.fromarray(rgb).save(out / 'color-input.png')
env = {**os.environ, 'INKSCAPE_PROFILE_DIR': str(out / 'inkscape-profile')}

def trace(png, name, action):
    data = base64.b64encode(png.read_bytes()).decode('ascii')
    wrapper = out / (name + '-input.svg')
    wrapper.write_text(f'<svg xmlns="{NS}" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><image id="raster" width="{w}" height="{h}" xlink:href="data:image/png;base64,{data}"/></svg>', encoding='utf-8')
    svg = out / (name + '.svg')
    commands = f'select-by-id:raster;object-trace:{action};select-clear;select-by-id:raster;delete;export-plain-svg;export-filename:{svg};export-do'
    args = [str(exe), str(wrapper), '--batch-process', '--actions=' + commands]
    r = subprocess.run(args, env=env, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=300)
    (out / (name + '.log')).write_text(json.dumps(args) + '\n' + r.stdout + r.stderr, encoding='utf-8')
    if r.returncode or 'Tracing done.' not in r.stdout + r.stderr:
        raise RuntimeError('Inkscape trace failed: ' + name)
    tree = E.parse(svg)
    if tree.findall('.//{' + NS + '}image') or not tree.findall('.//{' + NS + '}path'):
        raise RuntimeError('Trace must contain paths and zero embedded images')
    return tree

tree = trace(out / 'color-input.png', 'native-color', f'{scans},true,true,false,32,1,0.2')
root = tree.getroot()
if rgba[:, :, 3].min() < 255:
    mask = np.where(rgba[:, :, 3] >= 128, 0, 255).astype('uint8')
    Image.fromarray(mask).convert('RGB').save(out / 'alpha-mask.png')
    alpha = trace(out / 'alpha-mask.png', 'native-alpha', '2,false,false,true,0,0,0.1')
    defs = root.find('{' + NS + '}defs')
    if defs is None:
        defs = E.SubElement(root, '{' + NS + '}defs')
    clip = E.SubElement(defs, '{' + NS + '}clipPath', {'id': 'source-alpha', 'clipPathUnits': 'userSpaceOnUse'})
    for e in alpha.getroot():
        if e.tag.split('}')[-1] in ('g', 'path'):
            item = copy.deepcopy(e)
            for child in item.iter():
                child.attrib.pop('id', None)
            clip.append(item)
    group = E.SubElement(root, '{' + NS + '}g', {'clip-path': 'url(#source-alpha)'})
    for e in list(root):
        if e is not group and e.tag.split('}')[-1] in ('g', 'path'):
            root.remove(e)
            group.append(e)
raw = out / 'raw.svg'
if raw.exists():
    raise RuntimeError('Refuse to overwrite immutable raw.svg; use another output directory')
tree.write(raw, encoding='utf-8', xml_declaration=True)
render = subprocess.run([str(exe), str(raw), '--export-background-opacity=0', '--export-filename=' + str(out / 'raw.png')], env=env, capture_output=True, text=True, errors='replace', timeout=120)
(out / 'raw-render.log').write_text(render.stdout + render.stderr, encoding='utf-8')
if render.returncode:
    raise RuntimeError('Native raw render failed')
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
record = {'source': str(source), 'sourceSha256': sha(source), 'sourcePixels': [w, h], 'scans': scans, 'smooth': True, 'stack': True, 'speckles': 32, 'alphaThreshold': 128, 'alphaMethod': 'separate native Inkscape binary silhouette clip; no white-color deletion', 'rawSha256': sha(raw), 'rawBytes': raw.stat().st_size, 'images': 0, 'version': subprocess.check_output([str(exe), '--version'], text=True).strip(), 'visualReview': 'PENDING', 'scope': 'Actual native trace only, not optimization, gameplay or artwork approval'}
(out / 'trace.json').write_text(json.dumps(record, indent=2) + '\n', encoding='utf-8')
print(json.dumps(record))
