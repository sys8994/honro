import json
from pathlib import Path
from svgpathtools import parse_path,Line
from shapely.geometry import shape,LineString,box,mapping
from shapely.geometry.polygon import orient
R=Path('stage32-upper-long-diagonal');nodes=[]
def visit(n):
 if n['tag']=='path':nodes.append(n)
 for c in n.get('children',[]):visit(c)
visit(json.load(open('stage32-gray-diagnostic/review/source-evidence.json'))['body']['vector']['root'])
segs=[]
for p in parse_path(nodes[12].get('d') or ''.join(nodes[12]['dParts'])).continuous_subpaths():
 segs.extend(p)
 if p.start!=p.end:segs.append(Line(p.end,p.start))
# Authored narrow tail follows original path12 segments604/605, not a pixel whitelist.
points=[]
for s in segs[604:606]:
 for i in range(257):
  z=s.point(i/256);points.append((z.real,z.imag))
line=LineString(points).intersection(box(45,678,110,715))
load=lambda p:shape(json.load(open(p)))
V=load('stage32-geos-study/visible-protected.geojson');body=load('stage32-geos-study/original-painted.geojson');foundation=load('stage32-foundation-gray-geometry/source-alpha-silhouette.geojson');walk=load('stage32-geos-study/walk-guard.geojson');road=load('stage32-geos-study/road-guard.geojson')
allowed=V.intersection(line.buffer(.15)).intersection(box(45,678,110,715));safe=foundation.buffer(-18.194).difference(V.difference(allowed).buffer(1)).difference(walk).difference(road)
extra=line.buffer(1.0,cap_style='round').intersection(safe)
rawExtra=extra;extra=extra.simplify(.01,preserve_topology=True).buffer(-.012,quad_segs=4).intersection(rawExtra);assert extra.difference(rawExtra).area<1e-10
old=load('stage32-internal-material-final/coverage.geojson');cover=old.union(extra)
def ring(cs):return 'M'+'L'.join(f'{x:.6f},{y:.6f}' for x,y in list(cs)[:-1])+'Z'
polys=list(cover.geoms) if hasattr(cover,'geoms') else [cover];d=''.join(ring(p.exterior.coords)+''.join(ring(h.coords) for h in p.interiors) for p in map(lambda p:orient(p,sign=1),polys))
for name,g in [('tail-line',line),('allowed-tail',allowed),('extra',extra),('coverage',cover)]: (R/(name+'.geojson')).write_text(json.dumps(mapping(g)))
(R/'coverage.svgpath').write_text(d)
c=Path('stage32-internal-material-final/candidate.js').read_text();start=c.index('const internalSeamD=');end=c.index(';let internalSeam',start);c=c[:start]+'const internalSeamD='+json.dumps(d)+c[end:];(R/'candidate.js').write_text(c)
r=dict(scope='Local narrow connected grass-tail artist-region prototype; large grass body is excluded, original source unchanged. Sampled original curve guide, not universal proof.',guideBounds=line.bounds,allowedArea=allowed.area,allowedBounds=allowed.bounds,extraArea=extra.area,rawExtraArea=rawExtra.area,simplifyToleranceSource=.01,inwardAllowanceSource=.012,extraOutsideFoundation=extra.difference(foundation).area,extraOutsideBody=extra.difference(body).area,otherVisibleOverlap=extra.intersection(V.difference(allowed)).area,walkOverlap=extra.intersection(walk).area,roadOverlap=extra.intersection(road).area,bytes=len(d))
(R/'geometry.json').write_text(json.dumps(r,indent=2));print(r)
# Existing original-foundation/fullhelper Native comparison, still separate local candidate.
t=Path('stage32-internal-material-final/proof.cjs').read_text().replace('stage32-internal-material-final','stage32-upper-long-diagonal').replace('Three authorized small internal overlap regions counted separately','Three previous small overlap regions plus a declared narrow connected-tail region; its original contribution is deliberately recolored');(R/'proof.cjs').write_text(t)
