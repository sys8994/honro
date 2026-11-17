import xml.etree.ElementTree as E
from pathlib import Path
N='http://www.w3.org/2000/svg';E.register_namespace('',N)
r=E.parse('stage7-exterior-study/v3/registration-preview.svg').getroot();defs=r.find('{'+N+'}defs');cap=E.SubElement(defs,'{'+N+'}clipPath',id='preserved-original-through-1065',clipPathUnits='userSpaceOnUse');E.SubElement(cap,'{'+N+'}rect',x='-1200',y='-1200',width='3848',height='2265')
# New study only; original path data and transforms untouched.
for child in list(r)[2:]:
 r.remove(child);g=E.SubElement(r,'{'+N+'}g',{'clip-path':'url(#preserved-original-through-1065)'});g.append(child)
for e in defs:
 if e.attrib.get('id')=='new-exterior-only':
  for rect in list(e):
   if rect.attrib.get('width')=='3848':rect.set('y','1065');rect.set('height','2585')
r.set('viewBox','0 965 1448 600');r.set('width','1448');r.set('height','600');E.ElementTree(r).write('stage7-exterior-study/v4-join/reference.svg')
