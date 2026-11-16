"""Extract complete visible geological color planes from native Inkscape tracing.
No broad masking band: each accepted plane retains its traced silhouette.
"""
from lxml import etree as E
from svgpathtools import parse_path
from pathlib import Path
import copy,sys,subprocess,os,json
out=Path(sys.argv[1]);side=sys.argv[2];ns='{http://www.w3.org/2000/svg}';src=E.parse(str(out/'registered.svg'));paths=[p for p in src.findall('.//'+ns+'path') if not (p.get('id')or'').startswith('mask')];env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(out/'face-profile')};result=E.Element(ns+'svg',nsmap={None:ns[1:-1]},viewBox=src.getroot().get('viewBox'));selected=[]
for i,p in enumerate(paths[:-1]):
 r=E.Element(ns+'svg',nsmap={None:ns[1:-1]},viewBox=src.getroot().get('viewBox'));base=copy.deepcopy(p);base.set('id','face');r.append(base);ids=[]
 for j,over in enumerate(paths[i+1:]):
  over=copy.deepcopy(over);over.set('id',f'over{j}');r.append(over);ids.append(f'over{j}')
 acts=['select-clear','select-by-id:'+','.join(ids),'path-union','select-clear','select-by-id:face,over0','path-difference','select-clear','export-plain-svg',f'export-filename:{out}/visible-{i}.svg','export-do'];f=out/f'visible-input-{i}.svg';E.ElementTree(r).write(str(f));z=subprocess.run(['/usr/bin/inkscape',str(f),'--batch-process','--actions='+';'.join(acts)],capture_output=True,text=True,env=env);z.check_returncode();t=E.parse(str(out/f'visible-{i}.svg'))
 node=t.find('.//'+ns+'path');chunks=[]
 for sub in parse_path(node.get('d')).continuous_subpaths():
  if not sub.isclosed():continue
  x0,x1,y0,y1=sub.bbox();area=abs(sub.area())
  if side=='west':ok=x0>=-330 and x1<=95 and y0>=300 and y1<=655 and x0<30 and x1>-30
  else:ok=x0>=2130 and x1<=2450 and y0>=480 and y1<=680 and x0<2200 and x1>2150
  if ok and area>15:
   chunks.append(sub.d()+' Z');selected.append({'color':i,'bbox':[x0,x1,y0,y1],'area':area})
 if chunks:E.SubElement(result,ns+'path',d=' '.join(chunks),style=p.get('style'))
E.ElementTree(result).write(str(out/'faces.svg'));a=copy.deepcopy(result)
for p in a.findall('.//'+ns+'path'):p.set('style','fill:#000')
E.ElementTree(a).write(str(out/'faces-alpha.svg'));(out/'faces-report.json').write_text(json.dumps(selected,indent=2));print('faces',len(selected))
