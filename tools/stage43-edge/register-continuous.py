"""Register concept landmarks and extract only non-gameplay continuous geology."""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Path as SVGPath,Line,CubicBezier,QuadraticBezier
import os,sys,json,subprocess,numpy as np
root=Path(__file__).resolve().parents[2];out=Path(sys.argv[1]);ns='{http://www.w3.org/2000/svg}'
# Source architecture is never transformed. Only generated exterior BODY.
xx=[0,280,950,1254];yy=[-1600,0,2172,3772]
def interp(v,a,b):
 i=max(0,min(len(a)-2,int(np.searchsorted(a,v))-1));return b[i]+(v-a[i])*(b[i+1]-b[i])/(a[i+1]-a[i])
def f(z):return complex(interp(z.real,xx,yy),interp(z.imag,[0,210,400,1254],[0,709,1400,6000]))
def mapped(d):
 r=[]
 for s in parse_path(d):
  if isinstance(s,Line):r.append(Line(f(s.start),f(s.end)))
  elif isinstance(s,CubicBezier):r.append(CubicBezier(f(s.start),f(s.control1),f(s.control2),f(s.end)))
  elif isinstance(s,QuadraticBezier):r.append(QuadraticBezier(f(s.start),f(s.control),f(s.end)))
  else:raise ValueError(type(s))
 return SVGPath(*r).d()
for kind in ['color','alpha']:
 t=E.parse(str(out/f'{kind}-raw.svg'));t.getroot().set('viewBox','-1600 0 5372 6000');t.getroot().set('width','5372');t.getroot().set('height','6000');acts=[]
 for i,p in enumerate(t.findall('.//'+ns+'path')):
  p.set('d',mapped(p.get('d')));mid=f'exterior-{i}';E.SubElement(p.getparent(),ns+'path',id=mid,d='M-1600 -100H0V450H70V700H2100V450H2172V-100H3772V6000H-1600Z',style='fill:#000000');acts+=['select-clear',f'select-by-id:{p.get("id")},{mid}','path-intersection']
 src=out/f'{kind}-registered-input.svg';dest=out/f'{kind}-exterior.svg';t.write(str(src));acts+=['select-clear','export-plain-svg',f'export-filename:{dest}','export-do'];p=subprocess.run(['/usr/bin/inkscape',str(src),'--batch-process','--actions='+';'.join(acts)],capture_output=True,text=True,env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(out/'profile')});(out/f'{kind}-boolean.log').write_text(p.stdout+p.stderr);p.check_returncode()
c={'id':'act5:stage43:foundation','semanticLayer':'BODY','bounds':{'x':-1600,'y':0,'w':5372,'h':6000},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':6000},'preserveCompounds':True};(root/'art/stage43-edge/continuous-config.json').write_text(json.dumps(c,indent=2))

# Drop detached generated silhouette debris; preserve the main continuous bedrock.
a=out/'alpha-exterior.svg';t=E.parse(str(a));node=t.find('.//'+ns+'path');parts=parse_path(node.get('d')).continuous_subpaths();main=max(parts,key=lambda p:(p.bbox()[1]-p.bbox()[0])*(p.bbox()[3]-p.bbox()[2]));node.set('d',main.d());t.write(str(a))
