"""Reproduce finite Native visible-sample region classification; never change gates."""
import json
from pathlib import Path
from shapely.geometry import shape, Point
from shapely.ops import unary_union
root=Path('stage32-upper-long-diagonal')
paths=['stage32-upper-pale-review/component.geojson','stage32-upper-grass-review/component.geojson','stage32-upper-grass-diagonal/component.geojson',str(root/'allowed-tail.geojson')]
allowed=unary_union([shape(json.load(open(p))) for p in paths]);out=[]
for name in ['result-1.65.json','result-0.057352941176470586_portrait.json','result-0.6.json']:
 r=json.loads((root/name).read_text());assert len(r['bad'])==r['protectedSamples'],'Incomplete raw samples'
 other=[v for v in r['bad'] if not allowed.covers(Point(v['sx'],v['sy']))]
 out.append(dict(file=str(root/name),raw=r['protectedSamples'],other=other,changed=r['changed'],alpha=r['alpha'],background=r['outside0']))
assert out==json.loads((root/'classification.json').read_text()),'Recorded classification differs'
assert all(not r['other'] for r in out),'Other visible samples found'
print('All recorded samples classified; finite local evidence only')
