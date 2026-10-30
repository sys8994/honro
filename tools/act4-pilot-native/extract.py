#!/usr/bin/env python3
"""Extract reviewed disconnected objects without geometric clipping/redrawing."""
import importlib.util,json,xml.etree.ElementTree as E
from pathlib import Path
H=Path(__file__).resolve().parents[1];s=importlib.util.spec_from_file_location('imp',H/'vector-production/import-svg.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
P=H.parents[0]/'art/act4-pilot-common-v1';S='http://www.w3.org/2000/svg';E.register_namespace('',S)
regions={'reedsteps':(0,0,858,520),'overhangpine':(858,0,678,600),'cliffpine':(0,520,730,480),'foregroundreedrock':(730,600,806,424)}
roots={k:E.Element('{'+S+'}svg',viewBox=f'{x} {y} {w} {h}',width=str(w),height=str(h)) for k,(x,y,w,h) in regions.items()}
counts={k:0 for k in regions}
for e in E.parse(P/'source-traced.svg').getroot().iter():
 if e.tag.split('}')[-1]!='path':continue
 groups={k:[] for k in roots}
 for d,(x0,x1,y0,y1) in m.contours(e.get('d')):
  matches=[k for k,(x,y,w,h) in regions.items() if x0>=x and x1<=x+w and y0>=y and y1<=y+h]
  if len(matches)!=1:raise ValueError(('Contour not contained in exactly one object',x0,x1,y0,y1,matches))
  groups[matches[0]].append(d)
 for k,ds in groups.items():
  if ds:E.SubElement(roots[k],'{'+S+'}path',style=e.get('style'),id=e.get('id'),d=' '.join(ds));counts[k]+=len(ds)
for k,r in roots.items():
 dest=P/'objects'/k;dest.mkdir(parents=True,exist_ok=True);E.ElementTree(r).write(dest/'raw.svg',encoding='utf-8',xml_declaration=True)
 x,y,w,h=regions[k]
 cfg={'id':'act4:pilot:'+k,'name':k,'semanticLayer':'FORE' if k=='foregroundreedrock' else 'REAR','category':'rock','bounds':{'x':x,'y':y,'w':w,'h':h},'anchor':{'x':x,'y':y},'foot':{'x':x+w/2,'y':y+h},'scaleRange':[1,1],'backgroundRange':[1,1],'params':{'artRevision':1,'candidateOnly':True,'collisionSource':'unchanged'}}
 (dest/'asset-config.json').write_text(json.dumps(cfg,indent=2)+'\n')
 # Maximum test size is 1 CSS px per source unit. Entire object is protected.
 cfg={'width':w,'scales':[1,2],'protectedRects':[[0,0,w,h]],'limits':{'rgbMAE255':2,'silhouettePx':1.5,'protectedRgbMAE255':1,'protectedPx':.5},'protectionMode':'feature','scaleDeclaration':'1x: one source unit per CSS px; 2x: DPR2 sampling of same CSS size. Actual runtime placement is not yet declared.'}
 (dest/'compare-config.json').write_text(json.dumps(cfg,indent=2)+'\n')
print(json.dumps(counts))
