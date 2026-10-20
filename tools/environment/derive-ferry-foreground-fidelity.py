"""Controlled fidelity experiment. Offline native paths, no runtime raster.
Preserves source sampling, palette and geometric error as separate outputs.
"""
from pathlib import Path
from PIL import Image,ImageFilter
from scipy import ndimage as nd
import numpy as np,json,hashlib,gzip,sys,time,os
ROOT=Path(__file__).resolve().parents[2]
SOURCE=Path(os.environ.get('HONRO_FERRY_SOURCE',str(ROOT/'game/art-studies/ferry-foreground-authoring/reference.png')))
OUT=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'_local/reports/ferry-fidelity'
OUT.mkdir(parents=True,exist_ok=True)
COLORS=int(sys.argv[2]) if len(sys.argv)>2 else 48
EPSILON=float(sys.argv[3]) if len(sys.argv)>3 else .55
MINIMUM=int(sys.argv[4]) if len(sys.argv)>4 else 12
SPATIAL='--spatial' in sys.argv
CURVES='--curves' in sys.argv
FIT='--fit' in sys.argv
im=Image.open(SOURCE).convert('RGB');SW,SH=im.size;W,H=SW,SH
# Keep original sampling. A 3px median suppresses isolated image compression /
# painted speckles without shrinking the entire source before derivation.
a=np.array(im.filter(ImageFilter.MedianFilter(3)))
palette_source=os.environ.get('HONRO_FERRY_PALETTE')
q=Image.fromarray(a).quantize(palette=Image.open(palette_source),dither=Image.Dither.NONE) if palette_source else Image.fromarray(a).quantize(colors=COLORS,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
indices=np.array(q);palette=np.array(q.getpalette(),dtype=int).reshape(-1,3)
Image.fromarray(palette[indices].astype(np.uint8)).save(OUT/'palette-only.png')
merge_stats=[]
for iteration in range(2):
 stable=np.zeros((H,W),bool);pieces=[]
 for color in np.unique(indices):
  labels,n=nd.label(indices==color);areas=np.bincount(labels.ravel());stable|=(areas[labels]>=MINIMUM)&(labels!=0)
  boxes=nd.find_objects(labels)
  for component in np.flatnonzero((areas>0)&(areas<MINIMUM)):
   if not component:continue
   box=boxes[component-1];ys,xs=np.where(labels[box]==component)
   pieces.append((int(color),ys+box[0].start,xs+box[1].start))
 if not pieces:break
 _,nearest=nd.distance_transform_edt(~stable,return_indices=True);nearest_colors=indices[nearest[0],nearest[1]];updated=indices.copy()
 for color,ys,xs in pieces:
  options,counts=np.unique(nearest_colors[ys,xs],return_counts=True)
  dist=np.sqrt(((palette[options]-palette[color])**2).sum(axis=1));score=dist-3*np.log1p(counts)
  updated[ys,xs]=int(options[np.argmin(score)])
 merge_stats.append({'pass':iteration+1,'components':len(pieces),'pixelsChanged':int((updated!=indices).sum())});indices=updated
Image.fromarray(palette[indices].astype(np.uint8)).save(OUT/'regions-merged.png')
def simplify_open(ps,eps):
 if len(ps)<3:return ps
 a=np.array(ps[0]);b=np.array(ps[-1]);v=b-a;pts=np.array(ps);den=np.linalg.norm(v)
 ds=np.linalg.norm(pts-a,axis=1) if den==0 else np.abs(v[0]*(pts[:,1]-a[1])-v[1]*(pts[:,0]-a[0]))/den
 i=int(np.argmax(ds))
 if ds[i]<=eps:return [ps[0],ps[-1]]
 return simplify_open(ps[:i+1],eps)[:-1]+simplify_open(ps[i:],eps)
def simplify_ring(ps,eps):
 ps=ps[:-1] if ps[0]==ps[-1] else ps
 k=max(range(len(ps)),key=lambda i:(ps[i][0]-ps[0][0])**2+(ps[i][1]-ps[0][1])**2)
 return simplify_open(ps[:k+1],eps)[:-1]+simplify_open(ps[k:]+[ps[0]],eps)[:-1]
def contours(mask):
 # Clockwise pixel boundaries; interior holes retain opposite winding.
 edges={}
 def e(a,b):edges.setdefault(a,[]).append(b)
 ys,xs=np.where(mask)
 for y,x in zip(ys,xs):
  x=int(x);y=int(y)
  if y==0 or not mask[y-1,x]:e((x,y),(x+1,y))
  if x==W-1 or not mask[y,x+1]:e((x+1,y),(x+1,y+1))
  if y==H-1 or not mask[y+1,x]:e((x+1,y+1),(x,y+1))
  if x==0 or not mask[y,x-1]:e((x,y+1),(x,y))
 loops=[]
 while edges:
  start=next(iter(edges));ps=[start];cur=start;prior=(start[0]-1,start[1])
  while True:
   opts=edges[cur];vx,vy=cur[0]-prior[0],cur[1]-prior[1]
   def order(q):
    wx,wy=q[0]-cur[0],q[1]-cur[1];cross=vx*wy-vy*wx;dot=vx*wx+vy*wy
    return {1:0,0:1,-1:2}.get(cross,3) if dot!=-1 else 3
   nxt=min(opts,key=order);opts.remove(nxt)
   if not opts:del edges[cur]
   prior,cur=cur,nxt;ps.append(cur)
   if cur==start:break
   if cur not in edges:break
  if len(ps)>4:loops.append(ps)
 return loops

def native_point(p):return int(round(p[0]*SW/W)),int(round(p[1]*SH/H))
def paths_for(mask,epsilon):
 ds=[];nodes=0;loops_kept=0
 for loop in contours(mask):
  area=abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(loop,loop[1:]))/2)
  if area<4:continue
  q=simplify_ring(loop,epsilon)
  if len(q)<3:continue
  pts=[native_point(p) for p in q]
  # Original boundary direction is retained, including opposite-winding holes.
  fmt=lambda p:f'{p[0]},{p[1]}'
  ds.append('M'+fmt(pts[0])+''.join('L'+fmt(p)for p in pts[1:])+'Z');nodes+=len(pts);loops_kept+=1
 return ''.join(ds),nodes,loops_kept


def fitted_ring(points,error=.72):
 # Least-squares cubic segments, recursively split against source vertices.
 # No image filter or runtime geometry fitting is involved.
 pts=np.array(points,float)
 def unit(v):
  n=np.linalg.norm(v);return v/max(n,1e-12)
 def fit(ps,t1,t2):
  if len(ps)==2:
   l=np.linalg.norm(ps[-1]-ps[0])/3
   return [(ps[0],ps[0]+t1*l,ps[-1]+t2*l,ps[-1])]
  lengths=np.linalg.norm(np.diff(ps,axis=0),axis=1);u=np.r_[0,np.cumsum(lengths)];u/=max(u[-1],1e-9)
  v=1-u;b0=v**3;b1=3*u*v*v;b2=3*u*u*v;b3=u**3
  a1=b1[:,None]*t1;a2=b2[:,None]*t2
  rhs=ps-(b0+b1)[:,None]*ps[0]-(b2+b3)[:,None]*ps[-1]
  c00=(a1*a1).sum();c01=(a1*a2).sum();c11=(a2*a2).sum();x0=(a1*rhs).sum();x1=(a2*rhs).sum();det=c00*c11-c01*c01
  distance=np.linalg.norm(ps[-1]-ps[0]);alpha=(c11*x0-c01*x1)/det if abs(det)>1e-12 else -1;beta=(c00*x1-c01*x0)/det if abs(det)>1e-12 else -1
  if min(alpha,beta)<distance*1e-5 or max(alpha,beta)>max(distance*3,3):alpha=beta=distance/3
  c1=ps[0]+t1*alpha;c2=ps[-1]+t2*beta
  fitted=b0[:,None]*ps[0]+b1[:,None]*c1+b2[:,None]*c2+b3[:,None]*ps[-1]
  ds=np.linalg.norm(fitted-ps,axis=1);split=int(np.argmax(ds))
  if ds[split]<=error:return [(ps[0],c1,c2,ps[-1])]
  split=max(1,min(len(ps)-2,split));middle=unit(ps[split-1]-ps[split+1])
  return fit(ps[:split+1],t1,middle)+fit(ps[split:],-middle,t2)
 k=max(range(len(pts)),key=lambda i:np.linalg.norm(pts[i]-pts[0]))
 first=pts[:k+1];second=np.concatenate((pts[k:],pts[:1]))
 curves=fit(first,unit(first[1]-first[0]),unit(first[-2]-first[-1]))+fit(second,unit(second[1]-second[0]),unit(second[-2]-second[-1]))
 fmt=lambda p:f'{p[0]:.2f},{p[1]:.2f}'.replace('.00','')
 return 'M'+fmt(curves[0][0])+''.join('C'+fmt(c1)+' '+fmt(c2)+' '+fmt(b)for a,c1,c2,b in curves)+'Z'

def spatial_paths(mask,epsilon):
 labels,_=nd.label(mask);groups={}
 for loop in contours(mask):
  area=abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(loop,loop[1:]))/2)
  if area<4:continue
  q=simplify_ring(loop,epsilon)
  if len(q)<3:continue
  pts=[native_point(p) for p in q]
  ax,ay=loop[0];bx,by=loop[1];dx,dy=bx-ax,by-ay
  px=int((ax+bx)/2-dy*.25);py=int((ay+by)/2+dx*.25)
  component=int(labels[min(H-1,max(0,py)),min(W-1,max(0,px))])
  if not component:raise ValueError('Contour lost owning component')
  fmt=lambda p:f'{p[0]:.2f},{p[1]:.2f}'.replace('.00','')
  if FIT:d=fitted_ring(pts)
  elif CURVES:
   # Rounding is bounded by 0.65 source pixels. Long geological corners
   # remain angular; subpixel grid turns become short quadratic segments.
   pairs=[]
   for j,b in enumerate(pts):
    a=np.array(pts[j-1],float);b=np.array(b,float);c=np.array(pts[(j+1)%len(pts)],float)
    u=a-b;v=c-b;lu=np.linalg.norm(u);lv=np.linalg.norm(v)
    radius=min(.65,lu*.28,lv*.28)
    left=b+u/max(lu,.001)*radius;right=b+v/max(lv,.001)*radius
    pairs.append((left,b,right))
   d='M'+fmt(pairs[0][0])
   for j,(left,b,right) in enumerate(pairs):
    if j:d+='L'+fmt(left)
    d+='Q'+fmt(b)+' '+fmt(right)
   d+='Z'
  else:d='M'+fmt(pts[0])+''.join('L'+fmt(p)for p in pts[1:])+'Z'
  r=groups.setdefault(component,{'d':[],'nodes':0,'bounds':[SW,SH,0,0]})
  r['d'].append(d);r['nodes']+=len(pts);z=r['bounds'];z[0]=min(z[0],min(p[0]for p in pts));z[1]=min(z[1],min(p[1]for p in pts));z[2]=max(z[2],max(p[0]for p in pts));z[3]=max(z[3],max(p[1]for p in pts))
 # Components share one colour. Group neighboring bounded components so a
 # tile traverses only local geometry while even-odd holes stay with owners.
 bins={}
 for r in groups.values():
  z=r['bounds'];key=(int((z[0]+z[2])/2//128),int((z[1]+z[3])/2//128))
  g=bins.setdefault(key,{'d':[],'nodes':0,'bounds':[SW,SH,0,0]})
  g['d']+=r['d'];g['nodes']+=r['nodes'];b=g['bounds'];g['bounds']=[min(b[0],z[0]),min(b[1],z[1]),max(b[2],z[2]),max(b[3],z[3])]
 return [{'d':''.join(r['d']),'bounds':r['bounds'],'nodes':r['nodes'],'loops':len(r['d'])}for r in bins.values()]

rows=[{'fill':'#555449','d':f'M0,0H{SW}V{SH}H0Z','bounds':[0,0,SW,SH]}];stats=[];nodes=4
order=sorted(np.unique(indices),key=lambda i:float(np.dot(palette[i],[.25,.6,.15])))
for i in order:
 color='#'+''.join(f'{int(v):02x}' for v in palette[i])
 if SPATIAL:
  pieces=spatial_paths(indices==i,EPSILON)
  n=sum(r['nodes']for r in pieces);loops=sum(r['loops']for r in pieces)
  rows.extend({'fill':color,'d':r['d'],'bounds':r['bounds']}for r in pieces)
 else:
  d,n,loops=paths_for(indices==i,EPSILON)
  if d:rows.append({'fill':color,'d':d})
 nodes+=n;stats.append({'color':color,'loops':loops,'nodes':n})
# Keep source geometry and the world projection fixed for the controlled test.
scene={'viewBox':[0,0,SW,SH],'paths':rows,'renderHints':{'sameFillStrokeWidth':.45},'coverage':[0,0,SW,SH]}
js=(json.dumps(scene,separators=(',',':'))+'\n').encode()
svg=('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+str(SW)+' '+str(SH)+'">'+''.join('<path fill="'+r['fill']+'" stroke="'+r['fill']+'" stroke-width=".45" stroke-linejoin="round" d="'+r['d']+'"/>' for r in rows)+'</svg>\n').encode()
(OUT/'foreground.json').write_bytes(js);(OUT/'foreground.svg').write_bytes(svg)
p={'experiment':'same-source-native-fidelity','approvedArt':False,'geometrySource':str(SOURCE.relative_to(ROOT)),'sourcePngSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'sourceSize':[SW,SH],'workingSize':[W,H],'colors':COLORS,'retainedColors':len(stats),'spatialGroups':len(rows),'curves':CURVES or FIT,'leastSquaresCubicFit':FIT,'medianSourcePixels':3,'minimumRegionSourcePixels':MINIMUM,'boundaryErrorSourcePixels':EPSILON,'minimumLoopSourceArea':4,'mergeStats':merge_stats,'boundaryNodes':nodes,'rawSvgBytes':len(svg),'gzipSvgBytes':len(gzip.compress(svg,mtime=0)),'rawJsonBytes':len(js),'gzipJsonBytes':len(gzip.compress(js,mtime=0)),'sameFillStrokeWidthSourcePixels':.45,'projection':{'x':-900,'y':740,'worldWidth':6000,'worldPerSourcePixel':6000/SW,'adultWorldHeight':103.5,'adultSourcePixels':103.5*SW/6000},'paths':stats,'runtimeRasterReferences':0}
(OUT/'provenance.json').write_text(json.dumps(p,indent=2)+'\n')
print(json.dumps({k:v for k,v in p.items() if k!='paths'},indent=2))
