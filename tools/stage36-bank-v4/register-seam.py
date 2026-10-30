"""Source-derived inner-face registration. Not automatic simplification.
Outer contour stays unchanged. Native broad face boundaries meet at the join;
small source holes crossing the crop seam are repositioned intact into their own
region. No texture is invented or discarded; editable raw remains unchanged.
"""
import json,sys,os,subprocess,xml.etree.ElementTree as E
from pathlib import Path
from svgpathtools import parse_path,Path as SvgPath,Line,CubicBezier,QuadraticBezier
sys.path.insert(0,'tools/vector-production');from bounded_flatten import flatten
D=Path('art/stage36-bank-silhouette-v4');sx=4800/1774;join=3600;span=650;data={}
def paths(o):
 if isinstance(o,dict):
  if o.get('tag')=='path':yield o
  for v in o.values():
   if isinstance(v,(dict,list)):yield from paths(v)
 elif isinstance(o,list):
  for v in o:yield from paths(v)
def largest(d):return max(parse_path(d).continuous_subpaths(),key=lambda q:abs(q.area()) if q.isclosed() else 0)
def y_at(d,x):
 p=parse_path(flatten(largest(d).d(),.1));return min(s.start.imag+(s.end.imag-s.start.imag)*(x-s.start.real)/(s.end.real-s.start.real)for s in p if abs(s.end.real-s.start.real)>1e-8 and min(s.start.real,s.end.real)<=x<=max(s.start.real,s.end.real))
for side,origin in [('west',-800),('east',3200)]:
 a=json.load(open(D/f'play-{side}-source-asset.json'));ps=list(paths(a['vector']['root']));x=(join-origin)/sx;top=y_at(ps[0]['d'],x);depths=[(y_at(q['d'],x)-top)*sx for q in ps];data[side]=(a,ps,origin,depths)
target=[sum(v[3][i] for v in data.values())/2 for i in range(5)];report={'operation':'native inner-face seam registration, not simplification','joinWorld':join,'transitionWorld':span,'targetLayerDepthsWorld':target,'outerContourUnchanged':True,'sides':{}}
for side,(a,ps,origin,depths)in data.items():
 fixes=[];offsets=[]
 for i,q in enumerate(ps):
  if i==0:continue
  delta=(target[i]-depths[i])/sx;offsets.append(delta*sx);newpaths=[];subs=parse_path(q['d']).continuous_subpaths();main=largest(q['d'])
  for sub in subs:
   bx=sub.bbox();joinX=(join-origin)/sx;dx=0
   if sub.d()!=main.d() and bx[0]<joinX<bx[1]:
    dx=joinX-bx[1]-15 if side=='west' else joinX-bx[0]+15;fixes.append({'layer':i,'sourceBounds':list(map(float,bx)),'translateXSource':dx,'reason':'retain intact native highlight/hole instead of cropping it at seam'})
   def pt(z):
    world=origin+z.real*sx;t=max(0,min(1,1-abs(world-join)/span));w=t*t*(3-2*t);return complex(z.real+dx,z.imag+delta*w)
   seg=[]
   for v in sub:
    if isinstance(v,Line):seg.append(Line(pt(v.start),pt(v.end)))
    elif isinstance(v,CubicBezier):seg.append(CubicBezier(pt(v.start),pt(v.control1),pt(v.control2),pt(v.end)))
    elif isinstance(v,QuadraticBezier):seg.append(QuadraticBezier(pt(v.start),pt(v.control),pt(v.end)))
    else:raise ValueError(type(v))
   newpaths.append(SvgPath(*seg).d())
  q['d']=' '.join(newpaths)
 for q,c in zip(ps,['#748998','#546f82','#4b667a','#30495b','#233b4d']):q['fill']=c
 root=E.parse(D/f'play-{side}-master.svg').getroot();native=[e for e in root.iter()if e.tag.endswith('}path')]
 for e,q in zip(native,ps):e.set('d',q['d']);e.set('style','fill:'+q['fill'])
 inp=D/f'play-{side}-registered-input.svg';svg=D/f'play-{side}-registered.svg';E.ElementTree(root).write(inp)
 subprocess.run(['inkscape',str(inp),'--export-plain-svg','--export-type=svg',f'--export-filename={svg}'],env={**os.environ,'INKSCAPE_PROFILE_DIR':'/tmp/honro36register','XDG_CACHE_HOME':'/tmp/honro36registercache'},check=True)
 a['params']['seamRegistration']={'joinWorld':join,'transitionWorld':span,'innerLayerOffsetsWorld':offsets,'outerContourUnchanged':True};(D/f'play-{side}-registered-asset.json').write_text(json.dumps(a,separators=(',',':')));report['sides'][side]={'sourceLayerDepthsWorld':depths,'innerLayerOffsetsWorld':offsets,'intactDetailReposition':fixes,'sourceOuterUnchanged':ps[0]['d']==list(paths(json.load(open(D/f'play-{side}-source-asset.json'))['vector']['root']))[0]['d']}
(D/'seam-registration.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
