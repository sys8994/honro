"""Proposed browser implementation; semantic schedule only feeds trusted mouse input."""
import base64,hashlib,json,os,sys,tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright
D=Path(__file__).parent
plan=json.loads((D/'witness-itinerary.json').read_text())['phases']
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
url=os.environ['HONRO_STRUCTURE_URL']
shapes=json.loads((D/'detail-itinerary.json').read_text())['shapes']
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
def mouse_position(p,x,y):
 camera(p,x,y,.38)
 q=p.evaluate("""([x,y])=>{const c=document.querySelector('#stageCanvas'),r=c.getBoundingClientRect(),v=HonroWorkshopAPI.getEditorState().stageView;
  const a=r.left+r.width/2+(x-v.x)*v.zoom,b=r.top+r.height/2+(y-v.y)*v.zoom;
  if(document.elementFromPoint(a,b)!==c)throw Error('Pointer not targeted to real canvas');return [a,b]
 }""",[x,y])
 return q
def shape_click(p,x,y,ctrl=False):
 q=mouse_position(p,x,y)
 if ctrl:p.keyboard.down('Control')
 try:p.mouse.click(*q)
 finally:
  if ctrl:p.keyboard.up('Control')
def snapshot(p,name):camera(p,1950,1720,.32);p.screenshot(path=str(out/(name+'.png')))
def state(p):
 return p.evaluate("""()=>{const p=HonroWorkshopAPI.getProject();return {id:p.activeStageId,terrains:p.stages[0].terrains,
    placements:p.stages[0].elements.map(x=>[x.assetId,x.layer]),assets:p.library.map(a=>[a.id,a.vector.root,a.collision])}}""")
game=(D/'game-detail.js').read_text()
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
   assert result['manual_save']['sha256']=='bc6fc37239d6ec62d380588418727098f3066429478e794742225f75f350ec21'
   view={'x':1950,'y':1720,'zoom':.37}
   def gamepng(where,exp,stem,view):
    proof=where.evaluate(game,{'expected':exp,'view':view});png=base64.b64decode(proof.pop('png').split(',',1)[1],validate=True)
    (out/(stem+'.png')).write_bytes(png);result.setdefault('game',{})[stem]={**proof,'png_sha256':hashlib.sha256(png).hexdigest()}
   gamepng(fresh,actual,'04-stock-same-camera-before',view)
   button(fresh,'상세 작도 시작')
   fresh.wait_for_function("document.documentElement.dataset.detailStatus==='검증된 V4 원본 상세 작도 시작'")
   for idx,shape in enumerate(shapes):
    fresh.get_by_label('Detail owning shape').select_option(shape['owner'])
    fresh.get_by_label('Native detail material').select_option(shape['role'])
    button(fresh,'새 구조 면')
    for i,xy in enumerate(shape['points']):shape_click(fresh,*xy,ctrl=idx==0 and i==0)
    button(fresh,'구조 면 닫기')
    assert int(fresh.locator('html').get_attribute('data-detail-count'))==idx+1,(shape['name'],fresh.locator('#toast').text_content())
   result['trusted_detail_clicks']=sum(len(v['points']) for v in shapes);result['detail_count']=len(shapes)
   button(fresh,'상세 면 미리보기');assert state(fresh)==actual
   snapshot(fresh,'05-details-neutral-preview')
   button(fresh,'상세 면 묶음 저장')
   fresh.wait_for_function("document.documentElement.dataset.detailStatus==='상세 구조 저장 완료'")
   detail=state(fresh); asserted={a[0]:a for a in detail['assets']}
   assert detail['terrains']==[] and len(detail['assets'])==7
   assert sum(len(q[1]['children']) for q in detail['assets'])-5==len(shapes)
   assert all(a[1]['children'][0]==asserted[a[0]][1]['children'][0] and not asserted[a[0]][2] for a in actual['assets'])
   with fresh.expect_download() as detail_dl:button(fresh,'상세 초안 내보내기')
   g=Path(tmp)/'v4-details-editable.json';detail_dl.value.save_as(g)
   result['detail_manual_save']={'bytes':g.stat().st_size,'sha256':hashlib.sha256(g.read_bytes()).hexdigest()}
   reopened=begin(b)
   with reopened.expect_file_chooser() as again:button(reopened,'구조 초안 열기')
   again.value.set_files(str(f));reopened.wait_for_function("document.documentElement.dataset.v4Import==='opened'")
   with reopened.expect_file_chooser() as detail_again:button(reopened,'상세 초안 열기')
   detail_again.value.set_files(str(g));reopened.wait_for_function("['opened','error'].includes(document.documentElement.dataset.detailImport)")
   assert reopened.locator('html').get_attribute('data-detail-import')=='opened' and state(reopened)==detail
   snapshot(reopened,'06-reopened-detail-foreground-only')
   gamepng(reopened,detail,'07-stock-same-camera-after',view)
   assert result['game']['04-stock-same-camera-before']['camera']==result['game']['07-stock-same-camera-after']['camera']
   gamepng(reopened,detail,'08-stock-structure-detail-close',{'x':2500,'y':1770,'zoom':.64})
   reopened.get_by_label('Existing editable detail').select_option('f-1')
   button(reopened,'저장된 면 선택')
   pt=mouse_position(reopened,1660,1348)
   reopened.mouse.move(*pt);reopened.mouse.down();reopened.mouse.move(pt[0]-10.8,pt[1]+3.6,steps=7);reopened.mouse.up()
   assert not reopened.locator('html').get_attribute('data-detail-error')
   button(reopened,'상세 면 묶음 저장')
   assert state(reopened)!=detail
   snapshot(reopened,'09-fresh-declared-detail-reedit')
  assert not result['page_errors'];result['pass']=True;checkpoint('native-structure-proof-no-art-or-play-qualification')
 except Exception as e:
  result['error']=str(e);checkpoint('failed');p.screenshot(path=str(out/'failure.png'));raise
 finally:b.close()
