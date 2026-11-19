"""Proposed browser implementation; semantic schedule only feeds trusted mouse input."""
import base64,hashlib,json,os,sys,tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
D=Path(__file__).parent
plan=json.loads((D/'witness-itinerary.json').read_text())['phases']
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
url=os.environ['HONRO_STRUCTURE_URL']
result={'pass':False,'scope':'representative new closed structure x450–3450; not V3 continuation, full stage, or gameplay','page_errors':[]}
def checkpoint(s):
 result['step']=s;(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
def begin(browser):
 p=browser.new_context(viewport={'width':1920,'height':1080},device_scale_factor=1,accept_downloads=True).new_page()
 p.on('pageerror',lambda e:result['page_errors'].append(str(e)))
 p.goto(url,wait_until='domcontentloaded')
 p.wait_for_function("window.HonroWorkshopAPI && document.querySelector('#nativeV4Host')",timeout=90000)
 return p
def button(p,t):p.get_by_role('button',name=t,exact=True).click()
def camera(p,x,y,z):p.evaluate("v=>HonroWorkshopAPI.setCamera(v)",{'x':x,'y':y,'zoom':z})
def shape_click(p,x,y):
 camera(p,x,y,.38)
 q=p.evaluate("""([x,y])=>{const c=document.querySelector('#stageCanvas'),r=c.getBoundingClientRect(),v=HonroWorkshopAPI.getEditorState().stageView;
  const a=r.left+r.width/2+(x-v.x)*v.zoom,b=r.top+r.height/2+(y-v.y)*v.zoom;
  if(document.elementFromPoint(a,b)!==c)throw Error('Pointer not targeted to real canvas');return [a,b]
 }""",[x,y])
 p.mouse.click(*q)
def snapshot(p,name):camera(p,1950,1720,.32);p.screenshot(path=str(out/(name+'.png')))
def state(p):
 return p.evaluate("""()=>{const p=HonroWorkshopAPI.getProject();return {id:p.activeStageId,terrains:p.stages[0].terrains,
    placements:p.stages[0].elements.map(x=>[x.assetId,x.layer]),assets:p.library.map(a=>[a.id,a.vector.root,a.collision])}}""")
game=(D/'game-witness.js').read_text()
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=os.environ['HONRO_CHROME'],headless=True)
 p=begin(b)
 try:
  button(p,'빈 구조 작도 작업본')
  p.wait_for_function("document.documentElement.dataset.v4Status==='구조 시작: 자산 0개'")
  pristine=state(p)
  assert pristine=={'id':'stage-42-structure-witness','assets':[],'placements':[],'terrains':[]}
  assert p.locator('#stageW').input_value()=='6500' and p.locator('#stageH').input_value()=='2861' and p.locator('[data-asset]:visible').count()==0
  snapshot(p,'01-v4-empty-pinned');checkpoint('real-blank')
  for i,phase in enumerate(plan):
   for xy in phase:shape_click(p,*xy)
   button(p,'다음 작도 단계')
   assert int(p.locator('html').get_attribute('data-v4-clicks'))==sum(map(len,plan[:i+1]))
   assert not p.locator('html').get_attribute('data-v4-error')
  assert p.locator('html').get_attribute('data-v4-phase')=='edit'
  result['trusted_stage_clicks']=sum(map(len,plan));checkpoint('closed-structures-authored')
  button(p,'구조 미리보기');assert state(p)==pristine
  snapshot(p,'02-v4-closed-preview-clean')
  button(p,'구조 초안 저장')
  p.wait_for_function("document.documentElement.dataset.v4Status==='구조 초안 저장 완료'")
  actual=state(p)
  assert len(actual['assets'])==len(actual['placements'])==5 and actual['terrains']==[] and all(not a[2] for a in actual['assets'])
  assert len({a[1]['children'][0]['fill'] for a in actual['assets']})==4
  assert all(len(a[1]['children'])==1 and a[1]['children'][0]['d'].endswith('Z') for a in actual['assets'])
  with p.expect_download() as dl:button(p,'구조 초안 내보내기')
  with tempfile.TemporaryDirectory() as tmp:
   f=Path(tmp)/'manual-native-witness.json';dl.value.save_as(f);data=f.read_bytes()
   assert 0<len(data)<=13000 and b'act5:near:42' not in data
   result['manual_save']={'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
   fresh=begin(b)
   with fresh.expect_file_chooser() as chooser:button(fresh,'구조 초안 열기')
   chooser.value.set_files(str(f));fresh.wait_for_function("['opened','error'].includes(document.documentElement.dataset.v4Import)",timeout=30000)
   assert fresh.locator('html').get_attribute('data-v4-import')=='opened' and state(fresh)==actual
   snapshot(fresh,'03-v4-actual-fresh-reopen-clean');checkpoint('real-compact-roundtrip')
   for name,v in [('04-game-native-structure-normal',{'x':1950,'y':1720,'zoom':.37}),('05-game-native-structure-closer',{'x':2500,'y':1770,'zoom':.64})]:
    proof=fresh.evaluate(game,{'expected':actual,'view':v});png=base64.b64decode(proof.pop('png').split(',',1)[1],validate=True)
    (out/(name+'.png')).write_bytes(png);result.setdefault('game',{})[name]={**proof,'png_sha256':hashlib.sha256(png).hexdigest()}
  assert not result['page_errors'];result['pass']=True;checkpoint('native-structure-proof-no-art-or-play-qualification')
 except Exception as e:
  result['error']=str(e);checkpoint('failed');p.screenshot(path=str(out/'failure.png'));raise
 finally:b.close()
