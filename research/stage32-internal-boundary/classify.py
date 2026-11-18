import json
from pathlib import Path
from PIL import Image
import numpy as np
from shapely.geometry import shape,Point
p=Path('stage32-bodyguard-audit-chrome'); im=np.asarray(Image.open(p/'stage32-ss2-maximum.png').convert('RGBA'));body=np.asarray(Image.open(p/'stage32-body-candidate-maximum.png').convert('RGBA'))
load=lambda n:shape(json.load(open('stage32-geos-study/'+n+'.geojson')))
bg=load('original-painted');prot=load('visible-protected');wg=load('walk-guard');rg=load('road-guard')
rows=[]
for y in [200,250,300,360,420,490,550,600,650]:
 # closest source BODY boundary in visible seam interval, not an acceptance exception
 best=None
 for x in range(210,321):
  s=Point((x+.5-137.5)/(1.65*2.2),(y+.5+2341)/(1.65*2.2)); dist=bg.boundary.distance(s)
  if best is None or dist<best[0]:best=(dist,x,s)
 dist,x,s=best
 rows.append(dict(pixel=[x,y],source=[s.x,s.y],scene=im[y,x].tolist(),bodyAlpha=int(body[y,x,3]),neighborScene=[im[y,x-3].tolist(),im[y,x+3].tolist()],neighborBodyAlpha=[int(body[y,x-3,3]),int(body[y,x+3,3])],bodyBoundaryDistanceSource=dist,visibleDistanceSource=prot.distance(s),walkGuardDistanceSource=wg.distance(s),roadGuardDistanceSource=rg.distance(s)))
Path('stage32-internal-boundary-review/samples.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows,indent=2))
