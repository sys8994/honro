from pathlib import Path
from lxml import etree as E
import copy,subprocess,os,json
A=Path(__file__).resolve().parent;src=A/'native-v11-bleed/color-opt.svg';tree=E.parse(str(src));r=tree.getroot();ns='http://www.w3.org/2000/svg';tag=lambda s:'{'+ns+'}'+s
folder=A/'partition-v11-bleed';folder.mkdir(exist_ok=True);stats=[]
env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(folder/'inkscape-profile')}
for i,p in enumerate(r.findall('.//{*}path')):
 if len(p.get('d'))<=230000:continue
 parent=p.getparent();at=parent.index(p)
 for k,(left,right) in enumerate([(-100,200),(200,400),(400,610),(610,820),(820,1030),(1030,1280),(1280,1700)]):
  wrapper=E.Element(tag('svg'),nsmap={None:ns},viewBox=r.get('viewBox'));a=copy.deepcopy(p);a.set('id','paint');wrapper.append(a);E.SubElement(wrapper,tag('path'),id='cut',d=f'M{left},-1000H{right}V6000H{left}Z',fill='#000')
  inp=folder/f'{i}-{k}-input.svg';out=folder/f'{i}-{k}-native.svg';E.ElementTree(wrapper).write(str(inp));env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(folder/'inkscape-profile')}
  q=subprocess.run(['/usr/bin/inkscape',str(inp),'--batch-process',f'--actions=select-by-id:paint,cut;path-intersection;export-plain-svg;export-filename:{out};export-do'],env=env,capture_output=True,text=True,timeout=180)
  (folder/f'{i}-{k}.log').write_text(q.stdout+q.stderr);assert q.returncode==0
  for shape in E.parse(str(out)).findall('.//{*}path'):parent.insert(at,copy.deepcopy(shape));at+=1;stats.append(len(shape.get('d','')))
 parent.remove(p)
tree.write(str(A/'native-v11-bleed/color-partitioned.svg'));(folder/'report.json').write_text(json.dumps({'method':'native Inkscape Boolean intersection, only oversized opaque color path; unchanged palette, alpha and collision','pathChars':stats}))

# A connected native subpath can exceed 60000 even when compound fits.
import re
for i,p in enumerate(r.findall('.//{*}path')):
 if max(map(len,re.split('[mM]',p.get('d',''))))<=59000:continue
 parent=p.getparent();at=parent.index(p)
 for k,(top,bottom) in enumerate([(-1000,650),(650,6000)]):
  wrapper=E.Element(tag('svg'),nsmap={None:ns},viewBox=r.get('viewBox'));a=copy.deepcopy(p);a.set('id','paint');wrapper.append(a);E.SubElement(wrapper,tag('path'),id='cut',d=f'M-1000,{top}H6000V{bottom}H-1000Z',fill='#000')
  inp=folder/f'sub-{i}-{k}-input.svg';out=folder/f'sub-{i}-{k}-native.svg';E.ElementTree(wrapper).write(str(inp))
  q=subprocess.run(['/usr/bin/inkscape',str(inp),'--batch-process',f'--actions=select-by-id:paint,cut;path-intersection;export-plain-svg;export-filename:{out};export-do'],env=env,capture_output=True,text=True,timeout=180);assert q.returncode==0
  for shape in E.parse(str(out)).findall('.//{*}path'):parent.insert(at,copy.deepcopy(shape));at+=1
 parent.remove(p)
tree.write(str(A/'native-v11-bleed/color-partitioned.svg'))
