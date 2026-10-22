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
 page.click('[data-action=settings-page][data-id=sound]');page.locator('#setting-volume').focus();page.keyboard.press('ArrowRight')
 assert page.evaluate('Math.abs(HonroApp.profile.settings.volume-.6)<.00001')
 assert page.evaluate('Math.abs(JSON.parse(localStorage.getItem("honro-first-act-profile-1")).settings.volume-.6)<.00001')
 page.wait_for_timeout(200)
 page.screenshot(path=str(out/'sound-saved-value-390x844.jpg'),type='jpeg',quality=80)
 assert page.evaluate('JSON.stringify(HonroApp.engine.b)')==before
 page.click('.menu-close');assert page.evaluate('HonroApp.modalKind')=='pause-dialog'
 page.click('[data-action=settings]');page.click('[data-action=settings-page][data-id=play]');page.click('[data-action=settings-help]')
 assert page.locator('[data-action=fullscreen]').is_visible()
 page.screenshot(path=str(out/'settings-help-390x844.jpg'),type='jpeg',quality=80)
 page.locator('.menu-back').click();assert page.evaluate('HonroApp.settingsPage')=='play'
 page.click('.menu-close');page.click('[data-action=settings]')
 for _ in range(10):
  page.keyboard.press('Tab');assert page.evaluate('!!document.activeElement.closest("[role=dialog]")')
 page.click('[data-action=settings-page][data-id=records]');page.click('[data-action=import]');page.screenshot(path=str(out/'import-confirm-390x844.jpg'),type='jpeg',quality=80);page.click('[data-action=menu-cancel]');assert page.evaluate('HonroApp.modalKind')=='settings-dialog'
 # Exercise the browser fullscreen API through the real gesture first.
 page.click('[data-action=fullscreen]');page.wait_for_function('!!document.fullscreenElement')
 assert page.locator('[data-fullscreen-label]').inner_text()=='나가기'
 assert page.evaluate('JSON.stringify(HonroApp.engine.b)')==before
 page.screenshot(path=str(out/'fullscreen-success-chromium.jpg'),type='jpeg',quality=80)
 page.click('[data-action=fullscreen]');page.wait_for_function('!document.fullscreenElement')
 page.evaluate("() => {document.documentElement.requestFullscreen=()=>Promise.reject(Error('fixture rejection'));}")
 page.click('[data-action=fullscreen]');page.wait_for_function("document.querySelector('[data-fullscreen-status]').textContent.includes('제한')")
 page.screenshot(path=str(out/'fullscreen-rejected-fixture.jpg'),type='jpeg',quality=80)
 assert page.evaluate('JSON.stringify(HonroApp.engine.b)')==before
 # File picker cancellation and invalid input leave the current menu paused.
 page.locator('#file-import').dispatch_event('cancel')
 page.locator('#file-import').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':b'{broken'})
 page.wait_for_function('document.querySelector("#file-import").value===""')
 assert page.evaluate('JSON.stringify(HonroApp.engine.b)')==before
 assert page.evaluate('HonroApp.modalKind')=='settings-dialog'
 assert '기록 파일을 읽을 수 없습니다' in page.locator('#notice').inner_text()
 page.screenshot(path=str(out/'import-invalid-fixture-390x844.jpg'),type='jpeg',quality=80)
 page.locator('#notice').wait_for(state='hidden')
 with page.expect_download() as download:page.click('[data-action=export]')
 saved=json.loads(__import__('pathlib').Path(download.value.path()).read_text())
 assert saved['game']=='honro' and page.evaluate('HonroApp.settingsPage')=='records'
 page.keyboard.press('Escape');assert page.evaluate('HonroApp.settingsPage')=='root'
 page.keyboard.press('Escape');assert page.evaluate('HonroApp.modalKind')=='pause-dialog'
 page.click('[data-action=rest]');page.click('[data-action=cancel-journey-launch]')
 assert page.evaluate('HonroApp.modalKind')=='pause-dialog'
 assert page.evaluate('JSON.stringify(HonroApp.engine.b)')==before
 page.click('[data-action=retry-menu]');page.screenshot(path=str(out/'retry-choice-390x844.jpg'),type='jpeg',quality=80);page.click('[data-action=retry-confirm][data-id=battle]');page.screenshot(path=str(out/'retry-confirm-390x844.jpg'),type='jpeg',quality=80);page.click('[data-action=menu-cancel]')
 assert page.evaluate('HonroApp.modalKind')=='pause-retry'
 page.click('.menu-close');page.click('[data-action=settings]');page.click('[data-action=settings-page][data-id=records]');page.click('[data-action=newgame]');page.screenshot(path=str(out/'new-journey-confirm-390x844.jpg'),type='jpeg',quality=80);page.click('[data-action=menu-cancel]')
 assert page.evaluate('JSON.stringify(HonroApp.engine.b)')==before
 # Confirmed valid import takes the established title path.
 page.click('[data-action=import]')
 with page.expect_file_chooser() as picker:page.click('[data-action=menu-confirm]')
 picker.value.set_files({'name':'valid.json','mimeType':'application/json','buffer':json.dumps(saved).encode()})
 page.wait_for_function('HonroApp.screen==="title"&&!HonroApp.engine')
 page.evaluate('HonroApp.settings("records")');page.click('[data-action=newgame]');page.click('[data-action=menu-confirm]')
 assert page.evaluate('HonroApp.screen==="title"&&Object.keys(HonroApp.profile.cleared).length===0&&HonroApp.profile.honroBattle==null')
 print(json.dumps({'errors':errors,'checks':'4 viewport roots/details fit; 5% volume persistence; paused state immutable; X/Escape/cancel paths; native fullscreen success and rejection; invalid import/export/valid import; confirmed new journey'},ensure_ascii=False));assert not errors
 b.close()
