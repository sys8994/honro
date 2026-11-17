from lxml import etree as E
from pathlib import Path
import copy,json
S='http://www.w3.org/2000/svg';P=Path('stage3-exterior-study/solid880')
body=E.parse('stage3-exterior-study/body-original.svg').getroot()
r=E.Element('{%s}svg'%S,nsmap={None:S},width='2564',height='4887',viewBox='-390 0 2564 4887');defs=E.SubElement(r,'{%s}defs'%S)
src=E.SubElement(defs,'{%s}g'%S,id='original-body')
for n in body:src.append(copy.deepcopy(n))
E.SubElement(r,'{%s}use'%S,href='#original-body')
for i,(x,y,w,h,dx,dy,dw,dh) in enumerate([(0,506,27,381,0,506,-390,381),(1752,470,22,417,2174,470,-400,417)]):
 c=E.SubElement(defs,'{%s}clipPath'%S,id='side'+str(i),clipPathUnits='userSpaceOnUse');E.SubElement(c,'{%s}rect'%S,x=str(x),y=str(y),width=str(w),height=str(h))
 sx=dw/w;sy=dh/h;g=E.SubElement(r,'{%s}g'%S,transform=f'matrix({sx} 0 0 {sy} {dx-x*sx} {dy-y*sy})',attrib={'clip-path':f'url(#side{i})'});E.SubElement(g,'{%s}use'%S,href='#original-body')
# Only constant-color nonwalking footer is covered; original source remains intact.
# Old site-edge-2 is omitted entirely. Opaque overlay also avoids per-path cut AA.
E.SubElement(r,'{%s}rect'%S,x='-390',y='880',width='2564',height='4007',fill='#142c2f')
(P/'composite.svg').write_bytes(E.tostring(r))
views=[('join','0 650 1774 900',1200,609),('full','-390 0 2564 3400',550,730)]
for name,v,w,h in views:
 a=copy.deepcopy(r);a.set('viewBox',v);a.set('width',str(w));a.set('height',str(h));(P/(name+'.svg')).write_bytes(E.tostring(a))
scale=390/6800*3.23;cx=0;cy=3035.01/3.23;w=390;h=844
v=f'{cx-w/scale/2} {cy-h/scale/2} {w/scale} {h/scale}'
a=copy.deepcopy(r);a.set('viewBox',v);a.set('width',str(w));a.set('height',str(h));(P/'portrait-min.svg').write_bytes(E.tostring(a))
print(json.dumps({'sourceToPixel':scale,'viewBox':v,'lowestWalkSource':811,'baseStart':880,'gapSource':69,'gapWorld':69*3.23,'baseEndWorld':4887*3.23}))
