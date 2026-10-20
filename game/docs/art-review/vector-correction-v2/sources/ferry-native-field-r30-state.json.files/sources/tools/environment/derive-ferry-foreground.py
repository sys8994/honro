"""Bounded source-shape prototype from a new vector-like authoring reference.
No runtime raster link, dependency installation, or game-source modification.
"""
from pathlib import Path
from PIL import Image,ImageFilter
from scipy import ndimage as nd
import numpy as np,json,hashlib,gzip,sys
ROOT=Path(__file__).resolve().parents[2]
SOURCE=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'game/art-studies/ferry-foreground-authoring/reference.png'
OUT=Path(sys.argv[2]) if len(sys.argv)>2 else ROOT/'_local/reports/ferry-scene-authoring'
OUT.mkdir(parents=True,exist_ok=True)
im=Image.open(SOURCE).convert('RGB');SW,SH=im.size
W=1000;H=round(SH*W/SW)
a=np.array(im.resize((W,H),Image.Resampling.LANCZOS).filter(ImageFilter.MedianFilter(3)))
a=nd.gaussian_filter(a.astype(float),sigma=(.55,.55,0)).clip(0,255).astype(np.uint8)
semantic=['#42483f','#65695b','#878975','#b0ad92','#2e3931','#948060','#685e48','#5e6744']
fixed=Image.new('P',(1,1));colors=[tuple(int(v[i:i+2],16)for i in (1,3,5))for v in semantic]
fixed.putpalette([c for rgb in (colors+[colors[-1]]*248)for c in rgb])
quantized=Image.fromarray(a).quantize(palette=fixed,dither=Image.Dither.NONE)
indices=np.array(quantized);palette=np.array(quantized.getpalette(),dtype=int).reshape(-1,3)
MINIMUM=100
merge_stats=[]
for iteration in range(3):
 stable=np.zeros((H,W),bool);pieces=[]
 for color in np.unique(indices):
  labels,n=nd.label(indices==color);areas=np.bincount(labels.ravel());stable|=(areas[labels]>=MINIMUM)&(labels!=0)
  boxes=nd.find_objects(labels)
  for component in np.flatnonzero((areas>0)&(areas<MINIMUM)):
   if not component:continue
   box=boxes[component-1]
   ys,xs=np.where(labels[box]==component)
   pieces.append((int(color),ys+box[0].start,xs+box[1].start))
 if not pieces:break
 _,nearest=nd.distance_transform_edt(~stable,return_indices=True);nearest_colors=indices[nearest[0],nearest[1]]
 updated=indices.copy()
 for color,ys,xs in pieces:
  # Merge the whole small field into one stable neighbour. Keeping original
  # per-pixel colors here would retain gravel/leaf dots as fragmented noise.
  options,counts=np.unique(nearest_colors[ys,xs],return_counts=True)
  dist=np.sqrt(((palette[options]-palette[color])**2).sum(axis=1))
  score=dist-8*np.log1p(counts)
  neighbor=int(options[np.argmin(score)])
  updated[ys,xs]=neighbor
 merge_stats.append({'pass':iteration+1,'smallComponentsMerged':len(pieces),'smallPixelsMerged':int((~stable).sum())})
 indices=updated

# Reuse only contour and RDP utilities from the prior authoring tool.
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
  if len(ps)>10:loops.append(ps)
 return loops

def native_point(p):return int(round(p[0]*SW/W)),int(round(p[1]*SH/H))
def paths_for(mask,epsilon):
 ds=[];nodes=0;loops_kept=0
 for loop in contours(mask):
  area=abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(loop,loop[1:]))/2)
  if area<24:continue
  q=simplify_ring(loop,epsilon)
  if len(q)<3:continue
  pts=[native_point(p) for p in q]
  # Original boundary direction is retained, including opposite-winding holes.
  fmt=lambda p:f'{p[0]},{p[1]}'
  ds.append('M'+fmt(pts[0])+''.join('L'+fmt(p)for p in pts[1:])+'Z');nodes+=len(pts);loops_kept+=1
 return ''.join(ds),nodes,loops_kept

# The adaptive loop is only a geometry/byte budget operation before any render.
# Its output is still judged on actual rendered pixels, never by these metrics.
def build(epsilon):
 rows=[{'fill':'#555449','d':f'M0,0H{SW}V{SH}H0Z'}];stats=[];nodes=4
 order=sorted(np.unique(indices),key=lambda i:float(np.dot(palette[i],[.25,.6,.15])))
 for i in order:
  d,n,loops=paths_for(indices==i,epsilon)
  if not d:continue
  color='#'+''.join(f'{int(v):02x}' for v in palette[i]);rows.append({'fill':color,'d':d});nodes+=n
  stats.append({'paletteIndex':int(i),'fill':color,'loops':loops,'nodes':n})
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SW} {SH}">\n'+''.join(f'<path fill="{r["fill"]}" d="{r["d"]}"/>\n'for r in rows)+'</svg>\n'
 return rows,stats,nodes,svg
for epsilon in [1.4,1.8,2.2,2.6]:
 rows,stats,nodes,svg=build(epsilon)
 if nodes<=9000 and len(svg.encode())<=150000:break
(OUT/'authored-geology.svg').write_text(svg)
(OUT/'authored-geology.json').write_text(json.dumps({'viewBox':[0,0,SW,SH],'paths':rows},separators=(',',':'))+'\n')
sha=lambda b:hashlib.sha256(b).hexdigest()
provenance={'version':1,'kind':'unapproved-new-authoring-reference-prototype','geometrySource':str(SOURCE),'sourcePngSha256':sha(SOURCE.read_bytes()),'sourceSize':[SW,SH],'sourceFormat':'RGB PNG used only in this offline shape derivation','runtimePngReferences':0,'embeddedRasterImages':0,'filterElements':0,'colorsRequested':8,'colorPathsRetained':len(rows)-1,'workingSize':[W,H],'minimumWorkingComponentArea':MINIMUM,'minimumSourceComponentAreaApprox':MINIMUM*(SW/W)**2,'smallRegionMerging':merge_stats,'simplificationWorkingEpsilon':epsilon,'boundaryNodes':nodes,'rawSvgBytes':len(svg.encode()),'rawJsonBytes':len((OUT/'authored-geology.json').read_bytes()),'gzipSvgBytes':len(gzip.compress(svg.encode(),mtime=0)),'scaleConcept':{'adultSourceHeightPx':30,'adultWorldHeight':103.5,'sourcePixelToWorld':3.45,'fullFieldWorldWidth':SW*3.45,'fullFieldWorldHeight':SH*3.45,'unrelatedToPrior80PixelActorReference':True},'method':'eight-role coarse planes; small connected regions merged into stable neighbouring colours; boundary simplification with preserved winding; native integer path coordinates','candidateSvgSha256':sha(svg.encode()),'approvedArt':False,'runtimeAcceptance':False,'planes':stats}
(OUT/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
print(json.dumps({k:provenance[k]for k in ['colorsRequested','colorPathsRetained','smallRegionMerging','simplificationWorkingEpsilon','boundaryNodes','rawSvgBytes','rawJsonBytes','gzipSvgBytes','scaleConcept']},indent=2))
