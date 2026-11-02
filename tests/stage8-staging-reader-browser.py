"""Normal Chromium Continue + Defend + manual Next regression.
Imports an unmodified saved native normal-input battle before launch. No live
actor, phase, HP, camera or objective writes. This is not a Stage8 clear test.
"""
import gzip,json,os,time,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(os.getenv('HONRO_QA_OUT','_local/reports/stage8-reader-browser'));out.mkdir(parents=True,exist_ok=True)
result={'passed':False,'scope':__doc__,'source':os.getenv('GITHUB_SHA'),'errors':[]};events=[]
def save():
 (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));(out/'events.json').write_text(json.dumps(events,ensure_ascii=False,indent=2))
try:
 with sync_playwright() as w:
  browser=w.chromium.launch(headless=True);p=browser.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:result['errors'].append(str(e)))
  p.goto(os.getenv('HONRO_QA_URL','http://127.0.0.1:8870/HONRO.html'),wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=60000)
  profile=json.loads(gzip.decompress(Path('tests/fixtures/stage8-staging/natural-r24-reader-stall.json.gz').read_bytes()))
  p.evaluate('v=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',profile);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=60000)
  p.locator('.title-actions [data-action="continue"]').first.click()
  def state():return p.evaluate('''()=>{const a=HonroApp,b=a.engine?.b,u=b?.units.find(u=>u.id==='boss');return {stage:b?.honroStage,round:b?.round,phase:b?.phase,can:a.canInput(),status:b?.honroState.stage8Bier?.status,completed:b?.honroState.stage8Bier?.completedOnce,boss:u&&{x:u.x,y:u.y,hp:u.hp,focus:u.focus},dialogue:a.dialogue&&{index:a.dialogue.index,staging:a.dialogue.staging},lastError:a.lastError}}''')
  def record(op):events.append({'op':op,'time':time.time(),'state':state()});save()
  p.wait_for_function('HonroApp.engine?.b.honroStage===8 && HonroApp.canInput()',timeout=30000);record('continued-recovered-input');p.screenshot(path=str(out/'continued.png'))
  s=state();assert s['status']=='blocked' and s['completed']==0,'No forced physical completion';assert abs(s['boss']['x']-profile['honroBattle']['units'][next(i for i,u in enumerate(profile['honroBattle']['units']) if u['id']=='boss')]['x'])<.01
  p.keyboard.press('f');record('normal-defend')
  p.wait_for_function('HonroApp.dialogue?.staging?.id==="stage8-bier-courtyard-v1"',timeout=30000);record('manual-caption');p.screenshot(path=str(out/'caption-motion.png'));index=state()['dialogue']['index'];positions=[]
  deadline=time.monotonic()+25
  while time.monotonic()<deadline:
   s=state();positions.append({'time':time.time(),'boss':s['boss'],'status':s['status']})
   assert s['dialogue'] and s['dialogue']['index']==index,'Physical completion must not auto-advance caption'
   if s['status']=='settled':break
   p.wait_for_timeout(100)
  assert state()['status']=='settled' and state()['completed']==1,'Real physical motion must finish';result['motionSamples']=positions;record('settled-manual-caption');p.screenshot(path=str(out/'settled-caption.png'))
  for _ in range(20):
   if not state()['dialogue']:break
   p.locator('[data-action="dialogue-next"]:visible').click();p.wait_for_timeout(150)
  p.wait_for_function('HonroApp.canInput()',timeout=60000);record('normal-input-resumed');p.screenshot(path=str(out/'resumed.png'))
  result['final']=state();result['passed']=not result['errors'] and not result['final']['lastError'];browser.close()
except Exception:
 result['passed']=False
 result['exception']=traceback.format_exc()
 try:result['last']=state();p.screenshot(path=str(out/'failure.png'))
 except Exception:pass
finally:save()
if not result['passed']:raise SystemExit(1)
