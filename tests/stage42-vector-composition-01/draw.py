import hashlib,json,sys,tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageChops
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
url='http://127.0.0.1:8872/HONRO_WORKSHOP.html'
D=Path(__file__).parent
plan=json.loads((D/'rings.json').read_text())
result={'scope':'original terrain vectors ONLY, no play, collision or remote release','pass':False,'completed':[]}
def put(): (out/'result.json').write_text(json.dumps(result,indent=2,ensure_ascii=False))
def work(p):return p.evaluate('HonroWorkshopAPI.getProject()')
def find(p,id):return next(a for a in work(p)['library'] if a['id']==id)
def stage(p):return p.evaluate('HonroWorkshopAPI.queryScene().stage')
def clickxy(p,k,q):
 where=p.evaluate("""([k,x,y])=>{
 const c=document.querySelector('#'+k+'Canvas'),r=c.getBoundingClientRect(),v=HonroWorkshopAPI.getEditorState()[k+'View'];
 const pt=[r.left+r.width/2+(x-v.x)*v.zoom,r.top+r.height/2+(y-v.y)*v.zoom];
 if(document.elementFromPoint(...pt)!==c)throw Error('Outside native canvas: '+[k,x,y,pt,r.width,r.height]);return pt;
 }""",[k,*q])
 p.mouse.click(*where,click_count=1)
def stageframe(p):
 p.evaluate("HonroWorkshopAPI.setCamera({x:700,y:400,zoom:.79})")
 p.evaluate("HonroWorkshopAPI.setOverlay(false)")
def fresh(b):
 p=b.new_context(viewport={'width':1950,'height':1150},device_scale_factor=1,accept_downloads=True).new_page()
 p.on('pageerror',lambda e:result.setdefault('pageErrors',[]).append(str(e)))
 p.goto(url,wait_until='domcontentloaded');p.wait_for_function('window.HonroWorkshopAPI?.setNeutralTerrainElementFrame',timeout=90000);return p
def open_map(p,value):
 with p.expect_file_chooser() as q:p.locator('#importBtn').click()
 q.value.set_files(value)
 p.wait_for_function("HonroWorkshopAPI.queryScene().stage.name==='성책 지형 벡터 독립작업본'")
def shot(p,name):
 stageframe(p)
 p.mouse.move(2,2)
 p.locator('#stageCanvas').screenshot(path=str(out/name))
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=sys.argv[2],headless=True,args=['--no-sandbox'])
 p=fresh(b);put()
 try:
  # Empty schema serialization only. Zero map geometry, events, actors or media.
  scratch=p.evaluate("""()=>{
   const s=HonroMaps.emptyStage('qa-42-vector-redesign','성책 지형 벡터 독립작업본',1400,800);
   s.environment.placements=[];
   const a={id:'qa-empty-sentinel',name:'Unplaced sentinel',category:'scenery',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};
   a.reference=HonroEnvironment.referenceForLegacyAsset(a);
   return HonroMaps.finalize({schema:'honro-map',version:HonroMaps.VERSION,name:s.name,activeStageId:s.id,
    environmentVersion:HonroEnvironment.VERSION,settings:{autosave:false},stages:[s],library:[a]});
  }""")
  open_map(p,{'name':'empty.honro-map.json','mimeType':'application/json','buffer':json.dumps(scratch).encode()})
  assert not any(stage(p)[k] for k in ['terrains','elements','units','events','objectives'])
  p.evaluate("""()=>{window.vectorPointerAudit={element:0,stage:0,untrusted:0};
   for(const k of ['element','stage'])document.querySelector('#'+k+'Canvas').addEventListener('pointerdown',e=>{if(e.isTrusted)vectorPointerAudit[k]++;else vectorPointerAudit.untrusted++},true)}""")
  shot(p,'00-before-blank-canvas.png')
  for i,g in enumerate(plan['groups'],1):
   p.locator('[data-tab=element]').click()
   past={x['id'] for x in work(p)['library']}
   p.locator('#newAsset').click();a=next(x for x in work(p)['library'] if x['id'] not in past); aid=a['id']
   p.locator('#assetCollision').uncheck()
   p.evaluate('HonroWorkshopAPI.setNeutralTerrainElementFrame({x:0,y:0,zoom:.72})')
   for j,sh in enumerate(g['shapes'],1):
    f=p.locator('#nativeShapeFill')
    p.locator('[data-etool=polygon]').click()
    for xy in sh['p']:clickxy(p,'element',xy)
    p.keyboard.press('Enter')
    a=find(p,aid);assert len(a['visual'])==j+1,(g['role'],j,len(a['visual']))
    actual=a['visual'][-1]['points']
    assert len(actual)==len(sh['p']),(g['role'],j,len(actual),len(sh['p']))
    assert max(abs(pt[k]-c) for pt,sp in zip(actual,sh['p']) for k,c in zip(['x','y'],sp))<=2
    assert f.is_enabled(),(g['role'],j,'shape inspector')
    f.fill(sh['fill']);f.press('Tab')
    assert find(p,aid)['visual'][-1]['fill']==sh['fill']
   # No new shape covers the default seed centre for the chosen artist contours.
   clickxy(p,'element',[0,0])
   assert p.evaluate('HonroWorkshopAPI.getEditorState().selectedShapeIndex')==0
   p.keyboard.press('Delete')
   a=find(p,aid);assert len(a['visual'])==len(g['shapes']) and not a['collision']
   assert [s['fill'] for s in a['visual']]==[s['fill'] for s in g['shapes']]
   p.locator('#assetLayer').fill('prop');p.locator('#assetLayer').press('Tab')
   p.locator('[data-tab=stage]').click();p.locator(f'[data-asset="{aid}"]').click()
   p.locator('[data-tool=place]').click();stageframe(p);clickxy(p,'stage',[700,400])
   layer=next(x for x in stage(p)['elements'] if x['assetId']==aid)
   assert abs(layer['x']-700)<=2 and abs(layer['y']-400)<=2 and layer['layer']=='prop',layer
   if p.locator('#elSnap').is_checked():p.locator('#elSnap').uncheck()
   result['completed'].append({'role':g['role'],'shapes':len(a['visual']),'points':sum(len(s['points']) for s in a['visual'])})
   shot(p,f'{i:02}-native-{g["role"]}.png');put()
  assert not any(stage(p)[k] for k in ['terrains','units','events','objectives'])
  result['inputCounts']=p.evaluate('vectorPointerAudit')
  assert result['inputCounts']['element']>=sum(g['points'] for g in result['completed']) and result['inputCounts']['untrusted']==0
  with p.expect_download() as q:p.locator('#exportBtn').click()
  f=out/'private-native-vector.honro-map.json';q.value.save_as(f)
  saved=json.loads(f.read_bytes())
  q=fresh(b);open_map(q,f)
  assert work(q)['library']==saved['library'] and stage(q)['elements']==stage(p)['elements']
  shot(q,'04-native-export-reopened.png')
  img1=Image.open(out/'03-native-east-shelf.png').convert('RGB')
  img2=Image.open(out/'04-native-export-reopened.png').convert('RGB')
  assert ImageChops.difference(img1,img2).getbbox() is None
  result['saved_sha256']=hashlib.sha256(f.read_bytes()).hexdigest()
  result['same_camera_reopen_pixels']=True
  assert not result.get('pageErrors')
  result['pass']=True;put()
 except Exception as e:
  result['error']=str(e);put();p.screenshot(path=str(out/'99-authoring-error.png'));raise
 finally:b.close()
