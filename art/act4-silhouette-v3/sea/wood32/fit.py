import json,xml.etree.ElementTree as E,numpy as np
from pathlib import Path
from svgpathtools import parse_path,Line
D=Path(__file__).parent;p=parse_path(next(e.get('d') for e in E.parse(D/'wood-raw.svg').getroot().iter() if e.get('id')=='path7'))
def top(x):
 ys=[]
 for s in p:
  try:ys.extend(s.point(t).imag for t,u in s.intersect(Line(complex(x,0),complex(x,724))))
  except ValueError:pass
 return min(ys)
a=json.loads((D/'source-asset.json').read_text());v=a['vector'];v['symbols']={'wood-source':v['root']};v['clips']={};ch=[];report=[]
xs=[115,755,1645,2060];wx=[1200,1660,2300,2600];wy=[2010,1760,1760,2000];sy=.46
for i in range(3):
 lo,hi=xs[i:i+2];l,r=wx[i:i+2];y,z=wy[i:i+2];sx=(r-l)/(hi-lo);slope=(top(hi)-top(lo))/(hi-lo);c=(z-y)/(hi-lo)-sy*slope;f=y-sy*top(lo)-c*lo;dx=l-sx*lo;k=f'panel{i}';v['clips'][k]=[f'M{l-.00001} 1500 H{r+.00001} V2300 H{l-.00001}Z'];tr=[sx,c,0,sy,dx,f];ch.append({'tag':'g','clipPath':k,'pixelSnapClip':True,'children':[{'tag':'g','transform':tr,'children':[{'tag':'use','symbol':'wood-source'}]}]});samples=[]
 for x in np.linspace(lo,hi,60):
  yy=sy*top(x)+c*x+f;target=y+(z-y)*(x-lo)/(hi-lo);samples.append(yy-target)
 report.append({'sourceX':[lo,hi],'worldX':[l,r],'transform':tr,'maxTopDeviationWorld':max(abs(q) for q in samples)})
v['root']={'tag':'g','children':ch};a['id']='s32-silhouette:wood-route-v3';a['bounds']={'x':1198,'y':1750,'w':1404,'h':320};a['reference']['bounds']=a['bounds'];v['viewBox']=[1198,1750,1404,320];a['params']={'source':'wood-raw.svg','method':'Actual fullroute skeleton concept →native8scantrace→three actual knee-aligned panels','collision':'existing oneWay platform untouched; visible top tested against exact line','panels':report};(D/'asset.json').write_text(json.dumps(a,separators=(',',':')));(D/'fit-report.json').write_text(json.dumps(report,indent=2));print(report)
