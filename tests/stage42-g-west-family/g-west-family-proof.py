"""True full G stock pointer replay and two native noncollision contact sites."""
import base64,hashlib,json,math,sys,tempfile
from io import BytesIO
from pathlib import Path
from statistics import median
from PIL import Image
D=Path(__file__).resolve().parent
pin=json.loads((D/'evidence-pins.json').read_text())
driver=Path(sys.argv[3]).resolve(strict=True);raw_driver=driver.read_bytes()
assert hashlib.sha256(raw_driver).hexdigest()==pin['exactDriverSha256']
PROPOSED=json.loads((D/'operator-points.json').read_text())
TITLE='혼로 5막 2장 G · 서부 암반 맞닿음 검증'
def canonical(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()
def hashb(v):return hashlib.sha256(v).hexdigest()
def point_poly(p,x,y):return sum((a[1]>y)!=(b[1]>y) and x<a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]) for a,b in zip(p,p[1:]+p[:1]))%2==1
def point_dist(p,x,y):
 def edge(a,b):
  u,v=b[0]-a[0],b[1]-a[1]
  t=max(0,min(1,((x-a[0])*u+(y-a[1])*v)/(u*u+v*v))) if u or v else 0
  return math.hypot(x-a[0]-t*u,y-a[1]-t*v)
 return min(edge(a,b) for a,b in zip(p,p[1:]+p[:1]))
def get(p):return p.evaluate('HonroWorkshopAPI.getProject()')
def owned(p,id):return next(a for a in get(p)['library'] if a['id']==id)
def cursor(p,c,xy):
 return p.evaluate("""([k,x,y])=>{
   const c=document.querySelector('#'+k+'Canvas'),r=c.getBoundingClientRect(),v=HonroWorkshopAPI.getEditorState()[k+'View'];
   const s=[r.left+r.width/2+(x-v.x)*v.zoom,r.top+r.height/2+(y-v.y)*v.zoom];
   if(document.elementFromPoint(...s)!==c)throw Error('Authentic pointer outside canvas '+k+': '+s);
   return s;
 }""",[c,*xy])
def raw_scene(p,cam):
 return p.evaluate("""([x,y,zoom])=>{
  const r=HonroWorkshopAPI.getRuntime(),prior=r.scene.renderCacheStats(),previous=HonroWorkshopAPI.getEditorState().stageView;
  HonroWorkshopAPI.setCamera({x,y,zoom});
  const now=HonroWorkshopAPI.getRuntime(),c=document.querySelector('#stageCanvas'),v=HonroWorkshopAPI.getEditorState().stageView,b=now.engine.b;
  const next=now.scene.renderCacheStats();
  return {png:c.toDataURL('image/png'),camera:[v.x,v.y,v.zoom],previous:[previous.x,previous.y,previous.zoom],size:[c.width,c.height],css:[c.clientWidth,c.clientHeight],
          runtimeSceneUnchanged:r.scene===now.scene,cachePrior:prior,cacheAfter:next,
          domain:HonroTerrainDomain.active(b),collider:b.terrain[0].vertices,overlay:document.querySelector('#overlayToggle').checked};
 }""",cam)
def snap(p,cam,root,key):
 a=raw_scene(p,cam);im=base64.b64decode(a.pop('png').split(',',1)[1],validate=True);
 (root/f'{key}.png').write_bytes(im)
 assert a['camera']==cam and a['domain'] and not a['overlay'] and a['size']==a['css']
 assert a['runtimeSceneUnchanged'] and a['previous']!=cam,'A first-frame camera test needs actually changed view in stable renderer'
 return Image.open(BytesIO(im)).convert('RGB'),a
def pixel_guard(before,after,p,cam):
 w,h=before.size; assert after.size==(w,h)
 cx,cy,z=cam
 # Crop metrics to where the actual native asset can contribute; any global/background
 # drift is independently counted with an exact whole-canvas difference.
 from PIL import ImageChops
 d=ImageChops.difference(before,after);loc=d.getbbox();assert loc is not None
 l,t,r,b=loc
 f=d.load()
 outside=0;inside=0;aa=0;out_samples=[];base=before.load();candidate=after.load()
 for j in range(t,b):
  for i in range(l,r):
   if f[i,j]==(0,0,0):continue
   x,y=cx+(i+.5-w/2)/z,cy+(j+.5-h/2)/z
   lo=[q for q in p if min(v[0] for v in q)-2/z<=x<=max(v[0] for v in q)+2/z and min(v[1] for v in q)-2/z<=y<=max(v[1] for v in q)+2/z]
   if any(point_poly(q,x,y) for q in lo):inside+=1
   elif any(point_dist(q,x,y)<=2/z for q in lo):aa+=1
   else:
    outside+=1
    if len(out_samples)<96:
     distances=[point_dist(q,x,y)*z for q in p]
     out_samples.append({'pixel':[i,j],'world':[x,y],'rasterDistancePx':min(distances),'nearestFamilyIndex':distances.index(min(distances)),
                         'beforeRgb':base[i,j],'afterRgb':candidate[i,j]})
 return {'exactDifferenceBoundsPx':loc,'interiorChangedPx':inside,'edgeTolerancePx':aa,'outsideChangedPx':outside,'outsideSamples':out_samples}
def color_probe(image,cam,xy,width=1):
 w,h=image.size;cx,cy,z=cam;x,y=round(w/2+(xy[0]-cx)*z),round(h/2+(xy[1]-cy)*z)
 return tuple(round(median(x[i] for x in image.crop((x-width,y-width,x+width+1,y+width+1)).getdata())) for i in range(3))
def fit_native_element(p, targets, root, phase):
 # Using existing integer middle-drag controls only; no direct Element camera mutation,
 # and every upcoming target must be the actual native canvas hit.
 controls="""xs=>{
  const c=document.querySelector('#elementCanvas'),r=c.getBoundingClientRect(),v=HonroWorkshopAPI.getEditorState().elementView;
  const clip=(x,y)=>document.elementFromPoint(x,y);
  const hit=(x,y)=>clip(x,y)===c;
  const points=xs.map(([x,y])=>[r.left+r.width/2+(x-v.x)*v.zoom,r.top+r.height/2+(y-v.y)*v.zoom]);
  const blocked=points.flatMap((q,i)=>hit(...q)?[]:[{i,world:xs[i],screen:q,actual:clip(...q)?.id??'',className:String(clip(...q)?.className??'').slice(0,120)}]);
  return {camera:[v.x,v.y,v.zoom],canvas:[r.left,r.top,r.width,r.height],dpr:devicePixelRatio,points,blocked};
 }"""
 rows=[]
 def check(label):
  data=p.evaluate(controls,targets);rows.append({'label':label,**data});return data
 def write():
  (root/f'pointer-fit-{phase}.json').write_text(json.dumps({'points':len(targets),'phases':rows},indent=2))
 try:
  first=check('stock-initial-element-view')
  if first['blocked']:p.screenshot(path=str(root/f'16-{phase}-before-fit-pointer-blocked.png'))
  left,top,w,h=first['canvas']
  vx,vy,z=first['camera'];assert first['dpr']==1
  def visible(q):return p.evaluate("q=>document.elementFromPoint(...q)===document.querySelector('#elementCanvas')",q)
  center=[round(left+w/2),round(top+h/2)]
  assert visible(center),'Native element center is obscured; no fake camera fallback'
  xmin,xmax=min(v[0] for v in targets),max(v[0] for v in targets)
  ymin,ymax=min(v[1] for v in targets),max(v[1] for v in targets)
  spans=(xmax-xmin,ymax-ymin);expected_zoom=1.0
  margin=(w-spans[0]*expected_zoom,h-spans[1]*expected_zoom)
  assert all(v>=27 for v in margin) and math.sqrt(2)*.5/expected_zoom<1.8, 'Measured aperture is not large enough at legal input precision'
  assert abs(z-1)<1e-12 and first['canvas']==[500,45,370,831], 'Unexpected native phase/viewport; no pointer authored'
  assert p.evaluate("()=>{const c=document.querySelector('#elementCanvas');return [c.clientWidth,c.clientHeight]}")==[370,831]
  zoomed=check('stock-integral-native-zoom')
  vx,vy,z=zoomed['camera']
  def margins(row):
   l,t,ww,hh=row['canvas'];ps=row['points']
   return [min(x-l for x,y in ps),min(l+ww-x for x,y in ps),min(y-t for x,y in ps),min(t+hh-y for x,y in ps)]
  if zoomed['blocked'] or min(margins(zoomed))<12:
   mx=(xmin+xmax)/2
   my=(ymin+ymax)/2
   planned=[round((vx-mx)*z),round((vy-my)*z)]
   # Saturate the physical native drag length, re-evaluate real camera each move.
   for i in range(5):
    x,y,z0=p.evaluate("()=>{const v=HonroWorkshopAPI.getEditorState().elementView;return [v.x,v.y,v.zoom]}")
    step=[max(-115,min(115,round((x-mx)*z0))),max(-115,min(115,round((y-my)*z0)))]
    if max(map(abs,step))<=1:break
    candidates=[[round(left+w*fx),round(top+h*fy)] for fy in [.55,.5,.65,.45] for fx in [.55,.5,.65,.45]]
    start=next((q for q in candidates if all(visible([q[0]+f*step[0],q[1]+f*step[1]]) for f in [0,.25,.5,.75,1])),None)
    assert start is not None,'No proven native camera-pan stroke across this canvas'
    p.mouse.move(*start);p.mouse.down(button='middle')
    try:p.mouse.move(start[0]+step[0],start[1]+step[1],steps=8)
    finally:p.mouse.up(button='middle')
  last=check('final-fit-live-hit-map')
  rows[-1]['exactMarginsPx']=margins(last)
  rows[-1]['worldTargetSpans']=spans
  assert all(abs(v-round(v))<1e-9 for q in last['points'] for v in q),'Live stock lattice phase cannot produce exact contact here' 
  write()
  assert not last['blocked'] and min(rows[-1]['exactMarginsPx'])>=12,'Native Element target coverage or 12px aperture margin shortage; no authoring'
  assert math.sqrt(2)*.5/last['camera'][2] < 1.8, 'Viewport fitting would exceed existing authored-point tolerance'
  return last
 except:
  write();p.screenshot(path=str(root/f'16-{phase}-actual-fit-blocked.png'));raise
def run_shoulder(fresh,open_page,domain,root):
 root=Path(root);report={'scope':'Only Stage42 G two intentionally border-meeting west sites; no rest-of-stage/bridge/playability/production or art-pass claim','pass':False}
 def write():(root/'shoulder-proof.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 write()
 assert hashlib.sha256(canonical(domain['original'])).hexdigest()==pin['collisionGeometrySha256'],'Genuine base replay vertices drifted'
 assert hashlib.sha256(canonical(domain['world'])).hexdigest()==pin['projectedGeometrySha256'],'Genuine stock exterior projection drifted'
 q=get(fresh); assert q['stages'][0]['terrainDomainVersion']==1 and q['stages'][0]['name']==TITLE
 assert len(q['stages'][0]['terrains'])==1 and not q['stages'][0]['elements']
 base_stage=q['stages'][0]; start=evidence_views={'west-native-match':[580,1625,.5],'whole':[3250,1650,.14],'quiet-crest':[770,1740,.5],'cached-close':[560,1775,.95],'direct-first-close':[560,1775,1.08]}
 before={}
 for name,cam in start.items():before[name]=snap(fresh,cam,root,f'11-before-{name}')
 fresh.locator('[data-tab=element]').click()
 fresh.locator('#newAsset').click()
 aid=next(v['id'] for v in get(fresh)['library'] if v['category']=='custom')
 assert fresh.locator('#nativeShapeFill').is_disabled()
 fresh.locator('#assetCollision').uncheck()
 fresh.locator('#assetName').fill('서부 암반 맞닿음 (검증용)')
 fresh.locator('#assetName').press('Tab')
 fresh.locator('#assetLayer').fill('prop');fresh.locator('#assetLayer').press('Tab')
 fresh.locator('[data-tab=stage]').click();fresh.locator(f'[data-asset="{aid}"]').click()
 fresh.evaluate('()=>HonroWorkshopAPI.setCamera({x:300,y:1800,zoom:1})')
 fresh.mouse.click(*cursor(fresh,'stage',PROPOSED['nativeAssetAnchorWorld']))
 fresh.locator('#elSnap').uncheck()
 placed=get(fresh)['stages'][0]['elements'][0]
 assert placed['assetId']==aid and placed['layer']=='prop' and placed['rotation']==0 and placed['scale']==1 and placed['depthLayer']=='L1' and not placed['snap']
 dx,dy=placed['x'],placed['y']
 assert [dx,dy]==PROPOSED["nativeAssetAnchorWorld"], "Exact stock placement lattice shifted"
 fresh.locator('[data-tab=element]').click()
 ordered=PROPOSED['faces'] # matrix first; three constrained surface faces above
 local=[[[x-dx,y-dy] for x,y in row['clockwiseWorld']] for row in ordered]
 targets=list(dict.fromkeys(tuple(xy) for row in local[:2] for xy in row))
 fit=fit_native_element(fresh,targets,root,'primary-contact')
 assert all(math.dist(a,b)>=5 for row in local for a,b in zip(row,row[1:] + row[:1]))
 seed=owned(fresh,aid)['visual']
 assert len(seed)==1 and seed[0]['type']=='polygon' and len(seed[0]['points'])==6
 seed=seed[0]
 seed_hash=hashb(canonical(seed))
 for k,s in enumerate(ordered):
  if k>0:fit_native_element(fresh,local[k],root,s['material'])
  fresh.locator('[data-etool=polygon]').click();assert fresh.locator('#nativeShapeFill').is_disabled()
  for x,y in s['clockwiseWorld']:
   try:fresh.mouse.click(*map(round,cursor(fresh,'element',[x-dx,y-dy])))
   except: fresh.screenshot(path=str(root/'16-real-point-hit-blocked.png'));raise
  fresh.keyboard.press('Enter')
  inp=fresh.locator('#nativeShapeFill');assert inp.is_enabled()
  inp.fill(s['fill']);inp.press('Tab')
  o=owned(fresh,aid)
  assert len(o['visual'])==(2 if k==0 else k+1) and o['visual'][-1]['fill']==s['fill'] and not o['collision']
  if k==0:
   assert o['visual'][0]==seed and o['visual'][1]['fill']==ordered[0]['fill']
   base,matrix=([[v['x'],v['y']] for v in face['points']] for face in o['visual'])
   # The stock Point handler considers vertices first (10 screen px).
   # Select from the actual seed interior, outside the authored dark face,
   # with a 2-world rounding reserve beyond both shapes' node hit radii.
   hit_radius=10/z
   targets=[(x,y) for x in range(-22,23,2) for y in range(-22,23,2)]
   targets.sort(key=lambda t:(math.hypot(*t),t))
   cursor_choices=[pt for pt in targets if point_poly(base,*pt) and point_dist(base,*pt)>2
    and not point_poly(matrix,*pt) and point_dist(matrix,*pt)>2
    and min(math.dist(pt,u) for u in base+matrix)>hit_radius+2]
   assert cursor_choices,'No safe disjoint real starter interior at the fitted camera'
   tx,ty=cursor_choices[0]
   pt=(tx,ty+.5)
   fit_native_element(fresh,[pt],root,'true-seed-interior')
   fresh.mouse.click(*map(round,cursor(fresh,'element',pt)))
   state=fresh.evaluate('HonroWorkshopAPI.getEditorState()')
   current=owned(fresh,aid)
   fresh.screenshot(path=str(root/'17-elements-before-seed-delete.png'))
   report['seedDelete']={'ownerId':aid,'originalStarterVisualSha256':seed_hash,'selectedShapeIndex':state['selectedShapeIndex'],
      'selectedNode':state['selectedNode'],'starterPointCount':len(base),'authoredCountBefore':1,'pointLocalXy':pt,
      'nearestVertexWorld':min(math.dist(pt,u) for u in base+matrix),'vertexHitRadiusWorld':hit_radius}
   write()
   assert state['elementTool']=='point' and state['selectedShapeIndex']==0 and state['selectedNode']==-1,'Real click did not select original starter interior'
   assert current['id']==aid and current['visual'][0]==seed and current['visual'][1:]==o['visual'][1:]
   fresh.keyboard.press('Delete')
   after=owned(fresh,aid)
   assert after['id']==aid and after['visual']==o['visual'][1:] and not after['collision'],'Only exact verified starter may be deleted'
   fresh.screenshot(path=str(root/'17-elements-after-seed-delete.png'))
   report['seedDelete']['exactStarterOnlyRemoved']=True
   write()
 o=owned(fresh,aid)
 assert len(o['visual'])==6 and not o['collision'] and not o.get('interactionType')
 assert all(v['stroke']=='#222d30' for v in o['visual'])
 assert [v['fill'] for v in o['visual']]==[s['fill'] for s in ordered]
 rings=[[[w['x']+dx,w['y']+dy] for w in face['points']] for face in o['visual']]
 assert rings==[s['clockwiseWorld'] for s in ordered], 'Native stored world lattice roundtrip mismatch'
 ground=[(v['x'],v['y']) for v in domain['original'] if v['y']<2600 and 0<=v['x']<=6500]
 def below(x,y):
  for a,b in zip(ground,ground[1:]):
   if a[0]<=x<=b[0]:return y-a[1]-(x-a[0])*(b[1]-a[1])/(b[0]-a[0])
  raise AssertionError('No actual native rail')
 def edge_checks(a,b):
  xs=[a[0],b[0],*(x for x,y in ground if min(a[0],b[0])<x<max(a[0],b[0]))]
  return [below(x,min(a[1],b[1]) if a[0]==b[0] else a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0])) for x in xs]
 assert rings[0][:3]==rings[1][3:6], 'Structural faces lost exact shared diagonal'
 def undirected(r):return {tuple(sorted((tuple(a),tuple(b)))) for a,b in zip(r,r[1:]+r[:1])}
 for a,b,least in PROPOSED['layerJoins']:
  assert len(undirected(rings[a])&undirected(rings[b]))>=least,'Connected bedrock broke its authored joint' 
 for r in rings:
  assert min(v for a,b in zip(r,r[1:]+r[:1]) for v in edge_checks(a,b))>=.49
 for r,xs in zip(rings[1:],PROPOSED['contactSites']):
  assert [p[0] for p in r[:3]]==xs
  for a,b in zip(r[:2],r[1:3]): assert all(abs(v-.5)<1e-7 for v in edge_checks(a,b))
 assert all(min(v for a,b in zip(r,r[1:]+r[:1]) for v in edge_checks(a,b))>=95 for r in rings[3:]), 'Original quiet crest lost mechanical separation'
 # Independent weak-color/diff reach checks below both true tread intervals, not an art auto-pass.
 def contact_diagnostics(im,prior,cam):
  x0,y0,z=cam; w,h=im.size; target=[]
  for r in rings[1:3]:
   columns=[]
   for a,b in zip(r[:2],r[1:3]):
    for sx in range(math.ceil((a[0]-x0)*z+w/2)+2,math.floor((b[0]-x0)*z+w/2)-1):
     xx=(sx+.5-w/2)/z+x0
     sy=(ground_y(xx)-y0)*z+h/2
     visible=[(j+.5)-sy for j in range(max(0,int(sy)-1),min(h,int(sy)+4)) if im.getpixel((sx,j))!=prior.getpixel((sx,j))]
     columns.append([sx,min(visible,default=None,key=abs)])
   target.append({'columns':columns,'nearWithinOnePixel':sum(d is not None and abs(d)<=1 for _,d in columns)})
  return target
 def ground_y(x):return -below(x,0)
 fresh.screenshot(path=str(root/'12-real-workshop-element.png'))
 edited=get(fresh)
 assert edited['stages'][0]['elements']==[placed]
 assert {k:v for k,v in edited['stages'][0].items() if k!='elements'}=={k:v for k,v in base_stage.items() if k!='elements'}
 assert [a for a in edited['library'] if a['id']!=aid]==q['library']
 fresh.locator('[data-tab=stage]').click();fresh.locator('#overlayToggle').uncheck()
 metrics={}; contact={}; telemetry={}
 for name,cam in start.items():
  after,meta=snap(fresh,cam,root,f'13-after-{name}')
  assert meta['collider']==before[name][1]['collider']==domain['original']
  metrics[name]=pixel_guard(before[name][0],after,rings,cam)
  telemetry[name]={tag:{k:data[k] for k in ('camera','previous','cachePrior','cacheAfter')} for tag,data in [('before',before[name][1]),('after',meta)]}
  if name in ('west-native-match','quiet-crest'):contact[name]=contact_diagnostics(after,before[name][0],cam)
 report.update({'actualNativeWorldRingsVerified':True,'intentionallyBorderMeeting':PROPOSED['contactSites'],'contactScreens':contact,'pixelMetrics':metrics});write()
 (root/'cache-path-proof.json').write_text(json.dumps(telemetry,indent=2))
 with tempfile.TemporaryDirectory() as pa:
  f=Path(pa)/'private-contact.honro-map.json'
  with fresh.expect_download() as ask:fresh.locator('#exportBtn').click()
  ask.value.save_as(f); expect=hashb(f.read_bytes())
  again=open_page()
  with again.expect_file_chooser() as ask:again.locator('#importBtn').click()
  ask.value.set_files(f)
  again.wait_for_function("(n)=>HonroWorkshopAPI.queryScene().stage.name===n",arg=TITLE)
  assert get(again)==edited,'Exact fresh reopen changed draft, rail or style'
  again.locator('#overlayToggle').uncheck()
  for name in ('west-native-match','quiet-crest'):
   im,meta=snap(again,start[name],root,f'14-exact-reopen-{name}')
   assert meta['collider']==domain['original'] and pixel_guardcheck_same(im,root/f'13-after-{name}.png')
 report.update({'nativeExportSha256':expect,'exactReopen':True});write()
 assert all(a['columns'] and a['nearWithinOnePixel']==len(a['columns']) for group in contact.values() for a in group), 'Unverified visible first-pixel contact'
 assert all(v['outsideChangedPx']==0 and v['interiorChangedPx']>0 for v in metrics.values()),'Strict owner gate failed; independent reopened evidence retained'
 report['pass']=True;write()
def pixel_guardcheck_same(im,other):
 from PIL import ImageChops
 return ImageChops.difference(im,Image.open(other).convert('RGB')).getbbox() is None
stock=raw_driver.decode()
# Leave originally proven UI authoring / domain projection verbatim; skip unrelated movement/browser workload.
mark="    fresh.locator('[data-tab=play]').click()"
assert stock.count(mark)==1
stock=stock[:stock.index(mark)]+'    run_shoulder(fresh,open_page,domain,p)\n'
old="NAME='Act 5-2 G full from blank ordinary contour'";assert stock.count(old)==1
stock=stock.replace(old,'NAME='+repr(TITLE))
exec(compile(stock,str(driver),'exec'),{'__file__':str(driver),'__name__':'__main__','run_shoulder':run_shoulder})
