#!/usr/bin/env python3
"""Whole-contour extraction of four disconnected native props; no clipping."""
import importlib.util,json,xml.etree.ElementTree as E
from pathlib import Path
H=Path(__file__).resolve().parents[1];s=importlib.util.spec_from_file_location('imp',H/'vector-production/import-svg.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
P=H.parent/'art/act4-pilot-props-v2';S='http://www.w3.org/2000/svg';E.register_namespace('',S)
regions={'pine':(0,0,920,585),'reeds':(920,0,610,585),'rocks':(0,585,940,443),'marker':(940,585,590,443)}
roots={k:E.Element('{'+S+'}svg',viewBox=f'{x} {y} {w} {h}') for k,(x,y,w,h) in regions.items()};counts={k:0 for k in roots}
for e in E.parse(P/'props-traced.svg').getroot().iter():
 if e.tag.split('}')[-1]!='path':continue
 groups={k:[] for k in roots}
 for d,(x0,x1,y0,y1) in m.contours(e.get('d')):
  matches=[k for k,(x,y,w,h) in regions.items() if x0>=x and x1<=x+w and y0>=y and y1<=y+h]
  if len(matches)!=1:raise ValueError(('Not entirely within one semantic prop',x0,x1,y0,y1,matches))
  groups[matches[0]].append(d)
 for k,ds in groups.items():
  if ds:E.SubElement(roots[k],'{'+S+'}path',id=e.get('id'),style=e.get('style'),d=' '.join(ds));counts[k]+=len(ds)
for k,r in roots.items():
 d=P/k;d.mkdir(exist_ok=True);E.ElementTree(r).write(d/'raw.svg',encoding='utf-8',xml_declaration=True)
 (d/'region.json').write_text(json.dumps({'region':regions[k],'contours':counts[k],'cropGeometry':False},indent=2)+'\n')
print(counts)
