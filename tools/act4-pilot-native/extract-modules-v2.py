#!/usr/bin/env python3
"""Whole-contour extraction of four disconnected native modules; no clipping."""
import importlib.util,json,sys,xml.etree.ElementTree as E
from pathlib import Path
H=Path(__file__).resolve().parents[1];s=importlib.util.spec_from_file_location('imp',H/'vector-production/import-svg.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
P=H.parent/'art/act4-pilot-modules-v2';S='http://www.w3.org/2000/svg';E.register_namespace('',S)
sourceName=sys.argv[1] if len(sys.argv)>1 else 'modules-traced.svg';prefix=sys.argv[2] if len(sys.argv)>2 else ''
regions={'ascending':(0,0,768,512),'plateau':(768,0,768,512),'descending':(0,512,800,512),'overhang':(800,512,736,512)}
roots={k:E.Element('{'+S+'}svg',viewBox=f'{x} {y} {w} {h}') for k,(x,y,w,h) in regions.items()};counts={k:0 for k in roots}
for e in E.parse(P/sourceName).getroot().iter():
 if e.tag.split('}')[-1]!='path':continue
 groups={k:[] for k in roots}
 for d,(x0,x1,y0,y1) in m.contours(e.get('d')):
  matches=[k for k,(x,y,w,h) in regions.items() if x0>=x and x1<=x+w and y0>=y and y1<=y+h]
  if len(matches)!=1:raise ValueError(('Not entirely within one semantic module',x0,x1,y0,y1,matches))
  groups[matches[0]].append(d)
 for k,ds in groups.items():
  if ds:E.SubElement(roots[k],'{'+S+'}path',id=e.get('id'),style=e.get('style'),d=' '.join(ds));counts[k]+=len(ds)
for k,r in roots.items():
 d=P/k;d.mkdir(exist_ok=True)
 bs=[b for e in r for _,b in m.contours(e.get('d'))];x,y,x1,y1=min(b[0] for b in bs),min(b[2] for b in bs),max(b[1] for b in bs),max(b[3] for b in bs);w,h=x1-x,y1-y
 r.set('viewBox',f'{x} {y} {w} {h}');E.ElementTree(r).write(d/(prefix+'raw.svg'),encoding='utf-8',xml_declaration=True)
 cfg={'id':'act4:module-v2:'+k,'name':k,'semanticLayer':'REAR','category':'rock','bounds':{'x':x,'y':y,'w':w,'h':h},'anchor':{'x':0,'y':0},'foot':{'x':x,'y':y},'scaleRange':[1,1],'backgroundRange':[1,1],'params':{'nativeSourceFile':sourceName,'candidateOnly':True,'artRevision':2,'contactConvention':'Root-approved upper moss exterior; per-placement approval pending'}}
 (d/(prefix+'asset-config.json')).write_text(json.dumps(cfg,indent=2)+'\n')
 (d/(prefix+'region.json')).write_text(json.dumps({'region':regions[k],'contours':counts[k],'cropGeometry':False},indent=2)+'\n')
print(counts)
