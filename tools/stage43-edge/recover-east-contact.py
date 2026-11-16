"""Bounded native contact study from a source-referenced outpaint. Not release art."""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path, Path as SVGPath, Line, CubicBezier, QuadraticBezier
import numpy as np, math
import subprocess,os,json,copy,sys
root=Path(__file__).resolve().parents[2];raw=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True);ns='{http://www.w3.org/2000/svg}'
palette={'#fefefe':'#939ba7','#868e9b':'#939ba7','#798393':'#778394','#677285':'#687588','#8b8e44':'#8c9242','#556275':'#4f5d71','#505e71':'#4f5d71','#495669':'#4f5d71','#575b33':'#545c30','#374558':'#37475c','#253445':'#25364a','#182433':'#162332'}
knots=np.array([[1905.6,1905.6],[1926,1928],[1931,1930],[1950,1934],[1977.5,1980],[1991,1996],[2019,2013],[2043,2050.5],[2062,2057],[2151.5,2159],[2158.5,2164],[2175,2175]])
def warp(z):
 if len(sys.argv)<4 or z.imag>=766:return z
 t=max(0,min(1,(z.imag-706)/60));strength=1-t*t*(3-2*t)
 return complex(z.real+(float(np.interp(z.real,knots[:,0],knots[:,1]))-z.real)*strength,z.imag)
def register(d):
 p=parse_path(d).scaled(472/1073).translated(1700+480j);commands=[]
 def point(z):
  v=warp(z);return f'{v.real:.6f},{v.imag:.6f}'
 for sub in p.continuous_subpaths():
  commands.append('M'+point(sub[0].start))
  for seg in sub:
   n=1 if seg.bbox()[2]>=766 else max(1,math.ceil(seg.length()/3))
   for i in range(n):
    q=seg.cropped(i/n,(i+1)/n)
    if isinstance(q,Line):commands.append('L'+point(q.end))
    elif isinstance(q,CubicBezier):commands.append('C'+' '.join(point(z) for z in [q.control1,q.control2,q.end]))
    elif isinstance(q,QuadraticBezier):commands.append('Q'+' '.join(point(z) for z in [q.control,q.end]))
    else:raise ValueError(type(q))
  if sub.isclosed():commands.append('Z')
 return ' '.join(commands)
k=472/1073;mask='M1905.6 706H2175V1130H1905.6Z'
for kind in ['color','alpha']:
 t=E.parse(str(raw/f'{kind}-raw.svg'));r=t.getroot();r.set('viewBox','1700 480 480 650');r.set('width','960');r.set('height','1300');acts=[]
 for i,p in enumerate(t.findall('.//'+ns+'path')):
  
  if kind=='color':
   for before,after in palette.items():
    p.set('style',p.get('style','').replace(before,after))
  p.set('d',register(p.get('d')));p.attrib.pop('transform',None);p.set('id',f'face-{i}')
  mid=f'mask-{i}';E.SubElement(p.getparent(),ns+'path',id=mid,d=mask,style='fill:#000000');acts+=['select-clear',f'select-by-id:face-{i},{mid}','path-intersection']
 f=out/f'{kind}-input.svg';dest=out/f'{kind}-raw.svg';t.write(str(f));acts+=['select-clear','export-plain-svg',f'export-filename:{dest}','export-do'];z=subprocess.run(['/usr/bin/inkscape',str(f),'--batch-process','--actions='+';'.join(acts)],capture_output=True,text=True,env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(out/'profile')});(out/f'{kind}.log').write_text(z.stdout+'\n'+z.stderr);z.check_returncode()
# Native composite: no source geometry is changed. Colored extension is independently clipped.
src=E.parse(str(root/'art/stage43-edge/source.svg'));r=src.getroot();r.set('viewBox','1700 480 480 650');r.set('width','960');r.set('height','1300');defs=E.SubElement(r,ns+'defs');clip=E.SubElement(defs,ns+'clipPath',id='new-contact-alpha')
for p in E.parse(str(out/'alpha-raw.svg')).findall('.//'+ns+'path'):clip.append(copy.deepcopy(p))
g=E.SubElement(r,ns+'g',{'clip-path':'url(#new-contact-alpha)'})
for p in E.parse(str(out/'color-raw.svg')).findall('.//'+ns+'path'):g.append(copy.deepcopy(p))
f=out/'source-plus-contact.svg';src.write(str(f));z=subprocess.run(['/usr/bin/inkscape',str(f),'--export-type=png',f'--export-filename={out/"source-plus-contact.png"}'],capture_output=True,text=True,env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'});z.check_returncode()
(out/'config.json').write_text(json.dumps({'id':'act5:stage43:east-contact-study','semanticLayer':'BODY','bounds':{'x':1905.6,'y':706,'w':269.4,'h':424},'anchor':{'x':0,'y':0},'foot':{'x':1905.6,'y':1130},'preserveCompounds':True},indent=2))
(out/'report.json').write_text(json.dumps({'sourceImageFrame':[1700,480,472,244],'generatedSize':[1073,1466],'uniformScale':k,'newArtOnlyRegistration':knots.tolist() if len(sys.argv)>3 else None,'registrationFadeY':[706,766],'palette':palette,'clip':mask,'sourceGeometryChanged':False,'scope':'isolated native SVG art study, not game or approval'},indent=2))
