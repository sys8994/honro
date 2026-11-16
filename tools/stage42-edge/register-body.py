"""Register traced BODY to measured source landmarks; Inkscape extracts BODY only."""
from pathlib import Path as FSPath
from lxml import etree as E
import subprocess,os,json,numpy as np
import math,runpy
edge_depth=runpy.run_path(str(FSPath(__file__).with_name("source-contact.py")))["edge_depth"]
from svgpathtools import parse_path,Path,Line,CubicBezier,QuadraticBezier
root=FSPath(__file__).resolve().parents[2]; out=root/'_local/reports/stage42-registered-trace12'; src=json.load(open(root/'art/stage42-edge/source.json'))
# Image-template measured building correspondences. Exterior extrapolates endpoint slope.
xx=np.array([244,263,700,1027,1501,1658.]); yy=np.array([0,20,510,870,1370,1536.])*2022/1536

def f(z):
 x=z.real;i=max(0,min(len(xx)-2,int(np.searchsorted(xx,x))-1)); X=yy[i]+(x-xx[i])*(yy[i+1]-yy[i])/(xx[i+1]-xx[i]);return complex(X,(z.imag-1)*1.4004)
def mapped(d):
 p=parse_path(d);r=[]
 for s in p:
  if isinstance(s,Line):r.append(Line(f(s.start),f(s.end)))
  elif isinstance(s,CubicBezier):r.append(CubicBezier(f(s.start),f(s.control1),f(s.control2),f(s.end)))
  elif isinstance(s,QuadraticBezier):r.append(QuadraticBezier(f(s.start),f(s.control),f(s.end)))
  else:raise ValueError(type(s))
 return Path(*r).d()
def contact_mask(d):
 p=parse_path(d);segments=[]
 for line in p:
  assert isinstance(line,Line)
  n=max(1,math.ceil(line.length()/5));points=[line.point(i/n) for i in range(n+1)]
  points=[z+edge_depth(z.real)*1j for z in points]
  segments.extend(Line(u,v) for u,v in zip(points,points[1:]))
 return Path(*segments).d()
for kind in ['color','alpha']:
 t=E.parse(str(out/f'{kind}-raw.svg'));t.getroot().set('viewBox','-400 0 2700 1175');t.getroot().set('width','2700');t.getroot().set('height','1175')
 for p in t.findall('.//{*}path'):p.set('d',mapped(p.get('d')))
 t.write(str(out/f'{kind}-registered.svg'),encoding='utf-8',xml_declaration=True)
 if kind=='alpha':continue
 mask=' '.join(contact_mask(d) for d in src['vector']['clips']['a'])+' M-400 414H0V1175H-400Z M2022 294L2031 286L2046 288L2060 290H2300V1175H2022Z M0 740H2022V1175H0Z'
 acts=[]
 for i,p in enumerate(t.findall('.//{*}path')):
  mid=f'body-{i}';E.SubElement(p.getparent(),'{http://www.w3.org/2000/svg}path',id=mid,d=mask,style='fill:#000000');acts+=['select-clear',f'select-by-id:{p.get("id")},{mid}','path-intersection']
 name=out/'body-boolean-input.svg';t.write(str(name),encoding='utf-8',xml_declaration=True)
 acts+=['select-clear','export-plain-svg',f'export-filename:{out/"body-raw.svg"}','export-do']
 p=subprocess.run(['/usr/bin/inkscape',str(name),'--batch-process','--actions='+';'.join(acts)],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'},capture_output=True,text=True);(out/'body-boolean.log').write_text(p.stdout+'\n'+p.stderr);p.check_returncode()
c=json.load(open(root/'art/stage42-edge/registered-config.json'));c['id']='act5:stage42:registered-body';c['bounds']={'x':-400,'y':0,'w':2700,'h':1175};c['foot']['y']=1175;json.dump(c,open(root/'art/stage42-edge/body-config.json','w'))
