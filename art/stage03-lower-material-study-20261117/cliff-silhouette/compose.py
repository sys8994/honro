from lxml import etree as E
from pathlib import Path
import copy,json
S='http://www.w3.org/2000/svg';P=Path('stage3-exterior-study/cliff-silhouette');src=E.parse('stage3-exterior-study/solid880/composite.svg').getroot();src.remove(src[-1])
# Explicitly NEW nonwalking concept silhouette, not derived original geometry.
# Top starts within original solid footer; all side segments descend steeply.
d='M -390 880 C -399 932 -420 1010 -438 1082 C -452 1156 -496 1216 -520 1300 C -540 1375 -544 1458 -584 1540 C -634 1642 -698 1740 -728 1865 C -759 1998 -826 2091 -884 2200 C -951 2322 -1050 2462 -1128 2600 L -1128 4887 L 2902 4887 L 2902 2600 C 2820 2460 2752 2338 2676 2210 C 2605 2090 2590 1958 2534 1855 C 2475 1742 2412 1668 2385 1550 C 2362 1445 2320 1358 2287 1270 C 2259 1180 2220 1120 2206 1040 C 2194 972 2183 924 2174 880 Z'
# New base follows original rendering; changes restricted to source y>=880.
E.SubElement(src,'{%s}path'%S,d=d,fill='#142c2f')
(P/'composite.svg').write_bytes(E.tostring(src))
views=[('full','-1200 550 4174 2850',900,615),('join','-500 720 2800 800',1200,343)]
scale=390/6800*3.23;cy=3035.01/3.23
for name,cx in [('portrait-left',0),('portrait-right',1774)]:views.append((name,f'{cx-390/scale/2} {cy-844/scale/2} {390/scale} {844/scale}',390,844))
for name,v,w,h in views:
 r=copy.deepcopy(src);r.set('viewBox',v);r.set('width',str(w));r.set('height',str(h));(P/(name+'.svg')).write_bytes(E.tostring(r))
(P/'scope.json').write_text(json.dumps({'newConceptGeometry':True,'originalPathsUnchanged':True,'sourceYStart':880,'lowestWalkY':811,'walkGapWorld':222.87,'cameraHalfWidthSource':390/scale/2,'overscanSource':240/3.23,'sourceLateralTarget':[-1128,2902],'targetReachedAtSourceY':2600,'sourceBottom':4887,'physicsChanged':False,'nativeStudyOnly':True},indent=2))
