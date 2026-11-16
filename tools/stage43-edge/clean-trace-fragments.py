"""Remove only subpixel thin trace slivers, not the native alpha or major facets."""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path
import sys,json,hashlib
out=Path(sys.argv[1]);p=out/'color-raw.svg';raw=p.read_bytes();t=E.fromstring(raw);removed=[];count=0
for i,node in enumerate(t.findall('.//{*}path')):
 chunks=[]
 for sub in parse_path(node.get('d')).continuous_subpaths():
  count+=1
  try:area=abs(sub.area());perimeter=sub.length()
  except Exception:area=1e20;perimeter=1
  if sub.isclosed() and area<120 and (area<3 or area/max(perimeter,1)<.45):removed.append({'path':i,'area':area,'perimeter':perimeter});continue
  chunks.append(sub.d()+(' Z' if sub.isclosed() else ''))
 node.set('d',' '.join(chunks))
E.ElementTree(t).write(str(out/'color-raw.svg'))
(out/'fragment-cleanup.json').write_text(json.dumps({'sourceSHA256':hashlib.sha256(raw).hexdigest(),'rule':'native source-space area<120 and area/perimeter<0.45, or area<3; closed components only; alpha untouched','subpathsBefore':count,'removedCount':len(removed),'removedArea':sum(i['area'] for i in removed),'removed':removed},indent=2));print(count,len(removed),sum(i['area'] for i in removed))
