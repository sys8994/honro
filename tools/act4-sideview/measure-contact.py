"""Read the final native alpha against the immutable authored walk profiles."""
from pathlib import Path
import sys,json
from lxml import etree as E
from svgpathtools import parse_path
import numpy as np
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act4-sideview-p1-20261116';reports=[]
for n in [33,40]:
 record=json.loads((OUT/f'registered{n}-v2/registration.json').read_text());z=record['sourceToWorld']['scale'];offset=record['sourceToWorld']['offsetX']
 stage=json.loads((OUT/f'stage{n}-canonical.json').read_text(encoding='utf8'))
 segments=[s for p in E.parse(str(OUT/f'registered{n}-v2/alpha-registered.svg')).findall('.//{*}path') for s in parse_path(p.get('d'))]
 errors=[]
 for tid in record['selectedTerrainIds']:
  t=next(t for t in stage['terrains'] if t['id']==tid)
  for i in t['properties']['honroWalkEdges']:
   a,b=t['points'][i],t['points'][i+1]
   for k in np.linspace(.01,.99,21):
    wx=a['x']+(b['x']-a['x'])*k;expected=a['y']+(b['y']-a['y'])*k;x=(wx-offset)/z;ys=[]
    for s in segments:
     if abs(s.end.real-s.start.real)<1e-8:continue
     if min(s.start.real,s.end.real)<=x<=max(s.start.real,s.end.real):ys.append(s.start.imag+(x-s.start.real)*(s.end.imag-s.start.imag)/(s.end.real-s.start.real))
    assert ys;errors.append(abs(min(ys)*z-expected))
 report={'stage':n,'samples':len(errors),'maximumWorldError':max(errors),'meanWorldError':float(np.mean(errors)),'maxScreenErrorAt165':max(errors)*1.65,'scope':'final native alpha vs canonical walk edges; not actor traversal'}
 assert report['maximumWorldError']<2,report
 reports.append(report)
(OUT/'contact-measurement.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports))
