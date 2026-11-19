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
detail_plan=json.loads((D/'detail-itinerary.json').read_text())
assert detail_plan['schema']=='honro.stage42.full-detail-pointer-intent' and 20<=len(detail_plan['details'])<=32
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
   assert r['scope_save']['sha256']=='6adcdaaac1d3e85b0a837680e9263ca9a72909fef96f872b9d6b85beedf580a3'
   click(fresh,'전체 상세 작도 시작')
   fresh.wait_for_function("document.documentElement.dataset.wholeDetailStatus==='전체 기준 원본 한정 작도 시작'")
   for i,row in enumerate(detail_plan['details']):
    fresh.get_by_label('Detail owning shape').select_option(row['owner'])
    fresh.get_by_label('Native detail material').select_option(row['role'])
    click(fresh,'새 구조 면')
    for xy in row['points']:draw(fresh,{'at':xy})
    click(fresh,'구조 면 닫기')
    assert int(fresh.locator('html').get_attribute('data-whole-detail-count'))==i+1,(row['id'],fresh.locator('#toast').text_content())
   r['full_detail_count']=len(detail_plan['details'])
   r['full_detail_pointer_count']=sum(len(x['points']) for x in detail_plan['details'])
   click(fresh,'상세 면 미리보기');assert get(fresh)==authored
   camera(fresh,cameras[0]['requested']);fresh.screenshot(path=str(out/'04-new-full-detail-preview-neutral.png'))
   click(fresh,'상세 면 묶음 저장')
   fresh.wait_for_function("document.documentElement.dataset.wholeDetailStatus==='전체 상세 수동 저장 완료'")
   complete=get(fresh);name= {a[0]:a for a in complete['asset']}
   assert complete['bounds']==authored['bounds'] and complete['terrain']==0 and all(a[2]==0 for a in complete['asset'])
   assert all(name[a[0]][1]['children'][:len(a[1]['children'])]==a[1]['children'] for a in authored['asset'])
   assert sum(len(v[1]['children']) for v in complete['asset'])-sum(len(v[1]['children']) for v in authored['asset'])==r['full_detail_count']
   with fresh.expect_download() as detail_dl:click(fresh,'전체 상세 초안 내보내기')
   g=Path(td)/'authored-full-detail-native.json';detail_dl.value.save_as(g);detail_bytes=g.read_bytes()
   assert 0<len(detail_bytes)<=28000 and b'act5:near:42' not in detail_bytes
   r['detail_manual_save']={'bytes':len(detail_bytes),'sha256':hashlib.sha256(detail_bytes).hexdigest()}
   again=start(b)
   with again.expect_file_chooser() as b0:click(again,'전체 초안 열기')
   b0.value.set_files(str(f));again.wait_for_function("document.documentElement.dataset.full42Import==='opened'")
   with again.expect_file_chooser() as b1:click(again,'전체 상세 초안 열기')
   b1.value.set_files(str(g));again.wait_for_function("['opened','error'].includes(document.documentElement.dataset.wholeDetailImport)")
   assert again.locator('html').get_attribute('data-whole-detail-import')=='opened' and get(again)==complete
   camera(again,cameras[0]['requested']);again.screenshot(path=str(out/'05-exact-reopened-full-detail-neutral.png'));ck('full-detail-reopened-exact')
   r['detail_frames']={}
   for v in cameras:
    q=again.evaluate(game,{'expected':complete,'requested':v['requested']})
    assert q['actual']==r['frames'][v['id']]['actual']
    raw_png=base64.b64decode(q.pop('png').split(',',1)[1],validate=True);(out/('detail-stock-'+v['id']+'.png')).write_bytes(raw_png)
    r['detail_frames'][v['id']]={**q,'sha256':hashlib.sha256(raw_png).hexdigest()}
   again.get_by_label('Existing editable detail').select_option('f-1')
   click(again,'저장된 면 선택')
   check=detail_plan['reedit'];q=target(again,check['at'],.5)
   again.mouse.move(*q);again.mouse.down();again.mouse.move(q[0]+.5*check['delta'][0],q[1]+.5*check['delta'][1],steps=7);again.mouse.up()
   assert not again.locator('html').get_attribute('data-whole-detail-error')
   click(again,'상세 면 묶음 저장');assert get(again)!=complete
  assert not r['errors'];r['pass']=True;ck('actual-full-width-detail-proof-no-gameplay')
 except Exception as e:
  r['error']=str(e);ck('failed');p.screenshot(path=str(out/'failure.png'));raise
 finally:b.close()
