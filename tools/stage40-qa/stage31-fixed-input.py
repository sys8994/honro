"""Bounded clock-controlled A/B diagnostic. Never whole-stage acceptance."""
import os,json,datetime,traceback,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path('.');out=Path(os.environ['AB_OUT']);out.mkdir(parents=True,exist_ok=False)
profile=json.loads((root/'tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile']
result={'variant':os.environ['AB_VARIANT'],'scope':'One fixed-input/clock diagnostic, not normal full-stage or release approval','inputs':[],'states':[],'errors':[],'passed':False}
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True);p=browser.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:result['errors'].append(str(e)))
 p.clock.install(time=datetime.datetime(2026,11,3,tzinfo=datetime.timezone.utc))
 try:
  p.goto('http://127.0.0.1:8870/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp')
  # Declared original entry fixture only, before battle. No live-state edits.
  p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',profile);p.reload();p.wait_for_function('window.HonroApp')
  p.clock.pause_at(datetime.datetime(2026,11,3,0,2,tzinfo=datetime.timezone.utc))
  p.get_by_text('여정 이어가기',exact=True).click(force=True);p.clock.run_for(3000)
  p.get_by_text('스테이지 진입',exact=False).click(force=True);p.clock.run_for(3000)
  def state():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e?.b;return {stage:b?.honroStage,seed:b?.seed,rng:b?.rng,round:b?.round,side:b?.side,phase:b?.phase,active:b?.active,shots:b?.shots,can:a.canInput(),dialogue:!!a.dialogue,units:b?.units.map(u=>({id:u.id,x:u.x,y:u.y,vx:u.vx,vy:u.vy,hp:u.hp,shield:u.shield,dead:u.dead,angle:u.angle,move:u.moveLeft,acted:u.acted,lastAct:u.lastAct})),projectiles:b?.projectiles,queue:b?.queue,events:b?.honroState?.flags}}''')
  for i in range(30):
   s=state()
   if not s['dialogue'] and s['can']:break
   p.keyboard.press('Enter');p.clock.run_for(1000)
  s=state();assert s['stage']==31 and s['seed']==19388 and s['round']==1 and s['can'];result['states'].append({'label':'entry','state':s});p.screenshot(path=str(out/'entry.png'))
  # Exact fixed gestures for both variants, no planner or outcome-based retries.
  box=p.locator('#joystick').bounding_box();assert box;cx=box['x']+box['width']/2;cy=box['y']+box['height']/2
  for turn in range(8):
   for key,ms in [('ArrowRight',160),('ArrowUp',160)]:
    result['inputs'].append({'turn':turn,'key':key,'durationMs':ms});p.keyboard.down(key);p.clock.run_for(ms);p.keyboard.up(key);p.clock.run_for(160)
   result['inputs'].append({'turn':turn,'pointer':[cx,cy,cx,cy-20],'durationMs':320})
   p.mouse.move(cx,cy);p.mouse.down();p.mouse.move(cx,cy-20);p.clock.run_for(320);p.mouse.move(cx,cy);p.mouse.up();p.clock.run_for(160)
   p.keyboard.down('Space');p.clock.run_for(1100);p.keyboard.up('Space');p.clock.run_for(12000)
   result['inputs'].append({'turn':turn,'key':'Space','durationMs':1100,'settleMs':12000});result['states'].append({'label':'cast-'+str(turn),'state':state()})
  assert not result['errors'];result['passed']=True;p.screenshot(path=str(out/'final.png'))
 except Exception as e:result['failure']=str(e);result['traceback']=traceback.format_exc();p.screenshot(path=str(out/'failure.png'))
 finally:(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));browser.close()
if not result['passed']:raise SystemExit(1)
