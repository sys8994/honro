import xml.etree.ElementTree as E,json
from pathlib import Path
s=.2635;tx=442;ty=83.5
ns='http://www.w3.org/2000/svg';E.register_namespace('',ns);root=E.parse('stage7-exterior-study/body-original.svg').getroot();defs=root.find('{'+ns+'}defs');clip=E.SubElement(defs,'{'+ns+'}clipPath',id='new-exterior-only',clipPathUnits='userSpaceOnUse')
# Registration/visibility diagnostic only: no source silhouette or production change.
for x,y,w,h in [(-1200,1067,3848,2583),(-1200,880,1200,187),(1448,880,1200,187)]:E.SubElement(clip,'{'+ns+'}rect',x=str(x),y=str(y),width=str(w),height=str(h))
g=E.Element('{'+ns+'}g',{'clip-path':'url(#new-exterior-only)'})
E.SubElement(g,'{'+ns+'}image',href=Path('stage7-exterior-study/v3/source.png').resolve().as_uri(),x=str(-tx/s),y=str(-ty/s),width=str(1254/s),height=str(1254/s))
root.insert(1,g);root.set('viewBox','-1200 0 3848 3650');root.set('width','1539');root.set('height','1460');E.ElementTree(root).write('stage7-exterior-study/v3/registration-preview.svg')
root.set('viewBox','-120 850 1700 470');root.set('width','1360');root.set('height','376');E.ElementTree(root).write('stage7-exterior-study/v3/join-preview.svg')
Path('stage7-exterior-study/v3/registration.json').write_text(json.dumps({'status':'manual landmark provisional; original is drawn unchanged on top; production not modified','sourceToGenerated':{'s':s,'tx':tx,'ty':ty},'coverageSource':{'left':-tx/s,'right':(1254-tx)/s,'bottom':(1254-ty)/s},'newClipSource':{'bottomStart':1067,'sideStart':880}},indent=2))
