"""Actual UI Continue + hero-select/E (17) or F (18), unchanged natural saves.
Read-only runtime observation; candidate regression, not whole-stage acceptance.
Run only against the parent's freshly gated integrated build.
"""
import os,json,gzip,time,traceback,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
stage=int(os.environ['HONRO_STAGE']);assert stage in (17,18)
fixture=Path(f'tests/fixtures/act2-gameplay/stage{stage}-'+('dead-hoist' if stage==17 else 'cast')+'-404/terminal.json.gz')
raw=fixture.read_bytes();saved=json.loads(gzip.decompress(raw));out=Path(os.environ.get('HONRO_QA_OUT',f'_local/reports/stage{stage}-retained-ui'));out.mkdir(parents=True,exist_ok=True)
r={'passed':False,'stage':stage,'scope':__doc__,'source':os.environ.get('GITHUB_SHA'),'fixture':str(fixture),'fixtureSha256':hashlib.sha256(raw).hexdigest(),'events':[],'errors':[]}
def save():(out/'result.json').write_text(json.dumps(r,ensure_ascii=False,indent=2))
with sync_playwright() as w:
 try:
  browser=w.chromium.launch(headless=True);p=browser.new_page(viewport={'width':1440,'height':960});p.on('pageerror',lambda e:r['errors'].append(str(e)))
  p.goto(os.environ.get('HONRO_QA_URL','http://127.0.0.1:8870/HONRO.html'),wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=60000)
  p.evaluate('v=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',saved['profile']);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.locator('.title-actions button.primary:visible').click();p.wait_for_function(f'HonroApp.engine?.b?.honroStage==={stage}',timeout=60000)
  def state():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,h=e.unit('act2-hoist'),m=b.honroStage===18?HonroAct23V4Stage18.memory(b):null,marker=b.honroMarkers.find(m=>m.id==='17.hoist');return{stage:b.honroStage,round:b.round,phase:b.phase,can:a.canInput(),active:e.active?.id,dialogue:!!a.dialogue,projectiles:b.projectiles.length,settleBusy:e.settleBusy(),cast:b.cast,goal:HonroAct2.current(b)?.id,heroes:e.heroesAlive().map(u=>({id:u.id,cls:u.cls,acted:u.acted,hp:u.hp,x:u.x,y:u.y})),hoist:h?{x:h.x,y:h.y,hp:h.hp,dead:h.dead,attached:h.honroHoistSpiritAttached}:null,hoistEligible:marker?HonroInteractions.eligibility(a,marker):null,separated:b.honroStage===17?HonroAct23V4Reviewed17.separated(b):null,bell:m?.bell,liftDone:m?.liftDone}}''')
  def record(op):r['events'].append({'op':op,'time':time.time(),'state':state()});save()
  def dialogue():
   nxt=p.locator('[data-action="dialogue-next"]:visible')
   if nxt.count() and nxt.first.is_enabled():nxt.first.click()
   elif state()['dialogue']:p.keyboard.press('Enter')
  initial=state();r['initial']=initial;record('normal-continue');p.screenshot(path=str(out/'initial.png'))
  deadline=time.monotonic()+90
  while time.monotonic()<deadline and not state()['can']:dialogue();p.wait_for_timeout(200)
  assert state()['can'],'Natural save did not reach ordinary input boundary'
  if stage==17:
   assert initial['hoist']['dead'] and initial['hoist']['hp']==0 and initial['hoist']['attached']
   selected=False
   for hero in state()['heroes']:
    chip=p.locator('[data-action="select-hero"][data-id="'+hero['id']+'"]:visible')
    if not chip.count():continue
    chip.click();p.wait_for_timeout(200);record('normal-select-'+hero['id']);st=state()
    if st['active']==hero['id'] and st['can'] and st['hoistEligible']['ok']:
     selected=True;p.keyboard.press('e');record('normal-E');break
   assert selected,'No ordinary UI-selectable eligible hero for retained hoist'
   deadline=time.monotonic()+20
   while time.monotonic()<deadline and not state()['separated']:dialogue();p.wait_for_timeout(150)
   final=state();assert final['separated'] and final['goal']!='17.hoist'
   assert final['hoist']['dead'] and final['hoist']['hp']==0 and not final['hoist']['attached']
   assert abs(final['hoist']['x']-initial['hoist']['x'])<.01 and abs(final['hoist']['y']-initial['hoist']['y'])<.01,'Retained hoist frame moved'
  else:
   assert initial['cast'] and initial['cast'].get('refunded') and not initial['liftDone']
   p.keyboard.press('f');record('normal-F-defend');deadline=time.monotonic()+90
   while time.monotonic()<deadline and not state()['liftDone']:
    if state()['dialogue']:dialogue()
    p.wait_for_timeout(150)
   final=state();assert final['liftDone'],'Completed-shot bookkeeping still blocked ordinary bell lift'
  r['final']=final;record('regression-boundary');p.screenshot(path=str(out/'terminal.png'));assert not r['errors'],r['errors'];browser.close();r['passed']=True
 except Exception:
  r['passed']=False;r['exception']=traceback.format_exc()
  try:record('exception');p.screenshot(path=str(out/'failure.png'))
  except Exception:pass
 finally:save()
if not r['passed']:raise SystemExit(1)
