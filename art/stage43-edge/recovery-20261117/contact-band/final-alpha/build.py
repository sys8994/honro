from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path
import json,os,subprocess,re
p=Path(__file__).parent;base=p.parent;n='{http://www.w3.org/2000/svg}';env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(p/'profile')}
def operation(paths,op,name):
 r=E.Element(n+'svg',nsmap={None:n[1:-1]},viewBox='0 0 2172 1024')
 for i,d in enumerate(paths):E.SubElement(r,n+'path',id=f'p{i}',d=d)
 f=p/(name+'-input.svg');o=p/(name+'.svg');E.ElementTree(r).write(str(f));subprocess.run(['inkscape',str(f),'--batch-process','--actions='+'select-all;path-'+op+';select-clear;export-plain-svg;export-filename:'+str(o)+';export-do'],env=env,capture_output=True,check=True);q=E.parse(str(o)).findall('.//'+n+'path');assert len(q)==1;return q[0].get('d')
src=E.parse(str(base/'stage43-recovery/art/stage43-edge/source.svg'));original=[src.find('.//'+n+'clipPath[@id="'+i+'"]/'+n+'path').get('d')for i in ['a','b']];deep=parse_path(E.parse(str(base/'stage43-recovery-deep-study/body-alpha.svg')).find('.//'+n+'path').get('d')).scaled(2.3815789473684212).translated(complex(-42.86842105263158,-9.216842105263254));bottom=parse_path(original[0]).continuous_subpaths()[0];tail=bottom[-10:];points=[tail[0].start]+[v.end for v in tail];points=list(reversed(points));bridge='M'+' L'.join(f'{z.real} {z.imag}' for z in points)+f' L{points[-1].real} 710.1 L{points[0].real} 710.1 Z';(p/'actual-bottom-gap-d.txt').write_text(bridge);joined=operation([*original,deep.d(),bridge],'union','alpha-union')
a=json.load(open(base/'stage43-contact-seam-study/asset.json'));parts=re.findall('[Mm][^Mm]*',joined);chunks=[];chunk=''
for v in parts:
 if len(chunk)+len(v)>59000:chunks.append(chunk);chunk=''
 assert len(v)<59000
 chunk+=v
if chunk:chunks.append(chunk)
a['vector']['clips']['source-alpha-or-deep']=chunks;(p/'asset.json').write_text(json.dumps(a,separators=(',',':')));print('chars',len(joined),'parts',len(chunks))
