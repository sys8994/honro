"""Actual touch on prepared current saves. Three samples, not three chapter clears."""
import json,subprocess,hashlib
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/interaction-enemy-gates';rows=[];errors=[];http=[]
with serve_game()as base,sync_playwright()as p:
 browser=launch(p)
 for sid,marker in [(3,'ledger'),(17,'brace'),(24,'family-crest')]:
  profile=json.loads((OUT/f'control-{sid}-save.json').read_text());ctx=browser.new_context(viewport={'width':390,'height':844},has_touch=True);ctx.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile,ensure_ascii=False))+')');page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:http.append({'url':r.url,'status':r.status})if r.status>=400 else None)
  page.goto(base+'/HONRO.html');page.wait_for_function('document.documentElement.dataset.honroReady');page.locator('[data-action="continue"]').click();page.wait_for_function('(id)=>HonroApp.engine?.b.honroStage===id',arg=sid)
  for _ in range(60):
   if page.evaluate('!!HonroApp.dialogue'):
    button=page.locator('[data-action="dialogue-skip"]');nxt=page.locator('[data-action="dialogue-next"]');(button if button.count()else nxt).click()
   elif page.evaluate('HonroApp.canInput()&&!HonroApp.turnNotice'):break
   page.wait_for_timeout(150)
  button=page.locator(f'[data-context-interact="{marker}"]');button.wait_for();assert button.is_enabled();box=button.bounding_box();assert box and box['x']>=0 and box['y']+box['height']<=844
  before=page.evaluate('''id=>{const a=HonroApp,b=a.engine.b,m=b.honroMarkers.find(m=>m.id===id);return{enemyVitals:JSON.stringify(b.units.filter(u=>u.side===1).map(u=>[u.id,u.hp,!!u.dead])),near:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0&&Math.hypot(u.x-m.x,u.y-m.y)<220).map(u=>u.id),oldClearWorks:!!b.honroState.act2?.done?.['clear-works']}}''',marker);assert before['near']
  page.touchscreen.tap(box['x']+box['width']/2,box['y']+box['height']/2);page.wait_for_function('id=>HonroApp.engine.b.honroMarkers.find(m=>m.id===id).collected',arg=marker)
  assert page.evaluate('JSON.stringify(HonroApp.engine.b.units.filter(u=>u.side===1).map(u=>[u.id,u.hp,!!u.dead]))')==before['enemyVitals']
  if sid==17:assert not page.evaluate('!!HonroApp.engine.b.honroState.act2.done["clear-works"]');assert page.evaluate('HonroAct2.current(HonroApp.engine.b)?.id')=='hoist'
  page.screenshot(path=str(OUT/f'focus3-stage-{sid}.jpg'),type='jpeg',quality=85);rows.append({'stage':sid,'marker':marker,'input':'real touch','nearbyEnemyIDs':before['near'],'enemyVitalsPreserved':True,'button':box});ctx.close()
 browser.close()
assert not errors and not http
report={'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'manifestSHA256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'cases':rows,'errors':errors,'httpFailures':http,'scope':__doc__};(OUT/'focus3-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'cases':len(rows),'errors':errors,'httpFailures':http}))
