#!/usr/bin/env python3
"""Hybrid decor library (user, 2026-10-31): reusable dressing (bamboo clumps,
ferns, moss, ruined wall pieces, fallen bamboo) is traced from the user's
reference play layers; play terrain/structures stay hand-authored.

crop -> alpha mask -> palette quantise (few fills) -> vtracer polygon trace ->
per-fill union + simplify (shapely) -> JSON {fills:[[color, [rings...]]], w, h}
in reference pixels, foot at the bottom centre. Painter.decor() places it."""
import json, sys, io
from pathlib import Path
from PIL import Image
import vtracer
from shapely.geometry import Polygon
from shapely.ops import unary_union
import re

ROOT = Path(__file__).resolve().parents[2]
REF = Path('/tmp/claude-0/-home-user/ce99f28e-d0a2-5521-9bd0-ca7baa6be50e/scratchpad/ref/ACT4_TERRAIN_REFERENCE/02_play_layers')
OUT = ROOT / 'art/act4-claude/decor'

def trace(name, src, box, colors=7, keep=None, simplify=2.2, min_area=14, mask=None):
    im = Image.open(REF / src).convert('RGBA').crop(box)
    if mask:   # polygon in crop px: keep only inside (drops terrain behind)
        from PIL import ImageDraw
        m = Image.new('L', im.size, 0); ImageDraw.Draw(m).polygon(mask, fill=255)
        a = im.split()[-1]; im.putalpha(Image.composite(a, Image.new('L', im.size, 0), m))
    if keep:   # drop pixels whose colour is not foliage-like etc.
        px = im.load()
        for y in range(im.height):
            for x in range(im.width):
                r, g, b, a = px[x, y]
                if a and not keep(r, g, b):
                    px[x, y] = (0, 0, 0, 0)
    alpha = im.split()[-1].point(lambda v: 255 if v > 140 else 0)
    q = im.convert('RGB').quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    pal = sorted({c for _, c in q.getcolors(1 << 16)})
    q.putalpha(alpha)
    buf = io.BytesIO(); q.save(buf, 'PNG')
    svg = vtracer.convert_raw_image_to_svg(buf.getvalue(), img_format='png', colormode='color', hierarchical='cutout',
                                           mode='polygon', filter_speckle=6, color_precision=8, layer_difference=8,
                                           corner_threshold=60, length_threshold=4.0, path_precision=1)
    fills = {}
    for d, fill, tx, ty in re.findall(r'<path d="([^"]+)" fill="(#[0-9A-Fa-f]{6})" transform="translate\(([-\d.]+),([-\d.]+)\)"', svg):
        tx, ty = float(tx), float(ty)
        for sub in re.findall(r'M[^M]+', d):
            nums = [float(v) for v in re.findall(r'-?\d+(?:\.\d+)?', sub)]
            pts = [(nums[i] + tx, nums[i + 1] + ty) for i in range(0, len(nums) - 1, 2)]
            if len(pts) >= 3:
                v = tuple(int(fill[i:i + 2], 16) for i in (1, 3, 5))
                c = min(pal, key=lambda P: sum((a - b) ** 2 for a, b in zip(P, v)))
                fills.setdefault('#%02x%02x%02x' % c, []).append(Polygon(pts).buffer(0))
    out, nodes = [], 0
    for fill, ps in fills.items():
        g = unary_union([p for p in ps if p.area > min_area]).simplify(simplify)
        rings = []
        for p in getattr(g, 'geoms', [g]):
            if p.geom_type != 'Polygon' or p.area < min_area * 3:
                continue
            rings.append([[round(x, 1), round(y, 1)] for x, y in p.exterior.coords[:-1]])
            rings += [[[round(x, 1), round(y, 1)] for x, y in h.coords[:-1]] for h in p.interiors]
        nodes += sum(len(r) for r in rings)
        if rings:
            out.append([fill, rings])
    # paint order: darkest first (vtracer cutout = no overlap, order mostly cosmetic)
    out.sort(key=lambda fr: sum(int(fr[0][i:i + 2], 16) for i in (1, 3, 5)))
    rec = {'name': name, 'src': src, 'box': box, 'w': box[2] - box[0], 'h': box[3] - box[1], 'fills': out, 'nodes': nodes}
    (OUT / (name + '.json')).write_text(json.dumps(rec))
    preview(rec)
    return rec

def preview(rec):
    body = ''.join('<path d="%s" fill="%s" fill-rule="evenodd"/>' % (' '.join('M' + ' L'.join('%g %g' % tuple(p) for p in r) + ' Z' for r in rings), f) for f, rings in rec['fills'])
    (OUT / (rec['name'] + '.svg')).write_text('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d">%s</svg>' % (rec['w'] * 2, rec['h'] * 2, rec['w'], rec['h'], body))

if __name__ == '__main__':
    green = lambda r, g, b: g > r + 8 and b <= g + 12 and max(r, g, b) - min(r, g, b) > 18   # foliage only
    jobs = {
        'bamboo-grove': ('35-play-layer-v2.webp', (470, 255, 845, 500), 8, green),
        'bamboo-clump': ('35-play-layer-v2.webp', (285, 555, 425, 705), 7, green),
        'bamboo-top': ('35-play-layer-v2.webp', (1195, 125, 1290, 275), 6, green),
        'fern': ('35-play-layer-v2.webp', (700, 855, 840, 1000), 6, green),
    }
    for name in (sys.argv[1:] or jobs):
        src, box, nc, keep = jobs[name]
        r = trace(name, src, box, nc, keep)
        print(name, len(r['fills']), 'fills', r['nodes'], 'nodes')
