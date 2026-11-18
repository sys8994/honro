import json,time
from pathlib import Path
from shapely.geometry import shape,box,mapping
from shapely.ops import unary_union
from shapely.geometry.polygon import orient
P=Path('stage32-offline-face-recipe');source=json.load(open('stage32-geos-study/source-geometries.geojson'));g=[shape(f['geometry']) for f in source['features']];flat=json.load(open('stage32-geos-study/flattened-faces.json'));roles=json.load(open(P/'classified.json'))['rows'];fielddata=json.load(open('stage32-foundation-gray-geometry/oracle.json'));F=[unary_union([shape(f['geometry']) for f in r['faces'] if f['nativeInside']]) for r in fielddata['paths'][:12]];field=json.load(open('stage32-internal-boundary-review/foundation.json'));fills=field['vector']['root']['children'][0]['children'][0]['children'];region=box(-3000,779.5,6000,905);apron=g[25];later=unary_union([]);vis={}
for i in range(24,-1,-1):vis[i]=g[i].difference(later).intersection(apron).intersection(region);later=unary_union([later,g[i]])
fieldvis={};later=unary_union([])
for i in range(11,-1,-1):fieldvis[i]=F[i].difference(later).intersection(region);later=unary_union([later,F[i]])
groups={};stats=[]
def add(key,poly):
 if poly.is_empty:return
 groups.setdefault(key,[]).append(poly)
for r in roles:
 i=r['i'];v=vis[i]
 if v.is_empty:continue
 if r['protected']:
  if i>=21:add((r['fill'],r['fill']),v)
  else:
   for j,f in fieldvis.items():add((r['fill'],fills[j]['fill']),v.intersection(f))
 else:
  retained=unary_union([shape(flat['paths'][i]['faces'][k]['geometry']) for k in r['retainedFaces']]).intersection(v)
  add((r['fill'],r['fill']),retained)
  remaining=v.difference(retained)
  # Field-only faces use the one existing bitmap base; never re-fill its boundary as separate polygons.
  pass
def svg(geom):
 polys=list(geom.geoms) if geom.geom_type=='MultiPolygon' else [geom] if geom.geom_type=='Polygon' else [p for p in geom.geoms if p.geom_type=='Polygon'];out=[]
 for p in polys:
  p=orient(p,sign=1)
  for ring in [p.exterior,*p.interiors]:
   pts=list(ring.coords);out.append('M'+'L'.join(f'{x:.5f},{y:.5f}' for x,y in pts[:-1])+'Z')
 return ''.join(out)
rows=[]
for k,ps in groups.items():
 a=unary_union(ps);s=a.simplify(.01,preserve_topology=True);d=svg(s);rows.append(dict(start=k[0],end=k[1],d=d,area=a.area,simplifiedArea=s.area,approxSymmetricArea=a.symmetric_difference(s).area));print(k,len(d),a.area,flush=True)
coverage=unary_union([unary_union(ps) for ps in groups.values()]);expected=unary_union(list(vis.values()));result={'scope':'Author-time nonwalk lower final-visible faces, raw source retained, .005 source chord approximation and .01 simplification. Not accepted.','paths':rows,'rows':len(rows),'pathBytes':sum(len(r['d']) for r in rows),'fieldBaseOnlyArea':expected.difference(coverage).area,'outsideArea':coverage.difference(expected).area,'sourceBounds':coverage.bounds}
foundation=unary_union([shape(f['geometry']) for f in fielddata['paths'][12]['faces'] if f['nativeInside']])
reset=expected.buffer(.5).intersection(box(-3000,779.5,6000,1992/2.2)).intersection(foundation.buffer(-.02)).intersection(apron)
assert reset.difference(foundation).area==0
(P/'reset-scope.json').write_text(json.dumps({'radiusSource':.5,'rule':'Original lower BODY coverage + .5source paint-AA support, intersect original opaque foundation inset.02 and original apron; device lower split remains strict','area':reset.area,'outsideFoundation':reset.difference(foundation).area,'bounds':reset.bounds},indent=2))
(P/'coverage.svgpath').write_text(svg(reset.simplify(.005,preserve_topology=True)))
(P/'recipe.json').write_text(json.dumps(result,separators=(',',':')));(P/'summary.json').write_text(json.dumps({k:v for k,v in result.items() if k!='paths'},indent=2))
