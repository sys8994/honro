from pathlib import Path
import xml.etree.ElementTree as E,json
from svgpathtools import parse_path
from shapely.geometry import MultiLineString

def shape(d):
 lines=[]
 def flat(c,a=0,b=1):
  aa=c.point(a);bb=c.point(b);err=max(abs(c.point(a+(b-a)*q)-(aa+(bb-aa)*q))for q in [.25,.5,.75])
  if err>.01:
   m=(a+b)/2;return flat(c,a,m)[:-1]+flat(c,m,b)
  return [(aa.real,aa.imag),(bb.real,bb.imag)]
 for p in parse_path(d).continuous_subpaths():
  pts=[]
  for c in p:pts+=flat(c)[:-1]
  pts.append((p[-1].end.real,p[-1].end.imag));lines.append(pts)
 return MultiLineString(lines)
for directory in ['art/stage34-floor-silhouette-v4','art/stage34-silhouette-v4']:
 D=Path(directory);raw=[e for e in E.parse(D/'palette.svg').getroot().iter()if e.tag.endswith('path')];new=[e for e in E.parse(D/'final.svg').getroot().iter()if e.tag.endswith('path')];errors=[shape(a.attrib['d']).hausdorff_distance(shape(b.attrib['d']))+.02 for a,b in zip(raw,new)];limit=.08 # conservative near-camera bound for floor affine<=~7screen px/source
 passed=max(errors)<=limit
 report={'threshold':.0001,'geometricContourErrorBoundSourcePx':errors,'limitSourcePx':limit,'flattenTolerancePerCurve':.01,'pass':passed,'status':'screen visual inspection pending'}
 if not passed:
  (D/'simplified-rejected.svg').write_bytes((D/'final.svg').read_bytes());(D/'final.svg').write_bytes((D/'palette.svg').read_bytes());report['selected']='raw native paths, no simplification accepted yet'
 else:report['selected']='simplify .0001'
 report['rawSegments']=sum(len(parse_path(e.attrib['d']))for e in raw);report['trialSegments']=sum(len(parse_path(e.attrib['d']))for e in new)
 (D/'optimization-geometry.json').write_text(json.dumps(report,indent=2));print(directory,report)
