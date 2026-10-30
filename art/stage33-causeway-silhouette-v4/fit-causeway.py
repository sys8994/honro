"""Source-derived bridge mapping: one native source per route, smooth gameplay skeleton, no generated decorative geometry."""
import json,sys,copy,re,shutil,xml.etree.ElementTree as E
from pathlib import Path
import numpy as np
from scipy.interpolate import PchipInterpolator
from svgpathtools import parse_path,Line
from shapely.geometry import Polygon,box
sys.path.insert(0,'tools/vector-production');from bounded_flatten import flatten
D=Path(__file__).parent;O=Path('_local/reports/causeway-silhouette-v4');S=O/'optimization'
for a,b in [('simplify-0.0002.svg','causeway-master.svg'),('simplify-0.0002.json','causeway-master-asset.json'),('report.json','optimization-report.json')]:shutil.copy(S/a,D/b)
p=json.loads(Path('_local/reports/sea-silhouette-v3/project.json').read_text());s=next(s for s in p['stages'] if s['metadata']['stageId']==33);r=E.parse(D/'causeway-master.svg').getroot();source=[e for e in r.iter() if e.tag.endswith('path')];outer=parse_path(source[0].get('d'));xmin,xmax,ymin,ymax=outer.bbox();xmin+=30;xmax-=30
# Raw/optimized trace remains immutable. Only geometric coordinate conversion below.
def top(x):
 hits=[]
 for z in outer:
  try:hits.extend(z.point(t).imag for t,u in z.intersect(Line(complex(x,-1000),complex(x,2000))))
  except ValueError:pass
 return min(hits) if hits else ymin
left,right=top(xmin+.01),top(xmax-.01);entries=[]
for side in ['west','east']:
 t=next(t for t in s['terrains'] if t['id']==f'a4-33-upper-{side}');old=copy.deepcopy(t)
 anchors=([[900,2135],[1250,2010],[1650,1940],[2700,1940],[3050,2117]] if side=='west' else [[3100,2134],[3650,1910],[4900,1910],[5300,2104]])
 curve=PchipInterpolator(*np.array(anchors).T);start,end=anchors[0][0],anchors[-1][0];scale=(end-start)/(xmax-xmin);baseSlope=(right-left)/(xmax-xmin)
 def warp(z):
  x=start+(z.real-xmin)*scale;return (x,float(curve(np.clip(x,start,end)))+scale*(z.imag-left-baseSlope*(z.real-xmin)))
 children=[];outerpts=None
 for index,e in enumerate(source):
  paths=[]
  for part in re.findall(r'[Mm][^Mm]*',flatten(e.get('d'),.12)):
   path=parse_path(part);points=[path[0].start]+[z.end for z in path]
   # Densify source edges to bound nonlinear macro mapping, 8world max step.
   dense=[]
   for a,b in zip(points[:-1],points[1:]):
    n=max(1,int(abs(b-a)*scale/8)+1);dense.extend(a+(b-a)*i/n for i in range(n))
   dense.append(points[-1]);xy=[warp(z) for z in dense]
   if index==0:outerpts=xy
   paths.append('M'+'L'.join(f'{x:.4f},{y:.4f}' for x,y in xy)+'Z')
  children.append({'tag':'path','fill':e.get('style').split('fill:')[1].split(';')[0],'stroke':'none','d':' '.join(paths)})
 poly=Polygon(outerpts).buffer(0).intersection(box(start,0,end,10000)).simplify(.2,preserve_topology=True)
 pts=list(poly.exterior.coords)[:-1];bounds=poly.bounds;bounds=dict(zip(['x','y','w','h'],[bounds[0],bounds[1],bounds[2]-bounds[0],bounds[3]-bounds[1]]))
 a=json.loads((D/'causeway-master-asset.json').read_text());a.update(id=f's33-silhouette:causeway-{side}-v4',bounds=bounds);a['reference']['bounds']=bounds;a['vector']={'version':1,'viewBox':[bounds[k] for k in ['x','y','w','h']],'clips':{'span':[f'M{start} 0H{end}V10000H{start}Z']},'root':{'tag':'g','clipPath':'span','children':children}};a['params'].update(source='causeway-master.svg',uniformScale=scale,sourceRepeats=1,macroSkeleton=anchors,nonlinearWarp='PCHIP gameplay spine; native outline retained',flattenToleranceSource=.12,physicsToleranceWorld=.2,visualApproval=False)
 t.clear();t.update(id=old['id'],type='solid',baseMaterial='rock',oneWay=True,breakable=False,points=[{'x':round(x,4),'y':round(y,4)} for x,y in pts]);inst=next(e for e in s['elements'] if e['id']==f's33-density:refuge-{side}');inst['assetId']=a['id'];p['library'].append(a);file=D/f'{side}-asset.json';file.write_text(json.dumps(a,separators=(',',':')));entries.append({'assetFile':str(file),'assetId':a['id'],'instanceId':inst['id'],'oldTerrain':old,'terrain':t,'vertices':len(pts),'bounds':bounds,'maxPath':max(len(c['d']) for c in children)})
p['stages']=[s];p['activeStageId']=s['id'];p['production']=json.loads(Path('_local/reports/causeway-silhouette-v3/candidate-project.json').read_text())['production'];(O/'candidate-project.json').write_text(json.dumps(p,separators=(',',':')));(D/'integration.json').write_text(json.dumps({'stage':33,'entries':entries,'visualApproval':False,'geometryChanged':True},indent=2));print([(e['vertices'],e['maxPath'],e['bounds']) for e in entries])
