"""Native vector registration: extend broad authored strata beyond allowed camera coverage.
Only the non-playable far margins/deep field are widened; no boundary-pixel sampling.
"""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Path as SvgPath,Line,CubicBezier,QuadraticBezier
import json,re,shutil
R=Path(__file__).resolve().parents[2];o=R/'_local/stage45/deep-final-trace'
def ramp(t):
 t=max(0,min(1,t));return t*t*(3-2*t)
def point(z):
 x,y=z.real,z.imag
 xx=x-120*ramp((322-x)/322)+180*ramp((x-985)/(1254-985))
 yy=y+.3*max(0,y-400)
 # Original walk contact above the retained small root aperture.
 yy-=5*ramp((x-480)/20)*ramp((560-x)/20)*ramp((y-210)/25)*ramp((280-y)/35)
 return complex(xx,yy)
for name in ['native-color','native-alpha']:
 original=o/(name+'-unregistered.svg')
 if not original.exists():original.write_bytes((o/(name+'.svg')).read_bytes())
 t=E.parse(str(original));r=t.getroot();r.set('viewBox','-120 0 1554 1510.2');r.set('width','1554');r.set('height','1510.2')
 for el in t.findall('.//{*}path'):
  chunks=[]
  for p in parse_path(el.get('d')).continuous_subpaths():
   q=[]
   for s in p:
    if not isinstance(s,(Line,CubicBezier,QuadraticBezier)):raise ValueError('Unexpected segment')
    q.append(type(s)(*[point(v)for v in s.bpoints()]))
   chunks.append(SvgPath(*q).d()+('z' if p.isclosed()else''))
  data=' '.join(chunks);data=re.sub(r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?',lambda m:format(float(m[0]),'.3f').rstrip('0').rstrip('.') if '.'in format(float(m[0]),'.3f')else m[0],data);el.set('d',data)
 t.write(str(o/(name+'.svg')))
s=.305*2172/1997;dx=322;dy=60
cfg={'id':'act5:stage45:root-body','name':'서낭고개 연속 거목 심부암반','semanticLayer':'BODY','category':'rock','anchor':{'x':0,'y':0},'foot':{'x':0,'y':788},'bounds':{'x':(-120-dx)/s,'y':-dy/s,'w':1554/s,'h':1510.2/s},'scaleRange':[1,8],'backgroundRange':[1,8],'transform':[1/s,0,0,1/s,-dx/s,-dy/s],'preserveCompounds':True}
(R/'art/stage45-continuity/deep-config.json').write_text(json.dumps(cfg))
