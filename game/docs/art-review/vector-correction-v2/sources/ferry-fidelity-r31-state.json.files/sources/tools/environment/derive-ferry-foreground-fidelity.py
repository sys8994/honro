"""Controlled fidelity experiment. Offline native paths, no runtime raster.
Preserves source sampling, palette and geometric error as separate outputs.
"""
from pathlib import Path
from PIL import Image,ImageFilter
from scipy import ndimage as nd
import numpy as np,json,hashlib,gzip,sys,time
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'game/art-studies/ferry-foreground-authoring/reference.png'
OUT=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'_local/reports/ferry-fidelity'
OUT.mkdir(parents=True,exist_ok=True)
COLORS=int(sys.argv[2]) if len(sys.argv)>2 else 48
EPSILON=float(sys.argv[3]) if len(sys.argv)>3 else .55
MINIMUM=int(sys.argv[4]) if len(sys.argv)>4 else 12
im=Image.open(SOURCE).convert('RGB');SW,SH=im.size;W,H=SW,SH
# Keep original sampling. A 3px median suppresses isolated image compression /
# painted speckles without shrinking the entire source before derivation.
a=np.array(im.filter(ImageFilter.MedianFilter(3)))
q=Image.fromarray(a).quantize(colors=COLORS,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
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


rows=[{'fill':'#555449','d':f'M0,0H{SW}V{SH}H0Z'}];stats=[];nodes=4
order=sorted(np.unique(indices),key=lambda i:float(np.dot(palette[i],[.25,.6,.15])))
for i in order:
 d,n,loops=paths_for(indices==i,EPSILON)
 if not d:continue
 color='#'+''.join(f'{int(v):02x}' for v in palette[i]);rows.append({'fill':color,'d':d});nodes+=n
 stats.append({'color':color,'loops':loops,'nodes':n})
# Keep source geometry and the world projection fixed for the controlled test.
scene={'viewBox':[0,0,SW,SH],'paths':rows,'renderHints':{'sameFillStrokeWidth':.45},'coverage':[0,0,SW,SH]}
js=(json.dumps(scene,separators=(',',':'))+'\n').encode()
svg=('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+str(SW)+' '+str(SH)+'">'+''.join('<path fill="'+r['fill']+'" stroke="'+r['fill']+'" stroke-width=".45" stroke-linejoin="round" d="'+r['d']+'"/>' for r in rows)+'</svg>\n').encode()
(OUT/'foreground.json').write_bytes(js);(OUT/'foreground.svg').write_bytes(svg)
p={'experiment':'same-source-native-fidelity','approvedArt':False,'geometrySource':str(SOURCE.relative_to(ROOT)),'sourcePngSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),'sourceSize':[SW,SH],'workingSize':[W,H],'colors':COLORS,'retainedColors':len(rows)-1,'medianSourcePixels':3,'minimumRegionSourcePixels':MINIMUM,'boundaryErrorSourcePixels':EPSILON,'minimumLoopSourceArea':4,'mergeStats':merge_stats,'boundaryNodes':nodes,'rawSvgBytes':len(svg),'gzipSvgBytes':len(gzip.compress(svg,mtime=0)),'rawJsonBytes':len(js),'gzipJsonBytes':len(gzip.compress(js,mtime=0)),'sameFillStrokeWidthSourcePixels':.45,'projection':{'x':-900,'y':740,'worldWidth':6000,'worldPerSourcePixel':6000/SW,'adultWorldHeight':103.5,'adultSourcePixels':103.5*SW/6000},'paths':stats,'runtimeRasterReferences':0}
(OUT/'provenance.json').write_text(json.dumps(p,indent=2)+'\n')
print(json.dumps({k:v for k,v in p.items() if k!='paths'},indent=2))
