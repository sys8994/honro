import json,copy,xml.etree.ElementTree as E
from pathlib import Path
import numpy as np
from svgpathtools import parse_path,Line
D=Path(__file__).parent
sourceXs={31:[[90,460],[648,1264],[1316,1556,2081]],37:[[158,752,1620,1826]],40:[[87,465,1353,1722,2100]]}
for n in [31,37,40]:
 d=D/f'wood{n}';mp=json.load(open(d/'mapping.json'));src=json.load(open(d/'source-asset.json'));outer=parse_path(next(e.get('d') for e in E.parse(d/'wood-master.svg').getroot().iter() if e.get('id')=='path7'));subs=sorted([p for p in outer.continuous_subpaths() if abs(p.area())>1000],key=lambda p:p.bbox()[0]);assets=[];reports=[]
 for j,(terrain,xs,piece) in enumerate(zip(mp['terrains'],sourceXs[n],subs)):
  if 'control'in terrain:control=terrain['control'];thick=terrain['thickness']
  else:control=terrain['points'][:len(terrain['points'])//2];thick=24
  assert len(control)==len(xs)
  def vertical(x):
   ys=[]
   for seg in piece:
    try:ys += [seg.point(t).imag for t,u in seg.intersect(Line(complex(x,0),complex(x,724)))]
    except ValueError:pass
   return min(ys),max(ys)
  samples=[vertical((l+r)/2) for l,r in zip(xs[:-1],xs[1:])];sy=thick/float(np.median([b-a for a,b in samples]));a=copy.deepcopy(src);v=a['vector'];v['symbols']={'wood-source':v['root']};v['clips']={};ch=[];dev=[]
  for i,(sl,sr,l,r) in enumerate(zip(xs[:-1],xs[1:],control[:-1],control[1:])):
   yl=vertical(sl)[0];yr=vertical(sr)[0]
   #37 native joint cap is a recessed seam, not the supporting plank plane. Estimate each segment endpoint from its adjacent real top face.
   if n==37:yl=vertical(sl+8)[0]-(vertical(sl+20)[0]-vertical(sl+8)[0])*8/12;yr=vertical(sr-8)[0]+(vertical(sr-8)[0]-vertical(sr-20)[0])*8/12
   sx=(r['x']-l['x'])/(sr-sl);m=(r['y']-l['y']-sy*(yr-yl))/(sr-sl);bx=l['x']-sx*sl;by=l['y']-sy*yl-m*sl;k=f'piece-{i}';v['clips'][k]=[f"M{l['x']-.00001} 0H{r['x']+.00001}V40000H{l['x']-.00001}Z"];ch.append({'tag':'g','clipPath':k,'pixelSnapClip':True,'children':[{'tag':'g','transform':[sx,m,0,sy,bx,by],'children':[{'tag':'use','symbol':'wood-source'}]}]})
   for x in np.linspace(sl+2,sr-2,41):
    actual=m*x+sy*vertical(x)[0]+by;target=l['y']+(r['y']-l['y'])*(x-sl)/(sr-sl);dev.append(actual-target)
  lo=control[0]['x'];hi=control[-1]['x'];ymin=min(p['y'] for p in control)-8;ymax=max(p['y'] for p in control)+thick+12;a['id']=f's{n}-silhouette:wood-route-v4-{j}';a['bounds']={'x':lo,'y':ymin,'w':hi-lo,'h':ymax-ymin};a['reference']['bounds']=a['bounds'];v['viewBox']=[lo,ymin,hi-lo,ymax-ymin];v['root']={'tag':'g','children':ch};a['params'].update(collisionSource=terrain['id'],preservedCollision=True,sourceKnees=xs,verticalScale=sy);assets.append(a);reports.append({'terrainId':terrain['id'],'assetId':a['id'],'sourceKnees':xs,'verticalScale':sy,'minVisualTopDeviationWorld':min(dev),'maxVisualTopDeviationWorld':max(dev),'collisionUnchanged':True})
 (d/'assets.json').write_text(json.dumps(assets,separators=(',',':')));(d/'fit-report.json').write_text(json.dumps(reports,indent=2));print(n,reports)
