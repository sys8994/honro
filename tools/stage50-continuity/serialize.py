"""Bounded three-decimal relative serialization; retain every line and component."""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Line
import re,json,sys
src,dst=map(Path,sys.argv[1:3]);tree=E.parse(str(src));before=after=0;error=0
fmt=lambda v: f'{v:.3f}'.rstrip('0').rstrip('.') if v else '0'
for node in tree.findall('.//{*}path'):
 chunks=[]
 for part in re.findall(r'[Mm][^Mm]*',node.get('d','')):
  p=parse_path(part)
  if not p:continue
  assert all(isinstance(s,Line)for s in p)
  pts=[p[0].start]+[s.end for s in p];q=[complex(round(v.real,3),round(v.imag,3))for v in pts]
  error=max(error,max(abs(a-b)for a,b in zip(pts,q)))
  d='M'+fmt(q[0].real)+','+fmt(q[0].imag)
  if len(q)>2:d+='l'+' '.join(fmt((b-a).real)+','+fmt((b-a).imag)for a,b in zip(q[:-2],q[1:-1]))
  d+='L'+fmt(q[-1].real)+','+fmt(q[-1].imag)
  if re.search('[zZ]\\s*$',part):d+='Z'
  assert len(parse_path(d))==len(p)
  chunks.append(d);before+=len(p);after+=len(parse_path(d))
 node.set('d',' '.join(chunks))
tree.write(str(dst),encoding='utf-8',xml_declaration=True)
rec={'input':src.name,'output':dst.name,'inputBytes':src.stat().st_size,'outputBytes':dst.stat().st_size,'segmentsBefore':before,'segmentsAfter':after,'maxPointErrorSourceUnits':error,'maxAllowedPointError':.00071,'scope':'numeric serialization only, image error separately checked'};assert error<.00071;dst.with_suffix('.serialization.json').write_text(json.dumps(rec,indent=2)+'\n');print(json.dumps(rec))
