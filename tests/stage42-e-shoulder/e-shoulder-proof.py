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
TITLE='혼로 5막 2장 E · 서쪽 암반 어깨 작도 검증'
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
 outside=0;inside=0;aa=0
 for j in range(t,b):
  for i in range(l,r):
   if f[i,j]==(0,0,0):continue
   x,y=cx+(i+.5-w/2)/z,cy+(j+.5-h/2)/z
   lo=[q for q in p if min(v[0] for v in q)-2/z<=x<=max(v[0] for v in q)+2/z and min(v[1] for v in q)-2/z<=y<=max(v[1] for v in q)+2/z]
   if any(point_poly(q,x,y) for q in lo):inside+=1
   elif any(point_dist(q,x,y)<=2/z for q in lo):aa+=1
   else:outside+=1
 return {'exactDifferenceBoundsPx':loc,'interiorChangedPx':inside,'edgeTolerancePx':aa,'outsideChangedPx':outside}
def color_probe(image,cam,xy,width=1):
 w,h=image.size;cx,cy,z=cam;x,y=round(w/2+(xy[0]-cx)*z),round(h/2+(xy[1]-cy)*z)
 return tuple(round(median(x[i] for x in image.crop((x-width,y-width,x+width+1,y+width+1)).getdata())) for i in range(3))
def run_shoulder(fresh,open_page,domain,root):
 root=Path(root);report={'scope':'new full E graybox with only west shoulder style; no bridge/east/production or art-pass claim','pass':False}
 def write():(root/'shoulder-proof.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 write()
 assert hashlib.sha256(canonical(domain['original'])).hexdigest()==pin['collisionGeometrySha256'],'Genuine base replay vertices drifted'
 assert hashlib.sha256(canonical(domain['world'])).hexdigest()==pin['projectedGeometrySha256'],'Genuine stock exterior projection drifted'
 q=get(fresh); assert q['stages'][0]['terrainDomainVersion']==1 and q['stages'][0]['name']==TITLE
 assert len(q['stages'][0]['terrains'])==1 and not q['stages'][0]['elements']
 base_stage=q['stages'][0]; start=evidence_views={'near':[285,1480,.5],'actual-full-e-west':[850,1490,.5],'whole':[3250,1430,.14],'probe':[278,1480,1.2]}
 before={}
 for name,cam in start.items():before[name]=snap(fresh,cam,root,f'11-before-{name}')
 fresh.locator('[data-tab=element]').click()
 fresh.locator('#newAsset').click()
 aid=next(v['id'] for v in get(fresh)['library'] if v['category']=='custom')
 assert fresh.locator('#nativeShapeFill').is_disabled()
 fresh.locator('#assetCollision').uncheck()
 fresh.locator('#assetName').fill('서쪽 어깨 · 젖은 점판암 (검증용)')
 fresh.locator('#assetName').press('Tab')
 fresh.locator('#assetLayer').fill('prop');fresh.locator('#assetLayer').press('Tab')
 fresh.locator('[data-tab=stage]').click();fresh.locator(f'[data-asset="{aid}"]').click()
 fresh.evaluate('()=>HonroWorkshopAPI.setCamera({x:225,y:1430,zoom:1})')
 fresh.mouse.click(*cursor(fresh,'stage',PROPOSED['nativeAssetAnchorWorld']))
 fresh.locator('#elSnap').uncheck()
 placed=get(fresh)['stages'][0]['elements'][0]
 assert placed['assetId']==aid and placed['layer']=='prop' and placed['rotation']==0 and placed['scale']==1 and placed['depthLayer']=='L1' and not placed['snap']
 dx,dy=placed['x'],placed['y']
 assert abs(dx-94)<1 and abs(dy-1364)<2
 fresh.locator('[data-tab=element]').click()
 ordered=[PROPOSED['faces'][1],PROPOSED['faces'][0],PROPOSED['faces'][2]] # print darkest return first
 for k,s in enumerate(ordered):
  fresh.locator('[data-etool=polygon]').click();assert fresh.locator('#nativeShapeFill').is_disabled()
  for x,y in s['clockwiseWorld']:fresh.mouse.click(*cursor(fresh,'element',[x-dx,y-dy]))
  fresh.keyboard.press('Enter')
  inp=fresh.locator('#nativeShapeFill');assert inp.is_enabled()
  inp.fill(s['fill']);inp.press('Tab')
  o=owned(fresh,aid);assert len(o['visual'])==k+2 and o['visual'][-1]['fill']==s['fill'] and not o['collision']
 fresh.mouse.click(*cursor(fresh,'element',[0,0]))
 assert fresh.evaluate('HonroWorkshopAPI.getEditorState().selectedShapeIndex')==0
 assert fresh.evaluate('HonroWorkshopAPI.getEditorState().selectedNode')==-1
 fresh.keyboard.press('Delete')
 o=owned(fresh,aid)
 assert len(o['visual'])==3 and not o['collision'] and not o.get('interactionType')
 assert all(v['stroke']=='#222d30' for v in o['visual']),'Preferred ink behavior is not patched'
 assert [x['fill'] for x in o['visual']]==[x['fill'] for x in ordered]
 rings=[[[w['x']+dx,w['y']+dy] for w in row['points']] for row in o['visual']]
 assert all(len(r)==len(p['clockwiseWorld']) and all(math.dist(x,y)<=1.8 for x,y in zip(r,p['clockwiseWorld'])) for r,p in zip(rings,ordered))
 rr=lambda p:set((tuple(a),tuple(b)) for a,b in zip(p,p[1:]+p[:1]))
 assert len(rr(rings[0])&set((b,a) for a,b in rr(rings[1])))==5,'Real pointer sample did not preserve five exact shared seams'
 # Check every segment at all intervening real Solid knots, not planned top or raster.
 ground=[(v['x'],v['y']) for v in domain['original'] if v['y']<2000 and 0<=v['x']<=6500]
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
 assert minbelow>=1.7 and all(x<444 and y<1636 for p in rings for x,y in p),'False tread or extended face outside scope'
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
   for i,(pt,k) in enumerate([([355.8,1510],'dark_return'),([207.4,1479],'slate_front'),([170.6,1383.8],'cambium')]):
    assert point_poly(rings[i],*pt) and point_dist(rings[i],*pt)>3.0,(pt,rings[i])
    metrics[name][k]=color_probe(after,cam,pt)
   dr,mi,li=(metrics[name][k] for k in ('dark_return','slate_front','cambium'))
   luma=lambda a:sum(x*y for x,y in zip(a,(.2126,.7152,.0722)))
   assert luma(mi)-luma(dr)>=15 and luma(li)-luma(mi)>=10, metrics[name]
 assert all(v['outsideChangedPx']==0 and v['interiorChangedPx']>0 for v in metrics.values()),metrics
 report.update({'supports_exact':True,'trueAuthoredFaces':3,'jointSegmentsShared':5,'pixelMetrics':metrics,'lowestClearanceBelowTrueContact':minbelow,'observedWorldPlacement':placed,'nativeFills':[v['fill'] for v in o['visual']]});write()
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
  sim,meta=snap(again,start['near'],root,'14-exact-reopen-native-stage-near')
  assert meta['collider']==domain['original']
  assert pixel_guardcheck_same(sim,root/'13-after-near.png')
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
  for pt,k in [([355.8,1510],'dark_return'),([207.4,1479],'slate_front'),([170.6,1383.8],'cambium')]:
   assert abs(pt[0]-cx)*z<w/2-4 and abs(pt[1]-cy)*z<h/2-4,'Actual camera did not include valid shoulder material probe'
   game_probe[k]=color_probe(game_canvas,game['camera'],pt,width=1)
  dr,mi,li=(game_probe[k] for k in ('dark_return','slate_front','cambium'))
  luma=lambda a:sum(x*y for x,y in zip(a,(.2126,.7152,.0722)))
  assert luma(mi)-luma(dr)>=15 and luma(li)-luma(mi)>=8,{'Playtest actual pixels':game_probe}
 report.update({'nativePlaytestRgbProbes':game_probe,'newReceiptSha256':expect,'exactReopen':True,'reopenedPlaytestHasSameColliderAndSceneMaterials':True,'playtestCamera':game['camera'],'pass':True});write()
def pixel_guardcheck_same(im,other):
 from PIL import ImageChops
 return ImageChops.difference(im,Image.open(other).convert('RGB')).getbbox() is None
stock=raw_driver.decode()
# Leave originally proven UI authoring / domain projection verbatim; skip unrelated movement/browser workload.
mark="    fresh.locator('[data-tab=play]').click()"
assert stock.count(mark)==1
stock=stock[:stock.index(mark)]+'    run_shoulder(fresh,open_page,domain,p)\n'
old="NAME='Act 5-2 E full ordinary ground graybox'";assert stock.count(old)==1
stock=stock.replace(old,'NAME='+repr(TITLE))
exec(compile(stock,str(driver),'exec'),{'__file__':str(driver),'__name__':'__main__','run_shoulder':run_shoulder})
