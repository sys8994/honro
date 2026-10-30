from pathlib import Path
import xml.etree.ElementTree as E,copy
from svgpathtools import parse_path
D=Path('art/stage34-floor-silhouette-v4');r=E.parse(D/'final.svg').getroot()
def warp(z):return complex(z.real,z.imag if z.imag<=700 else 700+(z.imag-700)*80)
for e in r.iter():
 if not e.tag.endswith('path'):continue
 p=parse_path(e.attrib['d'])
 for s in p:
  for k in ['start','end','control','control1','control2']:
   if hasattr(s,k):setattr(s,k,warp(getattr(s,k)))
 e.set('d',p.d())
E.ElementTree(r).write(D/'depth-extended.svg',encoding='utf-8',xml_declaration=True)
