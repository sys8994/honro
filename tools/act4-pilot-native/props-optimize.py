#!/usr/bin/env python3
"""Image-free native contour cleanup; retains all but tiny color details."""
import json,sys,xml.etree.ElementTree as E,subprocess,hashlib
from pathlib import Path
import numpy as np
from shapely.geometry import LineString,Polygon,box
from shapely.ops import unary_union,polygonize
from shapely import hausdorff_distance
from svgpathtools import parse_path
H=Path(__file__).resolve().parents[1];sys.path.insert(0,str(H/'vector-production'));from bounded_flatten import flatten
P=H.parent/'art/act4-pilot-props-v2'; S='http://www.w3.org/2000/svg'; E.register_namespace('',S)
def polys(g):
 if g.geom_type=='Polygon':yield g
 elif hasattr(g,'geoms'):
  for p in g.geoms:yield from polys(p)
def geometry(d,evenodd=False):
 rings=[]
 for p in parse_path(flatten(d,.10)).continuous_subpaths():
  if not p:continue
  r=[(p[0].start.real,p[0].start.imag)]+[(s.end.real,s.end.imag) for s in p]
  if r[0]!=r[-1]:r.append(r[0])
  if len(r)>3:rings.append(r)
 if not rings:return Polygon()
 seg=np.array([(r[i],r[i+1]) for r in rings for i in range(len(r)-1)]);x0,y0,x1,y1=seg[:,0,0],seg[:,0,1],seg[:,1,0],seg[:,1,1];kept=[]
 for cell in polygonize(unary_union([LineString(r) for r in rings])):
  pt=cell.representative_point();x,y=pt.x,pt.y;cross=(x1-x0)*(y-y0)-(x-x0)*(y1-y0)
  winding=np.count_nonzero((y0<=y)&(y1>y)&(cross>0))-np.count_nonzero((y0>y)&(y1<=y)&(cross<0))
  if (winding%2 if evenodd else winding!=0):kept.append(cell)
 return unary_union(kept)
def pathtext(p):
 return ''.join('M'+'L'.join(f'{x:.2f},{y:.2f}' for x,y in list(r.coords)[:-1])+'Z' for r in [p.exterior,*p.interiors])
def emit(out,geom,fill,label,small=1,hole_small=None):
 if hole_small is None:hole_small=small
 result=[];removed=filled=0;maxerr=0
 for p in polys(geom):
  if p.area<small:removed+=1;continue
  holes=[]
  for r in p.interiors:
   if Polygon(r).area<hole_small:filled+=1
   else:holes.append(r.coords)
  q=Polygon(p.exterior.coords,holes).simplify(.15,preserve_topology=True)
  maxerr=max(maxerr,float(hausdorff_distance(p.exterior,q.exterior,densify=.1)));result.extend(polys(q))
 # Inseparable large polygon: intersect into adjacent half-planes without expansion.
 def split(p):
  d=pathtext(p)
  if len(d)<=55000:yield d;return
  x0,y0,x1,y1=p.bounds
  if x1-x0>=y1-y0:
   mid=(x0+x1)/2; bounds=[box(x0-1,y0-1,mid,y1+1),box(mid,y0-1,x1+1,y1+1)]
  else:
   mid=(y0+y1)/2; bounds=[box(x0-1,y0-1,x1+1,mid),box(x0-1,mid,x1+1,y1+1)]
  for b in bounds:
   for part in polys(p.intersection(b)):yield from split(part)
 chunks=[];cur=''
 for d in (d for p in result for d in split(p)):
  if len(cur)+len(d)>55000 and cur:chunks.append(cur);cur=''
  cur+=d
 if cur:chunks.append(cur)
 for i,d in enumerate(chunks):E.SubElement(out,'{'+S+'}path',id=label+'-'+str(i),style='fill:'+fill+';fill-rule:evenodd',d=d)
 return dict(removed=removed,filled=filled,maxExteriorDistance=maxerr,paths=len(chunks))
for name in ['pine','reeds','rocks','marker']:
 d=P/name; raw=E.parse(d/'raw.svg').getroot();out=E.Element(raw.tag,raw.attrib)
 subprocess.run(['node',str(H/'act4-pilot-native/props-union.mjs'),str(d/'raw.svg'),'/tmp/props-'+name+'-union.json'],check=True)
 u=json.load(open('/tmp/props-'+name+'-union.json')); report={'nativeUnionBounds':u['bounds'],'layers':[],'flatten':.1,'simplify':.15,'minimumComponentOrHoleArea':1,'paletteRevision':None,'underfill':'native union, no expansion; holes under 50 source px² filled','artApproval':'PENDING'}
 report['underfillMetrics']=emit(out,geometry(u['d'],True),'#132138','underfill',1,50)
 for e in raw:
  color=e.get('style').split(':')[1]; report['layers'].append({'color':color,**emit(out,geometry(e.get('d')),color,e.get('id'),1)})
 E.ElementTree(out).write(d/'optimized.svg',encoding='utf-8',xml_declaration=True); (d/'metrics.json').write_text(json.dumps(report,indent=2)+'\n'); print(name,report,flush=True)
