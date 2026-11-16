from pathlib import Path
import json,math,sys,re
import numpy as np
from PIL import Image
from lxml import etree as E
from svgpathtools import parse_path
from scipy.interpolate import RBFInterpolator
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tools/terrain-node-optimizer'));from optimize_svg import canonical_subpaths,flatten,rdp
root=Path(__file__).resolve().parent;out=root/'full-registered-v2';out.mkdir(exist_ok=True)
ts=json.load(open(Path(__file__).resolve().parent/'contact-source.json'))['allTerrains'];by={t['id']:t for t in ts}
base=lambda x,y:np.array([-3300+x*14000/1983,-300+y*5600/793])
def contact(t):
 es=t['properties']['honroWalkEdges'];return np.array([[t['points'][i]['x'],t['points'][i]['y']] for i in es+[es[-1]+1]])
upper=contact(by['approved33-upper']);low=contact(by['approved33-low']);ground=np.r_[np.array([[0,2205],[216,2227.5],[450,2272.5]]),low]
im=np.array(Image.open(root/'concept.png').convert('RGBA'));lum=im[:,:,:3].mean(2);alpha=im[:,:,3];controls=[]
def add(x,y,X,Y,label):controls.append({'source':[float(x),float(y)],'target':[float(X),float(Y)],'delta':(np.array([X,Y])-base(x,y)).tolist(),'label':label})
for x in range(16,1983,32):
 ys=np.where(alpha[:,x]>127)[0];runs=np.split(ys,np.where(np.diff(ys)>1)[0]+1);runs=[r for r in runs if len(r)>=8]
 if not runs:continue
 y=runs[0][0];X,Y=base(x,y);target=np.interp(X,upper[:,0],upper[:,1]) if 0<=X<=6907.5 else Y;add(x,y,X,target,'upper')
 if 0<=X<=6907.5:
  target=np.interp(X,ground[:,0],ground[:,1]);expected=(target+300)*793/5600;lo=max(0,round(expected)-22);hi=min(793,round(expected)+22);vals=lum[lo:hi,x-2:x+3].mean(1);valid=(alpha[lo:hi,x-2:x+3]>127).all(1);vals=np.where(valid,vals,-1);y=lo+int(vals.argmax())-.5
  if x==1360:y=521.5 # Ground edge, not the brighter staircase cap above it.
  add(x,y,X,target,'lowland')
# Exact authored upper vertices are protected, including sharp slope changes.
for X,Y in upper:
 x=(X+3300)*1983/14000;col=min(1982,max(0,round(x)));ys=np.where(alpha[:,col]>127)[0];runs=np.split(ys,np.where(np.diff(ys)>1)[0]+1);runs=[r for r in runs if len(r)>=8]
 if runs:add(x,runs[0][0],X,Y,'upper vertex')
rows=json.load(open(root/'full-contact-detection.json'))
for r in rows:
 a,b,Y=r['target'];lo,hi,y=r['source']
 if r['id']=='approved33-west-link' and a==0:lo=467.3
 if r['id']=='approved33-left-middle' and a==180:lo,hi,y=492.7,505.7,264.5
 if r['id']=='approved33-left-middle' and a==279:lo,hi,y=505.7,513.3,263.5
 for f in [.03,.5,.97]:add(lo+(hi-lo)*f,y,a+(b-a)*f,Y,r['id'])
for (x,y),(X,Y) in zip([(1357,318),(1380,321.5),(1407,326.5),(1436,326)],contact(by['approved33-right-middle'])):add(x,y,X,Y,'curved landing')
# The final lower riser is non-horizontal and must not introduce another ledge.
add(1409.5,445,6660,2808,'lower final riser')
for x in range(0,1984,128):
 for y in [0,793]:X,Y=base(x,y);add(x,y,X,Y,'border')
for y in range(128,793,128):
 for x in [0,1983]:X,Y=base(x,y);add(x,y,X,Y,'border')
xy=np.array([r['source'] for r in controls])/1983;delta=np.array([r['delta'] for r in controls]);rbf=RBFInterpolator(xy,delta,kernel='thin_plate_spline',smoothing=0)
def warppts(pts):
 a=np.array([[z.real,z.imag] for z in pts]);v=rbf(a/1983);return [complex(*(base(z[0],z[1])+q)) for z,q in zip(a,v)]
counts={}
for kind in ('color','alpha'):
 tree=E.parse(str(root/'full-bounded-trace'/f'{kind}-raw.svg'));r=tree.getroot();r.set('viewBox','-3300 -300 14000 5600');r.set('width','2800');r.set('height','1120');before=after=0
 for p in tree.findall('.//{*}path'):
  chunks=[]
  for raw in canonical_subpaths(p.get('d')):
   sub=parse_path(raw);before+=len(sub);pts=[]
   for seg in sub:
    flat=flatten(seg,.08)
    for a,b in zip(flat,flat[1:]):
     n=max(1,math.ceil(abs(b-a)/2));pts +=[a+(b-a)*j/n for j in range(n)]
   if not pts:continue
   pts.append(sub[-1].end);pts=rdp(warppts(pts),.25);after+=len(pts)-1;fmt=lambda z:f'{z.real:.2f},{z.imag:.2f}';chunks.append('M'+fmt(pts[0])+'L'+' '.join(map(fmt,pts[1:]))+('Z'if re.search(r'[Zz]\s*$',raw)else''))
  p.set('d',' '.join(chunks))
 tree.write(str(out/f'{kind}.svg'));counts[kind]=[before,after]
(out/'registration.json').write_text(json.dumps({'controls':controls,'counts':counts,'method':'one smooth 2D deformation of entire native color+alpha source to unchanged terrain contacts; no added caps, masking strips or collision'},indent=2));print(counts)
