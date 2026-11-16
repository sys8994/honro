"""Register traced vector paint to existing contacts; no raster/physics edits.

 Warp the native color stack and native alpha together. The lower canvas edge
 stays fixed. Native paths are adaptively sampled, then bounded to .025 source
 pixel chord error. This is an authored vector edit, before final optimization.
"""
from pathlib import Path
import sys,json,math,re,hashlib
import numpy as np
from lxml import etree as E
from svgpathtools import parse_path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act4-sideview-p1-20261116'
sys.path.insert(0,str(ROOT/'tools/terrain-node-optimizer'))
from optimize_svg import canonical_subpaths,flatten,rdp
n=int(sys.argv[1]);td=OUT/(f'trace{n}-front-extended' if n==33 else f'trace{n}-front');dest=OUT/f'registered{n}-v2';dest.mkdir(exist_ok=True)
stage=json.loads((OUT/f'stage{n}-canonical.json').read_text(encoding='utf-8'));layout=json.loads((ROOT/'shared/assets/environment/act4-sideview/source/layout.json').read_text()).get(str(n),{})
z=layout.get('worldPerPixel',stage['width']/1536);offset=layout.get('offsetX',0)
ids=['approved33-left-bank','approved33-low'] if n==33 else ['approved40-coast-east']
points=[]
for tid in ids:
 t=next(t for t in stage['terrains'] if t['id']==tid);edges=t['properties']['honroWalkEdges']
 points.extend(((t['points'][i]['x']-offset)/z,t['points'][i]['y']/z) for i in edges)
 p=t['points'][edges[-1]+1];points.append(((p['x']-offset)/z,p['y']/z))
points=sorted(set(points));tx,ty=np.array(points).T
grid=np.arange(0,1536.0001,.25);tops=np.full(len(grid),np.inf)
alpha=E.parse(str(td/'alpha-raw.svg'))
for p in alpha.findall('.//{*}path'):
 for raw in canonical_subpaths(p.get('d')):
  for seg in parse_path(raw):
   flat=flatten(seg,.025)
   for a,b in zip(flat,flat[1:]):
    if abs(a.real-b.real)<1e-8:continue
    lo,hi=sorted([a.real,b.real]);i=max(0,math.ceil(lo*4));j=min(len(grid),math.floor(hi*4)+1)
    if i<j:
     ys=a.imag+(grid[i:j]-a.real)*(b.imag-a.imag)/(b.real-a.real)
     tops[i:j]=np.minimum(tops[i:j],ys)
valid=np.isfinite(tops);tops=np.interp(grid,grid[valid],tops[valid])
target=np.interp(grid,tx,ty);delta=target-tops
if n==40 or offset:
 # Keep existing nonplay junctions: taper only outside the selected contact.
 weight=np.clip(np.minimum((grid-tx[0]+48)/48,(tx[-1]+80-grid)/80),0,1)
 delta*=weight
def warp(v):
 x,y=v.real,v.imag;t=float(np.interp(x,grid,tops));d=float(np.interp(x,grid,delta))
 weight=max(0,min(1,(1024-y)/max(1,1024-t)))
 # The generated nonplay wing originally crossed the departure-pier posts.
 # Compress only x < the east route's first point; every playable contact x
 # is unchanged. Existing boat and all separate wood assets stay untouched.
 out_x=tx[0]-(tx[0]-x)*.15 if n==40 and x<tx[0] else x
 return complex(out_x,y+d*weight)
def sample(seg,a=0,b=1,depth=0):
 u,v=warp(seg.point(a)),warp(seg.point(b));m=(a+b)/2;q=warp(seg.point(m))
 # Midpoint plus quarter points protect S curves and sharp contact bends.
 def dist(p):
  vec=v-u
  if abs(vec)<1e-9:return abs(p-u)
  k=max(0,min(1,((p-u).real*vec.real+(p-u).imag*vec.imag)/(abs(vec)**2)))
  return abs(p-(u+k*vec))
 err=max(dist(q),dist(warp(seg.point((3*a+b)/4))),dist(warp(seg.point((a+3*b)/4))))
 if depth<20 and (err>.02 or abs(v.real-u.real)>2):return sample(seg,a,m,depth+1)[:-1]+sample(seg,m,b,depth+1)
 return [u,v]
counts={}
for kind in ['color','alpha']:
 tree=E.parse(str(td/f'{kind}-raw.svg'));before=after=0
 for p in tree.findall('.//{*}path'):
  chunks=[]
  for raw in canonical_subpaths(p.get('d')):
   sub=parse_path(raw);before+=len(sub);flat=[]
   for seg in sub:
    q=sample(seg);flat.extend(q if not flat else q[1:])
   if not flat:continue
   flat=rdp(flat,.005);after+=len(flat)-1
   fmt=lambda v:f'{v.real:.4f},{v.imag:.4f}'
   chunks.append('M'+fmt(flat[0])+'L'+' '.join(fmt(v) for v in flat[1:])+('Z' if re.search(r'[Zz]\s*$',raw) else ''))
  p.set('d',' '.join(chunks))
 out=dest/f'{kind}-registered.svg';tree.write(str(out),encoding='utf-8',xml_declaration=True)
 counts[kind]={'segmentsBefore':before,'segmentsAfterEdit':after,'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
record={'stage':n,'operation':'shared native color/alpha vertical registration, bottom fixed; no gameplay mutation',
 'selectedTerrainIds':ids,'maximumContactShiftWorld':float(np.max(np.abs(delta))*z),'samplingChordToleranceSourcePx':.025,'sourceToWorld':{'scale':z,'offsetX':offset},'nonplayLeftCompression':.15 if n==40 else None,'counts':counts}
(dest/'registration.json').write_text(json.dumps(record,indent=2),encoding='utf-8');print(json.dumps(record),flush=True)
