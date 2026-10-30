#!/usr/bin/env python3
"""Piecewise affine warp of native filled curves, no path boolean or contour redraw."""
import argparse,bisect,copy,importlib.util,json,math,re,sys
from pathlib import Path
import numpy as np
from svgpathtools import parse_path,Path as SVGPath,Line,QuadraticBezier,CubicBezier
H=Path(__file__).resolve().parents[1]; spec=importlib.util.spec_from_file_location('svg_import',H/'vector-production/import-svg.py');imp=importlib.util.module_from_spec(spec);spec.loader.exec_module(imp)
I=[1,0,0,1,0,0]
def mul(a,b):return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]]
def affine(z,m):return complex(m[0]*z.real+m[2]*z.imag+m[4],m[1]*z.real+m[3]*z.imag+m[5])
def segmap(s,m):
 if isinstance(s,Line):return Line(affine(s.start,m),affine(s.end,m))
 if isinstance(s,QuadraticBezier):return QuadraticBezier(affine(s.start,m),affine(s.control,m),affine(s.end,m))
 if isinstance(s,CubicBezier):return CubicBezier(affine(s.start,m),affine(s.control1,m),affine(s.control2,m),affine(s.end,m))
 raise ValueError('unsupported segment '+type(s).__name__)
def profile(p):
 q=[(float(v[0]),float(v[1])) if isinstance(v,list) else (float(v['x']),float(v['y'])) for v in p]
 if len(q)<2 or any(q[i][0]>=q[i+1][0] for i in range(len(q)-1)):raise ValueError('profile must increase')
 return q
def line(p,x):
 xs=[q[0] for q in p];i=max(0,min(len(p)-2,bisect.bisect_right(xs,x)-1));(x0,y0),(x1,y1)=p[i:i+2];m=(y1-y0)/(x1-x0);return m,y0-m*x0
def paths(n,m=I,sty=None):
 if n.get('clipPath') or n.get('opacity',1)!=1:raise ValueError('clip or opacity not supported')
 style=dict(sty or {'fill':'#000000','stroke':'none','fillRule':'nonzero'});style.update({k:n[k] for k in ('fill','stroke','fillRule','opacity') if k in n});m=mul(m,n.get('transform',I))
 if n['tag']=='g':
  for child in n.get('children',[]):yield from paths(child,m,style)
 elif n['tag']=='path':
  if style['stroke']!='none':raise ValueError('strokes not supported')
  if style['fill']!='none':yield n['d'],m,style
 else:raise ValueError('only path/group')
def roots_at_x(seg,x):
 coeff=np.real(seg.poly().c).astype(float); coeff[-1]-=x
 coeff=np.trim_zeros(coeff,'f')
 if len(coeff)<=1:return []
 rr=np.roots(coeff);return [float(z.real) for z in rr if abs(z.imag)<1e-8 and 1e-9<z.real<1-1e-9]
def cut_curve(seg,cuts):
 lo,hi,*_=seg.bbox();start=bisect.bisect_right(cuts,lo+1e-10);end=bisect.bisect_left(cuts,hi-1e-10);t=[0.,1.]
 for x in cuts[start:end]:t.extend(roots_at_x(seg,x))
 t.sort();uniq=[t[0]]
 for v in t[1:]:
  if v-uniq[-1]>1e-8:uniq.append(v)
 return [seg.cropped(a,b) for a,b in zip(uniq,uniq[1:]) if b-a>1e-10]
def quant(s):return re.sub(imp.NUMBER,lambda m:format(round(float(m[0]),3),'.12g'),s)
def compact_rel(s):
 tokens=re.findall(r'[MmZzLlHhVvCcSsQqTtAa]|'+imp.NUMBER,s);out=[];cmd=None;prevnum=False;lastnum=''
 for t in tokens:
  if len(t)==1 and t.isalpha():
   if t not in 'MmZz' and t==cmd:continue
   out.append(t);cmd=t;prevnum=False
  else:
   t=format(round(float(t),3),'.12g');t=re.sub(r'^(-?)0\.',r'\1.',t)
   if prevnum and not t.startswith('-') and not (t.startswith('.') and '.' in lastnum):out.append(' ')
   out.append(t);prevnum=True;lastnum=t
 return ''.join(out)
def compact_d(d):
 # Standalone lossless minifier only for input already on the .001 grid.
 if any(abs(float(m[0])-round(float(m[0]),3))>1e-9 for m in re.finditer(imp.NUMBER,d)):raise ValueError('compact_d requires pre-quantized .001-grid numbers')
 return compact_rel(d)
def rnd(z):return complex(round(z.real,3),round(z.imag,3))
def degenerate(s):
 # Only zero-length line or Bezier with every control coincident is removable.
 points=[s.start,s.end]
 if isinstance(s,QuadraticBezier):points.append(s.control)
 if isinstance(s,CubicBezier):points.extend((s.control1,s.control2))
 return all(p==points[0] for p in points[1:])
def quantseg(s):
 if isinstance(s,Line):return Line(rnd(s.start),rnd(s.end))
 if isinstance(s,QuadraticBezier):return QuadraticBezier(rnd(s.start),rnd(s.control),rnd(s.end))
 if isinstance(s,CubicBezier):return CubicBezier(rnd(s.start),rnd(s.control1),rnd(s.control2),rnd(s.end))
 raise ValueError('unsupported curve')
def safe_chunks(subs,fillrule):
 # Bounding-box-connected components preserve every potentially nested hole.
 n=len(subs);parents=list(range(n))
 def find(i):
  while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
  return i
 for i in range(n):
  x0,x1,y0,y1=subs[i][1]
  for j in range(i):
   X0,X1,Y0,Y1=subs[j][1]
   if x0<=X1 and X0<=x1 and y0<=Y1 and Y0<=y1:parents[find(i)]=find(j)
 groups={}
 for i,(d,_,_) in enumerate(subs):groups.setdefault(find(i),[]).append(d)
 chunks=[];cur=''
 for group in groups.values():
  text=''.join(group)
  if len(text)>59999:raise ValueError(f'inseparable contour group {len(text)} exceeds 60k')
  if len(cur)+len(text)>59999 and cur:chunks.append(cur);cur=''
  cur+=text
 if cur:chunks.append(cur)
 return chunks
def run(source,config):
 if source.get('collision')!=[] or source['vector'].get('symbols') or source['vector'].get('clips'):raise ValueError('expected collision-free plain vector')
 if config.get('forbiddenPaths'):raise ValueError('protected corridors cannot be certified by this warp')
 raw=list(paths(source['vector']['root']));parsed=[];bounds=[]
 for d,m,style in raw:
  pp=SVGPath(*(segmap(s,m) for s in parse_path(d)));parsed.append((pp,style));bounds.append(pp.bbox())
 xmin=min(b[0] for b in bounds);xmax=max(b[1] for b in bounds);ymin=min(b[2] for b in bounds);ymax=max(b[3] for b in bounds)
 sp=profile(config['sourceTop']);tp=profile(config['targetTop']);originalsp=copy.deepcopy(sp);originaltp=copy.deepcopy(tp);ds=float(config.get('depthScale',1));sx0,sx1=sp[0][0],sp[-1][0];tx0,tx1=tp[0][0],tp[-1][0];a=(tx1-tx0)/(sx1-sx0);b=tx0-a*sx0
 if a<=0 or ds<=0:raise ValueError('nonpositive scale')
 left=max(0,sx0-xmin);right=max(0,xmax-sx1)
 if max(left,right)>config.get('decorativeOverhangMaxSourceUnits',0)+1e-4:raise ValueError('overhang exceeds reviewed bound')
 for x,side in [(xmin,'left'),(xmax,'right')]:
  if (side=='left' and x<sx0) or (side=='right' and x>sx1):
   sm,sb=line(sp,sx0 if side=='left' else sx1);tx=a*x+b;tm,tb=line(tp,tx0 if side=='left' else tx1);sv=(x,sm*x+sb);tv=(tx,tm*tx+tb)
   if side=='left':sp.insert(0,sv);tp.insert(0,tv)
   else:sp.append(sv);tp.append(tv)
 cuts=sorted(set([q[0] for q in sp]+[(q[0]-b)/a for q in tp]));children=[];outbounds=[];pieces=0
 for p,style in parsed:
  subs=[]
  for sub in p.continuous_subpaths():
   closed=abs(sub[0].start-sub[-1].end)<1e-8;out=[]
   for seg in sub:
    for piece in cut_curve(seg,cuts):
     mid=piece.point(.5).real;sm,sb=line(sp,mid);tm,tb=line(tp,a*mid+b);m=[a,tm*a-ds*sm,0,ds,b,tm*b+tb-ds*sb];warped=segmap(piece,m)
     if out:
      if abs(warped.start-out[-1].end)>1e-5:raise ValueError('mapping discontinuity at cut')
      warped.start=out[-1].end
     out.append(warped);pieces+=1
   if closed:
    if abs(out[-1].end-out[0].start)>1e-5:raise ValueError('mapping discontinuity at closure')
    out[-1].end=out[0].start
   out=[v for v in map(quantseg,out) if not degenerate(v)]
   if not out:continue
   for i in range(1,len(out)):out[i].start=out[i-1].end
   if closed:out[-1].end=out[0].start
   q=SVGPath(*out);outbounds.append(q.bbox());serial=SVGPath(*list(q)[:-1]) if closed and isinstance(q[-1],Line) else q;d=compact_rel(serial.d(useSandT=True,use_closed_attrib=False,rel=True));d='M'+d[1:] if d.startswith('m') else d;d+=('Z' if closed else '');
   decoded=parse_path(d)
   if len(decoded)==len(q)+1 and abs(decoded[-1].end-decoded[-1].start)<.0011:decoded=decoded[:-1]
   if len(decoded)!=len(q):raise ValueError(('curve count changed',len(decoded),len(q)))
   for qa,qb in zip(q,decoded):
    if max(abs(qa.point(t)-qb.point(t)) for t in (0,.25,.5,.75,1))>.0011:raise ValueError(('roundtrip geometry changed',qa,qb))
   subs.append((d,q.bbox(),0))
  # Minified relative commands start each independent contour with an absolute M.
  for chunk in safe_chunks(subs,style.get('fillRule','nonzero')):
   children.append({'tag':'path',**style,'d':chunk})
 x=min(v[0] for v in outbounds);X=max(v[1] for v in outbounds);y=min(v[2] for v in outbounds);Y=max(v[3] for v in outbounds);bound={'x':x,'y':y,'w':X-x,'h':Y-y};asset=copy.deepcopy(source);asset.update(id=config['id'],name=config.get('name',config['id']),bounds=bound,anchor={'x':0,'y':0},foot={'x':tx0,'y':tp[0][1]});asset['reference'].update(bounds=bound,foot=asset['foot']);asset['vector']={'version':1,'viewBox':[x,y,X-x,Y-y],'root':{'tag':'g','children':children}};asset['params'].update(nodeCount=len(children)+1,semanticLayer=config.get('semanticLayer','REAR'),nativeContactFit={'sourceId':source['id'],'sourceTop':originalsp,'targetTop':originaltp,'decorativeOverhangSourceUnits':{'left':left,'right':right},'depthScale':ds,'horizontalScale':a,'intentionalDeformation':True,'contactReviewed':False,'method':'exact piecewise affine Bezier subdivision; no boolean'})
 report={'sourceId':source['id'],'targetId':asset['id'],'sourceBounds':[xmin,ymin,xmax,ymax],'outputBounds':bound,'horizontalScale':a,'depthScale':ds,'sourceCuts':len(cuts),'bezierPieces':pieces,'nodes':len(children)+1,'maxPathChars':max(map(lambda c:len(c['d']),children)),'outputCoordinateGridWorld':.001,'bakedGeometry':True,'booleanOperations':0,'sourceMutated':False,'collision':[],'visualApproval':'NOT REVIEWED','forbiddenCorridorsChecked':False}
 return asset,report
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('source');ap.add_argument('config');ap.add_argument('output');args=ap.parse_args();a,r=run(json.load(open(args.source)),json.load(open(args.config)));Path(args.output).write_text(json.dumps(a,separators=(',',':')));Path(args.output).with_suffix('.report.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r))
