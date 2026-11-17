"""Register native traced BODY in source coordinates; intersect native authored protection."""
from pathlib import Path
from lxml import etree as E
from svgpathtools import parse_path,Path as SVGPath
import json,os,subprocess,importlib.util,re,math,copy
R=Path(__file__).resolve().parents[2];O=R/'art/stage50-continuity/source';ns='{http://www.w3.org/2000/svg}'
def reg(z):
 return complex(z.real*1774/1024, z.imag*1774/1024 if z.imag<=800 else 800*1774/1024+(z.imag-800)*(4300-800*1774/1024)/(1536-800))
protection=json.loads((R/'art/stage50-continuity/protection.json').read_text())
def run(tree,name,actions):
 src=O/(name+'-input.svg');dest=O/(name+'-final.svg');tree.write(str(src))
 p=subprocess.run(['inkscape',str(src),'--batch-process','--actions='+';'.join(actions+['select-clear','export-plain-svg',f'export-filename:{dest}','export-do'])],env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so'},capture_output=True,text=True)
 (O/(name+'.log')).write_text(p.stdout+p.stderr);p.check_returncode();return dest
for kind in ['color','alpha']:
 t=E.parse(str(O/'trace-v3'/('color-opt.svg' if kind=='color' else 'alpha-raw.svg')))
 for e in t.iter():
  if 'transform' in e.attrib:del e.attrib['transform']
 for e in t.findall('.//'+ns+'path'):
  parts=[]
  for path in parse_path(e.get('d')).continuous_subpaths():
   segs=[]
   for seg in path:
    count=max(1,math.ceil(max(abs(a-b) for a,b in zip(seg.bpoints(),seg.bpoints()[1:]))/12))
    for j in range(count):
     q=seg.cropped(j/count,(j+1)/count);segs.append(type(q)(*[reg(v) for v in q.bpoints()]))
   parts.append(SVGPath(*segs).d()+('Z' if path.isclosed() else ''))
  e.set('d',re.sub(r'-?\d+\.\d+(?:e[+-]?\d+)?',lambda m:format(float(m[0]),'.3f').rstrip('0').rstrip('.'),' '.join(parts)))
 t.getroot().set('viewBox','-1200 0 4200 4300');t.getroot().set('width','4200');t.getroot().set('height','4300')
 if kind=='alpha':
  p=t.find('.//'+ns+'path');p.set('id','generated');E.SubElement(p.getparent(),ns+'path',id='allowed',d=' '.join(protection['bodyAllowed']))
  alpha=run(t,'alpha',['select-clear','select-by-id:generated,allowed','path-intersection'])
 else:
  # Hidden white trace backdrop is clipped to genuine alpha. Subdue warm surfaces, not architecture.
  for p in t.findall('.//'+ns+'path'):p.set('style',p.get('style','').replace('#fefefe','#363439'))
  actions=[]
  for i,p in enumerate(list(t.findall('.//'+ns+'path'))):
   par=p.getparent();idx=par.index(p);par.remove(p)
   for j in range(6):
    n=copy.deepcopy(p);n.set('id',f'color-{i}-{j}');par.insert(idx+j,n)
    # Native viewport-depth modules keep each path within unchanged renderer budgets.
    mask=f'cut-{i}-{j}';E.SubElement(par,ns+'path',id=mask,d=f'M-1201 {j*720}H3001V{(j+1)*720}H-1201Z')
    actions+=['select-clear',f'select-by-id:{n.get("id")},{mask}','path-intersection']
  color=run(t,'color',actions)
subprocess.run(['python',str(R/'tools/stage50-continuity/serialize.py'),str(color),str(O/'color-compact.svg')],check=True)
color=O/'color-compact.svg'
s=importlib.util.spec_from_file_location('native',R/'tools/vector-production/import-native-clip.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
a=m.compile_native_clip(color,alpha,{'id':'act5:stage50:continuous-rock','name':'50장 연속 암벽','semanticLayer':'BODY','category':'rock','bounds':{'x':-1200,'y':0,'w':4200,'h':4300},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':887},'scaleRange':[1,8],'backgroundRange':[1,8],'params':{'silhouetteUnderpaint':False}})
json.dump(a,open(R/'shared/assets/environment/act5/stage50-continuous-rock.json','w'),separators=(',',':'))
