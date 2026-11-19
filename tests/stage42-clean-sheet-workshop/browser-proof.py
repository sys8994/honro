"""Prepared actual browser proof; not run. B01 points drive pointer, never map state."""
import base64,hashlib,json,os,sys,tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
D=Path(__file__).parent
plan=json.loads((D/'b01-pointer-plan.json').read_text())
layers=json.loads((D/'contact-pointer-itinerary.json').read_text())
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
url=os.environ['HONRO_BLANK_WORKSHOP_URL']
GAME_JS=(D/'game-snapshot.js').read_text()
record={'pass':False,'old_terrain_assets_loaded_into_active_design':False,'browser_errors':[]}
def cp(step):
 record['step']=step;(out/'result.json').write_text(json.dumps(record,indent=2))
def start(browser):
 ctx=browser.new_context(viewport={'width':1920,'height':1080},device_scale_factor=1,accept_downloads=True)
 p=ctx.new_page();p.on('pageerror',lambda error:record['browser_errors'].append(str(error)))
 p.goto(url,wait_until='domcontentloaded')
 p.wait_for_function("window.HonroWorkshopAPI?.getProject && document.querySelector('#blankNativeHost')",timeout=90000)
 return p
def click(page,label):
 page.get_by_role('button',name=label,exact=True).click()
def inspect(page):
 return page.evaluate("""()=>{
 const p=HonroWorkshopAPI.getProject(),s=p.stages[0],v=p.library[0]?.vector;
 return {active:p.activeStageId,stages:p.stages.length,library:p.library.map(a=>a.id),elements:s.elements.map(e=>e.assetId),terrain:s.terrains.map(t=>t.id),collision:p.library[0]?.collision??null,
 paths:v?.root?.children.map(c=>({d:c.d,id:c.id,fill:c.fill}))??[]}
 }""")
def camera(page,x,y,z):page.evaluate("v=>HonroWorkshopAPI.setCamera(v)",{'x':x,'y':y,'zoom':z})
def point(page,x,y):
 return page.evaluate("""([x,y])=>{const c=document.querySelector('#stageCanvas'),b=c.getBoundingClientRect(),q=HonroWorkshopAPI.getEditorState().stageView;
 const px=b.left+b.width/2+(x-q.x)*q.zoom,py=b.top+b.height/2+(y-q.y)*q.zoom;
 if(document.elementFromPoint(px,py)!==c)throw Error('Pointer opted into hidden or obstructed canvas');
 return [px,py];}""",[x,y])
def click_at(page,pt):
 camera(page,*pt,.32);page.mouse.click(*point(page,*pt))
def overview(page,name):camera(page,3250,1800,.13);page.screenshot(path=str(out/name))
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.environ['HONRO_CHROME'],headless=True)
 p=start(b)
 try:
  click(p,'빈 5막 2장 작업본');base=inspect(p)
  assert base=={'active':'stage-42-clean-sheet','stages':1,'library':[],'elements':[],'terrain':[],'collision':None,'paths':[]}
  p.wait_for_function("document.documentElement.dataset.cleanStatus==='빈 지형: 경로 0개'")
  assert p.locator('#stageW').input_value()=='6500' and p.locator('#stageH').input_value()=='2861'
  assert p.locator('[data-asset]:visible').count()==0
  assert p.locator('#elementToolbar [data-etool]').count()==0
  assert p.locator('html').get_attribute('data-clean-neutral')=='1'
  assert 'Cannot read properties' not in (p.locator('#toast').text_content() or '')
  overview(p,'01-blank-zero-paths.png');cp('blank-zero-paths-visible-confirmed')
  for pt in plan['outline']:click_at(p,pt)
  click(p,'실루엣 닫기')
  for s in plan['seams']:
   click(p,'새 공유 절리');click_at(p,plan['outline'][s['a']])
   for pt in s['knots']:click_at(p,pt)
   click(p,'절리 끝점 선택');click_at(p,plan['outline'][s['b']])
  click(p,'새 비충돌 외곽')
  for pt in plan['dummies'][0]:click_at(p,pt)
  click(p,'비충돌 외곽 닫기')
  assert p.locator('html').get_attribute('data-clean-mode')=='edit'
  assert json.loads(p.locator('html').get_attribute('data-clean-counts'))==[len(plan['outline']),2,1,0,0]
  click(p,'충돌 가이드 표시/숨기기');assert inspect(p)==base
  click(p,'충돌 가이드 표시/숨기기');assert inspect(p)==base
  p.get_by_label('암면 소유체',exact=True).select_option('mass-0')
  click(p,'새 종속 암면')
  for pt in layers['facets'][0]['points']:click_at(p,pt)
  click(p,'시각 층 끝내기')
  assert p.locator('html').get_attribute('data-clean-mode')=='layer-points','wrong owner unexpectedly accepted'
  click(p,'시각 층 입력 취소')
  for f in layers['facets']:
   p.get_by_label('암면 소유체',exact=True).select_option(f['owner'])
   p.get_by_label('암면 재질',exact=True).select_option(f['material'])
   click(p,'새 종속 암면')
   for pt in f['points']:click_at(p,pt)
   click(p,'시각 층 끝내기')
   assert p.locator('html').get_attribute('data-clean-mode')=='edit'
  for c in layers['contacts']:
   p.get_by_label('접촉 역할',exact=True).select_option(c['role'])
   click(p,'새 접촉 시각 띠')
   for pt in c['points']:click_at(p,pt)
   click(p,'시각 층 끝내기')
   assert p.locator('html').get_attribute('data-clean-mode')=='edit'
  assert json.loads(p.locator('html').get_attribute('data-clean-counts'))==[len(plan['outline']),2,1,len(layers['facets']),len(layers['contacts'])]
  cp('native-facets-and-contact-roles-drawn')
  click(p,'신규 지형 미리보기');assert inspect(p)==base
  p.screenshot(path=str(out/'02-native-preview.png'));overview(p,'03-native-overview.png')
  click(p,'신규 초안 저장')
  p.wait_for_function("document.documentElement.dataset.cleanStatus==='신규 초안 저장 완료'",timeout=30000)
  authored=inspect(p)
  assert authored['stages']==1 and authored['library']==['stage42-clean-workshop-native'] and authored['elements']==authored['library']
  assert authored['terrain']==authored['collision']==[] and len(authored['paths'])==4+len(layers['facets'])+len(layers['contacts'])
  with p.expect_download() as dl:click(p,'신규 초안 내보내기')
  with tempfile.TemporaryDirectory() as tmp:
   f=Path(tmp)/'local-blank-draft.json';dl.value.save_as(f)
   body=f.read_bytes();assert b'act5:near:42' not in body and b'a5-supply-road' not in body and 0<len(body)<=12000
   record['bytes']=len(body);record['download_sha256']=hashlib.sha256(body).hexdigest()
   p2=start(b)
   with p2.expect_file_chooser() as picker:click(p2,'신규 초안 열기')
   picker.value.set_files(str(f))
   p2.wait_for_function("['opened','error'].includes(document.documentElement.dataset.cleanImport)",timeout=30000)
   assert p2.locator('html').get_attribute('data-clean-import')=='opened'
   assert inspect(p2)==authored
   overview(p2,'04-new-context-roundtrip.png');cp('roundtrip-exact')
   render=p2.evaluate(GAME_JS,{'expectedPaths':authored['paths'],'view':{'x':3250,'y':1900,'zoom':.18}})
   raw_png=base64.b64decode(render.pop('png').split(',',1)[1],validate=True)
   (out/'06-stock-game-scene-reopened-blockout.png').write_bytes(raw_png)
   record['isolated_game_scene']={**render,'image_sha256':hashlib.sha256(raw_png).hexdigest()}
   anchor=plan['outline'][8];dest=[anchor[0]+24,anchor[1]+10];camera(p2,*anchor,.34)
   p2.mouse.move(*point(p2,*anchor));p2.mouse.down();p2.mouse.move(*point(p2,*dest),steps=6);p2.mouse.up()
   assert '잠깁니다' in (p2.locator('html').get_attribute('data-clean-status') or '')
   click(p2,'신규 지형 미리보기');assert inspect(p2)==authored
   click(p2,'신규 초안 저장')
   p2.wait_for_function("document.documentElement.dataset.cleanStatus==='신규 초안 저장 완료'",timeout=30000)
   assert inspect(p2)==authored
   overview(p2,'05-reopened-parent-outline-locked.png')
  assert not record['browser_errors']
  record['pass']=True;cp('proof-only-passed-no-production')
 except Exception as e:
  record['error']=str(e);cp('failed');p.screenshot(path=str(out/'failure.png'));raise
 finally:b.close()
