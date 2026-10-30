"""Stage36 source-authored banks. Explicit geometry revision, not render-mask approval.
Native traced outline drives matching art/collider outside protected home courtyard.
No shared world writes. Functional original door identity and event remain unchanged.
"""
import json,copy,sys,hashlib,xml.etree.ElementTree as E
from pathlib import Path
import numpy as np
from scipy.interpolate import PchipInterpolator
def rdp(ps,eps):
 if len(ps)<3:return ps
 ar=np.array(ps);a=ar[0];v=ar[-1]-a;t=np.clip((ar-a)@v/(v@v),0,1);d=np.linalg.norm(ar-(a+t[:,None]*v),axis=1);i=int(np.argmax(d))
 return rdp(ps[:i+1],eps)[:-1]+rdp(ps[i:],eps)if d[i]>eps else [ps[0],ps[-1]]
from svgpathtools import parse_path
sys.path.insert(0,'tools/vector-production');from bounded_flatten import flatten
from palette import apply
D=Path('art/stage36-bank-silhouette-v4');O=Path('_local/reports/stage36-bank-v4');O.mkdir(parents=True,exist_ok=True)
p=json.load(open('_local/reports/sea-silhouette-v3/project.json'));baseAssetIds={z['id']for z in p['library']};s=next(s for s in p['stages'] if s['id']=='stage-36');p['stages']=[s];p['activeStageId']=s['id'];base=copy.deepcopy(s);t=s['terrains'][0];old=copy.deepcopy(t['points']);upper=sorted([q for q in old if q['y']<10000],key=lambda q:q['x']);ox=[q['x']for q in upper];oy=[q['y']for q in upper];floor=lambda x:float(np.interp(x,ox,oy));court=(1970,3190);body=[];new=[];reports=[]
for side,lo,hi in [('west',-800,3600),('east',3600,8000)]:
 sk=json.load(open(D/f'play-{side}-skeleton.json'));sourceLo,sourceHi=sk['physicalRange'];sx=4800/1774;sy=sx;ty=-sk['worldToImage'][5]/sk['worldToImage'][0]
 root=E.parse(D/f'play-{side}-master.svg').getroot();paths=[e for e in root.iter()if e.tag.endswith('}path')];outer=parse_path(flatten(paths[0].get('d'),.15));edges=[(z.start,z.end)for z in outer]
 def sourceY(x):
  x=float(np.clip(x,2,1772));return min(u.imag+(v.imag-u.imag)*(x-u.real)/(v.real-u.real)for u,v in edges if abs(v.real-u.real)>1e-8 and min(u.real,v.real)<=x<=max(u.real,v.real))
 raw=lambda x:ty+sy*sourceY((x-sourceLo)/sx)
 anchors=sorted(set([lo,hi,*[q['x']for q in upper if lo<q['x']<hi],*[v for v in court if lo<v<hi]]));cor=PchipInterpolator(anchors,[floor(x)-raw(x)for x in anchors]);knots=sorted(set([lo,hi,*np.arange(lo,hi,240),*anchors]))
 # Courtyard retains exact authored support. Dense affine knots preserve native strata, not invented top noise.
 if side=='west':knots=sorted(set(knots+list(np.arange(court[0],court[1],80))+list(court)))
 cv=[floor(x)-raw(x)if court[0]<=x<=court[1]else float(cor(x))for x in knots]
 def top(x):return floor(x)if court[0]<=x<=court[1]else raw(x)+float(np.interp(x,knots,cv))
 samples=sorted(set([lo,hi,*np.arange(lo,hi,2),*anchors,*knots]));dense=[(float(x),top(x))for x in samples];poly=[]
 # Preserve all functional anchor vertices while simplifying native outline within0.6worldpx.
 for a,b in zip(anchors[:-1],anchors[1:]):poly+=rdp([q for q in dense if a<=q[0]<=b],.6)[:-1]
 poly+=[dense[-1]];new+=poly[:-1]if side=='west'else poly
 a=json.load(open(D/f'play-{side}-registered-asset.json'));v=a['vector'];v['symbols']={'native-bank':v['root']};v['clips']={};clip='M'+'L'.join(f'{x:.5f} {y:.5f}'for x,y in poly)+f'L{hi} 27100H{lo}Z';v['clips']['contact']= [clip];ch=[{'tag':'path','d':clip,'fill':'#233b4d'}]
 for i,(l,r)in enumerate(zip(knots[:-1],knots[1:])):
  cl,cr=np.interp([l,r],knots,cv);m=(cr-cl)/(r-l);key=f'slice{i}';v['clips'][key]=[f'M{l-.00001} 0H{r+.00001}V27100H{l-.00001}Z'];ch.append({'tag':'g','clipPath':key,'pixelSnapClip':True,'children':[{'tag':'g','transform':[sx,m*sx,0,sy,sourceLo,ty+cl+m*(sourceLo-l)],'children':[{'tag':'use','symbol':'native-bank'}]}]})
 ch.append({'tag':'path','d':f'M{lo} {max(y for x,y in poly)+650}H{hi}V27100H{lo}Z','fill':'#233b4d'})
 v['root']={'tag':'g','clipPath':'contact','children':ch};a['id']=f's36-silhouette:{side}-native-v4';a['bounds']={'x':lo,'y':0,'w':hi-lo,'h':27100};a['reference']['bounds']=a['bounds'];a['reference']['heightM']=27100/60;v['viewBox']=[lo,0,hi-lo,27100];a['params'].update(collisionSource=t['id'],silhouetteUnderpaint=False,protectedCourtyard=list(court),sourceConcept=f'play-{side}-concept-v2.png',nativeTrace=f'play-{side}-source.svg',sourceWorldPerPixel=sx,visualApproval=False)
 body.append(a);delta=[y-floor(x)for x,y in dense];reports.append({'side':side,'sourceWorldPerPixel':sx,'actor92SourcePx':92/sx,'vertices':len(poly),'minDeviationWorld':min(delta),'maxDeviationWorld':max(delta),'maxSlope':max(abs((b[1]-a[1])/(b[0]-a[0]))for a,b in zip(poly[:-1],poly[1:])),'nativeFlattenErrorSourcePx':.15,'outlineSimplificationWorldPx':.6})
# Single full-domain terrain. Retain original distant-domain vertices and deep closure.
full=[(q['x'],q['y'])for q in upper if q['x']<-800]+new+[(q['x'],q['y'])for q in upper if q['x']>8000];t['points']=[{'x':round(x,5),'y':round(y,5)}for x,y in full]+[{'x':13200,'y':27100},{'x':-6000,'y':27100}]
# Clip both sources to the same full physical polygon, not separate vertical
# compound closures at their shared edge. Individual affine slices already use
# canonical pixel-snapped rectangles, avoiding a double antialiased stitch.
fullClip='M'+'L'.join(f'{q["x"]} {q["y"]}'for q in t['points'])+'Z'
for a in body:
 v=a['vector'];lo=a['bounds']['x'];hi=lo+a['bounds']['w']
 v['clips']['contact']=[fullClip]
 # The opaque base must share the pixel-snapped slice range. A separate
 # antialiased vertical base closure paints a dark hairline over its neighbor.
 v['root']['children'][0]['d']=fullClip
 v['clips']['body-range']=[f'M{lo} 0H{hi}V27100H{lo}Z']
 v['root']={'tag':'g','clipPath':'body-range','pixelSnapClip':True,'children':[v['root']]}
# Off-play camera margins: extrude only the actual native endpoint cross-section.
# This is quiet technical domain coverage, not a new gameplay-art module. The
# original distant physical silhouette is retained and every layer meets its
# corresponding high-resolution boundary color/depth; no old ornate soil mix.
# Two source pixels of overlap hide the native image-edge closure, not terrain.
marginFloor=lambda x:float(np.interp(x,[q[0] for q in full],[q[1] for q in full]))
for side,lo,hi,u0,u1 in [('west',-6000,-800+2*4800/1774,4,2),('east',8000-2*4800/1774,13200,1772,1770)]:
 a=json.load(open(D/f'play-{side}-registered-asset.json'));v=a['vector'];native=v['root'];outer=parse_path(flatten(next(e for e in E.parse(D/f'play-{side}-master.svg').getroot().iter()if e.tag.endswith('}path')).get('d'),.15));edge=[(q.start,q.end)for q in outer]
 def nativeY(u):return min(z.imag+(w.imag-z.imag)*(u-z.real)/(w.real-z.real)for z,w in edge if abs(w.real-z.real)>1e-9 and min(z.real,w.real)<=u<=max(z.real,w.real))
 sxFar=(hi-lo)/(u1-u0);tx=lo-sxFar*u0;sy=4800/1774;sourceX=lambda x:(x-tx)/sxFar
 stops=sorted(set([lo,hi,*[q['x']for q in upper if lo<q['x']<hi]]));v['symbols']={'native-endpoint':native};v['clips']={'physical':[fullClip]};ch=[{'tag':'path','d':fullClip,'fill':'#233b4d'}]
 for i,(l,r)in enumerate(zip(stops[:-1],stops[1:])):
  ul,ur=sourceX(l),sourceX(r);dl,dr=marginFloor(l)-sy*nativeY(ul),marginFloor(r)-sy*nativeY(ur);m=(dr-dl)/(ur-ul);dy=dl-m*ul;key=f'margin{i}';v['clips'][key]=[f'M{l} 0H{r}V27100H{l}Z'];ch.append({'tag':'g','clipPath':key,'pixelSnapClip':True,'children':[{'tag':'g','transform':[sxFar,m,0,sy,tx,dy],'children':[{'tag':'use','symbol':'native-endpoint'}]}]})
 ch.append({'tag':'path','d':f'M{lo} {max(floor(x)for x in stops)+650}H{hi}V27100H{lo}Z','fill':'#233b4d'});v['clips']['margin-range']=[f'M{lo} 0H{hi}V27100H{lo}Z'];v['root']={'tag':'g','clipPath':'margin-range','pixelSnapClip':True,'children':[{'tag':'g','clipPath':'physical','children':ch}]};a['id']=f's36-silhouette:{side}-technical-domain-v4';a['bounds']={'x':lo,'y':0,'w':hi-lo,'h':27100};a['reference']['bounds']=a['bounds'];a['reference']['heightM']=27100/60;v['viewBox']=[lo,0,hi-lo,27100];a['params'].update(semanticLayer='BODY',collisionSource=t['id'],silhouetteUnderpaint=False,sourceRole='quiet off-play camera-margin coverage from native endpoint cross-section; not gameplay art',nativeCrossSection=[u0,u1],worldDomain=[lo,hi],physicalSilhouetteUnchanged=True);body.append(a)
newFloor=lambda x:float(np.interp(x,[q[0]for q in full],[q[1]for q in full]));reposition=[]
for e in s['elements']:
 if e['id'] in ['a4-36-house-2570','a4-36-door-4']:continue
 if e['id'].startswith(('a4-36-house-','a4-art-36-extra-')):
  dy=newFloor(e['x'])-floor(e['x']);e['y']+=dy;reposition.append({'id':e['id'],'dy':dy})
# Old body retained solely for far domain; central old rear/contact patterns are removed except original courtyard contacts.
for e in s['elements']:
 if 'body-continuous' in e['id']:
  a=copy.deepcopy(next(a for a in p['library']if a['id']==e['assetId']));a['id']+='-outside-v4';a['vector'].setdefault('clips',{})['outside']=['M-10000 0H-800V40000H-10000Z M8000 0H20000V40000H8000Z'];a['vector']['root']={'tag':'g','clipPath':'outside','children':[a['vector']['root']]};p['library'].append(a);e['assetId']=a['id']
 if e['id']=='s36-density:surface':
  a=copy.deepcopy(next(a for a in p['library']if a['id']==e['assetId']));a['id']='s36-density:contact-clusters-courtyard-v4';a['vector'].setdefault('clips',{})['courtyard']=[f'M{court[0]} 0H{court[1]}V27100H{court[0]}Z'];a['vector']['root']={'tag':'g','clipPath':'courtyard','children':[a['vector']['root']]};p['library'].append(a);e['assetId']=a['id']
ix=next(i for i,e in enumerate(s['elements'])if 'body-continuous'in e['id']);s['elements']=[e for e in s['elements']if e['id']!='s36v:rear-soil'and 'body-continuous'not in e['id']];ix=next((i for i,e in enumerate(s['elements'])if e['id']=='s36-density:surface'),len(s['elements']));s['elements'][ix:ix]=[{'id':a['id'],'assetId':a['id'],'x':0,'y':0,'scale':1,'rotation':0,'depthLayer':'L1','layer':'front'}for a in body];p['library']+=body;paint=apply(p,s)
for k in ['units','events','encounters','objectives','markers','initialState','playBounds','terrainBounds']:assert s.get(k)==base.get(k),k
for id in ['a4-36-house-2570','a4-36-door-4']:
 a=next(e for e in s['elements']if e['id']==id);b=next(e for e in base['elements']if e['id']==id);assert {k:v for k,v in a.items()if k!='assetId'}=={k:v for k,v in b.items()if k!='assetId'}
for x in np.arange(court[0],court[1],.5):assert abs(newFloor(x)-floor(x))<1e-5
s['design']['production']['artStatus']='stage36 native-bank-v4 candidate; visual/door lifecycle QA pending';s['revision']=s.get('revision',1)+1
views=[{'id':'west-normal','x':800,'y':1850,'scale':.53,'width':1440,'height':900},{'id':'house-normal','x':2570,'y':1900,'scale':.53,'width':1440,'height':900},{'id':'house-detail','x':2570,'y':1900,'scale':1.1,'width':1440,'height':900},{'id':'house-mobile','x':2570,'y':1900,'scale':.53,'width':720,'height':1100},{'id':'east-normal','x':5700,'y':1900,'scale':.53,'width':1440,'height':900},{'id':'whole','x':3600,'y':1900,'scale':1500/7200,'width':1600,'height':850}];p.setdefault('production',{}).setdefault('cards',{}).setdefault(s['id'],{})['cameraViews']=views
assetMap={a['id']:a for a in p['library']};reachable=set()
def visit(v):
 if isinstance(v,str) and v in assetMap:reachable.add(v)
 elif isinstance(v,dict):
  for x in v.values():visit(x)
 elif isinstance(v,list):
  for x in v:visit(x)
visit(s)
while True:
 prior=set(reachable)
 for id in prior:visit(assetMap[id])
 if prior==reachable:break
out=O/'candidate-project.json';out.write_text(json.dumps(p,separators=(',',':')));sha=hashlib.sha256(out.read_bytes()).hexdigest();report={'candidateSHA256':sha,'protectedCourtyard':court,'protectedHomeDoorInstances':['a4-36-house-2570','a4-36-door-4'],'doorEventAssetIdentity':'a4:door','functionalFieldsParity':True,'explicitGeometryRevision':True,'regions':reports,'decorativeFootAdjustments':reposition,'visualApproval':False,'doorLifecycleQA':'pending'};(D/'assembly-report.json').write_text(json.dumps(report,indent=2));(D/'candidate-module.json').write_text(json.dumps({'stage':s,'library':[a for a in p['library']if a['id']not in baseAssetIds and a['id']in reachable]},separators=(',',':')));print(json.dumps(report,indent=2))
