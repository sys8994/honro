"""CI proposal, trusted blank file / camera / browser pointer UI; no injected art."""
import hashlib,json,os,sys,tempfile
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
url=sys.argv[2];assert url=='http://127.0.0.1:8884/HONRO_WORKSHOP.html'
A=[[-182,63],[-85,58],[-100,132],[-173,137]]
B=[[78,65],[180,58],[171,132],[96,138]]
RING=[[0,1380],[190,1400],[420,1460],[700,1515],[950,1457],[1400,1380],[1400,2990],[0,2990]]
NAME='Native selected face fill QA (blank geometry fixture)'
result={'scope':'Fresh authored mechanical color fixture, not a Stage42 art/terrain finish', 'pass':False}
def put(): (out/'proof.json').write_text(json.dumps(result,indent=2))
def project(p): return p.evaluate('HonroWorkshopAPI.getProject()')
def asset(p,id):return next(a for a in project(p)['library'] if a['id']==id)
def stage(p):return p.evaluate('HonroWorkshopAPI.queryScene().stage')
def ed(p):return p.evaluate('HonroWorkshopAPI.getEditorState()')
def realpoint(p,kind,xy):
 return p.evaluate("""([kind,x,y])=>{
   const c=document.querySelector('#'+kind+'Canvas'),r=c.getBoundingClientRect(),state=HonroWorkshopAPI.getEditorState(),
     v=state[kind+'View'],q=[r.left+r.width/2+(x-v.x)*v.zoom,r.top+r.height/2+(y-v.y)*v.zoom];
   if(document.elementFromPoint(...q)!==c)throw Error('True click is not on native canvas');
   return q;
 }""",[kind,*xy])
def paint(p,v):
 f=p.locator('#nativeShapeFill');assert f.is_enabled()
 f.fill(v);f.press('Tab')
def absent(p):assert p.locator('#nativeShapeFill').is_disabled()
def canvasShot(p,n):
 p.locator('#stageCanvas').screenshot(path=str(out/n))
def sample(p,where):
 return [int(round(n)) for n in p.evaluate("""([x,y])=>{const c=document.querySelector('#stageCanvas'),v=HonroWorkshopAPI.getEditorState().stageView;
 return [c.clientWidth/2+(x-v.x)*v.zoom,c.clientHeight/2+(y-v.y)*v.zoom]}""",where)]
with sync_playwright() as pw:
 chrome=pw.chromium.launch(executable_path=os.environ['HONRO_CHROME'],headless=True,args=['--no-sandbox'])
 def page():
  p=chrome.new_context(viewport={'width':1500,'height':900},accept_downloads=True).new_page()
  p.goto(url);p.wait_for_function('window.HonroWorkshopAPI')
  return p
 def open_native(p,files):
  with p.expect_file_chooser() as q:p.locator('#importBtn').click()
  q.value.set_files(files)
  p.wait_for_function('(n)=>HonroWorkshopAPI.queryScene().stage.name===n',arg=NAME)
 t=page()
 scratch=t.evaluate("""n=>{
   const s=HonroMaps.emptyStage('qa-native-selected-fill',n,1400,3000);
   s.environment.placements=[];s.units.push(HonroUnits.record('archer','qa-fill-player',230,1420,'player'));
   s.objectives.push({id:'qa-fill-destination',type:'reach',label:'Mechanical color fixture',x:1310,y:1380,radius:30,required:true});
   const a={id:'qa-empty-sentinel',name:'Unplaced sentinel',category:'scenery',visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};
   a.reference=HonroEnvironment.referenceForLegacyAsset(a);return HonroMaps.finalize({
    schema:'honro-map',version:HonroMaps.VERSION, name:n, activeStageId:s.id,environmentVersion:HonroEnvironment.VERSION,
    settings:{autosave:false},stages:[s],library:[a]});
 }""",NAME)
 open_native(t,{'name':'empty-private.honro-map.json','mimeType':'application/json','buffer':json.dumps(scratch).encode()})
 assert not stage(t)['terrains'] and not stage(t)['elements'] and len(project(t)['library'])==1 and not project(t)['library'][0]['visual']
 t.locator('#overlayToggle').uncheck()
 t.locator('[data-tool=solid]').click()
 for xy in RING:
  t.evaluate('([x,y])=>HonroWorkshopAPI.setCamera({x,y,zoom:.9})',xy)
  t.mouse.click(*realpoint(t,'stage',xy))
 t.keyboard.press('Enter')
 floor=stage(t)['terrains']
 assert len(floor)==1 and len(floor[0]['points'])==len(RING)
 t.locator('[data-tab=element]').click();absent(t)
 t.locator('#newAsset').click()
 id=next(a['id'] for a in project(t)['library'] if a['category']=='custom')
 absent(t)
 t.locator('#assetCollision').uncheck()
 assert not asset(t,id)['collision']
 for i,poly in enumerate([A,B],1):
  t.locator('[data-etool=polygon]').click();absent(t)
  for xy in poly:
   t.mouse.click(*realpoint(t,'element',xy))
  t.keyboard.press('Enter')
  sho=asset(t,id)['visual']
  assert len(sho)==i+1 and len(sho[-1]['points'])==4 and not asset(t,id)['collision']
  assert all(max(abs(a[k]-x) for k,x in zip(('x','y'),pt))<=2 for a,pt in zip(sho[-1]['points'],poly))
 t.mouse.click(*realpoint(t,'element',[0,0]))
 assert ed(t)['selectedShapeIndex']==0 and ed(t)['selectedNode']==-1
 t.keyboard.press('Delete')
 ge=asset(t,id)['visual'];assert len(ge)==2
 t.mouse.click(*realpoint(t,'element',[-140,95]));assert ed(t)['selectedShapeIndex']==0
 invalid_before=project(t);paint(t,'bogus');assert project(t)==invalid_before
 paint(t,'#53636A');lo=asset(t,id)
 assert lo['visual'][0]['fill']=='#53636a' and lo['visual'][1]==ge[1]
 t.locator('#undoBtn').click();assert asset(t,id)['visual']==ge
 t.locator('#redoBtn').click();assert asset(t,id)==lo
 t.locator('#assetLayer').fill('prop');t.locator('#assetLayer').press('Tab')
 t.locator('[data-tab=stage]').click()
 t.locator(f'[data-asset="{id}"]').click()
 t.locator('[data-tool=place]').click()
 t.evaluate('()=>HonroWorkshopAPI.setCamera({x:440,y:1480,zoom:.7})')
 t.mouse.click(*realpoint(t,'stage',[440,1470]))
 pos=stage(t)['elements']
 assert len(pos)==1 and pos[0]['assetId']==id and pos[0]['layer']=='prop'
 t.locator('#elSnap').uncheck()
 pos=stage(t)['elements'][0]
 for key,value in [('rotation',0),('scale',1),('depthLayer','L1'),('snap',False)]:
  assert pos[key]==value,(key,pos[key])
 t.locator('#overlayToggle').uncheck()
 canvasShot(t,'01-true-stage-before-sibling-fill.png')
 sample_l=sample(t,[pos['x']-135,pos['y']+96]);sample_r=sample(t,[pos['x']+122,pos['y']+96])
 t.locator('[data-tab=element]').click();t.mouse.click(*realpoint(t,'element',[125,95]));assert ed(t)['selectedShapeIndex']==1
 paint(t,'#875a3d'); hi=asset(t,id)
 assert hi['visual'][0]==lo['visual'][0] and hi['visual'][1]['fill']=='#875a3d'
 assert hi['visual'][1]['points']==lo['visual'][1]['points'] and hi['visual'][1]['stroke']==lo['visual'][1]['stroke']
 assert not hi['collision'] and stage(t)['terrains']==floor
 t.screenshot(path=str(out/'02-selected-native-fill-ui.png'))
 result.update({'real_pointer_faces':2,'selected_only_undo_redo':True,'invalid_input_immutable':True,'stroke_byte_unchanged':True,'native_fills':[s['fill'] for s in hi['visual']]})
 put()
 with tempfile.TemporaryDirectory() as td:
  with t.expect_download() as q:t.locator('#exportBtn').click()
  f=Path(td)/'native-private.honro-map.json';q.value.save_as(f)
  exported=f.read_bytes();saved=json.loads(exported)
  assert next(a for a in saved['library'] if a['id']==id)['visual']==hi['visual']
  edit=page();open_native(edit,f);assert asset(edit,id)==hi and stage(edit)==stage(t)
  edit.locator('#overlayToggle').uncheck()
  edit.evaluate('()=>HonroWorkshopAPI.setCamera({x:440,y:1480,zoom:.7})')
  canvasShot(edit,'03-exact-reopen-stage-after-sibling-fill.png')
  a,b=[Image.open(out/n).convert('RGB') for n in ['01-true-stage-before-sibling-fill.png','03-exact-reopen-stage-after-sibling-fill.png']]
  def med(im, xy):
   from statistics import median
   x,y=xy;pixels=list(im.crop((x-3,y-3,x+4,y+4)).getdata())
   return tuple(round(median(p[k] for p in pixels)) for k in range(3))
  left0,left1=med(a,sample_l),med(b,sample_l)
  right0,right1=med(a,sample_r),med(b,sample_r)
  dist=lambda x,y:sum(abs(a-b) for a,b in zip(x,y))
  # Both probes are strictly inside true native world placements.
  assert dist(left0,left1)<=8 and dist(right0,right1)>45 and dist(left1,right1)>45,(left0,left1,right0,right1)
  result.update({'stage_pixels':{'left':[left0,left1],'right':[right0,right1]},'private_receipt_sha256':hashlib.sha256(exported).hexdigest(),'fresh_reopen_values_exact':True})
  put()
  edit.locator('[data-tab=play]').click()
  try:edit.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine',timeout=45000)
  finally:edit.screenshot(path=str(out/'04-native-playtest.png'))
  assert edit.evaluate("""([rid,aid])=>{
    const app=HonroWorkshopAPI.getPlayApp(), b=app.engine.b;
    return b.terrain.length===1&&b.terrain[0].id===rid&&
     b.honroLandmarks?.some(q=>q.asset?.id===aid&&q.asset?.visual?.[1]?.fill==='#875a3d');
  }""",[floor[0]['id'],id]),'Playtest did not consume authored color model with identical single collision owner'
  edit.locator('[data-tab=element]').click();edit.locator(f'[data-edit-asset="{id}"]').click();absent(edit)
  edit.mouse.click(*realpoint(edit,'element',[125,95]));paint(edit,'#6B543E')
  assert asset(edit,id)['visual'][1]['fill']=='#6b543e'
  assert asset(edit,id)['visual'][0]==hi['visual'][0] and stage(edit)['terrains']==floor
  result.update({'playtest_has_model_and_single_original_collider':True,'fresh_reedit_selected_only':True,'pass':True})
  put()
