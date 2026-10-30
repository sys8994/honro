#!/usr/bin/env python3
"""Background-only semantic cleanup of native trace; not a foreground optimizer."""
import sys,json,xml.etree.ElementTree as E,importlib.util,hashlib,colorsys,os
from pathlib import Path
import numpy as np
from shapely.geometry import LineString,Polygon,box
from shapely.ops import unary_union,polygonize
from shapely import hausdorff_distance
from svgpathtools import parse_path
H=Path(__file__).resolve().parents[1];sys.path.insert(0,str(H/'vector-production'))
from bounded_flatten import flatten
P=H.parent/'art/act4-pilot-stage31-v1';src=P/'background-traced.svg';root=E.parse(src).getroot();S='http://www.w3.org/2000/svg';E.register_namespace('',S)
def revised(c):
 if c == '#c9a39c': return '#9b99ac' # explicit muted gray-lavender dawn
 rgb=[int(c[i:i+2],16)/255 for i in (1,3,5)]
 h,l,s=colorsys.rgb_to_hls(*rgb)
 return '#'+''.join(f'{round(v*255):02x}' for v in colorsys.hls_to_rgb(h,l*.8,s*.8))
source_palette=os.getenv('BG_SOURCE_PALETTE')=='1'
if source_palette: revised=lambda c:c
out=E.Element('{'+S+'}svg',viewBox=root.get('viewBox'));w,h=map(float,root.get('viewBox').split()[2:]);E.SubElement(out,'{'+S+'}path',id='opaque-source-backing',fill=revised('#2e69b4'),d=f'M0 0H{w}V{h}H0Z')
report={'sourceSHA256':hashlib.sha256(src.read_bytes()).hexdigest(),'scope':'background only','flattenSourceUnits':.04,'simplifySourceUnits':.08,'antiSeamOverlapSourceUnits':.05,'coordinateDecimalPlaces':3,'dropComponentOrHoleBelowSourceArea':50,'opaqueBacking':'source PNG RGB opaque; use revised sky/water palette to close unstacked AA seams','paletteRevision':'Intentional art direction, separate from geometry optimization fidelity: blue HLS lightness and saturation each scaled 0.80; warm dawn explicitly mapped to muted gray-lavender.','layers':[],'visualApproval':'NOT REVIEWED'}
def polys(g):
 if g.geom_type=='Polygon':yield g
 elif hasattr(g,'geoms'):
  for q in g.geoms:yield from polys(q)
def pathtext(p):
 return ''.join('M'+'L'.join(f'{x:.3f},{y:.3f}' for x,y in list(r.coords)[:-1])+'Z' for r in [p.exterior,*p.interiors])
for e in root.iter():
 if e.tag.split('}')[-1]!='path':continue
 ps=parse_path(flatten(e.get('d'),.04)).continuous_subpaths();rings=[]
 for p in ps:
  r=[(p[0].start.real,p[0].start.imag)]+[(s.end.real,s.end.imag) for s in p]
  if r[0]!=r[-1]:r.append(r[0])
  if len(r)>3:rings.append(r)
 seg=np.array([(r[i],r[i+1]) for r in rings for i in range(len(r)-1)]);x0,y0,x1,y1=seg[:,0,0],seg[:,0,1],seg[:,1,0],seg[:,1,1];kept=[]
 for cell in polygonize(unary_union([LineString(r) for r in rings])):
  p=cell.representative_point();x,y=p.x,p.y;cross=(x1-x0)*(y-y0)-(x-x0)*(y1-y0);winding=np.count_nonzero((y0<=y)&(y1>y)&(cross>0))-np.count_nonzero((y0>y)&(y1<=y)&(cross<0))
  if winding:kept.append(cell)
 geometry=unary_union(kept);result=[];deleted=filled=0;maxerr=0;removedArea=0
 for p in polys(geometry):
  if p.area<50:deleted+=1;removedArea+=p.area;continue
  holes=[]
  for ring in p.interiors:
   if Polygon(ring).area<50:filled+=1;removedArea+=Polygon(ring).area
   else:holes.append(ring.coords)
  clean=Polygon(p.exterior.coords,holes).simplify(.08,preserve_topology=True)
  maxerr=max(maxerr,float(hausdorff_distance(p.exterior,clean.exterior,densify=.1)));result.extend(polys(clean))
 # Intersect oversized geometry with adjacent half-planes; no intended area loss.
 def split(p):
  d=pathtext(p)
  if len(d)<=35000:yield d;return
  x0,y0,x1,y1=p.bounds
  if x1-x0>=y1-y0:
   m=(x0+x1)/2; boxes=[box(x0-1,y0-1,m,y1+1),box(m,y0-1,x1+1,y1+1)]
  else:
   m=(y0+y1)/2; boxes=[box(x0-1,y0-1,x1+1,m),box(x0-1,m,x1+1,y1+1)]
  for b in boxes:
   for q in polys(p.intersection(b)):yield from split(q)
 chunks=[];current=''
 for d in (d for p in result for d in split(p)):
  if len(current)+len(d)>35000 and current:chunks.append(current);current=''
  current+=d
 if current:chunks.append(current)
 color=e.get('style').split(':')[1]; newcolor=revised(color)
 for i,d in enumerate(chunks):E.SubElement(out,'{'+S+'}path',id=e.get('id')+'-'+str(i),style='fill:'+newcolor+';fill-rule:evenodd;stroke:'+newcolor+';stroke-width:0.10;stroke-linejoin:round',d=d)
 report['layers'].append({'id':e.get('id'),'sourcePalette':color,'revisedPalette':newcolor,'droppedSmallComponents':deleted,'filledSmallHoles':filled,'changedSmallAreaSourcePx2':removedArea,'mainExteriorDenseSampleHausdorffSourceUnits':maxerr,'outputPaths':len(chunks),'outputPathChars':sum(map(len,chunks))})
 print(e.get('id'),sum(map(len,chunks)),deleted,filled,flush=True)
E.ElementTree(out).write('/tmp/background-source-palette.svg' if source_palette else P/'background-optimized.svg',encoding='utf-8',xml_declaration=True)
if not source_palette:
 m=max(l['mainExteriorDenseSampleHausdorffSourceUnits'] for l in report['layers']);v=m+.04+(2**.5)*.0005+.05
 report['plainCameraExteriorEvidence']={'sourceToWorldScaleXY':[7000/1529,4700/1029],'zoomNormal':.7,'zoomMaximum':1.65,'maxSampledFlattenedExteriorDistanceSource':m,'flattenToleranceSource':.04,'maxCoordinateRoundingSourceEuclidean':(2**.5)*.0005,'sameColorStrokeReachSource':.05,'combinedConservativeEstimateSource':v,'estimatedCSSPxNormal':v*7000/1529*.7,'estimatedCSSPxMaximum':v*7000/1529*1.65,'status':'measured/sampled estimate; excludes intentional small-area deletion, filled holes, and palette revision; no L6 runtime integration verified'}
 (P/'background-optimization.json').write_text(json.dumps(report,indent=2)+'\n')
