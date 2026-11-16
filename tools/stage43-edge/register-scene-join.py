"""Register generated Scene joining study, retain only nonwalkable geology."""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Line,CubicBezier,QuadraticBezier
import subprocess,os,sys,json
out=Path(sys.argv[1]);side=sys.argv[2] if len(sys.argv)>2 else 'west';ns='{http://www.w3.org/2000/svg}'
# Exact diagnostic camera and source artwork registration. Raster study is 1586x992.
scale=6656/2172*.45
origin=652.5 if side=='west' else -2207.7
f=lambda z:complex((z.real*1440/1586-origin)/scale,(z.imag*900/992+246.33)/scale)
mask='M-245 505L-205 470L-160 445L-205 430L-190 409L-115 389L-80 350L-10 325L30 350L70 385L88 440L88 520L75 600L55 650L-40 655L-78 620L-145 601L-100 574L-190 575L-220 550L-170 525Z'
if side=='east':mask='M2140 480L2190 500L2260 490L2330 510L2290 540L2380 565L2325 600L2280 625L2300 670L2190 680L2135 650L2125 610L2160 580L2138 560L2138 540L2165 510Z'
colors={'#565965':'#838da0','#484c56':'#687489','#3d424d':'#4d5b71','#343843':'#35455b','#262a33':'#25364b','#25262a':'#25364b','#1d2027':'#15263a','#181d24':'#15263a'}
t=E.parse(str(out/'color-raw.svg'));r=t.getroot();r.set('viewBox',('-300 0 600 724' if side=='west' else '2100 0 400 724'));r.set('width','600');r.set('height','724');acts=[]
for i,p in enumerate(t.findall('.//'+ns+'path')):
 chunks=[]
 for sub in parse_path(p.get('d')).continuous_subpaths():
  a=f(sub[0].start);cmd=[f'M{a.real},{a.imag}']
  for seg in sub:
   v=f(seg.end)
   if isinstance(seg,Line):cmd.append(f'L{v.real},{v.imag}')
   elif isinstance(seg,CubicBezier):
    a,b=f(seg.control1),f(seg.control2);cmd.append(f'C{a.real},{a.imag} {b.real},{b.imag} {v.real},{v.imag}')
   elif isinstance(seg,QuadraticBezier):
    a=f(seg.control);cmd.append(f'Q{a.real},{a.imag} {v.real},{v.imag}')
   else:raise ValueError(type(seg))
  if sub.isclosed():cmd.append('Z')
  chunks.append(' '.join(cmd))
 p.set('d',' '.join(chunks));fill=p.get('style').split('fill:')[1].split(';')[0];palette=['#838da0','#687489','#4d5b71','#35455b','#25364b','#25364b','#15263a','#15263a'];p.set('style','fill:'+(colors[fill] if side=='west' else palette[i])+';stroke:none');mid=f'mask{i}';E.SubElement(p.getparent(),ns+'path',id=mid,d=mask,style='fill:#000');acts+=['select-clear',f'select-by-id:{p.get("id")},{mid}','path-intersection']
src=out/'registered.svg';dest=out/'clipped.svg';t.write(str(src));acts+=['select-clear','export-plain-svg',f'export-filename:{dest}','export-do'];z=subprocess.run(['/usr/bin/inkscape',str(src),'--batch-process','--actions='+';'.join(acts)],capture_output=True,text=True,env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(out/'profile')});(out/'boolean.log').write_text(z.stdout+z.stderr);z.check_returncode()
a=E.Element(ns+'svg',nsmap={None:ns[1:-1]},viewBox=('-300 0 600 724' if side=='west' else '2100 0 400 724'),width=('600' if side=='west' else '400'),height='724');E.SubElement(a,ns+'path',d=mask,fill='#000');E.ElementTree(a).write(str(out/'alpha-join.svg'))
(out/'config.json').write_text(json.dumps({'id':'act5:stage43:'+side+'-geology-join','semanticLayer':'BODY','bounds':{'x':(-300 if side=='west' else 2100),'y':0,'w':(600 if side=='west' else 400),'h':724},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':724},'preserveCompounds':True},indent=2))
