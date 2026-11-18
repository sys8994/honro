"""Run with PYTHONPATH=/tmp/honro-geometry python stage32-lower-exterior-scope/audit.py.
Author-time geometry check, not a browser simulation. Source curves are sampled
by previously independently tested original nonzero geometry with <=.005source error.
"""
from pathlib import Path
from shapely.geometry import shape, box
from shapely.ops import unary_union
import hashlib, json
P=Path(__file__).parent
paths=['stage32-foundation-gray-geometry/source-alpha-silhouette.geojson','stage32-geos-study/source-geometries.geojson','stage32-integration-final-chrome/new/snapshot.json','stage32-internal-boundary-review/foundation.json',str(P/'bounds-reference.js')]
F=shape(json.load(open(paths[0])));features=json.load(open(paths[1]))['features'];assert len(features)==26
B=unary_union([shape(f['geometry']) for f in features[:25]]).intersection(shape(features[25]['geometry']));U=F.union(B)
s=json.load(open(paths[2]))['stage32'];assert s['width']==3379.2 and s['height']==2252.8 and 'camera' not in s
bounds=Path(paths[4]).read_text();assert 'focusSide:320' in bounds and 'maxZoom:1.65' in bounds
field=json.load(open(paths[3]))['vector']['root']['children'][0]['children'][0];m=field['transform'];first=field['children'][0]
assert first['fill']=='#9a8273' and first['d']=='M0,362C0,241.33 0,120.67 0,0c724,0 1448,0 2172,0 0,241.33 0,482.67 0,724C1448,724 724,724 0,724 0,603.33 0,482.67 0,362Z'
opaque=[(-5500+7.2*m[4])/2.2,(-1950+7.2*m[5])/2.2,(-5500+7.2*(m[4]+m[0]*2172))/2.2,(-1950+7.2*(m[5]+m[3]*724))/2.2];assert F.difference(box(*opaque)).area==0
rows=[]
for width in [390,844,1331,1920,3840]:
 xmin=-320-width/(2*1.05);xmax=s['width']+320+width/(2*1.05);r=box(xmin/2.2,1714/2.2,xmax/2.2,1992/2.2);missing=r.difference(U)
 rows.append({'cssWidth':width,'nativeScaleLowerBound':1.05,'cameraFocusRangeX':[-320,s['width']+320],'conservativeWorldRect':[xmin,1714,xmax,1992],'missingAreaWorld':missing.area*2.2**2,'minimumTerrainBoundaryDistanceWorld':r.distance(U.boundary)*2.2,'covered':U.covers(r)})
 assert missing.is_empty and r.distance(U.boundary)*2.2>113
report={'scope':'Normal constrained stage32 camera, native>1.05, CSSwidth<=3840 and renderer pixel ratio>=1. Continuous author-time rectangle coverage, not all arbitrary cameras/screens. Original sampled source geometry <=.005source, minimum113world separation far exceeds that bound. No source geometry or runtime change.', 'sourceHashes':{('stage32-lower-exterior-scope/bounds-reference.js' if i==4 else p):hashlib.sha256(Path(p).read_bytes()).hexdigest() for i,p in enumerate(paths)},'foundationOpaqueProof':{'firstSourcePath':'exact2172x724 rectangle with all cubic controls on rectangle edges; solid#9a8273','opaqueRectWorld':[v*2.2 for v in opaque],'foundationSilhouetteOutsideArea':0},'bodyBoundsWorld':[v*2.2 for v in B.bounds],'rows':rows}
(P/'geometry-result.json').write_text(json.dumps(report,indent=2));print(json.dumps(rows,indent=2))
