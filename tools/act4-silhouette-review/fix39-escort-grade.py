"""Intentional local gameplay contour correction, not lossless vector optimization."""
import copy,hashlib,json
from pathlib import Path
import numpy as np
from scipy.optimize import minimize,LinearConstraint
from svgpathtools import parse_path,Line
BASE=Path('_local/reports/act4-silhouette-final-qa');OUT=Path('_local/reports/stage39-escort-grade-v1');ART=Path('art/stage39-escort-grade-v1');OUT.mkdir(parents=True,exist_ok=True);ART.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
def read(p):return json.loads(p.read_text())
def write(p,v):b=json.dumps(v,separators=(',',':'),ensure_ascii=False).encode();p.write_bytes(b);return sha(b)
p=read(BASE/'project-pruned.json');w=read(BASE/'world-pruned.json');before=copy.deepcopy(p);s=next(s for s in p['stages']if s['metadata']['stageId']==39);t=next(t for t in s['terrains']if t['id']=='a4-39-land');q=[z for z in t['points']if 6200<=z['x']<=6600];x=np.array([z['x']for z in q]);y=np.array([z['y']for z in q]);D=np.zeros((len(x)-1,len(x)));D[np.arange(len(x)-1),np.arange(len(x)-1)]=-1;D[np.arange(len(x)-1),np.arange(1,len(x))]=1
r=minimize(lambda z:np.sum((z-y)**2),y,jac=lambda z:2*(z-y),constraints=[LinearConstraint(D,-1.1*np.diff(x),1.1*np.diff(x))],bounds=[(v,v)if i in[0,len(y)-1]else(None,None)for i,v in enumerate(y)],method='SLSQP',options={'ftol':1e-8,'maxiter':1000});assert r.success,r.message
new=np.round(r.x,5);delta=new-y;assert max(abs(np.diff(new)/np.diff(x)))<1.10001
for z,ny in zip(q,new):z['y']=float(ny)
def dy(xx):return float(np.interp(xx,x,delta,left=0,right=0))
oldid='s39-silhouette:east-native-v4';a=copy.deepcopy(next(a for a in p['library']if a['id']==oldid));aid=oldid+'-escort-grade-v1';a['id']=aid;stats={'paths':0,'oldSegments':0,'newSegments':0}
def warp(d):
 path=parse_path(d);chunks=[]
 for part in path.continuous_subpaths():
  pts=[]
  for seg in part:
   assert isinstance(seg,Line),'Source native fitted bank must remain polyline'
   ax,ay=seg.start.real,seg.start.imag;bx,by=seg.end.real,seg.end.imag;cuts=[0,1]
   if abs(bx-ax)>1e-10:cuts+= [float((k-ax)/(bx-ax))for k in x if 1e-10<(k-ax)/(bx-ax)<1-1e-10]
   cuts=sorted(cuts)
   if not pts:pts.append((ax,ay+dy(ax)))
   for f in cuts[1:]:xx=ax+(bx-ax)*f;yy=ay+(by-ay)*f;pts.append((xx,yy+dy(xx)))
   stats['oldSegments']+=1;stats['newSegments']+=len(cuts)-1
  chunks.append('M'+'L'.join(f'{xx:.8f} {yy:.8f}'for xx,yy in pts)+('Z'if part.isclosed()else''))
 stats['paths']+=1;return ' '.join(chunks)
def nodes(n):
 if n.get('tag')=='path':n['d']=warp(n['d'])
 for c in n.get('children',[]):nodes(c)
nodes(a['vector']['root'])
for k,ds in a['vector'].get('clips',{}).items():a['vector']['clips'][k]=[warp(d)for d in ds]
a['params']['intentionalEscortGradeCorrection']={'sourceAssetId':oldid,'physicalTerrain':'a4-39-land','range':[6200,6600],'method':'Minimum squared vertical deviation at original native outline x knots, endpoints fixed, maximum absolute grade1.10; source vector columns receive identical piecewise linear vertical delta.','maxVerticalChangeWorld':float(max(abs(delta))),'runtimeWalkerLimit':1.35,'classification':'intentional gameplay silhouette correction, not lossless optimization','sourceConcept':'art/stage39-bank-silhouette-v4/play-east-concept-v2.png','sourceNative':'art/stage39-bank-silhouette-v4/play-east-master.svg'}
for e in s['elements']:
 if e['assetId']==oldid:e['assetId']=aid
decor=[]
for e in s['elements']:
 if 6200<e['x']<6600 and e['id']=='a4-coast-39-art-4':
  ea=next(v for v in p['library']if v['id']==e['assetId']);assert not ea['collision'] and e['layer']=='back';deltaY=dy(e['x']);oldY=e['y'];e['y']=round(oldY+deltaY,5);decor.append({'id':e['id'],'oldY':oldY,'newY':e['y'],'deltaY':deltaY,'reason':'Retain existing rear decorative footing contact offset using identical local contour delta. No collider or event anchor changed.'})
p['library'].append(a)
# Narrow delta only: all unrelated gameplay fields, stages and original assets exact.
oldstage=next(z for z in before['stages']if z['metadata']['stageId']==39)
for k in s:
 if k not in ['terrains','elements']:assert s[k]==oldstage[k],k
for ot,nt in zip(oldstage['terrains'],s['terrains']):
 if ot['id']!='a4-39-land':assert ot==nt
 else:
  for op,np_ in zip(ot['points'],nt['points']):
   if not 6200<op['x']<6600:assert op==np_
assert [z for z in p['stages']if z['metadata']['stageId']!=39]==[z for z in before['stages']if z['metadata']['stageId']!=39]
assert p['library'][:-1]==before['library']
w['stages']=[copy.deepcopy(s)if z['metadata']['stageId']==39 else z for z in w['stages']];w['library'].append(a)
report={'status':'candidate-requires-actual-walker-and-visual-and-full39-QA','sourceProjectSHA256':sha((BASE/'project-pruned.json').read_bytes()),'sourceWorldSHA256':sha((BASE/'world-pruned.json').read_bytes()),'protectedExactRanges':[[5300,6200],[6600,8000]],'onlyChangedStage':39,'onlyAddedAsset':aid,'allOriginalAssetsExact':True,'changedKnots':[{'x':float(xx),'oldY':float(yy),'newY':float(ny),'delta':float(d)}for xx,yy,ny,d in zip(x,y,new,delta)if abs(d)>1e-7],'maxVerticalChangeWorld':float(max(abs(delta))),'maxGrade':float(max(abs(np.diff(new)/np.diff(x)))),'vectorWarp':stats,'decorSupportAdjustments':decor,'note':'Existing source-native silhouette locally fitted to safe escort geometry. Internal layers share the same warp. No runtime/otherstage changes. Old world and assets retained as provenance.'}
report['projectSHA256']=write(OUT/'project.json',p);report['worldSHA256']=write(OUT/'world.json',w);write(ART/'world-asset.json',a);write(ART/'terrain-delta.json',{'old':next(t for t in oldstage['terrains']if t['id']=='a4-39-land'),'new':t});write(ART/'provenance.json',report);print(json.dumps(report,indent=2))
