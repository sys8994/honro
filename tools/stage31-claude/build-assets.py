#!/usr/bin/env python3
"""Import every authored module SVG into a HONRO vector v1 asset (world coords)."""
import json, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / 'art/act4-stage31-claude-v1'
OUT = ROOT / '_local/reports/stage31-claude/modules'
OUT.mkdir(parents=True, exist_ok=True)
SEM = {'BODY': 'BODY', 'SURFACE': 'SURFACE', 'STRUCT': 'REAR', 'REAR': 'REAR', 'FORE': 'FORE'}
rows = []
for m in json.load(open(ART / 'modules.json')):
    x0, y0, x1, y1 = m['bounds']
    cfg = {'id': 's31c:' + m['name'], 'name': 'Stage31 ' + m['name'], 'semanticLayer': SEM[m['layer']], 'category': 'terrain',
           'bounds': {'x': x0, 'y': y0, 'w': x1 - x0, 'h': y1 - y0}, 'anchor': {'x': 0, 'y': 0}, 'foot': {'x': 0, 'y': 0},
           'params': {'artRevision': 2, 'author': 'claude-direct-vector', 'silhouetteUnderpaint': False}}
    c = OUT / (m['name'] + '.config.json'); c.write_text(json.dumps(cfg))
    a = OUT / (m['name'] + '.asset.json')
    subprocess.run([sys.executable, str(ROOT / 'tools/vector-production/import-svg.py'), str(ART / 'modules' / (m['name'] + '.svg')), '--config', str(c), '--output', str(a)], check=True, stdout=subprocess.DEVNULL)
    rows.append({**m, 'asset': str(a.relative_to(ROOT)), 'assetId': cfg['id']})
(OUT / 'index.json').write_text(json.dumps(rows, indent=1))
print(len(rows), 'assets')
