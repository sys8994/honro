"""Touch controls and save continuation of a real Stage21 browser combat save.
This is a mobile interaction smoke, not a second full combat completion.
"""
import json,hashlib,subprocess,os
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
source=ROOT/os.environ.get('HONRO_STAGE21_MOBILE_SAVE','_local/reports/stage21-current/ui-play-v6/moving-save.json')
out=ROOT/'_local/reports/stage21-current/mobile-touch';out.mkdir(parents=True,exist_ok=True)
profile=json.loads(source.read_text());results=[];errors=[]
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw)
 for name,w,h in [('portrait',390,844),('landscape',844,390)]:
  context=browser.new_context(viewport={'width':w,'height':h},has_touch=True,is_mobile=True,device_scale_factor=1)
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(base+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp');page.evaluate('p=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',profile);page.reload();page.locator('[data-action="continue"]').tap();page.wait_for_function('HonroApp.engine?.b?.honroStage===21')
  for _ in range(120):
   if page.evaluate('!!HonroApp.dialogue'):page.locator('[data-action="dialogue-next"]').tap()
   if page.evaluate('HonroApp.canInput()&&HonroApp.engine.grounded(HonroApp.engine.active)'):break
   page.wait_for_timeout(150)
  page.wait_for_function('HonroApp.canInput()')
  before=page.evaluate('({x:HonroApp.engine.active.x,move:HonroApp.engine.active.moveLeft,round:HonroApp.engine.b.round})')
  boxes={s:page.locator(s).bounding_box() for s in ['#joystick','#fire','#jump','#combat-skills','[data-action="defend"]']}
  assert all(b and b['x']>=0 and b['y']>=0 and b['x']+b['width']<=w+1 and b['y']+b['height']<=h+1 for b in boxes.values()),boxes
  box=page.locator('#joystick .joystick-ring').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
  cdp=context.new_cdp_session(page)
  cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
  cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x-28,'y':y}]});page.wait_for_timeout(350)
  cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_timeout(150)
  after=page.evaluate('({x:HonroApp.engine.active.x,move:HonroApp.engine.active.moveLeft,round:HonroApp.engine.b.round})')
  assert after['x']!=before['x'] and after['move']<before['move'],(before,after)
  page.screenshot(path=str(out/(name+'-battle.png')))
  page.locator('[data-action="pause"]').tap();page.wait_for_timeout(100)
  saved=page.evaluate('JSON.parse(localStorage.getItem("honro-first-act-profile-1")).honroBattle')
  assert saved['honroStage']==21 and saved['round']==after['round']
  page.screenshot(path=str(out/(name+'-pause.png')))
  results.append({'viewport':name,'before':before,'after':after,'controls':boxes,'savedStage':saved['honroStage'],'savedRound':saved['round']})
  context.close()
 browser.close()
assert not errors,errors
(out/'result.json').write_text(json.dumps({'scope':__doc__,'sourceSaveSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'servedSource':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'results':results,'errors':errors},ensure_ascii=False,indent=2))
print('PASS mobile touch movement, controls and pause/save',len(results))
