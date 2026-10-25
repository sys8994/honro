"""One production UI training entry/reset/exit path, isolated save and normal frames."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/training-initializer-p21';OUT.mkdir(parents=True,exist_ok=True)
with serve_game() as base,sync_playwright() as pw:
 b=launch(pw);p=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp');entry=p.locator('script[type=module][src]').get_attribute('src')
 p.locator('[data-action=rest]').click();p.wait_for_timeout(150)
 for i in range(4):
  if p.locator('[data-action=dialogue-skip]').count():p.locator('[data-action=dialogue-skip]').click();p.wait_for_timeout(100)
 p.wait_for_selector('[data-action=training]')
 p.evaluate("()=>{const a=HonroApp;window.progressBefore=JSON.stringify({heroes:a.profile.heroes,loadouts:a.profile.loadouts,tuning:a.profile.tuning,cleared:a.profile.cleared});window.framesObserved=0;requestAnimationFrame(function count(){framesObserved++;requestAnimationFrame(count)})}")
 p.locator('[data-action=training]').click();p.wait_for_selector('.training-dialog');p.locator('[data-training-action=close]').click();p.wait_for_timeout(300)
 first=p.evaluate("()=>{const a=HonroApp,b=a.engine.b,u=b.units.find(u=>u.side===0);return {training:a.training,screen:a.screen,mode:b.mode,width:b.width,height:b.height,cls:u.cls,skill:u.loadout,enemyCount:b.units.filter(u=>u.side===1).length,session:b.session,sceneVersion:b.sceneVersion}}")
 assert first['training'] and first['mode']=='practice' and first['width']==6000 and first['height']==2300 and first['enemyCount']==18,first
 p.screenshot(path=str(OUT/'training-mobile.jpg'),type='jpeg',quality=80)
 p.locator('[data-action=training-reset]').click();p.wait_for_function('HonroApp.training&&HonroApp.engine.b.phase==="aim"');p.wait_for_timeout(150)
 second=p.evaluate("()=>{const a=HonroApp,b=a.engine.b,u=b.units.find(u=>u.side===0);return {session:b.session,cls:u.cls,skill:u.loadout,enemyCount:b.units.filter(u=>u.side===1).length,width:b.width,height:b.height}}")
 assert second['session']!=first['session'] and second['cls']==first['cls'] and second['skill']==first['skill'] and second['enemyCount']==18,second
 p.locator('[data-action=pause]').click();p.wait_for_selector('.pause-menu');p.locator('.pause-menu [data-action=rest]').click();p.wait_for_function('HonroApp.screen==="rest"&&!HonroApp.engine')
 assert p.evaluate('progressBefore===JSON.stringify({heroes:HonroApp.profile.heroes,loadouts:HonroApp.profile.loadouts,tuning:HonroApp.profile.tuning,cleared:HonroApp.profile.cleared})')
 assert p.evaluate('framesObserved>10');assert not errors,errors
 result={'entry':entry,'actualUI':'title→rest (intro skip)→training→close selection→reset→pause→rest','initial':first,'reset':second,'growthLoadoutsTuningClearedUnchanged':True,'framesObserved':p.evaluate('framesObserved'),'errors':errors,'browser':b.version};b.close()
(OUT/'browser.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False))
