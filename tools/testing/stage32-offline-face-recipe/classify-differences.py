from pathlib import Path
import json
from PIL import Image
import numpy as np
from shapely.geometry import shape,Point
P=Path('stage32-offline-face-recipe');g=[shape(f['geometry']) for f in json.load(open('stage32-geos-study/source-geometries.geojson'))['features']];protected={1,2,3,4,12,13,14,15,16,17,21,22,23,24};reports=[]
for r in json.load(open(P/'results.json'))['reports']:
 n=r['pose']['name'];v=r['pose'];a=np.array(Image.open(P/(n+'-baseline.png'))).astype(int);b=np.array(Image.open(P/(n+'-candidate.png'))).astype(int);d=np.max(abs(a-b)[:,:,:3],axis=2);ys,xs=np.where(d>1);counts={};samples=[]
 for y,x in zip(ys,xs):
  wx=(x+.5-v['w']/2)/v['z']+v['cx'];wy=(y+.5-v['h']/2)/v['z']+v['cy'];pt=Point(wx/2.2,wy/2.2);owner=next((i for i in range(24,-1,-1) if g[i].covers(pt)),-1);role='road' if owner>=21 else 'pale' if owner in {1,2,3,4} else 'grass' if owner in {12,13,14,15,16,17} else 'grayOrFoundation';key=('upper' if y<r['split'] else 'lower')+':'+role;counts[key]=counts.get(key,0)+1
  if len(samples)<100 and (owner in protected or y<r['split']):samples.append({'pixel':[int(x),int(y)],'world':[wx,wy],'source':[wx/2.2,wy/2.2],'owner':owner,'boundaryDistanceSource':g[owner].boundary.distance(pt) if owner>=0 else None,'delta':int(d[y,x]),'before':a[y,x].tolist(),'after':b[y,x].tolist()})
 reports.append({'view':n,'deltaAbove1':len(xs),'counts':counts,'finiteCenterSamples':samples})
json.dump({'scope':'Geometry center classification only using independently retained GEOS source; not partial AA contribution proof. Delta1 retained in raw results, not waived.','reports':reports},open(P/'difference-roles.json','w'),indent=2)
