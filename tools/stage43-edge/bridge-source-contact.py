"""Native source-stack bridge above the cropped seam; isolated review only.
Unlike the rejected y706-anchored extrusion, deformation begins within the
actual face at y650, so paint and alpha ends receive nearly identical offsets.
No architecture or source file is modified. New copy is limited to pure rock.
"""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Line,CubicBezier,QuadraticBezier
import numpy as np,math,copy,subprocess,os,json,sys
root=Path(__file__).resolve().parents[2];out=Path(sys.argv[1]);base=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True);ns='{http://www.w3.org/2000/svg}'
knots=np.array([[1905.6,0],[1934,12],[1980,25],[1996,8],[2013,20],[2051,14],[2075,24],[2115,28],[2159,8],[2171,0]])
def warp(z):
 if z.imag<=650 or not 1905.6<z.real<2171:return z
 t=min(1,max(0,(z.imag-650)/56));t=t*t*(3-2*t)
 return complex(z.real,z.imag+float(np.interp(z.real,knots[:,0],knots[:,1]))*t)
def fmt(z):
 z=warp(z);return f'{z.real:.5f},{z.imag:.5f}'
def mapped(d):
 result=[]
 for sub in parse_path(d).continuous_subpaths():
  result.append('M'+fmt(sub[0].start))
  for seg in sub:
   bbox=seg.bbox();n=1 if bbox[3]<=650 or bbox[1]<=1905.6 or bbox[0]>=2171 else max(1,math.ceil(seg.length()/3))
   for i in range(n):
    q=seg.cropped(i/n,(i+1)/n)
    if isinstance(q,Line):result.append('L'+fmt(q.end))
    elif isinstance(q,CubicBezier):result.append('C'+' '.join(fmt(z) for z in [q.control1,q.control2,q.end]))
    elif isinstance(q,QuadraticBezier):result.append('Q'+' '.join(fmt(z) for z in [q.control,q.end]))
    else:
     for c in q.as_cubic_curves():result.append('C'+' '.join(fmt(z) for z in [c.control1,c.control2,c.end]))
  if sub.isclosed():result.append('Z')
 return ' '.join(result)
s=E.parse(str(root/'art/stage43-edge/source.svg'));alpha=s.find('.//'+ns+'clipPath[@id="a"]/'+ns+'path').get('d');group=s.find('.//'+ns+'g[@clip-path="url(#a)"]')
r=E.Element(ns+'svg',nsmap={None:ns[1:-1]},viewBox='1700 480 480 650',width='960',height='1300');acts=[]
for i,p in enumerate(group.findall(ns+'path')):
 E.SubElement(r,ns+'path',id=f'paint{i}',d=mapped(p.get('d')),style='fill:'+p.get('fill')+';stroke:none')
 E.SubElement(r,ns+'path',id=f'alpha{i}',d=mapped(alpha),style='fill:#000000')
 E.SubElement(r,ns+'path',id=f'crop{i}',d=mapped('M1905.6 650H2171V706.2H1905.6Z'),style='fill:#000000')
 acts+=['select-clear',f'select-by-id:paint{i},alpha{i}','path-intersection','select-clear',f'select-by-id:paint{i},crop{i}','path-intersection']
f=out/'input.svg';E.ElementTree(r).write(str(f));acts+=['select-clear','export-plain-svg',f'export-filename:{out/"bridge.svg"}','export-do'];env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(out/'profile')};p=subprocess.run(['/usr/bin/inkscape',str(f),'--batch-process','--actions='+';'.join(acts)],env=env,capture_output=True,text=True);(out/'boolean.log').write_text(p.stdout+p.stderr);p.check_returncode()
t=E.parse(str(base));
for p in E.parse(str(out/'bridge.svg')).getroot():
 if p.tag==ns+'path':t.getroot().append(copy.deepcopy(p))
f=out/'composite.svg';t.write(str(f));p=subprocess.run(['/usr/bin/inkscape',str(f),'--export-type=png',f'--export-filename={out/"composite.png"}'],env=env,capture_output=True,text=True);p.check_returncode();(out/'report.json').write_text(json.dumps({'originalFileChanged':False,'protected':'x<=1905.6 or y<=650; masonry, moss and all walking surfaces','anchorY':650,'fullOffsetY':706,'profile':knots.tolist(),'scope':'isolated native bridge on source-referenced lower rock, not release'},indent=2))
