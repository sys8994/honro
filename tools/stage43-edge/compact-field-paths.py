"""Compact absolute-rounded line geometry; no accumulated relative rounding."""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Line
import re,json,sys
src,dest=map(Path,sys.argv[1:3]);t=E.parse(str(src));before=after=0
f=lambda x: ('%.1f'%x).rstrip('0').rstrip('.') if abs(x)>=.05 else '0'
for node in t.findall('.//{*}path'):
 d=node.get('d','');before+=len(d);chunks=[];cursor=0j
 for raw in re.findall(r'[Mm][^Mm]*',d):
  p=parse_path(raw,current_pos=cursor)
  if not p:continue
  if any(not isinstance(s,Line) for s in p):raise ValueError('Only line compounds supported')
  pts=[complex(round(p[0].start.real,1),round(p[0].start.imag,1))]+[complex(round(s.end.real,1),round(s.end.imag,1)) for s in p]
  out='M'+f(pts[0].real)+','+f(pts[0].imag)
  for a,b in zip(pts,pts[1:]):
   v=b-a;options=['L'+f(b.real)+','+f(b.imag),'l'+f(v.real)+','+f(v.imag)]
   if a.imag==b.imag:options+=['H'+f(b.real),'h'+f(v.real)]
   if a.real==b.real:options+=['V'+f(b.imag),'v'+f(v.imag)]
   out+=min(options,key=len)
  closed=bool(re.search(r'[zZ]\s*$',raw));out+='Z' if closed else '';chunks.append(out);cursor=p[0].start if closed else p[-1].end
 node.set('d',' '.join(chunks));after+=len(node.get('d'))
t.write(str(dest));print(json.dumps({'beforeCharacters':before,'afterCharacters':after,'maxPointError':.071,'method':'round absolute points to 0.1, then choose shortest exact absolute/relative line; alpha untouched'}))
