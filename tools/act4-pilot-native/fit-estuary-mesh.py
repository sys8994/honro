#!/usr/bin/env python3
"""Exact native curves mapped through a continuous macro-anchor mesh; no generated art."""
import importlib.util,json,sys,bisect,hashlib
from pathlib import Path
import numpy as np
from svgpathtools import parse_path,Path as SVGPath,Line
h=Path(__file__).resolve().parent;s=importlib.util.spec_from_file_location('w',h/'warp-native-curves.py');w=importlib.util.module_from_spec(s);s.loader.exec_module(w)
src,profile,out=map(Path,sys.argv[1:4]);a=json.loads(src.read_text());sp=np.array(json.loads(profile.read_text())['sourceTop'])
# Native crest/gutter positions measured from actual path14. Targets are geographic roles, not graybox facets.
anchors=[[12,0,1160],[310,900,1100],[500.96104064,1450,940],[540,1560,955],[592.752053936,1740,1120],[625,1840,1040],[720,2120,1035],[1078.36053721,3190,1275],[1400,4300,1010],[1500,4550,1050],[1657.74350352,5020,905],[2110,6110,1120],[2160,6370,1340]]
ds=2.6;row=450.;bottom=582.;targetbottom=1855.;xs=[q[0] for q in anchors];ys=[float(np.interp(q[0],sp[:,0],sp[:,1])) for q in anchors];targetrow=[q[2]+ds*(row-y) for q,y in zip(anchors,ys)]
def affine_tri(source,target):
 m=np.array([[x,y,1] for x,y in source]);r=np.linalg.solve(m,np.array(target));return [r[0,0],r[0,1],r[1,0],r[1,1],r[2,0],r[2,1]]
# Extend the authoring mesh beyond decorative side overhangs; extrapolate the same upper affine map.
for side,newx in [(0,-100.),(-1,2300.)]:
 i,j=(0,1) if side==0 else (-2,-1);t=(newx-xs[i])/(xs[j]-xs[i]);tx=anchors[i][1]+t*(anchors[j][1]-anchors[i][1]);tr=targetrow[i]+t*(targetrow[j]-targetrow[i]);sy=float(np.interp(newx,sp[:,0],sp[:,1]));extra=[newx,tx,tr-ds*(row-sy)]
 if side==0:anchors.insert(0,extra);xs.insert(0,newx);ys.insert(0,sy);targetrow.insert(0,tr)
 else:anchors.append(extra);xs.append(newx);ys.append(sy);targetrow.append(tr)
regions=[];lines=[(1,0,x) for x in xs]+[(0,1,row)]
for i in range(len(xs)-1):
 l,r=xs[i:i+2];L,R=anchors[i][1],anchors[i+1][1];u,v=targetrow[i:i+2];upper=affine_tri([(l,row),(r,row),(l,row-100)],[(L,u),(R,v),(L,u-ds*100)])
 low1=affine_tri([(l,row),(r,row),(r,bottom)],[(L,u),(R,v),(R,targetbottom)])
 low2=affine_tri([(l,row),(r,bottom),(l,bottom)],[(L,u),(R,targetbottom),(L,targetbottom)])
 regions.append((upper,low1,low2));lines.append((-(bottom-row)/(r-l),1,row-(bottom-row)*l/(r-l)))
def matrix(z):
 x,y=z.real,z.imag;i=max(0,min(len(xs)-2,bisect.bisect_right(xs,x)-1));l,r=xs[i:i+2]
 if y<=row:return regions[i][0]
 return regions[i][1 if y<=row+(x-l)*(bottom-row)/(r-l) else 2]
def point(z):return w.affine(z,matrix(z))
children=[];bounds=[];pieces=0;maxjoin=0
for d,m,style in w.paths(a['vector']['root']):
 subs=[];p=SVGPath(*(w.segmap(s,m) for s in parse_path(d)))
 for sub in p.continuous_subpaths():
  closed=abs(sub[0].start-sub[-1].end)<1e-8;res=[]
  for seg in sub:
   co=seg.poly().c;ts=[0.,1.]
   for A,B,C in lines:
    c=np.array(A*np.real(co)+B*np.imag(co),dtype=float);c[-1]-=C;c=np.trim_zeros(c,'f')
    if len(c)>1:ts.extend(float(t.real) for t in np.roots(c) if abs(t.imag)<1e-8 and 1e-9<t.real<1-1e-9)
   ts=sorted(ts);uniq=[ts[0]]
   for t in ts[1:]:
    if t-uniq[-1]>1e-8:uniq.append(t)
   for l,r in zip(uniq,uniq[1:]):
    q=seg.cropped(l,r);v=w.segmap(q,matrix(q.point(.5)))
    if res:
     err=abs(v.start-res[-1].end);maxjoin=max(maxjoin,err)
     if err>1e-5:raise ValueError(('mesh discontinuity',err))
     v.start=res[-1].end
    res.append(v);pieces+=1
  if closed:res[-1].end=res[0].start
  res=[s for s in map(w.quantseg,res) if not w.degenerate(s)]
  if not res:continue
  for i in range(1,len(res)):res[i].start=res[i-1].end
  if closed:res[-1].end=res[0].start
  q=SVGPath(*res);bounds.append(q.bbox());serial=SVGPath(*list(q)[:-1]) if closed and isinstance(q[-1],Line) else q;d=w.compact_rel(serial.d(useSandT=True,use_closed_attrib=False,rel=True));d='M'+d[1:] if d.startswith('m') else d;d+='Z' if closed else '';decoded=parse_path(d)
  if len(decoded)==len(q)+1 and abs(decoded[-1].end-decoded[-1].start)<.0011:decoded=decoded[:-1]
  assert len(decoded)==len(q) and all(max(abs(u.point(t)-v.point(t)) for t in [0,.25,.5,.75,1])<.0011 for u,v in zip(q,decoded))
  subs.append((d,q.bbox(),0))
 for chunk in w.safe_chunks(subs,style.get('fillRule','nonzero')):children.append({'tag':'path',**style,'d':chunk})
x=min(b[0] for b in bounds);X=max(b[1] for b in bounds);y=min(b[2] for b in bounds);Y=max(b[3] for b in bounds);box={'x':x,'y':y,'w':X-x,'h':Y-y};a.update(id='estuary31:continuous-native-bank',bounds=box,anchor={'x':0,'y':0});a['reference']['bounds']=box;a['vector']={'version':1,'viewBox':[x,y,X-x,Y-y],'root':{'tag':'g','children':children}};a['params']['estuaryMacroFit']={'anchors':anchors,'sourceRow':row,'sourceBottom':bottom,'targetBottom':targetbottom,'upperDepthScale':ds,'intentionalArtFit':True,'collisionModified':False};out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(a,separators=(',',':')))
topxs=sorted(set(sp[:,0].tolist()+[x for x in xs if sp[0,0]<=x<=sp[-1,0]]));top=[[point(complex(x,float(np.interp(x,sp[:,0],sp[:,1])))).real,point(complex(x,float(np.interp(x,sp[:,0],sp[:,1])))).imag] for x in topxs];out.with_suffix('.top.json').write_text(json.dumps({'status':'NATIVE NATURAL TOP CANDIDATE; geometry/Engine/root review required','sourceProfile':str(profile),'worldTop':top,'anchors':anchors,'sourceFlattenBound':.015,'sourceVerticalSimplificationBound':.04,'upperDepthScale':ds,'maxZoom165EstimatedProfileErrorCSS':(.015+.04)*ds*1.65,'fullGeometryInAsset':True},indent=2))
r={'sourceSHA256':hashlib.sha256(src.read_bytes()).hexdigest(),'sourceGeometryReused':'100%; all native contours; no clipping or new decorative paths','anchors':anchors,'sourceRow':row,'targetBottom':targetbottom,'upperDepthScale':ds,'maxMeshJoinErrorWorld':maxjoin,'worldSerializationGrid':.001,'nativeCurvePieces':pieces,'pathCount':len(children),'maxPathChars':max(len(n['d']) for n in children),'bytes':out.stat().st_size,'status':'NOT ACCEPTED; explicit macro art fit, not fidelity optimization; native contact/top and physics review pending'};out.with_suffix('.report.json').write_text(json.dumps(r,indent=2));print(json.dumps(r))

# Independent inverse-map occupancy checks consume this local sample fixture.
points=[]
for x in np.linspace(2.17,2168.13,80):
 for y in np.linspace(289.37,581.23,40):
  z=point(complex(x,y));points.append([float(x),float(y),z.real,z.imag])
out.with_suffix('.samples.json').write_text(json.dumps(points))
