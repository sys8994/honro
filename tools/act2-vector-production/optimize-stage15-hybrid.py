"""Bounded segment serializer; exact original operands in protected contact regions."""
import sys,re,json,hashlib,math,xml.etree.ElementTree as E
from pathlib import Path
from svgpathtools import CubicBezier,Line,parse_path
p=Path(sys.argv[1]);source=p/'authored-raw.svg';out=p/'candidate-bbox.svg';r=E.parse(source).getroot();cfg=json.loads((p/'pixel-config.json').read_text());lines=[(*a,*b) for line in cfg['protectedPolylines'] for a,b in zip(line['points'],line['points'][1:])];pad=12;NUMBER=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?';arity={'M':2,'L':2,'H':1,'V':1,'C':6};counts={'protected':0,'line':0,'quadratic':0,'cubic':0};maxbound=0.
def protected(s):
 x0,x1,y0,y1=s.bbox();xmin,xmax,ymin,ymax=x0-pad,x1+pad,y0-pad,y1+pad
 for ax,ay,bx,by in lines:
  dx,dy=bx-ax,by-ay;lo,hi=0.,1.;hit=True
  for a,b in [(-dx,ax-xmin),(dx,xmax-ax),(-dy,ay-ymin),(dy,ymax-ay)]:
   if a==0:
    if b<0:hit=False;break
   elif a<0:lo=max(lo,b/a)
   else:hi=min(hi,b/a)
   if lo>hi:hit=False;break
  if hit:return True
 return False
def dist(z,x,y):
 if x==y:return abs(z-x)
 t=max(0,min(1,((z-x)*(y-x).conjugate()).real/abs(y-x)**2));return abs(z-(x+t*(y-x)))
def f(v):return re.sub(r'^(-?)0\.',r'\1.',format(v,'.12g'))
def pair(v):return [f(v.real),f(v.imag)]
def rnd(v):return complex(round(v.real,2),round(v.imag,2))
def mini(tokens):
 a=[];prev=None;pn=False
 for t in tokens:
  if t.isalpha():
   if t not in 'MmZz' and prev==t:continue
   a.append(t);prev=t;pn=False
  else:
   t=re.sub(r'^(-?)0\.',r'\1.',t)
   if pn and not t.startswith(('-','+')):a.append(' ')
   a.append(t);pn=True
 return ''.join(a)
pathIndex=0
for node in r.iter():
 node.attrib.pop('id',None)
 if not node.tag.endswith('path'):continue
 pathIndex+=1
 if pathIndex==1 and p.name in ['outer-v1','arches-flat-v2']:continue
 bounds=parse_path(node.get('d')).bbox()
 tokens=re.findall('[A-Za-z]|'+NUMBER,node.get('d'));i=0;cmd=None;current=0j;emitted=0j;start=0j;output=[]
 while i<len(tokens):
  if tokens[i].isalpha():cmd=tokens[i];i+=1
  assert cmd
  up=cmd.upper();relative=cmd.islower()
  if up=='Z':output.append(cmd);current=start;emitted=start;cmd=None;continue
  n=arity[up];values=tokens[i:i+n];i+=n;vs=list(map(float,values));base=current if relative else 0j
  if up=='H':end=complex(vs[0]+(current.real if relative else 0),current.imag);curve=Line(current,end)
  elif up=='V':end=complex(current.real,vs[0]+(current.imag if relative else 0));curve=Line(current,end)
  elif up in ['M','L']:end=base+complex(vs[0],vs[1]);curve=Line(current,end)
  else:
   c1=base+complex(vs[0],vs[1]);c2=base+complex(vs[2],vs[3]);end=base+complex(vs[4],vs[5]);curve=CubicBezier(current,c1,c2,end)
  box=curve.bbox();atExtreme=any(abs(box[j]-bounds[j])<2 for j in range(4))
  keep=up=='M' or protected(curve) or atExtreme
  if keep:
   counts['protected']+=1
   if abs(current-emitted)<1e-9 or not relative:output.extend([cmd,*values])
   elif up=='C':output.extend(['c',*pair(c1-emitted),*pair(c2-emitted),*pair(end-emitted)])
   else:output.extend(['m' if up=='M' else 'l',*pair(end-emitted)])
   emitted=end
  else:
   target=rnd(end);delta=target-emitted
   if up!='C':output.extend(['l',*pair(delta)]);counts['line']+=1
   else:
    lb=max(dist(c1,current,end),dist(c2,current,end));Q=((3*c1-current)/2+(3*c2-end)/2)/2;qb=max(abs(c1-(current/3+2*Q/3)),abs(c2-(end/3+2*Q/3)))
    if lb<=.15:output.extend(['l',*pair(delta)]);counts['line']+=1;maxbound=max(maxbound,lb)
    elif qb<=.15:output.extend(['q',*pair(rnd(Q)-emitted),*pair(delta)]);counts['quadratic']+=1;maxbound=max(maxbound,qb)
    else:output.extend(['c',*pair(rnd(c1)-emitted),*pair(rnd(c2)-emitted),*pair(delta)]);counts['cubic']+=1
   emitted=target
  current=end
  if up=='M':start=current;cmd='l' if relative else 'L'
 node.set('d',mini(output))
E.register_namespace('','http://www.w3.org/2000/svg');E.ElementTree(r).write(out,encoding='utf-8',xml_declaration=True)
report={'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceBytes':source.stat().st_size,'outputBytes':out.stat().st_size,'reductionPercent':100*(1-out.stat().st_size/source.stat().st_size),'epsilonLocalUnits':.15,'curveReplacementBound':maxbound,'roundingBound':.01/2**.5,'bboxExtremaProtected':True,'protectedRule':'Original operands retained within12 source px of canonical contact lines; transition operands rebased to exact original absolute control/endpoints. Native 1x/2x gate required.','counts':counts};out.with_suffix('.report.json').write_text(json.dumps(report,indent=2));print(report)
