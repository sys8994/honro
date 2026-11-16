from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path
import os,subprocess,copy,json,hashlib,sys
p=Path(__file__).parent;src=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path('/workspace/scratch/0b8c8f8d81c7/stage43-recovery/art/stage43-edge/source.svg');ns='{http://www.w3.org/2000/svg}'
env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(p/'profile')}
def run(f,actions,out):
 z=subprocess.run(['inkscape',str(f),'--batch-process','--actions='+(';'.join(actions+['select-clear','export-plain-svg','export-filename:'+str(out),'export-do']))],env=env,capture_output=True,text=True);(p/(out.stem+'.log')).write_text(z.stdout+z.stderr);z.check_returncode()
def root():return E.Element(ns+'svg',nsmap={None:ns[1:-1]},width='650',height='760',viewBox='-200 0 650 760')
def mapped(d):return parse_path(d).scaled(650/1160).translated(-200).d()
s=E.parse(str(src));alpha=s.find('.//'+ns+'clipPath').find(ns+'path').get('d');newalpha=mapped(E.parse(str(p/'trace-v1/alpha-raw.svg')).find('.//'+ns+'path').get('d'))
r=root();E.SubElement(r,ns+'path',id='outer',d=newalpha,fill='#000');E.SubElement(r,ns+'path',id='region',d='M-100 250H100V724H-100Z',fill='#000');E.SubElement(r,ns+'path',id='original',d=alpha,fill='#000');f=p/'mask-input.svg';E.ElementTree(r).write(str(f));run(f,['select-by-id:outer,region','path-intersection','select-clear','select-by-id:outer,original','path-difference'],p/'exterior-mask.svg')
mask=E.parse(str(p/'exterior-mask.svg')).find('.//'+ns+'path').get('d')
r=root();actions=[];palette=['#939ba7','#778394','#657184','#687588','#4f5d71','#37475c','#25364a','#162332']
def rgb(c):return tuple(int(c[i:i+2],16) for i in [1,3,5])
colors=[]
for i,q in enumerate(E.parse(str(p/'trace-v1/color-raw.svg')).findall('.//'+ns+'path')):
 c=q.get('style').split('fill:')[1].split(';')[0];v=rgb(c);col='#162332' if min(v)>240 else min(palette,key=lambda c:sum((x-y)**2 for x,y in zip(v,rgb(c))))
 colors.append([c,col]);E.SubElement(r,ns+'path',id=f'color{i}',d=mapped(q.get('d')),style='fill:'+col+';stroke:none');E.SubElement(r,ns+'path',id=f'mask{i}',d=mask,fill='#000');actions+=['select-clear',f'select-by-id:color{i},mask{i}','path-intersection']
f=p/'colors-input.svg';E.ElementTree(r).write(str(f));run(f,actions,p/'exterior-native.svg')
patch=E.parse(str(p/'exterior-native.svg'));original=E.parse(str(src));r=root();defs=copy.deepcopy(original.getroot()[0]);r.append(defs);g=E.SubElement(r,ns+'g',id='new-exterior')
for q in patch.findall('.//'+ns+'path'):g.append(copy.deepcopy(q))
r.append(copy.deepcopy(original.getroot()[1]));E.ElementTree(r).write(str(p/'composed-native.svg'))
# An original-only comparison at exactly the same crop and dimensions.
o=root();o.extend(copy.deepcopy(x) for x in original.getroot());E.ElementTree(o).write(str(p/'original-native.svg'))
for kind in ['composed','original']:
 z=subprocess.run(['inkscape',str(p/f'{kind}-native.svg'),'--export-width=1024','--export-filename='+str(p/f'{kind}-native.png')],env=env,capture_output=True,text=True);z.check_returncode()
(p/'extraction.json').write_text(json.dumps({'sourceSHA256':hashlib.sha256(src.read_bytes()).hexdigest(),'registration':'uniform scale650/1160, translate(-200,0); 3 masonry anchors NCC .916..993, residual <=1 generated px','mode':'native traced exterior alpha minus original alpha, clipped west x-100..100 y250..724; original child tree unchanged','paletteMap':colors,'status':'visual review pending'},indent=2))
