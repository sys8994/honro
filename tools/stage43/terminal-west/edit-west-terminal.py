from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Line,CubicBezier,QuadraticBezier
import math,os,subprocess,json,copy
import argparse
ap=argparse.ArgumentParser(description='Stage43 existing west terminal exterior-only merge; no source/deep paint edits')
ap.add_argument('--west-color',type=Path,required=True)
ap.add_argument('--west-alpha',type=Path,required=True)
ap.add_argument('--source',type=Path,required=True)
ap.add_argument('--out',type=Path,required=True)
args=ap.parse_args();p=args.out.resolve();p.mkdir(parents=True,exist_ok=True)
n='{http://www.w3.org/2000/svg}';env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(p/'profile')};end=717.80078
# Hold original inward contact; taper only exterior edge into actual deep top.
import numpy as np
maskpath=parse_path(E.parse(str(args.west_alpha)).find('.//'+n+'path').get('d'))
lines=[]
for seg in maskpath:
 count=max(2,math.ceil(seg.length()/.15));pts=[seg.point(k/count) for k in range(count+1)]
 lines.extend(zip(pts[:-1],pts[1:]))
rows=[]
for yy in np.arange(679.75,710.51,.25):
 xs=[]
 for a,c in lines:
  if (a.imag<=yy<c.imag) or(c.imag<=yy<a.imag):xs.append(a.real+(c.real-a.real)*(yy-a.imag)/(c.imag-a.imag))
 rows.append([yy,min(xs),max(xs)])
rows=np.array(rows)
def warp(z):
 if z.imag<=680:return z
 yy=min(z.imag,710.1);o=float(np.interp(yy,rows[:,0],rows[:,1]));inn=float(np.interp(yy,rows[:,0],rows[:,2]));t=min(1,max(0,(yy-680)/30));u=t*t*(3-2*t);newouter=o+(4.76316-o)*u
 return complex(newouter+(z.real-o)*(inn-newouter)/(inn-o),z.imag)
def fmt(z):
 z=warp(z);return f'{z.real:.6f},{z.imag:.6f}'
def mapped(d):
 out=[]
 for q in parse_path(d).continuous_subpaths():
  out.append('M'+fmt(q[0].start))
  for s in q:
   count=1 if s.bbox()[3]<=680 else max(1,math.ceil(s.length()/1.5))
   for j in range(count):
    v=s.cropped(j/count,(j+1)/count)
    if isinstance(v,Line):out.append('L'+fmt(v.end))
    elif isinstance(v,CubicBezier):out.append('C'+' '.join(fmt(z)for z in [v.control1,v.control2,v.end]))
    elif isinstance(v,QuadraticBezier):out.append('Q'+' '.join(fmt(z)for z in [v.control,v.end]))
    else:raise ValueError(type(v))
  if q.isclosed():out.append('Z')
 return ' '.join(out)
def run(f,acts,out):
 q=subprocess.run(['inkscape',str(f),'--actions='+';'.join(acts+['select-clear','export-plain-svg',f'export-filename:{out}','export-do'])],env=env,capture_output=True,text=True);(p/(out.stem+'.log')).write_text(q.stdout+q.stderr);q.check_returncode()
source=E.parse(str(args.source));orig=source.find('.//'+n+'clipPath[@id="a"]/'+n+'path').get('d')
for name,inp in [('color','exterior-optimized.svg'),('alpha','exterior-mask.svg')]:
 r=E.parse(str((args.west_color if name=='color' else args.west_alpha))).getroot();acts=[]
 for i,q in enumerate(r.findall('.//'+n+'path')):
  q.set('d',mapped(q.get('d')));q.set('id',f'west{i}')
  if q.get('fill') and not q.get('style'):q.set('style','fill:'+q.get('fill')+';stroke:none')
  E.SubElement(r,n+'path',id=f'original{i}',d=orig,style='fill:#000');E.SubElement(r,n+'path',id=f'limit{i}',d='M-200 0H300V710.12H-200Z',style='fill:#000');acts += [f'select-by-id:west{i},original{i}','path-difference','select-clear',f'select-by-id:west{i},limit{i}','path-intersection','select-clear']
 f=p/f'{name}-input.svg';E.ElementTree(r).write(str(f));run(f,acts,p/f'{name}.svg')
(p/'config.json').write_text(json.dumps({'id':'act5:stage43:west-terminal-taper','semanticLayer':'BODY','bounds':{'x':-100,'y':250,'w':200,'h':510},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':710.12},'preserveCompounds':True,'params':{'silhouetteUnderpaint':False}}))
(p/'registration.json').write_text(json.dumps({'unchangedAboveSourceY':680,'oldNativeTipY':end,'newTip':[4.76316,710.12],'basis':'Integration deep actual upper-left x4.7631578947,y710.02; inward boundary preserved, only outer edge converges; overlap ends710.12. Existing tip color/alpha mapped together; then original alpha native difference protects architecture and walking surfaces.','sourceFileChanged':False,'oldWestPreserved':True},indent=2))
