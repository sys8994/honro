import json
from pathlib import Path
from shapely.geometry import shape,box,mapping
from shapely.geometry.polygon import orient
from shapely.ops import unary_union
p=Path('stage32-final-ss-alternative');load=lambda f:shape(json.load(open(f)))
features=json.load(open('stage32-geos-study/source-geometries.geojson'))['features'];geoms={f['properties']['index']:shape(f['geometry']) for f in features}
gray=load('stage32-geos-study/visible-gray.geojson');visible=load('stage32-geos-study/visible-protected.geojson');painted=load('stage32-geos-study/original-painted.geojson');foundation=load('stage32-foundation-gray-geometry/source-alpha-silhouette.geojson');walk=load('stage32-geos-study/walk-guard.geojson');road=load('stage32-geos-study/road-guard.geojson')
# Narrow band from original grass contour geometry, not screen difference pixels.
# World1420..1716 is the existing SS domain. No new artist grass exception.
edges=unary_union([geoms[i].boundary for i in range(12,18)])
safe=gray.buffer(-.03).intersection(painted.buffer(-.03)).intersection(foundation.buffer(-.03)).difference(visible.buffer(.03)).difference(walk).difference(road)
raw=edges.buffer(.75,quad_segs=4).intersection(box(-1e4,1420/2.2,1e4,1716/2.2)).intersection(safe)
cover=raw.simplify(.02,preserve_topology=True).buffer(-.025,quad_segs=4).intersection(raw)
polys=[g for g in (cover.geoms if hasattr(cover,'geoms') else [cover]) if g.geom_type=='Polygon']
def ring(cs):return 'M'+'L'.join(f'{x:.6f},{y:.6f}' for x,y in list(cs)[:-1])+'Z'
d=''.join(ring(v.exterior.coords)+''.join(ring(h.coords) for h in v.interiors) for v in map(lambda v:orient(v,sign=1),polys))
(p/'correction.geojson').write_text(json.dumps(mapping(cover)));(p/'correction.svgpath').write_text(d)
r={'scope':'Local SS alternative only: original grass contour boundary band in topmost nonwalk gray, no new exposed-grass allowance','widthSource':.75,'originalCurveFlattenError':.005,'safetyInwardSource':.03,'simplify':.02,'simplifyInward':.025,'bytes':len(d),'polygons':len(polys),'area':cover.area,'outsideGray':cover.difference(gray).area,'visibleOverlap':cover.intersection(visible).area,'outsideBODY':cover.difference(painted).area,'outsideFoundation':cover.difference(foundation).area,'walkOverlap':cover.intersection(walk).area,'roadOverlap':cover.intersection(road).area}
(p/'geometry.json').write_text(json.dumps(r,indent=2));print(r)
