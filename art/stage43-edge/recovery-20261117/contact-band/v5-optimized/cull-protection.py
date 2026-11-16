from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path
import json
p=Path(__file__).parent;n='{http://www.w3.org/2000/svg}';report=[]
for i in [5,2,4]:
 q=E.parse(str(p/f'op-{i}-out.svg')).find('.//'+n+'path');subs=parse_path(q.get('d')).continuous_subpaths();keep=[]
 for sub in subs:
  x0,x1,y0,y1=sub.bbox()
  if x1>=0 and x0<=2172 and y1>=649.5 and y0<=1024:keep.append(sub.d()+' Z')
 r=E.Element(n+'svg',nsmap={None:n[1:-1]},viewBox='0 650 2172 374');E.SubElement(r,n+'path',d=' '.join(keep));E.ElementTree(r).write(str(p/f'culled-{i}.svg'));report.append({'layer':i,'originalSubpaths':len(subs),'retained':len(keep),'chars':sum(map(len,keep))})
(p/'cull-report.json').write_text(json.dumps(report,indent=2));print(report)
