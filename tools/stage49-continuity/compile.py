from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Path as P,Line,CubicBezier,QuadraticBezier
import re,json,os,subprocess,copy,importlib.util,math
R=Path(__file__).resolve().parents[2];O=R/'art/stage49-continuity/source';ns='{http://www.w3.org/2000/svg}'
env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'}
def run(t,src,dest,acts):
 t.write(str(src));p=subprocess.run(['inkscape',str(src),'--batch-process','--actions='+';'.join(acts+['select-clear','export-plain-svg',f'export-filename:{dest}','export-do'])],env=env,capture_output=True,text=True);(O/(dest.stem+'.log')).write_text(p.stdout+p.stderr);p.check_returncode()
def f(z):
 x=z.real*3300/916-1100;y=(z.imag-700)*3.84 if z.imag<=1100 else 1536+(z.imag-1100)*(4600-1536)/617
 return complex(x,y)
for kind in ['color','alpha']:
 t=E.parse(str(O/'trace-v1'/('color-opt.svg' if kind=='color' else 'alpha-raw.svg')))
 for e in t.findall('.//'+ns+'path'):
  parts=[]
  for p in parse_path(e.get('d')).continuous_subpaths():
   segs=[]
   for segment in p:
    points=segment.bpoints();count=max(1,math.ceil(max(abs(a-b)for a,b in zip(points,points[1:]))/10))
    for j in range(count):
     ss=segment.cropped(j/count,(j+1)/count);segs.append(type(ss)(*[f(q) for q in ss.bpoints()]))
   parts.append(P(*segs).d()+('Z' if p.isclosed() else ''))
  e.set('d',re.sub(r'-?\d+\.\d+(?:e[+-]?\d+)?',lambda m:format(float(m[0]),'.3f').rstrip('0').rstrip('.'),' '.join(parts)))
 # Trace coordinates are rewritten into source native coordinates; do not apply original root viewBox transform.
 for e in t.iter():
  if 'transform' in e.attrib: del e.attrib['transform']
 t.getroot().set('viewBox','-1100 -3300 3300 7900');t.getroot().set('width','3300');t.getroot().set('height','7900')
 if kind=='alpha':
  p=t.find('.//'+ns+'path');p.set('id','generated');v=json.loads((R/'shared/assets/environment/act5/near-import.json').read_text())[8]['vector'];[E.SubElement(p.getparent(),ns+'path',id='original-'+k,d=v['clips'][k][0]) for k in ['a','b']];E.SubElement(p.getparent(),ns+'path',id='protect',d=json.loads((R/'art/stage49-continuity/protection.json').read_text())['sourcePreserved'][0]);run(t,O/'alpha-input.svg',O/'alpha-final.svg',['select-clear','select-by-id:generated,original-a,original-b','path-union','select-clear','select-all','path-difference'])
 else:
  acts=[]
  for q in t.findall('.//'+ns+'path'):q.set('style',q.get('style','').replace('#fefefe','#323a4b').replace('#996749','#3b4252'))
  t.write(str(O/'color-registered.svg'))
  for i,p in enumerate(list(t.findall('.//'+ns+'path'))):
   # Reduce warm ochre to subdued mineral rather than false walkable faces.
   if len(p.get('d'))<130000:continue
   par=p.getparent();idx=par.index(p);par.remove(p)
   for j in range(12):
    n=copy.deepcopy(p);n.set('id',f'color-{i}-{j}');par.insert(idx+j,n);mask=f'cut-{i}-{j}';E.SubElement(par,ns+'path',id=mask,d=f'M-1101 {-3300+j*660}H2201V{-3300+(j+1)*660}H-1101Z');acts+=['select-clear',f'select-by-id:{n.get("id")},{mask}','path-intersection']
  run(t,O/'color-input.svg',O/'color-final.svg',acts)
s=importlib.util.spec_from_file_location('native',R/'tools/vector-production/import-native-clip.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
a=m.compile_native_clip(O/'color-final.svg',O/'alpha-final.svg',{'id':'act5:stage49:continuous-rock','name':'49장 연속 암벽','semanticLayer':'BODY','category':'rock','bounds':{'x':-1100,'y':-3300,'w':3300,'h':7900},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':1536},'scaleRange':[1,8],'backgroundRange':[1,8],'params':{'silhouetteUnderpaint':False}})
json.dump(a,open(R/'shared/assets/environment/act5/stage49-continuous-rock.json','w'),separators=(',',':'))
