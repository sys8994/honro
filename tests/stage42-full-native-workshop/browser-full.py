"""Planned Chrome verification only. Artist itinerary is read as mouse schedule."""
import base64,hashlib,json,os,sys,tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
D=Path(__file__).parent
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
plan=json.loads(Path(os.environ['HONRO_FULL42_ARTIST_ITINERARY']).read_text())
assert plan['schema']=='honro.full-stage42.pointer-sequence' and len(plan["phases"])==34
cameras=json.loads((D/'review-cameras.json').read_text())
game=(D/'game-full.js').read_text()
r={'pass':False,'errors':[],'layout_scope':'all four authored sections, separate lower/deck, four margins; visual blockout, no play approved'}
def ck(step):
 r['step']=step;(out/'result.json').write_text(json.dumps(r,indent=2,ensure_ascii=False))
def start(b):
 p=b.new_context(viewport={'width':1920,'height':1080},accept_downloads=True,device_scale_factor=1).new_page()
 p.on('pageerror',lambda e:r['errors'].append(str(e)));p.goto(os.environ['HONRO_FULL42_URL'],wait_until='domcontentloaded')
 p.wait_for_function("window.HonroWorkshopAPI && document.querySelector('#nativeFull42Host')",timeout=90000)
 return p
def click(p,label):p.get_by_role('button',name=label,exact=True).click()
def camera(p,q):
 x,y,z=q;p.evaluate("v=>HonroWorkshopAPI.setCamera(v)",{'x':x,'y':y,'zoom':z})
def target(p,pt,zoom=.36):
 x,y=pt;camera(p,[x,y,zoom])
 return p.evaluate("""([x,y])=>{
  const c=document.querySelector('#stageCanvas'),b=c.getBoundingClientRect(),v=HonroWorkshopAPI.getEditorState().stageView;
  const w=[b.left+b.width/2+(x-v.x)*v.zoom,b.top+b.height/2+(y-v.y)*v.zoom];
  if(document.elementFromPoint(...w)!==c)throw Error('True pointer outside active canvas');
  return w;
 }""",pt)
def draw(p,step):
 pt=target(p,step['at'])
 if step.get('ownedEndpoint'):p.keyboard.down('Control')
 try:p.mouse.click(*pt)
 finally:
  if step.get('ownedEndpoint'):p.keyboard.up('Control')
def get(p):
 return p.evaluate("""()=>{const p=HonroWorkshopAPI.getProject(),s=p.stages[0];return {id:p.activeStageId,stages:p.stages.length,terrain:s.terrains.length,bounds:s.terrainBounds,asset:p.library.map(x=>[x.id,x.vector.root,x.collision.length]),placements:s.elements.map(e=>[e.id,e.assetId,e.layer])}}""")
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.environ['HONRO_CHROME'],headless=True)
 p=start(b)
 try:
  click(p,'빈 전체 지형 작업본');p.wait_for_function("document.documentElement.dataset.full42Status==='전체 신규 장: 시각 자산 0개'")
  blank=get(p);assert blank['id']=='stage-42-whole-native-blockout' and blank['stages']==1 and not blank['asset'] and not blank['terrain'] and not blank['placements']
  assert p.locator('#stageW').input_value()=='6500' and p.locator('#stageH').input_value()=='2861' and p.locator('[data-asset]:visible').count()==0
  camera(p,cameras[0]['requested']);p.screenshot(path=str(out/'01-full-native-blank.png'));ck('actual-blank')
  for row in plan['phases']:
   assert p.locator('html').get_attribute('data-full42-phase')==row['name']
   for step in row['points']:draw(p,step)
   click(p,'전체 작도 다음 단계')
   assert not p.locator('html').get_attribute('data-full42-error'),(row['name'],p.locator('#toast').text_content())
  assert p.locator('html').get_attribute('data-full42-phase')=='edit'
  r['click_count']=sum(len(row['points']) for row in plan['phases'])
  click(p,'전체 지형 미리보기');assert get(p)==blank
  camera(p,cameras[0]['requested']);p.screenshot(path=str(out/'02-full-native-preview-neutral.png'))
  click(p,'전체 지형 초안 저장')
  p.wait_for_function("document.documentElement.dataset.full42Status==='전체 지형 초안 수동 저장 완료'")
  authored=get(p);roles=[a[0] for a in authored['asset']]
  assert authored['bounds']==blank['bounds'] and authored['terrain']==0 and all(a[2]==0 for a in authored['asset'])
  assert set(['new-stage42-'+x for x in ['margin-left','margin-right','margin-top','margin-bottom','joined-lower','upper-route']])<=set(roles)
  assert len(next(x[1] for x in authored['asset'] if x[0]=='new-stage42-joined-lower')['children'])==5
  with p.expect_download() as d:click(p,'전체 초안 내보내기')
  with tempfile.TemporaryDirectory() as td:
   f=Path(td)/'new-native-stage42.json';d.value.save_as(f)
   raw=f.read_bytes();assert len(raw)<=26000 and b'act5:near:42' not in raw
   r['scope_save']={'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
   fresh=start(b)
   with fresh.expect_file_chooser() as picker:click(fresh,'전체 초안 열기')
   picker.value.set_files(str(f));fresh.wait_for_function("['opened','error'].includes(document.documentElement.dataset.full42Import)")
   assert fresh.locator('html').get_attribute('data-full42-import')=='opened' and get(fresh)==authored
   camera(fresh,cameras[0]['requested']);fresh.screenshot(path=str(out/'03-exact-full-native-reopen.png'));ck('reopened-exact')
   r['frames']={}
   for v in cameras:
    q=fresh.evaluate(game,{'expected':authored,'requested':v['requested']})
    raw_png=base64.b64decode(q.pop('png').split(',',1)[1],validate=True);(out/('stock-'+v['id']+'.png')).write_bytes(raw_png)
    r['frames'][v['id']]={**q,'sha256':hashlib.sha256(raw_png).hexdigest()}
   check=plan['reedit'];a=target(fresh,check['at'],.55)
   move=check['delta']
   fresh.mouse.move(*a);fresh.mouse.down();fresh.mouse.move(a[0]+.55*move[0],a[1]+.55*move[1],steps=7);fresh.mouse.up()
   assert not fresh.locator('html').get_attribute('data-full42-error')
   click(fresh,'전체 지형 초안 저장');assert get(fresh)!=authored
  assert not r['errors'];r['pass']=True;ck('actual-full-width-proof-no-gameplay')
 except Exception as e:
  r['error']=str(e);ck('failed');p.screenshot(path=str(out/'failure.png'));raise
 finally:b.close()
