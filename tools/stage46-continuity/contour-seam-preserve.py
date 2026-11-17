"""Native diagnostic source-color registration mask. No hand-authored art paths.
Compress copies of canonical silhouette toward its closed frame; use the actual
curved edge instead of a rectangular cut. Original contacts/props win. No runtime
or source mutation; this is an artwork mask, not collision or new geometry.
"""
from pathlib import Path
from lxml import etree as E
import os,json,subprocess,hashlib,numpy as np
from svgpathtools import parse_path
from svgpathtools.parser import parse_transform
from svgpathtools.path import transform
R=Path(__file__).resolve().parents[2];O=R/'_local/stage46/contour-seam-preserve';O.mkdir(exist_ok=True)
S='http://www.w3.org/2000/svg';v=json.loads((R/'_local/stage46/source.json').read_text())['vector'];protect=json.loads((R/'_local/stage46/contact-only/protected-contact-only.json').read_text());env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'}
def native(name,items,acts):
 r=E.Element('svg',xmlns=S,viewBox='0 0 1024 1536')
 for i,d,t in items:
  q=E.SubElement(r,'path',id=i,d=d,fill='white',**{'fill-rule':'nonzero'})
  if t:q.set('transform',t)
 p=O/(name+'-input.svg');out=O/(name+'.svg');E.ElementTree(r).write(str(p));z=subprocess.run(['/usr/bin/inkscape',str(p),'--batch-process','--actions='+acts+f';select-clear;export-plain-svg;export-filename:{out};export-do'],env=env,capture_output=True,text=True);z.check_returncode();
 result=[]
 for el in E.parse(str(out)).findall('.//{*}path'):
  matrix=np.eye(3)
  for node in reversed([el,*el.iterancestors()]):
   if node.get('transform'):matrix=matrix@parse_transform(node.get('transform'))
  result.append(transform(parse_path(el.get('d')),matrix).d())
 return result
final={}
for k in 'ab':
 assert len(v['clips'][k])==1
 d=v['clips'][k][0];side='matrix(.18,0,0,1,0,0)'if k=='a'else'matrix(.18,0,0,1,839.68,0)'
 strips=native(k+'-strips',[('side',d,side),('bottom',d,'matrix(1,0,0,.03,0,1489.92)')],'select-all;path-union')
 assert len(strips)==1
 keep=native(k+'-keep',[('source',d,None),('strip',strips[0],None)],'select-by-id:source,strip;path-difference')
 merged=native(k+'-restore',[(f'base{i}',x,None)for i,x in enumerate(keep)]+[(f'protected{i}',x,None)for i,x in enumerate(protect[k])],'select-all;path-union');assert len(merged)==1
 final[k]=native(k+'-final',[('kept',merged[0],None),('source',d,None)],'select-by-id:kept,source;path-intersection')
 assert len(final[k])==1
 queue=final[k][:];parts=[];serial=0
 while queue:
  curve=queue.pop(0)
  if len(curve)<60000:parts.append(curve);continue
  x0,x1,y0,y1=parse_path(curve).bbox();horizontal=(y1-y0)>=(x1-x0)
  boxes=([(x0-1,y0-1,x1+1,(y0+y1)/2),(x0-1,(y0+y1)/2,x1+1,y1+1)] if horizontal else [(x0-1,y0-1,(x0+x1)/2,y1+1),((x0+x1)/2,y0-1,x1+1,y1+1)])
  for xa,ya,xb,yb in boxes:
   serial+=1;window=f'M{xa} {ya}H{xb}V{yb}H{xa}Z'
   queue.extend(native(k+'-partition-'+str(serial),[('curve',curve,None),('window',window,None)],'select-by-id:curve,window;path-intersection'))
  assert serial<60,'Partition budget exhausted'
 final[k]=parts;assert len(parts)<=32
(O/'protected-clips.json').write_text(json.dumps(final,separators=(',',':'))+'\n')
t=E.parse(str(R/'_local/stage46/source-export/source.svg'))
for cp in t.findall('.//{*}clipPath'):
 k=cp.get('id')
 if k in final:
  for old in list(cp):cp.remove(old)
  for d in final[k]:E.SubElement(cp,'{'+S+'}path',d=d,**{'fill-rule':'nonzero'})
t.write(str(O/'source-protected.svg'))
subprocess.run(['/usr/bin/inkscape',str(O/'source-protected.svg'),'--export-width=1024','--export-background-opacity=0','--export-filename='+str(O/'source-protected.png')],env=env,capture_output=True,check=True)
(O/'report.json').write_text(json.dumps({'mode':'diagnostic source-color mask only','sideScale':.18,'bottomScale':.03,'method':'Actual canonical silhouette transformed and Boolean-subtracted in native Inkscape, contact-only source mask re-unioned, final source intersection','chars':{k:list(map(len,x))for k,x in final.items()},'status':'Pending direct Scene and protection verification; no runtime mutation'},indent=2)+'\n')
