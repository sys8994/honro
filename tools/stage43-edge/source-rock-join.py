"""Native source-rock seam: smoothly extend only non-walkable outer faces.
Reference: source.svg; inner edge/top/bottom coordinates stay identical.
"""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Path as P,Line,CubicBezier,QuadraticBezier
import os,sys,math,subprocess,json,copy
root=Path(__file__).resolve().parents[2];out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True);ns='{http://www.w3.org/2000/svg}'
src=E.parse(str(root/'art/stage43-edge/source.svg'));alpha=src.find('.//'+ns+'clipPath').find(ns+'path').get('d');mask='M-100 220H90V660H-100ZM2140 450H2300V660H2140Z'
paths=[p for p in src.findall('.//'+ns+'path') if any(a.get('clip-path')=='url(#a)' for a in p.iterancestors())]
shadow=next(p.get('d') for p in paths if p.get('fill')=='#162332')
for kind in ['color','alpha']:
 r=E.Element(ns+'svg',nsmap={None:ns[1:-1]},viewBox='-200 0 2572 724',width='2572',height='724');acts=[]
 for i,p in enumerate(paths if kind=='color' else [E.Element(ns+'path',d=alpha,fill='#000000')]):
  p=copy.deepcopy(p);p.set('style','fill:'+p.get('fill','#000000')+';stroke:none');p.set('id',f'p{i}');r.append(p);aid=f'a{i}';mid=f'm{i}';E.SubElement(r,ns+'path',id=aid,d=alpha,fill='#000');E.SubElement(r,ns+'path',id=mid,d=mask,fill='#000');acts+=['select-clear',f'select-by-id:p{i},{aid}','path-intersection','select-clear',f'select-by-id:p{i},{mid}','path-intersection']
 for i in range(len(paths) if kind=='color' else 1):
  ci=f'cut{i}';ri=f'outer{i}';E.SubElement(r,ns+'path',id=ci,d=shadow,style='fill:#000');E.SubElement(r,ns+'path',id=ri,d='M-30 320L35 327L20 346L-30 355ZM-30 485L33 499L18 519L-30 525ZM2153 515L2200 505V540L2157 545ZM2155 590L2200 580V618L2158 620Z',style='fill:#000');acts+=['select-clear',f'select-by-id:{ci},{ri}','path-intersection','select-clear',f'select-by-id:p{i},{ci}','path-difference']
 f=out/f'{kind}-input.svg';dest=out/f'{kind}-clip.svg';E.ElementTree(r).write(str(f));acts+=['select-clear','export-plain-svg',f'export-filename:{dest}','export-do'];z=subprocess.run(['/usr/bin/inkscape',str(f),'--batch-process','--actions='+';'.join(acts)],capture_output=True,text=True,env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(out/'profile')});(out/f'{kind}.log').write_text(z.stdout+z.stderr);z.check_returncode()
 def f(z):
  x,y=z.real,z.imag
  if x<90 and 240<=y<=650:x=x-min(65,(90-x)*.85)*math.sin(math.pi*(y-240)/410)**2
  if x>2140 and 480<=y<=650:x=x+min(30,(x-2140)*1.4)*math.sin(math.pi*(y-480)/170)**2
  return complex(x,y)
 t=E.parse(str(dest))
 for p in t.findall('.//'+ns+'path'):
  chunks=[]
  for sub in parse_path(p.get('d')).continuous_subpaths():
   if not sub:continue
   start=f(sub[0].start);commands=[f'M{start.real},{start.imag}']
   for seg in sub:
    count=max(1,math.ceil(seg.length()/2))
    for j in range(1,count+1):
     point=seg.end if j==count else seg.point(j/count)
     z=f(point);commands.append(f'L{z.real},{z.imag}')
   if sub.isclosed():commands.append('Z')
   chunks.append(' '.join(commands))
  p.set('d',' '.join(chunks))
 t.write(str(out/f'{kind}-joined.svg'))
c={'id':'act5:stage43:source-rock-join','semanticLayer':'BODY','bounds':{'x':-200,'y':0,'w':2572,'h':724},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':724},'preserveCompounds':True};(out/'config.json').write_text(json.dumps(c,indent=2))
