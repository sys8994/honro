import argparse,hashlib,json,math,xml.etree.ElementTree as E
from pathlib import Path
from svgpathtools import parse_path,Line,CubicBezier,QuadraticBezier
p=argparse.ArgumentParser();p.add_argument('source',type=Path);p.add_argument('output',type=Path);p.add_argument('--config',type=Path,required=True);p.add_argument('--epsilon',type=float,default=.04);a=p.parse_args();assert 0<=a.epsilon<=.1
original=a.source.read_bytes();r=E.fromstring(original);counts={'cubicToLine':0,'cubicToQuadratic':0,'keptCubic':0,'protectedPaths':0};maxbound=0.;GRID=1000000

def dist_segment(z,x,y):
 if x==y:return abs(z-x)
 t=max(0,min(1,((z-x)*(y-x).conjugate()).real/abs(y-x)**2));return abs(z-(x+t*(y-x)))
def pt(z,protected=False):
 if not protected:z=complex(round(z.real*100)/100,round(z.imag*100)/100)
 return (round(z.real*GRID),round(z.imag*GRID))
config=json.loads(a.config.read_text())
def protect(s):
 points=[s.point(k/16) for k in range(17)]
 for line in config.get('protectedPolylines',[]):
  ps=line['points'];margin=line.get('width',6)/2+2
  for aa,bb in zip(ps,ps[1:]):
   x,y=complex(*aa),complex(*bb)
   if any(dist_segment(z,x,y)<=margin for z in points):return True
 return False
def num(v):
 s=f'{v/GRID:.6f}'.rstrip('0').rstrip('.');return ('0' if not s or s=='-0' else s).replace('-0.','-.').removeprefix('0.') if abs(v)<GRID and v else ('0' if not v else s)
def fmt(v):
 # integer micro-units; avoid cumulative rounding of relative coordinates.
 sign='-' if v<0 else '';v=abs(v);whole,frac=divmod(v,GRID)
 if frac:return sign+(str(whole) if whole else '')+'.'+f'{frac:06d}'.rstrip('0')
 return sign+str(whole)
def pair(v):return fmt(v[0])+','+fmt(v[1])
def sub(x,y):return(x[0]-y[0],x[1]-y[1])
def walk(parent,protected=False):
 global maxbound
 protected=False  # Explicit micro-rounding mode applies to all paths; never claim exact alpha identity.
 for e in parent:
  if e.tag.split('}')[-1]!='path':walk(e,protected);continue
  if e.get('style','') in ['fill:'+c for c in config.get('preserveRawColors',['#293a35','#566127','#727b33'])]:counts['protectedPaths']+=1;continue
  path=parse_path(e.get('d',''))
  if not all(isinstance(s,(Line,CubicBezier,QuadraticBezier)) for s in path):continue
  text=[]
  for q in path.continuous_subpaths():
   protectedSegments=[protect(seg) for seg in q];current=pt(q[0].start,protectedSegments[0] or protectedSegments[-1]);start=current;text.append('M'+pair(current))
   for i,s in enumerate(q):
    kind='L';control=[];bound=0.;protected=protectedSegments[i]
    if isinstance(s,QuadraticBezier):
     kind='Q';control=[s.control]
    elif isinstance(s,CubicBezier):
     linebound=max(dist_segment(s.control1,s.start,s.end),dist_segment(s.control2,s.start,s.end))
     Q=((3*s.control1-s.start)/2+(3*s.control2-s.end)/2)/2
     qbound=max(abs(s.control1-(s.start/3+2*Q/3)),abs(s.control2-(s.end/3+2*Q/3)))
     if not protected and linebound<=a.epsilon:counts['cubicToLine']+=1;bound=linebound
     elif not protected and qbound<=a.epsilon:kind='Q';control=[Q];counts['cubicToQuadratic']+=1;bound=qbound
     else:kind='C';control=[s.control1,s.control2];counts['keptCubic']+=1
    end=pt(s.end,protected or protectedSegments[(i+1)%len(q)]);maxbound=max(maxbound,bound)
    if kind=='L':
     delta=sub(end,current)
     if i==len(q)-1 and end==start:text.append('z')
     elif delta==(0,0):pass
     elif delta[0]==0:text.append('v'+fmt(delta[1]))
     elif delta[1]==0:text.append('h'+fmt(delta[0]))
     else:text.append('l'+pair(delta))
    else:
     values=[sub(pt(c,protected),current) for c in control]+[sub(end,current)];text.append(kind.lower()+' '.join(pair(v) for v in values))
     if i==len(q)-1 and end==start:text.append('z')
    current=end
  e.set('d',' '.join(text))
walk(r);E.register_namespace('','http://www.w3.org/2000/svg');E.ElementTree(r).write(a.output,encoding='utf-8',xml_declaration=True)
report={'sourceSha256':hashlib.sha256(original).hexdigest(),'sourceBytes':len(original),'outputBytes':a.output.stat().st_size,'epsilonLocalUnits':a.epsilon,'maxCurveReplacementBoundLocalUnits':maxbound,'absoluteCoordinateRoundingBound':math.sqrt(2)*.5/100,'protectedConfiguration':str(a.config),'protectedSegmentPrecision':1e-6,'protectedAlphaPathsUnchanged':False,'counts':counts,'topologyReview':'NOT_CERTIFIED','visualReview':'PENDING'};a.output.with_suffix('.report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
