from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path
from svgpathtools.path import transform
import numpy as np,json,subprocess,os
A=Path(__file__).resolve().parent;R=A.parents[1];ns='http://www.w3.org/2000/svg';folder=A/'composition-v12';folder.mkdir(exist_ok=True)
def op(name,ds,action):
 root=E.Element('{'+ns+'}svg',nsmap={None:ns},viewBox='-1400 -100 4400 5100')
 for i,d in enumerate(ds):E.SubElement(root,'{'+ns+'}path',id=f'p{i}',d=d,fill='#000')
 inp=folder/(name+'-input.svg');out=folder/(name+'-native.svg');E.ElementTree(root).write(str(inp))
 subprocess.run(['/usr/bin/inkscape',str(inp),'--batch-process',f'--actions=select-all;path-{action};export-plain-svg;export-filename:{out};export-do'],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(folder/'profile')},capture_output=True,check=True)
 return ' '.join(parse_path(p.get('d')).d() for p in E.parse(str(out)).findall('.//{*}path'))
def alpha(name):
 a=json.load(open(R/'shared/assets/environment/act5'/name));aa,b,c,d,e,f=a['vector']['root']['transform'];matrix=np.array([[aa,c,e],[b,d,f],[0,0,1]])
 return ' '.join(transform(parse_path(p),matrix).d() for p in a['vector']['clips']['native-source-alpha'])
load=lambda f:json.load(open(A/f));support=' '.join(load('support-mask-v9.json')['clip']);seam=load('source-seam.json');region=' '.join(load('joint-region-v12.json')['clip'])
body=op('deep',[alpha('stage48-continuous-v11-bleed.json'),support],'intersection');joint=op('joint-support',[alpha('stage48-joint-v12.json'),support],'intersection');joint=op('joint-region',[joint,region],'intersection')
coverage=op('coverage',[body,joint],'union');original=op('original',seam['sourceNativeClips'],'union');outside=op('outside',[original,coverage],'difference');keep=op('keep',[outside,seam['clip']],'union')
json.dump({'body':[body],'joint':[joint],'source':[keep],'method':'Actual native Boolean alpha partitions; each painted stack receives final coverage once'},open(A/'composition-v12.json','w'),indent=2)
