"""Map native Inkscape causeway twice per route at uniform scale. No invented artwork."""
import json,sys,copy,xml.etree.ElementTree as E
from pathlib import Path
import numpy as np
from svgpathtools import parse_path,Line
from shapely.geometry import Polygon,box
from shapely.ops import unary_union
sys.path.insert(0,'tools/vector-production');from bounded_flatten import flatten
D=Path(__file__).parent;out=Path('_local/reports/causeway-silhouette-v3');out.mkdir(parents=True,exist_ok=True)
p=json.loads(Path('_local/reports/sea-silhouette-v3/project.json').read_text());s=next(s for s in p['stages'] if s['metadata']['stageId']==33)
a0=json.loads((D/'causeway-master-asset.json').read_text());r=E.parse(D/'causeway-master.svg').getroot();d=next(e.get('d') for e in r.iter() if e.get('id')=='path7');outer=parse_path(d);xmin,xmax,ymin,ymax=outer.bbox();xmin+=35;xmax-=35;fd=parse_path(flatten(d,.18));sourcepts=[fd[0].start]+[z.end for z in fd]
def top(x):
 hits=[]
 for z in outer:
  try:hits.extend(z.point(t).imag for t,u in z.intersect(Line(complex(x,-1000),complex(x,2000))))
  except ValueError:pass
 return min(hits) if hits else ymin
left=top(xmin+.05);right=top(xmax-.05)
entries=[]
for side in ['west','east']:
 t=next(t for t in s['terrains'] if t['id']==f'a4-33-upper-{side}');old=copy.deepcopy(t);ctrl=t['control'];xs=[q['x'] for q in ctrl];ys=[q['y'] for q in ctrl];start,end=xs[0],xs[-1];width=(end-start)/2;scale=width/(xmax-xmin);children=[];clips={};polys=[];a=copy.deepcopy(a0)
 for tile in range(2):
  x0=start+tile*width;dx=x0-scale*xmin
  # Subtract the source-end baseline, preserving its actual shallow top deviations.
  bm=(right-left)/(xmax-xmin);bb=left-bm*xmin
  cuts=sorted(set([x0,x0+width,*[x for x in xs if x0<x<x0+width]]))
  for j,(lo,hi) in enumerate(zip(cuts[:-1],cuts[1:])):
   y0=float(np.interp(lo,xs,ys));y1=float(np.interp(hi,xs,ys));m=(y1-y0)/(hi-lo);f=y0-m*lo+m*dx-scale*bb;c=m*scale-scale*bm;key=f'{tile}-{j}'
   clips[key]=[f'M{lo-.00001} -10000H{hi+.00001}V10000H{lo-.00001}Z']
   children.append({'tag':'g','clipPath':key,'pixelSnapClip':True,'children':[{'tag':'g','transform':[scale,c,0,scale,dx,f],'children':[{'tag':'use','symbol':'source'}]}]})
  pp=[]
  for z in sourcepts:
   x=scale*z.real+dx;y=float(np.interp(x,xs,ys))+scale*(z.imag-(bm*z.real+bb));pp.append((x,y))
  poly=Polygon(pp).buffer(0).intersection(box(x0,0,x0+width,10000));polys.append(poly)
 union=unary_union(polys).buffer(.015).buffer(-.015)
 if union.geom_type!='Polygon':raise ValueError('Disconnected route '+side)
 pts=list(union.simplify(.12,preserve_topology=True).exterior.coords)[:-1];bounds=union.bounds
 a.update(id=f's33-silhouette:causeway-{side}',name='Native blue dawn causeway '+side,bounds=dict(zip(['x','y','w','h'],[bounds[0],bounds[1],bounds[2]-bounds[0],bounds[3]-bounds[1]])),anchor={'x':0,'y':0});a['vector']={'version':1,'viewBox':[a['bounds'][k] for k in ['x','y','w','h']],'symbols':{'source':a0['vector']['root']},'clips':clips,'root':{'tag':'g','children':children}};a['reference']['bounds']=a['bounds'];a['params'].update(source='causeway-master.svg',uniformScale=scale,sourceRepeats=2,topBaselineFit=[left,right],sourceOuterPath='path7',visualApproval=False)
 # Same real boundary for paint and one-way collider; underside intentionally nonblocking.
 t.clear();t.update(id=old['id'],type='solid',baseMaterial='rock',oneWay=True,breakable=False,points=[{'x':round(x,5),'y':round(y,5)} for x,y in pts])
 inst=next(e for e in s['elements'] if e['id']==f's33-density:refuge-{side}');inst['assetId']=a['id'];p['library'].append(a);file=D/f'{side}-asset.json';file.write_text(json.dumps(a,separators=(',',':')));entries.append({'assetFile':str(file),'instanceId':inst['id'],'assetId':a['id'],'oldTerrain':old,'terrain':t,'scale':scale,'vertices':len(pts),'visualBounds':a['bounds']})
p['stages']=[s];p['activeStageId']=s['id'];p['production']['cards'][s['id']]={'cameraViews':[{'id':'normal','x':2900,'y':1900,'scale':.53,'width':1440,'height':900},{'id':'detail','x':2350,'y':1920,'scale':.94,'width':1440,'height':900},{'id':'mobile','x':2900,'y':1900,'scale':.32,'width':430,'height':932}]}
(out/'candidate-project.json').write_text(json.dumps(p,separators=(',',':')));(D/'integration.json').write_text(json.dumps({'stage':33,'entries':entries,'visualApproval':False,'geometryChanged':True,'semantic':'oneWay solid; underside nonblocking, preserve actual route/gap and test tide'},indent=2));print([(e['scale'],e['vertices'],e['visualBounds']) for e in entries])
