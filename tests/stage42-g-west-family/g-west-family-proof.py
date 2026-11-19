"""True full E stock pointer replay and localized shoulder; no art brush/import/injection."""
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
TITLE='혼로 5막 2장 G · 서부 기반암 계열 검증'
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
  HonroWorkshopAPI.setCamera({x,y,zoom});
  const c=document.querySelector('#stageCanvas'),v=HonroWorkshopAPI.getEditorState().stageView,b=HonroWorkshopAPI.getRuntime().engine.b;
  return {png:c.toDataURL('image/png'),camera:[v.x,v.y,v.zoom],size:[c.width,c.height],css:[c.clientWidth,c.clientHeight],
          domain:HonroTerrainDomain.active(b),collider:b.terrain[0].vertices,overlay:document.querySelector('#overlayToggle').checked};
 }""",cam)
def snap(p,cam,root,key):
 a=raw_scene(p,cam);im=base64.b64decode(a.pop('png').split(',',1)[1],validate=True);
 (root/f'{key}.png').write_bytes(im)
 assert a['camera']==cam and a['domain'] and not a['overlay'] and a['size']==a['css']
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
def fit_native_element(p, targets, root, phase, first_zoom):
 # Using existing wheel and middle-drag controls, no direct Element camera mutation,
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
  spans=(xmax-xmin,ymax-ymin);expected_zoom=math.exp(-.87)
  margin=(w-spans[0]*expected_zoom,h-spans[1]*expected_zoom)
  assert all(v>=27 for v in margin) and math.sqrt(2)*.5/expected_zoom<1.8, 'Measured aperture is not large enough at legal input precision'
  if first_zoom:
   assert abs(z-1)<1e-8
   p.mouse.move(*center);p.mouse.wheel(0,580)
  p.wait_for_function("expected=>Math.abs(HonroWorkshopAPI.getEditorState().elementView.zoom-expected)<1e-7",arg=expected_zoom)
  zoomed=check('real-wheel-580' if first_zoom else 'already-verified-native-zoom')
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
  write()
  assert not last['blocked'] and min(rows[-1]['exactMarginsPx'])>=12,'Native Element target coverage or 12px aperture margin shortage; no authoring'
  assert math.sqrt(2)*.5/last['camera'][2] < 1.8, 'Viewport fitting would exceed existing authored-point tolerance'
  return last
 except:
  write();p.screenshot(path=str(root/f'16-{phase}-actual-fit-blocked.png'));raise
def assert_tones(d,old):
 luma=lambda a:sum(x*y for x,y in zip(a,(.2126,.7152,.0722)))
 ch={k:luma(d[k]) for k in ('local_return','primary','secondary')}
 assert 14<=ch['local_return']-luma(old)<=37,'Dark recessed return should remain close to stock substrate'
 assert ch['primary']-ch['local_return']>=17 and ch['secondary']-luma(old)>=23 and ch['primary']-ch['secondary']>=8,'Distinct exposed plane values no longer read'
def run_shoulder(fresh,open_page,domain,root):
 root=Path(root);report={'scope':'Only Stage42 G west family; no rest-of-stage/bridge/playability/production or art-pass claim','pass':False}
 def write():(root/'shoulder-proof.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 write()
 assert hashlib.sha256(canonical(domain['original'])).hexdigest()==pin['collisionGeometrySha256'],'Genuine base replay vertices drifted'
 assert hashlib.sha256(canonical(domain['world'])).hexdigest()==pin['projectedGeometrySha256'],'Genuine stock exterior projection drifted'
 q=get(fresh); assert q['stages'][0]['terrainDomainVersion']==1 and q['stages'][0]['name']==TITLE
 assert len(q['stages'][0]['terrains'])==1 and not q['stages'][0]['elements']
 base_stage=q['stages'][0]; start=evidence_views={'west-native-match':[580,1625,.5],'whole':[3250,1650,.14],'family-fit':[765,1820,.5],'probe':[765,1820,.95]}
 before={}
 for name,cam in start.items():before[name]=snap(fresh,cam,root,f'11-before-{name}')
 fresh.locator('[data-tab=element]').click()
 fresh.locator('#newAsset').click()
 aid=next(v['id'] for v in get(fresh)['library'] if v['category']=='custom')
 assert fresh.locator('#nativeShapeFill').is_disabled()
 fresh.locator('#assetCollision').uncheck()
 fresh.locator('#assetName').fill('서부 기반암 계열 (검증용)')
 fresh.locator('#assetName').press('Tab')
 fresh.locator('#assetLayer').fill('prop');fresh.locator('#assetLayer').press('Tab')
 fresh.locator('[data-tab=stage]').click();fresh.locator(f'[data-asset="{aid}"]').click()
 fresh.evaluate('()=>HonroWorkshopAPI.setCamera({x:300,y:1800,zoom:1})')
 fresh.mouse.click(*cursor(fresh,'stage',PROPOSED['nativeAssetAnchorWorld']))
 fresh.locator('#elSnap').uncheck()
 placed=get(fresh)['stages'][0]['elements'][0]
 assert placed['assetId']==aid and placed['layer']=='prop' and placed['rotation']==0 and placed['scale']==1 and placed['depthLayer']=='L1' and not placed['snap']
 dx,dy=placed['x'],placed['y']
 assert abs(dx-159)<1 and abs(dy-1902)<2
 fresh.locator('[data-tab=element]').click()
 ordered=PROPOSED['faces'] # matrix first; three constrained surface faces above
 local=[[[x-dx,y-dy] for x,y in row['clockwiseWorld']] for row in ordered]
 targets=list(dict.fromkeys(tuple(xy) for p in local[:2] for xy in p+[p[0]]))+[(0,0)]
 assert len(targets)==len(set(targets))
 fit=fit_native_element(fresh,targets,root,'ascent',True)
 z=fit['camera'][2]
 assert all(math.dist(a,b)*z>=5 for row in local for a,b in zip(row,row[1:] + row[:1])), 'Adjacent native click spacing would coalesce at fit zoom'
 seed=owned(fresh,aid)['visual']
 assert len(seed)==1 and seed[0]['type']=='polygon' and len(seed[0]['points'])==6
 seed=seed[0]
 seed_hash=hashb(canonical(seed))
 for k,s in enumerate(ordered):
  if k==2:fit_native_element(fresh,[tuple(xy) for xy in local[2]],root,'reverse-scarp',False)
  fresh.locator('[data-etool=polygon]').click();assert fresh.locator('#nativeShapeFill').is_disabled()
  for x,y in s['clockwiseWorld']:
   try:fresh.mouse.click(*cursor(fresh,'element',[x-dx,y-dy]))
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
   pt=cursor_choices[0]
   fresh.mouse.click(*cursor(fresh,'element',pt))
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
 assert len(o['visual'])==3 and not o['collision'] and not o.get('interactionType')
 assert all(v['stroke']=='#222d30' for v in o['visual']),'Preferred ink behavior is not patched'
 assert [x['fill'] for x in o['visual']]==[x['fill'] for x in ordered]
 rings=[[[w['x']+dx,w['y']+dy] for w in row['points']] for row in o['visual']]
 assert all(len(r)==len(p['clockwiseWorld']) and all(math.dist(x,y)<=1.8 for x,y in zip(r,p['clockwiseWorld'])) for r,p in zip(rings,ordered))
 rr=lambda p:set((tuple(a),tuple(b)) for a,b in zip(p,p[1:]+p[:1]))
 assert len(rr(rings[0])&rr(rings[1]))==1,'Ascent members lost exact shared bedding line'
 # Check every segment at all intervening real Solid knots, not planned top or raster.
 ground=[(v['x'],v['y']) for v in domain['original'] if v['y']<2600 and 0<=v['x']<=6500]
 def below(x,y):
  for a,b in zip(ground,ground[1:]):
   if a[0]<=x<=b[0]:return y-a[1]-(x-a[0])*(b[1]-a[1])/(b[0]-a[0])
  raise AssertionError('No actual contact beneath target')
 minbelow=999.
 for r in rings:
  for a,b in zip(r,r[1:]+r[:1]):
   for x in [a[0],b[0],*(x for x,y in ground if min(a[0],b[0])<x<max(a[0],b[0]))]:
    y=min(a[1],b[1]) if a[0]==b[0] else a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0])
    minbelow=min(minbelow,below(x,y))
 assert minbelow>=3.0 and all(315<x<1197 and y<2020 for p in rings for x,y in p),'False tread, underside or extended face outside scope'
 assert max(x for poly in rings[:2] for x,y in poly)<762 and min(x for x,y in rings[2])>953,'Distinct exposures may not be bridged or connected by an underlay'
 for xy in ([262,1850],[852,1615],[875,1780],[1340,1840]):
  assert all(not point_poly(poly,*xy) and point_dist(poly,*xy)>4 for poly in rings)
 fresh.screenshot(path=str(root/'12-real-workshop-element.png'))
 edited=get(fresh)
 assert edited['stages'][0]['elements']==[placed]
 assert {k:v for k,v in edited['stages'][0].items() if k!='elements'}=={k:v for k,v in base_stage.items() if k!='elements'}
 assert [a for a in edited['library'] if a['id']!=aid]==q['library']
 fresh.locator('[data-tab=stage]').click();fresh.locator('#overlayToggle').uncheck()
 metrics={}
 for name,cam in start.items():
  after,meta=snap(fresh,cam,root,f'13-after-{name}')
  assert meta['collider']==before[name][1]['collider']==domain['original']
  metrics[name]=pixel_guard(before[name][0],after,rings,cam)
  if name=='probe':
   probes=[([645,1745],'local_return'),([515,1780],'primary'),([1030,1690],'secondary')]
   for i,(pt,k) in enumerate(probes):
    assert point_poly(rings[i],*pt) and point_dist(rings[i],*pt)>5,(pt,rings[i])
    assert not any(point_poly(poly,*pt) for poly in rings[i+1:]),'Probe lies under another face'
    metrics[name][k]=color_probe(after,cam,pt)
   for xy in ([852,1615],[875,1780]):
    assert color_probe(before[name][0],cam,xy)==color_probe(after,cam,xy),'Untouched visual gaps changed'
   metrics[name]['old_matrix']=color_probe(before[name][0],cam,[875,1780])
   assert_tones(metrics[name],metrics[name]['old_matrix'])
 report['pixelMetrics']=metrics;write() # diagnostics are emitted before strict rejection
 assert all(v['outsideChangedPx']==0 and v['interiorChangedPx']>0 for v in metrics.values()),metrics
 report.update({'supports_exact':True,'trueAuthoredFaces':3,'jointSegmentsShared':1,'pixelMetrics':metrics,'lowestClearanceBelowTrueContact':minbelow,'observedWorldPlacement':placed,'nativeFills':[v['fill'] for v in o['visual']]});write()
 with tempfile.TemporaryDirectory() as pa:
  f=Path(pa)/'private-evidence.honro-map.json'
  with fresh.expect_download() as ask:fresh.locator('#exportBtn').click()
  ask.value.save_as(f); expect=hashb(f.read_bytes())
  again=open_page()
  with again.expect_file_chooser() as ask:again.locator('#importBtn').click()
  ask.value.set_files(f)
  again.wait_for_function("(n)=>HonroWorkshopAPI.queryScene().stage.name===n",arg=TITLE)
  assert get(again)==edited,'Exact fresh workshop reopen changed draft, route, domain or style'
  again.locator('#overlayToggle').uncheck()
  sim,meta=snap(again,start['west-native-match'],root,'14-exact-reopen-native-stage-near')
  assert meta['collider']==domain['original']
  assert pixel_guardcheck_same(sim,root/'13-after-west-native-match.png')
  again.locator('[data-tab=play]').click()
  try:again.wait_for_function("()=>{const a=HonroWorkshopAPI.getPlayApp();return a?.engine?.b&&a.scene?.canvas?.width>1&&a.canInput()}",timeout=45000)
  finally:again.screenshot(path=str(root/'15-native-playtest-shoulder.png'))
  game=again.evaluate("""([aid,x,y])=>{
    const a=HonroWorkshopAPI.getPlayApp(),b=a.engine.b;
    const row=b.honroLandmarks?.find(v=>v.asset?.id===aid);return {id:row?.asset.id,fills:row?.asset.visual.map(v=>v.fill),collider:b.terrain[0]?.vertices, count:b.terrain.length, exterior:HonroTerrainDomain.active(b),
      camera:[a.scene.x,a.scene.y,a.scene.scale], size:[a.scene.canvas.clientWidth,a.scene.canvas.clientHeight], canvas:a.scene.canvas.toDataURL('image/png'), x:row?.x, y:row?.y};
  }""",[aid,dx,dy])
  assert game['exterior'] and game['count']==1 and game['collider']==domain['original'] and game['fills']==[v['fill'] for v in o['visual']]
  game_canvas=Image.open(BytesIO(base64.b64decode(game.pop('canvas').split(',',1)[1],validate=True))).convert('RGB')
  assert game_canvas.size==tuple(game['size']),'Playtest pixel sampling requires actual device DPR 1'
  game_probe={}
  cx,cy,z=game['camera'];w,h=game_canvas.size
  for pt,k in probes[:2]:
   assert abs(pt[0]-cx)*z<w/2-4 and abs(pt[1]-cy)*z<h/2-4,'Actual camera did not include valid shoulder material probe'
   game_probe[k]=color_probe(game_canvas,game['camera'],pt,width=1)
  lum=lambda a:sum(x*y for x,y in zip(a,(.2126,.7152,.0722)))
  assert lum(game_probe['primary'])-lum(game_probe['local_return'])>=17,'Actual spawn Playtest lacks distinct primary values'
 report.update({'nativePlaytestRgbProbes':game_probe,'newReceiptSha256':expect,'exactReopen':True,'reopenedPlaytestHasSameColliderAndSceneMaterials':True,'playtestCamera':game['camera'],'pass':True});write()
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
