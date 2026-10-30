"""Complete35 bank from its separate native east concept; match material depth at join."""
exec(open('tools/act4-silhouette-review/fit35-west.py').read())
from native_edge_depth import verified_depth
leftAsset=copy.deepcopy(a);leftPaths={e.get('id'):e for e in E.parse(D/'play-west-master.svg').getroot().iter()if e.tag.endswith('path')};leftSourceY=sourceY
sk=json.load(open(D/'play-east-skeleton.json'));srcRoot=E.parse(D/'play-east-master.svg').getroot();sourcePaths={e.get('id'):e for e in srcRoot.iter()if e.tag.endswith('path')};outer=parse_path(flatten(sourcePaths['path5'].get('d'),.1));pairs=[(z.start,z.end)for z in outer]
def syAt(x):return min(u.imag+(w.imag-u.imag)*(x-u.real)/(w.real-u.real)for u,w in pairs if abs(w.real-u.real)>1e-9 and min(u.real,w.real)<=x<=max(u.real,w.real))
sx=4800/1774;sy=sx;ox=3200;oy=-sk['worldToImage'][5]/sk['worldToImage'][0];raw=lambda x:oy+sy*syAt(min(1773,max(1,(x-ox)/sx)))
alltop=sk['protectedTop'];fx=[q['x']for q in alltop];fy=[q['y']for q in alltop];anchors=np.array([[4000,float(np.interp(4000,fx,fy))],*[[q['x'],q['y']]for q in alltop if q['x']>4000]])
cor=PchipInterpolator(anchors[:,0],anchors[:,1]-[raw(x)for x in anchors[:,0]]);knots=sorted(set([*np.arange(4000,8000,160),8000,*anchors[:,0]]));cv=cor(knots);top=lambda x:raw(x)+float(np.interp(x,knots,cv));ps=[(float(x),top(x))for x in sorted(set([*np.arange(4000,8000,3),8000,*anchors[:,0]]))];poly=[{'x':round(x,5),'y':round(y,5)}for x,y in LineString(ps).simplify(.6).coords];t['points']=[q for q in t['points']if -800<=q['x']<4000]+poly+[q for q in t['points']if q['x']>8000 or q['x']<-800]
edgeChecks=[verified_depth(leftPaths[pid],leftPaths['path5'],1770,-1,1.25)for pid in ['path5','path4','path3','path2']]
(D/'pre-render-edge-checks.json').write_text(json.dumps(edgeChecks,indent=2))
clip='M'+'L'.join(f"{q['x']} {q['y']}"for q in poly)+'L8000 27100H4000Z';ch=[{'tag':'path','d':clip,'fill':'#203749'}];joinSrc=(4000-ox)/sx;decisions=[]
def layerDepth(el,x,outerY):
 q=parse_path(flatten(el.get('d'),.1));ys=[z.start.imag+(z.end.imag-z.start.imag)*(x-z.start.real)/(z.end.real-z.start.real)for z in q if abs(z.end.real-z.start.real)>1e-8 and min(z.start.real,z.end.real)<=x<=max(z.start.real,z.end.real)];return min(ys)-outerY
for pid,color in [('path5','#5c7386'),('path4','#3d566b'),('path3','#2a4356'),('path2','#203749'),('path1','#203749')]:
 el=sourcePaths[pid];lp=leftPaths.get(pid,leftPaths['path2']);delta=1.25*(layerDepth(lp,1770,leftSourceY(1770))-layerDepth(el,joinSrc,syAt(joinSrc)));parts=parse_path(flatten(el.get('d'),.1)).continuous_subpaths();ds=[]
 for part in parts:
  out=[]
  for z in [part[0].start]+[seg.end for seg in part]:
   ss=max(1,min(1773,z.real));wx=ox+ss*sx;u=max(0,min(1,(wx-4000)/400));wy=top(max(4000,min(8000,wx)))+1.25*(z.imag-syAt(ss))+delta*(1-u*u*(3-2*u));wy+=5000 if pid in ['path2','path1'] and z.imag>850 else 0;out.append((wx,wy))
  ds.append('M'+'L'.join(f'{x:.4f} {y:.4f}'for x,y in out)+'Z')
 ch.append({'tag':'path','d':' '.join(ds),'fill':color});decisions.append({'path':pid,'joinDepthAdjustmentWorld':delta,'localBlendWidth':400})
a=json.load(open(D/'play-east-source-asset.json'));a['id']='s35-silhouette:east-native-v4';a['bounds']={'x':4000,'y':0,'w':4000,'h':27100};a['reference']['bounds']=a['bounds'];a['vector']={'version':1,'viewBox':[4000,0,4000,27100],'root':{'tag':'g','clipPath':'physical','children':ch},'clips':{'physical':[clip]}};a['params'].update(collisionSource='a4-35-land',silhouetteUnderpaint=False,visualApproval=False,sourceDepthScale=1.25,materialJoin=decisions);p['library'].append(a)
for b in p['library']:
 if b['id'].endswith('-outside-west'):b['vector']['clips']['outside-west']=['M-10000 0H-800V40000H-10000Z M8000 0H20000V40000H8000Z']
ix=next(i for i,e in enumerate(s['elements'])if e['id']=='s35-silhouette:west-native-v4');s['elements'].insert(ix+1,{'id':a['id'],'assetId':a['id'],'x':0,'y':0,'scale':1,'rotation':0,'depthLayer':'L1','layer':'front'});(D/'east-world-asset.json').write_text(json.dumps(a,separators=(',',':')));(D/'east-fit-report.json').write_text(json.dumps({'vertices':len(poly),'source':'play-east-master.svg','join':decisions,'physicalJoin':[4000,poly[0]['y']],'status':'actualfullstage reviewpending'},indent=2));p['production']['cards'][s['id']]['cameraViews'] += [{'id':'east','x':5600,'y':1880,'scale':.48,'width':1440,'height':900},{'id':'join','x':4000,'y':1900,'scale':.6,'width':1440,'height':900},{'id':'whole','x':3600,'y':1900,'scale':.16,'width':1440,'height':900}];out=Path('_local/reports/stage35-bank-v4/candidate-full.json');out.write_text(json.dumps(p,separators=(',',':')));print(out)
