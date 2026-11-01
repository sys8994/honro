#!/usr/bin/env python3
"""Preview a segmented figure: true colours, and parts tinted by owner."""
import json, sys, colorsys
from pathlib import Path
d = json.loads(Path(sys.argv[1]).read_text()); out = sys.argv[2]
def P(r): return 'M' + ' L'.join(f'{x} {y}' for x, y in r) + ' Z'
names = list(d['parts']); body_true = ''; body_tint = ''
for i, (part, rows) in enumerate(d['parts'].items()):
    h = i / len(names); r, g, b = colorsys.hsv_to_rgb(h, .75, .95); tint = '#%02x%02x%02x' % (int(r*255), int(g*255), int(b*255))
    for c, ext, holes in rows:
        dd = P(ext) + ''.join(' ' + P(hh) for hh in holes)
        body_true += f'<path d="{dd}" fill="{c}" fill-rule="evenodd"/>'
        body_tint += f'<path d="{dd}" fill="{tint}" fill-opacity=".85" stroke="#000" stroke-width=".4" fill-rule="evenodd"/>'
legend = ''.join(f'<text x="450" y="{20+i*16}" font-size="12" fill="#000">{n}</text>' for i, n in enumerate(names))
for i, n in enumerate(names):
    h = i / len(names); r, g, b = colorsys.hsv_to_rgb(h, .75, .95); legend += f'<rect x="435" y="{10+i*16}" width="12" height="12" fill="#%02x%02x%02x"/>' % (int(r*255), int(g*255), int(b*255))
Path(out).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1100" viewBox="0 0 1200 1100"><rect width="1200" height="1100" fill="#f4f4f2"/><g>{body_true}</g><g transform="translate(560 0)">{body_tint}</g><g transform="translate(560 0)">{legend}</g></svg>')
