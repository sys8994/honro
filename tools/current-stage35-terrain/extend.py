"""QA-only native-plane extension. No source asset/collision mutation."""
import json,copy,sys,re
from pathlib import Path
from svgpathtools import parse_path,Path as SVGPath,Line,CubicBezier,QuadraticBezier
source=Path(sys.argv[1]);out=Path(sys.argv[2]);p=json.load(open(source));asset=copy.deepcopy(next(a for a in p['assets'] if a['id']=='act4-handoff:35:bedrock'))
counts={'paths':0,'segments':0,'clips':0}
def smooth(v):
 v=max(0,min(1,v));return v*v*(3-2*v)
def point(z):
 x=z.real*3;y=z.imag*3
 weight=smooth((x-500)/500)*smooth((4100-x)/500)
 return complex(z.real,z.imag+max(0,z.imag-900)*2.8*weight)
def warp(d):
 src=parse_path(d);segs=[]
 for s in src:
  if isinstance(s,Line):n=Line(point(s.start),point(s.end))
  elif isinstance(s,CubicBezier):n=CubicBezier(point(s.start),point(s.control1),point(s.control2),point(s.end))
  elif isinstance(s,QuadraticBezier):n=QuadraticBezier(point(s.start),point(s.control),point(s.end))
  else:raise ValueError(type(s))
  segs.append(n)
 counts['segments']+=len(segs)
 d=SVGPath(*segs).d(rel=True,use_closed_attrib=True)
 # Serialize unchanged segment topology at sufficient precision for the supported vector format.
 d=re.sub(r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?',lambda m:format(float(m.group()),'.6f').rstrip('0').rstrip('.') if '.' in format(float(m.group()),'.6f') else format(float(m.group()),'.6f'),d)
 d=re.sub(r"\s*([MmLlCcQqZz])\s*",r"\1",d);d=re.sub(r"\s+(-)",r"\1",d)
 return d

def parts(d):
 chunks=re.split(r'(?=[Mm])',d);out=[]
 for c in chunks:
  if not c:continue
  if len(c)>60000:raise ValueError('Single subpath exceeds format '+str(len(c)))
  if out and len(out[-1])+len(c)<59000:out[-1]+=c
  else:out.append(c)
 return out
def walk(n):
 d=n.get('d') or ''.join(n.get('dParts',[]))
 if d:n['dParts']=parts(warp(d));n.pop('d',None);counts['paths']+=1
 for c in n.get('children',[]):walk(c)
walk(asset['vector']['root'])
for k,ds in asset['vector']['clips'].items():
 if k=='belowWalk':asset['vector']['clips'][k]=[d.replace('V3072','V5000') for d in ds]
 else:asset['vector']['clips'][k]=[part for d in ds for part in parts(warp(d))];counts['clips']+=1
asset['vector']['clips']['extensionBelow']=['M-10000 2700H20000V20000H-10000Z'];asset['vector']['root']={'tag':'g','clipPath':'extensionBelow','children':[asset['vector']['root']]}
asset['id']='qa-stage35-native-lower-extension';asset['name']='QA original bedrock lower continuity option'
out.write_text(json.dumps(asset,separators=(',',':')));out.with_suffix('.provenance.json').write_text(json.dumps({'sourceId':'act4-handoff:35:bedrock','baseline':'1e043b09d4ce107e1d2dcf70fe2274dff7098476','keptColors':['#666659','#55594c','#494f46','#39443f'],'region':'world x500..4100 taper, full x1000..3600, y>2700','mapping':'local y += max(0,y-900)*2.8*smoothX; native sourceAlpha follows same mapping','counts':counts,'noGameplayMutation':True},indent=2));print(counts)
