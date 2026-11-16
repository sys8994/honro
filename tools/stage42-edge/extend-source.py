import json,copy,re
from svgpathtools import parse_path,Path,Line
src=json.load(open('art/stage42-edge/source.json'))
a=copy.deepcopy(src);a['id']='act5:stage42:direct-extension';a['vector']['root']['children']=a['vector']['root']['children'][:1]
def extend(d):
 p=parse_path(d);out=[]
 for s in p:
  side= -1 if abs(s.start.real)<1.5 and abs(s.end.real)<1.5 else (1 if abs(s.start.real-2022)<1.5 and abs(s.end.real-2022)<1.5 else 0)
  if side and abs(s.end.imag-s.start.imag)>2:
   # Expand only pre-existing boundary closure edges; interior curves unchanged.
   def off(z,t):return z+complex(side*600*t,(480 if side<0 else 600)*t*t)
   pts=[s.start,off(s.start,.35),off(s.start,.7),off(s.start,1),off(s.end,1),off(s.end,.7),off(s.end,.35),s.end]
   out.extend(Line(x,y) for x,y in zip(pts,pts[1:]))
  else:out.append(s)
 return re.sub(r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?',lambda m:format(round(float(m.group()),2),'g'),Path(*out).d())
def walk(n):
 if n.get('tag')=='path':
  d=extend(n['d'])
  if len(d)>60000:
   n.pop('d');parts=['']
   for sub in re.split(r'(?=M)',d):
    if not sub.strip():continue
    if len(parts[-1])+len(sub)>59000:parts.append('')
    parts[-1]+=sub
   n['dParts']=parts
  else:n['d']=d
 for c in n.get('children',[]):walk(c)
walk(a['vector']['root'])
a['vector']['clips']={k:[extend(d) for d in ds] for k,ds in a['vector']['clips'].items()}
json.dump(a,open('shared/assets/environment/act5/stage42-direct-extension.json','w'),separators=(',',':'))
