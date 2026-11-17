"""Unsmooth color trace: native spatial parts without changing engine budgets.
The registered parts overlap by1 source unit; a single canonical mask is applied
by the compositor after painting all parts, avoiding partition-alpha seams.
"""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path
from svgpathtools.path import transform
from svgpathtools.parser import parse_transform
import json,shutil,numpy as np,subprocess,os,copy
R=Path(__file__).resolve().parents[2];O=R/'art/stage46-continuity/v6-grid';O.mkdir(exist_ok=True);T=R/'_local/stage46/trace-v6';B=R/'_local/stage46/v6-grid-build';B.mkdir(exist_ok=True)
rec=json.loads((T/'trace.json').read_text());w,h=rec['sourceSize'];M=np.array([[3650/w,0,-1250],[0,3900/h,-100],[0,0,1.]])
t=E.parse(str(T/'color-raw.svg'));root=t.getroot()
for el in t.findall('.//{*}path'):
 a=np.eye(3)
 for node in reversed([el,*el.iterancestors()]):
  if node.get('transform'):a=a@parse_transform(node.get('transform'))
 el.set('d',transform(parse_path(el.get('d')),M@a).d())
for el in root.iter():el.attrib.pop('transform',None)
root.set('viewBox','-1250 -100 3650 3900');root.set('width','3650');root.set('height','3900');t.write(str(B/'color-registered-raw.svg'))
shutil.copy(T/'color-raw.svg',O/'color-native-raw.svg');shutil.copy(T/'trace.json',O/'trace.json');shutil.copy(R/'art/stage46-continuity/v3/alpha-composed-raw.svg',O/'alpha-composed-raw.svg')
(O/'registration.json').write_text(json.dumps({'sourceSize':[w,h],'matrix':M.tolist(),'bounds':[-1250,-100,3650,3900],'alpha':'v3 canonical alpha; apply once after all parts','nativeColumnEdges':[-1250,-600,0,600,1200,1800,2400],'overlapSourceUnits':1},indent=2))
S='{http://www.w3.org/2000/svg}';env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'};edges=[-1250,-600,0,600,1200,1800,2400];paths=[]
for j,(lo,hi)in enumerate(zip(edges,edges[1:])):
 d=O/str(j);d.mkdir(exist_ok=True);q=copy.deepcopy(t);acts=[]
 for i,e in enumerate(list(q.findall('.//{*}path'))):
  parent=e.getparent();parent.remove(e)
  for row,(top,bottom) in enumerate([(-100,1200),(1200,2500),(2500,3800)]):
   color=copy.deepcopy(e);a=f'face-{i}-{row}';color.set('id',a);parent.append(color);mid=f'window-{i}-{row}';x=lo-(1 if j else 0);xx=hi+(1 if j<5 else 0);E.SubElement(parent,S+'path',id=mid,d=f'M{x} {top}H{xx}V{bottom}H{x}Z',style='fill:#000');acts+=['select-clear',f'select-by-id:{a},{mid}','path-intersection']
 inp=B/f'part-{j}-input.svg';out=d/'color-partition-raw.svg';q.write(str(inp))
 p=subprocess.run(['/usr/bin/inkscape',str(inp),'--batch-process','--actions='+';'.join(acts+['select-clear','export-plain-svg',f'export-filename:{out}','export-do'])],env=env,capture_output=True,text=True);(B/f'part-{j}.log').write_text(p.stdout+p.stderr);p.check_returncode()
 p=subprocess.run(['python','tools/terrain-node-optimizer/optimize_svg.py',str(out),str(d/'color-optimized.svg'),'--epsilon','1','--render-widths','1280'],cwd=R,env=env,capture_output=True,text=True);(d/'optimization.log').write_text(p.stdout+p.stderr);p.check_returncode()
 subprocess.run(['python','tools/vector-production/quantize-svg.py',str(d/'color-optimized.svg'),'--output',str(d/'color-final.svg'),'--grid','.01'],cwd=R,check=True,stdout=subprocess.DEVNULL)
 cfg=json.loads((R/'art/stage46-continuity/v3/config.json').read_text());cfg['id']='act5:stage46:exterior-body'if j==0 else f'act5:stage46:exterior-body:{j}';cfg['name']='하늘우물 입구 연속 외벽 '+str(j);(d/'config.json').write_text(json.dumps(cfg))
 target=d/'candidate.json';subprocess.run(['python','tools/vector-production/import-native-clip.py',str(d/'color-final.svg'),str(O/'alpha-composed-raw.svg'),'--config',str(d/'config.json'),'--output',str(target)],cwd=R,check=True)
 a=json.loads(target.read_text());a['params']['silhouetteUnderpaint']=False;fills={}
 def remap(n):
  f=n.get('fill')
  if f:
   fills[f]=fills.get(f,0)+1
   rgb=tuple(int(f[i:i+2],16)for i in(1,3,5))
   if min(rgb)>220:n['fill']='#493353'
  for c in n.get('children',[]):remap(c)
 remap(a['vector']['root']);target.write_text(json.dumps(a,separators=(',',':'))+'\n');paths.append(str(target.relative_to(R)));(d/'palette.json').write_text(json.dumps(fills,indent=2));print('PART',j,'bytes',target.stat().st_size,flush=True)
(O/'parts.json').write_text(json.dumps(paths,indent=2)+'\n')
