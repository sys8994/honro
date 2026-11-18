import json
from pathlib import Path
from shapely.geometry import shape,box,Point,mapping
from shapely.ops import unary_union
from shapely.geometry.polygon import orient
R=Path('stage32-internal-guard-gap')
load=lambda p:shape(json.load(open(p)))
body=load('stage32-geos-study/original-painted.geojson');gray=load('stage32-foundation-gray-geometry/topmost-gray9.geojson');visible=load('stage32-geos-study/visible-protected.geojson');walk=load('stage32-geos-study/walk-guard.geojson');road=load('stage32-geos-study/road-guard.geojson')
# Explicit artist face selection: left contact contour, not all asset boundaries.
line=body.boundary.intersection(box(0,680,80,910))
# Fixed gray safe all min .05. Final terrain boundary is foundation silhouette here.
safe=gray.buffer(-18.194).difference(visible.buffer(9.103)).difference(walk).difference(road)
near=line.buffer(18.194,cap_style='round',join_style='round').intersection(body).union(line.buffer(2,cap_style='round',join_style='round'));cover=near.intersection(safe)
assert cover.difference(gray).area==0 and cover.intersection(visible).area==0
polys=list(cover.geoms) if hasattr(cover,'geoms') else [cover]
def ring(cs):return 'M'+'L'.join(f'{x:.6f},{y:.6f}' for x,y in list(cs)[:-1])+'Z'
d=''.join(ring(p.exterior.coords)+''.join(ring(h.coords) for h in p.interiors) for p in map(lambda p:orient(p,sign=1),polys))
(R/'coverage.svgpath').write_text(d);(R/'coverage.geojson').write_text(json.dumps(mapping(cover),separators=(',',':')))
r=dict(scope='Explicit left internal BODY/foundation contact contour. Original asset alpha may change only inside this band; static terrain union stays protected.',selectedContourBounds=list(line.bounds),selectedContourLength=line.length,insideOldBodyGuardGapSource=18.194,outsideBandRadiusSource=2,foundationGrayInsetSource=18.194,visibleInsetSource=9.103,area=cover.area,bodyOutsideArea=cover.difference(body).area,bounds=list(cover.bounds),components=len(polys),bytes=len(d),originalGrayOutsideArea=cover.difference(gray).area,visibleOverlapArea=cover.intersection(visible).area,walkOverlapArea=cover.intersection(walk).area,roadOverlapArea=cover.intersection(road).area)
(R/'geometry.json').write_text(json.dumps(r,indent=2));print(r)
