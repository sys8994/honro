import sys,json
from browser_support import launch,serve_game,ROOT
from playwright.sync_api import sync_playwright
out=ROOT/'game/docs/image-journey-clean-settings/evidence'
with serve_game() as url,sync_playwright() as p:
 b=launch(p);page=b.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(url+'/HONRO.html');page.wait_for_function('window.HonroApp')
 for w,h in [(360,800),(390,844),(844,390),(1280,900)]:
  page.set_viewport_size({'width':w,'height':h});page.evaluate('HonroApp.settings()');page.screenshot(path=str(out/f'settings-root-{w}x{h}.jpg'),type='jpeg',quality=80)
  for screen in ['sound','screen','play','records','debug']:
   page.evaluate('(s)=>HonroApp.settings(s)',screen)
   assert page.locator('[data-action=fullscreen]').is_visible()
   assert page.locator('.menu-close').is_visible()
   box=page.locator('.dialog').bounding_box();assert box['y']>=0 and box['y']+box['height']<=h+1,(w,h,box)
   if w==390:page.screenshot(path=str(out/f'settings-{screen}-390x844.jpg'),type='jpeg',quality=80)
 page.set_viewport_size({'width':390,'height':844});page.evaluate('HonroApp.close();HonroApp.launch(1)')
 for _ in range(30):
  if not page.locator('[data-action=dialogue-skip]').count():break
  page.locator('[data-action=dialogue-skip]').click()
 page.click('[data-action=pause]');page.screenshot(path=str(out/'pause-390x844.jpg'),type='jpeg',quality=80)
 page.click('[data-action=settings]');before=page.evaluate('JSON.stringify(HonroApp.engine.b)')
 page.click('[data-action=settings-page][data-id=sound]');page.wait_for_timeout(200)
 assert page.evaluate('JSON.stringify(HonroApp.engine.b)')==before
 page.click('.menu-close');assert page.evaluate('HonroApp.modalKind')=='pause-dialog'
 page.click('[data-action=settings]');page.click('[data-action=settings-page][data-id=records]');page.click('[data-action=import]');page.click('[data-action=menu-cancel]');assert page.evaluate('HonroApp.modalKind')=='settings-dialog'
 page.evaluate("() => {document.documentElement.requestFullscreen=()=>Promise.reject(Error('fixture rejection'));}")
 page.click('[data-action=fullscreen]');page.wait_for_function("document.querySelector('[data-fullscreen-status]').textContent.includes('제한')")
 page.screenshot(path=str(out/'fullscreen-rejected-fixture.jpg'),type='jpeg',quality=80)
 assert page.evaluate('JSON.stringify(HonroApp.engine.b)')==before
 print(json.dumps({'errors':errors,'checks':'4 viewport roots and all details fit; pause state immutable; X returns pause; import cancel; rejected fullscreen stays paused'},ensure_ascii=False));assert not errors
 b.close()
