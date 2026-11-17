import xml.etree.ElementTree as E
from pathlib import Path
from copy import deepcopy
N='http://www.w3.org/2000/svg';E.register_namespace('',N)
r=E.parse('stage7-exterior-study/body-original.svg').getroot();defs=r.find('{'+N+'}defs');old=list(r)[1:]
for n in old:r.remove(n)
for ident,x,y,w,h in [('old-upper',-1200,-1200,3848,2265),('old-footer',-1200,1065,3848,9),('new-below',-1200,1065,3848,2585)]:
 c=E.SubElement(defs,'{'+N+'}clipPath',id=ident,clipPathUnits='userSpaceOnUse');E.SubElement(c,'{'+N+'}rect',x=str(x),y=str(y),width=str(w),height=str(h))
grad=E.SubElement(defs,'{'+N+'}linearGradient',id='footer-alpha',gradientUnits='userSpaceOnUse',x1='0',x2='0',y1='1065',y2='1074');E.SubElement(grad,'{'+N+'}stop',offset='0',style='stop-color:white;stop-opacity:1');E.SubElement(grad,'{'+N+'}stop',offset='1',style='stop-color:white;stop-opacity:0')
m=E.SubElement(defs,'{'+N+'}mask',id='footer-mask',maskUnits='userSpaceOnUse',x='-1200',y='1065',width='3848',height='9',style='mask-type:alpha');E.SubElement(m,'{'+N+'}rect',x='-1200',y='1065',width='3848',height='9',fill='url(#footer-alpha)')
g=E.SubElement(r,'{'+N+'}g',{'clip-path':'url(#new-below)'});E.SubElement(g,'{'+N+'}image',href=Path('stage7-exterior-study/v3/source.png').resolve().as_uri(),x=str(-442/.2635),y=str(-83.5/.2635),width=str(1254/.2635),height=str(1254/.2635))
u=E.SubElement(r,'{'+N+'}g',{'clip-path':'url(#old-upper)'})
for n in old:u.append(deepcopy(n))
f=E.SubElement(r,'{'+N+'}g',{'clip-path':'url(#old-footer)','mask':'url(#footer-mask)'})
for n in old:f.append(deepcopy(n))
for name,vb,w,h in [('full','-1200 0 3848 3650',1539,1460),('join','-120 965 1700 270',1360,216),('pixel','0 965 1448 600',1448,600),('desktop-min','-120 1010 1700 160',1041,98),('portrait-min','-120 1010 1700 160',305,29)]:
 r.set('viewBox',vb);r.set('width',str(w));r.set('height',str(h));E.ElementTree(r).write('stage7-exterior-study/v5-nine-pixel-fade/'+name+'.svg')
