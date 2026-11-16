from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Path as SP,Line,CubicBezier,QuadraticBezier
import numpy as np,json,shutil
R=Path(__file__).resolve().parents[2];o=R/'art/stage46-continuity/v3';o.mkdir(exist_ok=True);t=R/'_local/stage46/trace-v3'
# Registration only: retain traced color faces, map nonplay margins to camera envelope.
X=[0,432,836,1300];U=[-1250,0,1024,2400]
Y=[0,40,615,820,1210];V=[-100,0,1425,1940,3800]
def point(z):
 # Register the original bottom fall gap: source x38..307 at y1536.
 # This is a correspondence warp of traced artwork, not new collision geometry.
 shift=np.interp(z.imag,[615,659,800],[0,1,0])*np.interp(z.real,[447,525,836],[0,70,0])
 return complex(np.interp(z.real,X,U)+shift,np.interp(z.imag,Y,V))
for kind in ['color','alpha']:
 tree=E.parse(str(t/f'{kind}-raw.svg'));r=tree.getroot();r.set('viewBox','-1250 -100 3650 3900');r.set('width','3650');r.set('height','3900')
 for el in tree.findall('.//{*}path'):
  paths=[]
  for p in parse_path(el.get('d')).continuous_subpaths():
   segs=[]
   for s in p:
    assert isinstance(s,(Line,CubicBezier,QuadraticBezier));segs.append(type(s)(*[point(q) for q in s.bpoints()]))
   paths.append(SP(*segs).d()+('z' if p.isclosed() else ''))
  el.set('d',' '.join(paths))
 tree.write(str(o/f'{kind}-registered-raw.svg'))
 shutil.copy(t/f'{kind}-raw.svg',o/f'{kind}-native-raw.svg')
shutil.copy(t/'trace.json',o/'trace.json')
cfg={'id':'act5:stage46:exterior-body','name':'하늘우물 입구 연속 외벽','semanticLayer':'BODY','category':'rock','anchor':{'x':0,'y':0},'foot':{'x':0,'y':1536},'bounds':{'x':-1250,'y':-100,'w':3650,'h':3900},'scaleRange':[1,8],'backgroundRange':[1,8],'preserveCompounds':True}
(o/'config.json').write_text(json.dumps(cfg));(o/'registration.json').write_text(json.dumps({'sourceX':X,'targetX':U,'sourceY':Y,'targetY':V,'scope':'traced exterior color field only; all gameplay and original internal artwork protected'}))
