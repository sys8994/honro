import json,hashlib,math,re,xml.etree.ElementTree as E
from pathlib import Path
from PIL import Image
from svgpathtools import parse_path,Line,CubicBezier,QuadraticBezier
import sys
p=Path(sys.argv[1]);source=p/'trace/raw.svg';out=p/'candidate-relative.svg';r=E.parse(source).getroot();cfg=json.loads((p/'pixel-config.json').read_text());lines=[(a[0],a[1],b[0],b[1]) for line in cfg['protectedPolylines'] for a,b in zip(line['points'],line['points'][1:])];pad=float(sys.argv[2]);epsilon=float(sys.argv[3]) if len(sys.argv)>3 else .04
preserveColors=sys.argv[4].split(',') if len(sys.argv)>4 else []
counts={'protectedContours':0,'protectedSegments':0,'cubicToLine':0,'cubicToQuadratic':0,'keptCubic':0};maxbound=0
NUMBER=r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
def protected(s):
 x0,x1,y0,y1=s.bbox();xmin,xmax,ymin,ymax=x0-pad,x1+pad,y0-pad,y1+pad
 for ax,ay,bx,by in lines:
  dx,dy=bx-ax,by-ay;lo,hi=0.,1.;hit=True
  for p0,q0 in [(-dx,ax-xmin),(dx,xmax-ax),(-dy,ay-ymin),(dy,ymax-ay)]:
   if p0==0:
    if q0<0:hit=False;break
   elif p0<0:lo=max(lo,q0/p0)
   else:hi=min(hi,q0/p0)
   if lo>hi:hit=False;break
  if hit:return True
 return False
def ds(z,x,y):
 if x==y:return abs(z-x)
 t=max(0,min(1,((z-x)*(y-x).conjugate()).real/abs(y-x)**2));return abs(z-(x+t*(y-x)))
def rnd(z):return complex(round(z.real,1),round(z.imag,1))
def num(x):return re.sub(r'^(-?)0\.',r'\1.',format(0 if x==0 else x,'.15g'))
def xy(z):return num(z.real)+','+num(z.imag)
def delta(x,y):return complex(round((x-y).real,10),round((x-y).imag,10))
def mini(text):
 tokens=re.findall(r'[MmZzLlHhVvCcSsQqTtAa]|'+NUMBER,text);result=[];command=None;previous_number=False;last_token=''
 for token in tokens:
  if len(token)==1 and token.isalpha():
   if token not in 'MmZz' and token==command:continue
   result.append(token);command=token;previous_number=False
  else:
   token=re.sub(r'^(-?)0\.',r'\1.',token)
   if previous_number and not token.startswith(('-','+')) and not (token.startswith('.') and '.' in last_token and 'e' not in last_token.lower()):result.append(' ')
   result.append(token);previous_number=True;last_token=token
 return ''.join(result)
for e in r.iter():
 if not e.tag.endswith('path'):continue
 if any(color in str(e.attrib) for color in preserveColors):e.set('d',mini(e.get('d')));continue
 chunks=[];subs=parse_path(e.get('d')).continuous_subpaths();originals=re.findall(r'[Mm][^Mm]*',e.get('d'));assert len(subs)==len(originals)
 for sub,original in zip(subs,originals):
  if any(protected(s) for s in sub):
   chunks.append(original);counts['protectedContours']+=1;counts['protectedSegments']+=len(sub);continue
  tokens=re.findall(r'[MmZzLlHhVvCcSsQqTtAa]|'+NUMBER,original);assert tokens[0] in 'Mm';chunks.append(tokens[0]+tokens[1]+','+tokens[2]);current=sub[0].start;start=current
  for i,s in enumerate(sub):
   end=rnd(s.end);kind='L';controls=[]
   if i==len(sub)-1 and sub.isclosed():end=start
   if isinstance(s,CubicBezier):
    lb=max(ds(s.control1,s.start,s.end),ds(s.control2,s.start,s.end));Q=((3*s.control1-s.start)/2+(3*s.control2-s.end)/2)/2;qb=max(abs(s.control1-(s.start/3+2*Q/3)),abs(s.control2-(s.end/3+2*Q/3)))
    if lb<=epsilon:counts['cubicToLine']+=1;maxbound=max(maxbound,lb)
    elif qb<=epsilon:kind='Q';controls=[Q];counts['cubicToQuadratic']+=1;maxbound=max(maxbound,qb)
    else:kind='C';controls=[s.control1,s.control2];counts['keptCubic']+=1
   elif isinstance(s,QuadraticBezier):kind='Q';controls=[s.control]
   elif not isinstance(s,Line):raise ValueError(type(s))
   vals=[delta(rnd(c),current) for c in controls]+[delta(end,current)]
   if kind=='L':
    d=vals[-1]
    if i==len(sub)-1 and sub.isclosed():pass
    elif d==0:pass
    elif d.real==0:chunks.append('v'+num(d.imag))
    elif d.imag==0:chunks.append('h'+num(d.real))
    else:chunks.append('l'+xy(d))
   else:chunks.append(kind.lower()+' '.join(xy(v) for v in vals))
   current=end
  if sub.isclosed():chunks.append('z')
 e.set('d',mini(' '.join(chunks)))
E.register_namespace('','http://www.w3.org/2000/svg');E.ElementTree(r).write(out,encoding='utf-8',xml_declaration=True)
report={'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceBytes':source.stat().st_size,'outputBytes':out.stat().st_size,'reductionPercent':100*(1-out.stat().st_size/source.stat().st_size),'epsilonLocalUnits':epsilon,'preservedWholePathColors':preserveColors,'maxCurveReplacementBoundLocalUnits':maxbound,'absoluteCoordinateRoundingBound':math.sqrt(2)*.05,'protectedRule':f'Preserve original textual geometry for contours touching {pad} local-unit expanded canonical polyline region; lexical minification only. Interior bounded geometry regenerated from immutable raw.svg.','counts':counts,'topologyReview':'NOT_CERTIFIED','visualReview':'PENDING'};out.with_suffix('.report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
