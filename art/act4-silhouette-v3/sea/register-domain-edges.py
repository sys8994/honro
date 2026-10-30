"""Source-derived material continuation outside playable native art; no new collider.
Read the native boundary cross-section and continue its layer depths along the
existing physical far-bank contour. Keep exact gameplay artwork and terrain.
"""
from pathlib import Path
import copy,json,hashlib,numpy as np
from svgpathtools import parse_path
D=Path(__file__).parent;R=D.parents[2];O=R/'_local/reports/sea-silhouette-v3'
SOURCES={31:'stage31-cargo-01f5c503.json',37:'stage37-review-09915a90.json',40:'stage40-review-58173023.json'}
def paths(n):
 if n['tag']=='path':yield n
 for c in n.get('children',[]):yield from paths(c)
def edge_ys(d,x):
 ys=[]
 for seg in parse_path(d):
  coefficients=np.real(seg.poly().coeffs).copy();coefficients[-1]-=x
  for t in np.roots(coefficients):
   if abs(t.imag)<1e-6 and -1e-7<=t.real<=1+1e-7:ys.append(float(seg.point(t.real).imag))
 return sorted(ys)
def write(p,n):
 raw=json.dumps(p,separators=(',',':'),ensure_ascii=False).encode();sha=hashlib.sha256(raw).hexdigest();fn=O/f'stage{n}-edge-registered-{sha[:8]}.json';fn.write_bytes(raw);return {'file':str(fn.relative_to(R)),'sha256':sha}
for n,src in SOURCES.items():
 p=json.load(open(O/src));before=copy.deepcopy(p);s=next(s for s in p['stages']if s['id']==f'stage-{n}');assets={a['id']:a for a in p['library']};mp=json.load(open(D/f'bank{n}/mapping.json'));terrain=next(t for t in s['terrains']if t['id']==mp['terrainId']);top=terrain['points'][:-2];xs=[q['x']for q in top];ys=[q['y']for q in top];bottom=max(q['y']for q in terrain['points']);reports=[]
 s['elements']=[e for e in s['elements']if not e['assetId'].startswith(f's{n}-silhouette:full-bank-v4-')]
 for side in ['left','right']:
  play=assets[f's{n}-silhouette:play-{side}-bank-v5-0'];v=play['vector'];lo,hi=play['params']['partDomain'];edge=lo if side=='left' else hi;low=xs[0]if side=='left'else edge;high=edge if side=='left'else xs[-1];sampleX=2.01 if side=='left'else 2169.99
  # Existing exact native-to-world mapping scale. Only depth, not macro y,
  # is needed; the frozen physical top remains authoritative.
  sy=json.load(open(D/f'bank{n}/play-{side}/mapping.json'))['h']/724
  rows=[]
  for node in paths(v['symbols']['native-bank']):
   intersections=edge_ys(node['d'],sampleX)
   if not intersections:continue
   y=intersections[0]
   if y>=700:continue # never sample artificial export-bottom closure
   rows.append({'fill':node['fill'],'sourceY':y})
  assert rows and rows[0]['fill']=='#667984',(n,side,rows)
  outerY=rows[0]['sourceY'];last=None;layers=[]
  for row in rows:
   if row['fill']==last:continue
   layers.append({**row,'depthWorld':max(0,(row['sourceY']-outerY)*sy)});last=row['fill']
  assert layers[-1]['fill']=='#233443',(n,side,layers)
  far=[{'x':low,'y':float(np.interp(low,xs,ys))},*[q for q in top if low<q['x']<high],{'x':high,'y':float(np.interp(high,xs,ys))}]
  children=[]
  for layer in layers:
   d=' '.join(('M'if i==0 else'L')+f"{q['x']:.6f} {q['y']+layer['depthWorld']:.6f}"for i,q in enumerate(far))+f'L{high:.6f} {bottom:.6f}H{low:.6f}Z';children.append({'tag':'path','d':d,'fill':layer['fill']})
  a=copy.deepcopy(play);a['id']=f's{n}-silhouette:far-{side}-registered-v1';a['name']=f'Stage{n} {side} native material continuation';a['bounds']={'x':low,'y':0,'w':high-low,'h':bottom};a['reference']['bounds']=a['bounds'];a['reference']['heightM']=bottom/60;a['vector']={'version':1,'viewBox':[low,0,high-low,bottom],'root':{'tag':'g','children':children}};a['params'].update(source='exact native edge cross-section of '+play['id'],partDomain=[low,high],fullDomain=[low,high],technicalContinuation=True,collisionSource=mp['terrainId'],silhouetteUnderpaint=False,nativeEdgeSampleX=sampleX,sourceDepthLayers=layers);a['collision']=[];p['library'].append(a);s['elements'].append({'id':a['id'],'assetId':a['id'],'x':0,'y':0,'scale':1,'rotation':0,'snap':False,'depthLayer':'L1','layer':'front'});reports.append({'side':side,'asset':a['id'],'nativeSourceAsset':play['id'],'edgeWorldX':edge,'sourceSampleX':sampleX,'layers':layers,'outerPhysicalContourUnchanged':True})
 oldstage=next(st for st in before['stages']if st['id']==s['id']);oldcopy=copy.deepcopy(oldstage);newcopy=copy.deepcopy(s);oldcopy.pop('elements');newcopy.pop('elements');assert oldcopy==newcopy
 # Exact original asset bytes and all other stages retained. Source art remains.
 assert p['library'][:len(before['library'])]==before['library'];assert [st for st in p['stages']if st['id']!=s['id']]==[st for st in before['stages']if st['id']!=s['id']]
 result=write(p,n);result.update(input=src,stage=n,scope='off-play technical soil continuation only; all physical terrain, authored play vectors and gameplay fields unchanged; visual verification pending',edges=reports);(D/f'bank{n}/domain-edge-registration.json').write_text(json.dumps(result,indent=2));print(json.dumps({k:v for k,v in result.items()if k!='edges'}))
