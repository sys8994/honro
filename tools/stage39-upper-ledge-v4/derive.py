from pathlib import Path
import sys,json,xml.etree.ElementTree as E
sys.path.insert(0,'tools/vector-production')
from bounded_flatten import flatten
from svgpathtools import parse_path
from shapely.geometry import Polygon,LineString
D=Path('art/stage39-upper-ledge-v4');root=E.parse(D/'ledge-source.svg').getroot();paths=root.findall('.//{http://www.w3.org/2000/svg}path')
pp=parse_path(flatten(paths[0].attrib['d'],.08));polys=[]
for s in pp.continuous_subpaths():
 p=Polygon([(c.start.real,c.start.imag) for c in s]);
 if p.is_valid:polys.append(p)
p=max(polys,key=lambda p:p.area)
def bounds(x):return p.intersection(LineString([(x,0),(x,724)])).bounds[1::2]
for x in [50,55,60,100,1086,1100,2100,2110,2118,2120]: print(x,bounds(x))
(D/'native-outline.json').write_text(json.dumps(list(p.exterior.coords)))
import copy,math
anchors=[(4600,1790,60),(5300,1720,1086),(6000,1720,2110)]; sy=.44;segments=[];tops=[];bottoms=[]
for a,b in zip(anchors,anchors[1:]):
 wx,wy,x=a;vx,vy,z=b;u0,u1=bounds(x)[0],bounds(z)[0];sx=(vx-wx)/(z-x); ms=(u1-u0)/(z-x);mw=(vy-wy)/(vx-wx);tr=[sx,mw*sx-sy*ms,0,sy,wx-sx*x,wy-mw*sx*x-sy*u0+sy*ms*x]
 segments.append({'sourceRange':[x,z],'worldRange':[wx,vx],'transform':tr})
 for i in range(math.ceil((z-x)/2)+1):
  xx=x+(z-x)*i/math.ceil((z-x)/2);lo,hi=bounds(xx); X=sx*xx+tr[4];Y=tr[1]*xx+tr[5]
  if tops and abs(X-tops[-1][0])<1e-7:continue
  tops.append((X,Y+sy*lo));bottoms.append((X,Y+sy*hi))
# Error-bounded simplification with anchors retained; both boundaries monotone x.
def simple(points):return list(LineString(points).simplify(.18,preserve_topology=False).coords)
top=simple(tops[:next(i for i,p in enumerate(tops) if abs(p[0]-5300)<1e-5)+1])+simple(tops[next(i for i,p in enumerate(tops) if abs(p[0]-5300)<1e-5):])[1:];bot=simple(bottoms);outline=top+list(reversed(bot));poly=Polygon(outline);assert poly.is_valid
slopes=[abs((b[1]-a[1])/(b[0]-a[0]))for a,b in zip(top,top[1:])];assert max(slopes)<1.35,max(slopes)
result={'originalType':'platform','newType':'solid','oneWay':True,'anchors':anchors,'segments':segments,'top':top,'bottom':bot,'points':[{'x':x,'y':y}for x,y in outline],'maxTopSlope':max(slopes),'maxThickness':max(b[1]-a[1]for a,b in zip(tops,bottoms)),'simplifyErrorWorld':.18,'flattenErrorSource':.08,'sourceCrop':[60,2110],'nativeSource':'ledge-source.svg','status':'pending actual visual and gameplay QA'}
(D/'contour.json').write_text(json.dumps(result,indent=2));print('top',len(top),'bottom',len(bot),'slope',max(slopes),'depth',result['maxThickness'])
S='http://www.w3.org/2000/svg';E.register_namespace('',S);r=E.Element('{'+S+'}svg',{'viewBox':'0 0 2172 724'});palette=['#526477','#526477','#40566a','#344b5d','#2b4052','#253949','#1c2d3e']
for e,col in zip(paths,palette):
 q=copy.deepcopy(e);q.set('style','fill:'+col);r.append(q)
E.ElementTree(r).write(D/'palette.svg',encoding='utf-8',xml_declaration=True)
(D/'import-config.json').write_text(json.dumps({'id':'s39-authored-v4:upper-source','name':'39 native full-profile stone ledge','category':'rock','semanticLayer':'SURFACE','bounds':{'x':0,'y':0,'w':2172,'h':724},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':724},'params':{'sourceConcept':'concept.png','nativeTrace':'ledge-source.svg'}}))
