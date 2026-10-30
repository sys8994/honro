from pathlib import Path
import json,copy,xml.etree.ElementTree as E,numpy as np
from svgpathtools import parse_path,Line
D=Path(__file__).parent;src=json.load(open(D/'source-asset.json'));t=json.load(open(D/'mapping.json'))['terrain'];outer=parse_path(next(e.get('d')for e in E.parse(D/'wall-top-aligned.svg').getroot().iter()if e.tag.endswith('path')))
def top(x):
 ys=[]
 for seg in outer:
  try:ys +=[seg.point(u).imag for u,v in seg.intersect(Line(complex(x,0),complex(x,724)))]
  except ValueError:pass
 return min(ys)
xs=[200,900,2020];sy=.49;a=copy.deepcopy(src);v=a['vector'];v['symbols']={'native-wall':v['root']};v['clips']={};ch=[];report=[]
for i,(sl,sr,l,r)in enumerate(zip(xs[:-1],xs[1:],t['control'][:-1],t['control'][1:])):
 yl=top(sl);yr=top(sr);sx=(r['x']-l['x'])/(sr-sl);m=(r['y']-l['y']-sy*(yr-yl))/(sr-sl);bx=l['x']-sx*sl;by=l['y']-sy*yl-m*sl;k=f'piece-{i}';v['clips'][k]=[f'M{l["x"]-.00001} 0H{r["x"]+.00001}V4000H{l["x"]-.00001}Z'];ch.append({'tag':'g','clipPath':k,'pixelSnapClip':True,'children':[{'tag':'g','transform':[sx,m,0,sy,bx,by],'children':[{'tag':'use','symbol':'native-wall'}]}]});dev=[]
 for x in np.linspace(sl+2,sr-2,101):dev.append(m*x+sy*top(x)+by-(l['y']+(r['y']-l['y'])*(x-sl)/(sr-sl)))
 report.append({'sourceX':[sl,sr],'worldX':[l['x'],r['x']],'minTopErrorWorld':min(dev),'maxTopErrorWorld':max(dev),'matrix':[sx,m,0,sy,bx,by]})
a['id']='s37-silhouette:broken-wall-v5';a['bounds']={'x':5100,'y':2115,'w':900,'h':245};a['reference']['bounds']=a['bounds'];v['viewBox']=[5100,2115,900,245];v['root']={'tag':'g','children':ch};a['params'].update(fit='two native architectural panels at actual macro knee, no texture warp; same original oneWayrock collision retained',sourceKnees=xs,topBandAlignment=json.load(open(D/'top-band-report.json')),collisionSource=t['id'],topFit=report,drawOrder='beforeopaqueBODY so approachenteringsoil is occluded naturally');(D/'asset.json').write_text(json.dumps(a,separators=(',',':')));(D/'fit-report.json').write_text(json.dumps(report,indent=2));print(report)
