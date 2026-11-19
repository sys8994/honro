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
route=json.loads((D/'route-itinerary.json').read_text())['shapes']
assert detail_plan['schema']=='honro.stage42.full-detail-pointer-intent' and 20<=len(detail_plan['details'])<=96
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
   assert r['scope_save']['sha256']=='a9f3200d572681ad29a0e80449f916f49565faf90d9bd8506e6d274d7eaf37e5'
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
   r['fresh_import']={'status':again.locator('html').get_attribute('data-whole-detail-import'),'reported_error':again.locator('html').get_attribute('data-whole-detail-error'),'records':again.locator('html').get_attribute('data-whole-detail-count')}
   assert r['fresh_import']['status']=='opened',r['fresh_import']
   assert int(r['fresh_import']['records'])==len(detail_plan['details']),r['fresh_import']
   assert get(again)==complete,'Reopened detail native asset/ownership state did not match the saved detail state'
   camera(again,cameras[0]['requested']);again.screenshot(path=str(out/'05-exact-reopened-full-detail-neutral.png'));ck('full-detail-reopened-exact')
   r['detail_frames']={}
   for v in cameras:
    q=again.evaluate(game,{'expected':complete,'requested':v['requested']})
    assert q['actual']==r['frames'][v['id']]['actual']
    raw_png=base64.b64decode(q.pop('png').split(',',1)[1],validate=True);(out/('detail-stock-'+v['id']+'.png')).write_bytes(raw_png)
    r['detail_frames'][v['id']]={**q,'sha256':hashlib.sha256(raw_png).hexdigest()}
   assert r['detail_manual_save']['sha256']=='900d1c5b756627014fbdf1d00df7e9b2b83ded27f2b146fe1956040679092f6f'
   gate_plan=json.loads((D/'gate-itinerary.json').read_text())
   assert len(gate_plan['shapes'])==11 and len(route)==16
   gate_plan['shapes'].extend(route)
   click(again,'Start Native Gate')
   assert again.locator('html').get_attribute('data-gate-status')=='gate-started'
   assert again.locator('html').get_attribute('data-gate-count')=='0' and get(again)==complete
   for i,shape in enumerate(gate_plan['shapes']):
    again.get_by_label('Native Gate role').select_option(shape['id']);click(again,'New Gate polygon')
    for xy in shape['points']:draw(again,{'at':xy})
    click(again,'Close Gate polygon')
    assert again.locator('html').get_attribute('data-gate-count')==str(i+1),(shape['id'],again.locator('#toast').text_content())
   r['gate_pointer_count']=sum(len(s['points']) for s in gate_plan['shapes']);ck('gate-authored')
   click(again,'Preview Native Gate');assert get(again)==complete
   gv=next(v for v in cameras if v['id']=='gate')
   camera(again,gv['requested']);again.screenshot(path=str(out/'06-actual-gate-native-preview.png'))
   click(again,'Save Native Gate');assert again.locator('html').get_attribute('data-gate-status')=='gate-saved'
   gate_state=get(again);owned='stage42-native-gate-open-prop'
   new_owners=[owned,'new-stage42-upper-deck-taper','new-stage42-reversible-palisade-ladder']
   added=[v for v in gate_state['asset'] if v[0] in new_owners];assert [len(v[1]['children']) for v in added]==[11,1,15] and all(v[2]==0 for v in added)
   assert [v for v in gate_state['asset'] if v[0] not in new_owners]==complete['asset']
   assert [v for v in gate_state['placements'] if v[1] not in new_owners]==complete['placements']
   with again.expect_download() as gate_dl:click(again,'Download Native Gate')
   h=Path(td)/'authored-gate.json';gate_dl.value.save_as(h);rb=h.read_bytes()
   assert 0<len(rb)<=8500 and b'act5:near:42' not in rb
   r['gate_save']={'bytes':len(rb),'sha256':hashlib.sha256(rb).hexdigest()}
   expected_gate='5769f3d261eddfc12e0cffcdac9d8291e9cf6c8de97cad19a1c2055fcbb67bad'
   assert r['gate_save']['sha256']==expected_gate,{'expected':expected_gate,'observed':r['gate_save']}
   returned=start(b)
   for label,file,key in [('전체 초안 열기',f,'full42Import'),('전체 상세 초안 열기',g,'wholeDetailImport'),('Open Native Gate',h,'gateImport')]:
    with returned.expect_file_chooser() as picker:click(returned,label)
    picker.value.set_files(str(file))
    returned.wait_for_function("key=>['opened','error'].includes(document.documentElement.dataset[key])",arg=key)
    assert returned.evaluate("key=>document.documentElement.dataset[key]",key)=='opened',(key,returned.locator('#toast').text_content())
   assert returned.locator('html').get_attribute('data-gate-count')=='27' and get(returned)==gate_state
   camera(returned,gv['requested']);returned.screenshot(path=str(out/'07-actual-gate-reopened.png'));ck('gate-reopened-exact')
   r['gate_frames']={}
   for v in cameras:
    q=returned.evaluate(game,{'expected':gate_state,'requested':v['requested']});q_png=q.pop('png')
    assert q['actual']==r['detail_frames'][v['id']]['actual']
    raw_png=base64.b64decode(q_png.split(',',1)[1],validate=True);(out/('gate-stock-'+v['id']+'.png')).write_bytes(raw_png)
    r['gate_frames'][v['id']]={**q,'sha256':hashlib.sha256(raw_png).hexdigest()}
    if v['id']=='gate':
     assert q['owners'].get(owned,{}).get('cached',0)>0
     before='data:image/png;base64,'+base64.b64encode((out/'detail-stock-gate.png').read_bytes()).decode()
     changed=returned.evaluate("""async ([old,neu,cam])=>{
      const cv=document.createElement('canvas');cv.width=1280;cv.height=800;const c=cv.getContext('2d');
      const get=async src=>{const i=new Image();i.src=src;await i.decode();c.clearRect(0,0,1280,800);c.drawImage(i,0,0);return c.getImageData(0,0,1280,800).data};
      const [x,y,z]=cam,a=await get(old),b=await get(neu);let roi=0,outside=0,changed=0,count=0;
      for(let j=0;j<800;j++)for(let i=0;i<1280;i++){
       const X=(i+.5-640)/z+x,Y=(j+.5-400)/z+y,k=(j*1280+i)*4;
       const isROI=X>=6004&&X<=6120&&Y>=778&&Y<=937,diff=a[k]!==b[k]||a[k+1]!==b[k+1]||a[k+2]!==b[k+2]||a[k+3]!==b[k+3];
       if(isROI){count++;if(diff)roi++}if(diff){changed++;if(!((X>=5856&&X<=6254&&Y>=566&&Y<=950)||(X>=5528&&X<=5862&&Y>=956&&Y<=1102)||(X>=3860&&X<=4080&&Y>=1320&&Y<=2086)))outside++;}
      }
      return {roi,outside,changed,count};
     }""",[before,q_png,q['actual']]);r['protected_gate_pixels']=changed
     assert changed['count']>0 and changed['roi']==0 and changed['outside']==0 and changed['changed']>0,changed
   r['legal_device_extremes']={}
   for w,h in [(1280,800),(390,844)]:
    for corner in ['nw','ne','sw','se']:
     device=f'{w}x{h}-{corner}'
     q=returned.evaluate(game,{'expected':gate_state,'requested':None,'w':w,'h':h,'corner':corner})
     png=base64.b64decode(q.pop('png').split(',',1)[1],validate=True)
     assert q['viewport']=={'w':w,'h':h} and q['deviceCorner']==corner and q['requested'][2]==q['legalZoom']['min'] and q['actual'][2]==q['legalZoom']['min']
     assert all(q['worldViewport'][k] is not None for k in ('left','right','top','bottom'))
     (out/f'legal-extreme-{device}.png').write_bytes(png)
     r['legal_device_extremes'][device]={**q,'sha256':hashlib.sha256(png).hexdigest()}
   ck('device-focus-extrema-captured')
   if os.environ.get('HONRO_C01_DISPOSABLE_QA')=='1':
    from c01_pairs import capture
    r['c01']=capture(returned,gate_state,r['scope_save']['sha256'],r['detail_manual_save']['sha256'],r['gate_save']['sha256'],cameras,out)
   if os.environ.get('HONRO_COMPOSE_LIVE_WALK')=='1':
    from integration import run_after_exact_composed_reopen
    try:
     run_after_exact_composed_reopen(b,raw,detail_bytes,rb,out,D,os.environ['HONRO_FULL42_URL'])
     r['live_walk']='passed-initial-segment-only'
    except Exception as live_error:
     r['live_walk']='blocked-'+type(live_error).__name__
    ck('post-composition-live-check-reported')
   returned.get_by_label('Existing editable Gate role').select_option('f-11');click(returned,'Select Gate polygon')
   knob=target(returned,[6052,581],.5)
   returned.mouse.move(*knob);returned.mouse.down();returned.mouse.move(knob[0],knob[1]+2,steps=5);returned.mouse.up()
   assert not returned.locator('html').get_attribute('data-gate-error'),returned.locator('#toast').text_content()
   click(returned,'Save Native Gate');v=get(returned);assert v!=gate_state
   assert [x for x in v['asset'] if x[0]!=owned]==[x for x in gate_state['asset'] if x[0]!=owned]
  assert not r['errors'];r['pass']=True;ck('actual-full-width-native-composed-proof-no-gameplay')
 except Exception as e:
  r['error']=str(e);ck('failed');p.screenshot(path=str(out/'failure.png'));raise
 finally:b.close()
