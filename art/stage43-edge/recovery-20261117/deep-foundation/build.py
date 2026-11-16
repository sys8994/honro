from pathlib import Path
from lxml import etree as E
import copy,json,os,subprocess,hashlib,re
from svgpathtools import parse_path
import numpy as np
from PIL import Image
p=Path(__file__).resolve().parent;src=p.parent/'stage43-recovery/art/stage43-edge/source.svg';n='{http://www.w3.org/2000/svg}';s=2172/912;tx=-18*s;ty=710.02-302*s;yend=(3700-ty)/s
env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(p/'profile')}
def run(f,acts,out):
 z=subprocess.run(['inkscape',str(f),'--batch-process','--actions='+';'.join(acts+['select-clear','export-plain-svg','export-filename:'+str(out),'export-do'])],env=env,capture_output=True,text=True);(p/(out.stem+'.log')).write_text(z.stdout+z.stderr);z.check_returncode()
def root(vb='0 0 948 1659',w=948,h=1659):return E.Element(n+'svg',nsmap={None:n[1:-1]},viewBox=vb,width=str(w),height=str(h))
a=E.parse(str(p/'trace-v1/alpha-raw.svg')).find('.//{*}path');r=root();a=copy.deepcopy(a);a.set('id','silhouette');r.append(a);E.SubElement(r,n+'path',id='domain',d=f'M18 302H930V{yend}H18Z');E.ElementTree(r).write(str(p/'mask-input.svg'));run(p/'mask-input.svg',['select-by-id:silhouette,domain','path-intersection'],p/'body-alpha.svg');mask=E.parse(str(p/'body-alpha.svg')).find('.//{*}path').get('d')
r=root();palette=['#778394','#657184','#4f5d71','#37475c','#25364a','#162332'];actions=[];maps=[]
def rgb(c):return [int(c[i:i+2],16)for i in [1,3,5]]
for i,q in enumerate(E.parse(str(p/'trace-v1/color-raw.svg')).findall('.//{*}path')):
 c=re.search('fill:([^;]+)',q.get('style')).group(1);v=rgb(c);col=min(palette,key=lambda k:sum((a-b)**2 for a,b in zip(v,rgb(k))))
 q=copy.deepcopy(q);q.set('id',f'color{i}');q.set('style',f'fill:{col};fill-rule:nonzero;stroke:none');r.append(q);E.SubElement(r,n+'path',id=f'mask{i}',d=mask);actions+=['select-clear',f'select-by-id:color{i},mask{i}','path-intersection'];maps.append([c,col])
E.ElementTree(r).write(str(p/'colors-input.svg'));run(p/'colors-input.svg',actions,p/'body-intersected.svg')
paths=E.parse(str(p/'body-intersected.svg')).findall('.//{*}path');body=root('0 710 2172 2990',2172,2990);g=E.SubElement(body,n+'g',id='deep-foundation',transform=f'matrix({s} 0 0 {s} {tx} {ty})')
for i,q in enumerate(paths):
 id=q.get('id');idx=int(id.replace('color',''));q.set('style',f'fill:{maps[idx][1]};fill-rule:nonzero;stroke:none');g.append(copy.deepcopy(q))
E.ElementTree(body).write(str(p/'foundation-native.svg'))
original=E.parse(str(src));whole=root('0 0 2172 3700',2172,3700);whole.append(copy.deepcopy(g));whole.extend(copy.deepcopy(e)for e in original.getroot());E.ElementTree(whole).write(str(p/'composed-native.svg'))
def render(tree,stem,vb,w,h):
 r=copy.deepcopy(tree);r.set('viewBox',vb);r.set('width',str(w));r.set('height',str(h));f=p/(stem+'.svg');E.ElementTree(r).write(str(f));subprocess.run(['inkscape',str(f),'--export-filename='+str(p/(stem+'.png'))],env=env,capture_output=True,check=True)
render(whole,'whole-review','-80 0 2332 3700',700,1110)
render(whole,'contact-review','0 570 2172 510',2172,510)
base=root('0 570 2172 510',2172,510);base.extend(copy.deepcopy(e)for e in original.getroot());render(base,'original-contact','0 570 2172 510',2172,510)
ss=.17575560610984725;vw=390/ss;top=3320.9634338017754-844/ss;render(whole,'mobile-predicted',f'{1086-vw/2} {top} {vw} {844/ss}',390,844)
a=np.array(Image.open(p/'contact-review.png').convert('RGBA'));b=np.array(Image.open(p/'original-contact.png').convert('RGBA'));protected=abs(a[:140].astype(int)-b[:140].astype(int));
r={'newArtSource':'built-in image_gen portrait then actual Inkscape12-scan native trace','uniformRawToSource':[s,0,0,s,tx,ty],'bounds':[0,710,2172,2990],'sourceSHA256':hashlib.sha256(src.read_bytes()).hexdigest(),'imagesInFinalSVG':len(whole.findall('.//{*}image')),'nativePaths':len(paths),'segments':sum(len(parse_path(q.get('d')))for q in paths),'paletteMap':maps,'protectedSourceY570Through709MaxRGBADifference':int(protected.max()),'protectedChangedPixels':int((protected.max(2)>0).sum()),'productionChanged':False,'status':'visual review pending; not imported or adopted'};(p/'report.json').write_text(json.dumps(r,indent=2));print(r)
