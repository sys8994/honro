"""Native bounded grid partition of large compounds, without raising budgets."""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path
import copy,os,subprocess,sys,json
out=Path(sys.argv[1]);t=E.parse(str(out/'color-opt.svg'));ns='{http://www.w3.org/2000/svg}';acts=[];changed=0
for i,p in enumerate(list(t.findall('.//'+ns+'path'))):
 if len(p.get('d',''))<=100000:continue
 x0,x1,y0,y1=parse_path(p.get('d')).bbox();parent=p.getparent();at=parent.index(p);parent.remove(p);changed+=1
 for col in range(4):
  for row in range(4):
   loX=max(x0,x0+(x1-x0)*col/4-1);hiX=min(x1,x0+(x1-x0)*(col+1)/4+1);loY=max(y0,y0+(y1-y0)*row/4-1);hiY=min(y1,y0+(y1-y0)*(row+1)/4+1);a=copy.deepcopy(p);ident=f'grid-{i}-{col}-{row}';a.set('id',ident);atPart=at+(col*4+row)*2;parent.insert(atPart,a);m=E.Element(ns+'path',id=ident+'-mask',d=f'M{loX} {loY}H{hiX}V{hiY}H{loX}Z',style='fill:#000');parent.insert(atPart+1,m);acts+=['select-clear',f'select-by-id:{ident},{ident}-mask','path-intersection']
src=out/'grid-input.svg';dest=out/'color-partitioned.svg';t.write(str(src));acts+=['select-clear','export-plain-svg',f'export-filename:{dest}','export-do'];r=subprocess.run(['/usr/bin/inkscape',str(src),'--batch-process','--actions='+';'.join(acts)],capture_output=True,text=True,env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(out/'grid-profile')});(out/'grid.log').write_text(r.stdout+r.stderr);r.check_returncode();q=E.parse(str(dest));lengths=[len(p.get('d','')) for p in q.findall('.//'+ns+'path')];report={'partitionedPaths':changed,'paths':len(lengths),'maxCharacters':max(lengths),'scope':'native intersections, same shapes and painter order; 1 unit overlap between identical fills'};(out/'grid-report.json').write_text(json.dumps(report,indent=2));print(report)
