"""P0 camera regression: real input/ordinary stage1 loop, plus labelled roster fixture.
Never substitutes the clock, Engine, simulation loop, terrain or actor positions.
"""
import json,sys,time
from pathlib import Path
from browser_support import ROOT,launch,serve_game
from playwright.sync_api import sync_playwright
BEFORE='--before' in sys.argv
DEVICE=next((v.split('=',1)[1] for v in sys.argv if v.startswith('--device=')),None)
OUT=ROOT/(('_local/reports/camera-player-control-before' if BEFORE else '_local/reports/camera-player-control-after')+('-'+DEVICE if DEVICE else ''));OUT.mkdir(parents=True,exist_ok=True)
SNAP='''()=>{const a=HonroApp,b=a.engine.b,s=a.scene,u=a.engine.active,r=s.canvas.getBoundingClientRect();return{phase:b.phase,round:b.round,active:b.active,canInput:a.canInput(),manual:s.manual,intent:HonroAttackCamera.status(s),camera:{x:s.x,y:s.y,scale:s.scale},unit:{x:u.x,y:u.y,h:u.h,moveLeft:u.moveLeft,jumping:u.jumping,retreat:u.retreat},screen:{x:r.width/2+(u.x-s.x)*s.scale,head:r.height/2+(u.y-u.h-s.y)*s.scale,foot:r.height/2+(u.y-s.y)*s.scale,w:r.width,h:r.height},projectiles:b.projectiles.length};}'''
with serve_game() as url,sync_playwright() as p:
 browser=launch(p);rows=[];errors=[]
 for device,size in [('desktop',{'width':1280,'height':800}),('mobile',{'width':390,'height':844})]:
  if DEVICE and device!=DEVICE:continue
  ctx=browser.new_context(viewport=size,has_touch=True);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(url+'/HONRO.html');page.wait_for_function('window.HonroApp',timeout=120000)
  def snap():return page.evaluate(SNAP)
  def shot(name):page.screenshot(path=str(OUT/f'{device}-{name}.png'))
  def finish_dialogue():
   deadline=time.monotonic()+30
   while page.evaluate('!!HonroApp.dialogue') and time.monotonic()<deadline:
    btn=page.locator('[data-action="dialogue-skip"]');(btn if btn.count() else page.locator('[data-action="dialogue-next"]')).click();page.wait_for_timeout(80)
  def fresh():
   page.evaluate('''()=>{const a=HonroApp;a.profile=HONRO_TOOLS.fresh();a.profile.settings.speed=4;a.profile.settings.playerSpeed=1;a.launch(1);}''');finish_dialogue();page.wait_for_function('HonroApp.canInput()&&HonroApp.engine.grounded(HonroApp.engine.active)',timeout=20000);page.wait_for_timeout(650)
  def touch_start(x,y):
   c=ctx.new_cdp_session(page);c.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});return c
  def end(c):c.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});c.detach()
  def pan(kind,held=False):
   x,y=size['width']*.56,size['height']*.37
   if kind=='zoom':
    page.mouse.move(x,y);page.mouse.wheel(0,130);page.wait_for_timeout(50);return None
   if kind=='minimap':
    r=page.locator('#minimap').bounding_box();x=r['x']+r['width']*.42;y=r['y']+r['height']*.5
    if device=='desktop':page.mouse.move(x,y);page.mouse.down();page.wait_for_timeout(40);page.mouse.up();return None
    c=touch_start(x,y);page.wait_for_timeout(40);end(c);return None
   if device=='desktop':
    page.mouse.move(x,y);page.mouse.down();page.mouse.move(x-110,y+65,steps=7)
    if not held:page.mouse.up()
    return 'mouse' if held else None
   c=touch_start(x,y);c.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x-100,'y':y+60}]})
   if not held:end(c)
   return c if held else None
  def move(direction,ms=1100):
   if device=='desktop':page.keyboard.down('KeyD' if direction>0 else 'KeyA');page.wait_for_timeout(ms);page.keyboard.up('KeyD' if direction>0 else 'KeyA')
   else:
    r=page.locator('#joystick').bounding_box();x=r['x']+r['width']/2;y=r['y']+r['height']/2;c=touch_start(x,y);c.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+direction*r['width']*.43,'y':y}]});page.wait_for_timeout(ms);end(c)
   page.wait_for_timeout(180)
  def follows(a,b):
   assert abs(b['unit']['x']-a['unit']['x'])>30,(a,b)
   assert not b['manual'] and not b['intent']['manual'],(a,b)
   assert abs(b['camera']['x']-a['camera']['x'])>10,(a,b)
   q=b['screen'];assert 10<q['x']<q['w']-10 and q['head']>-30 and q['foot']<q['h']*.90,(a,b)
  fresh();a=snap();move(1);b=snap();rows.append({'device':device,'case':'no-camera-input-right','before':a,'after':b});shot('00-default-move')
  if not BEFORE:follows(a,b)
  fresh();pan('minimap');a=snap();shot('01-minimap-before-move');move(1);b=snap();shot('02-minimap-after-move');rows.append({'device':device,'case':'minimap-right','before':a,'after':b})
  if BEFORE:
   assert b['manual'] and b['intent']['manual'] and abs(b['camera']['x']-a['camera']['x'])<1 and abs(b['unit']['x']-a['unit']['x'])>30,(a,b)
   print('REPRODUCED',device,'unit delta',round(b['unit']['x']-a['unit']['x'],1),'camera delta',round(b['camera']['x']-a['camera']['x'],1),'screen x',round(b['screen']['x'],1),flush=True);ctx.close();continue
  follows(a,b)
  for kind,direction in [(k,d) for k in ['pan','zoom','minimap'] for d in [-1,1] if (k,d)!=('minimap',1)]:
   fresh();move(1,500);pan(kind);a=snap();move(direction);b=snap();follows(a,b);rows.append({'device':device,'case':kind+('-left' if direction<0 else '-right'),'before':a,'after':b})
  for kind in ['pan','zoom','minimap']:
   fresh();pan(kind);a=snap()
   if device=='desktop':page.keyboard.press('ControlLeft')
   else:page.locator('#jump').tap()
   page.wait_for_timeout(140);b=snap();assert b['unit']['y']<a['unit']['y']-20 and not b['manual'] and not b['intent']['manual'],(a,b);rows.append({'device':device,'case':kind+'-jump','before':a,'after':b});shot(kind+'-jump')
  # Held drag wins over an explicit simultaneous keyboard movement. This is
  # a real pointer + keyboard combination also at the mobile viewport.
  fresh();held=pan('pan',True);a=snap();page.keyboard.down('KeyD');page.wait_for_timeout(450);b=snap();page.keyboard.up('KeyD');assert b['manual'] and b['intent']['gesture'],(a,b)
  if held=='mouse':page.mouse.up()
  else:end(held)
  page.wait_for_timeout(60);c=snap();assert c['manual'];move(1,500);d=snap();follows(c,d);rows.append({'device':device,'case':'held-drag-then-move','held':b,'released':c,'after':d})
  for kind in ['pan','zoom','minimap']:
   # Natural defend cycle; no fabricated phase, turn or attack tick.
   fresh();pan(kind);a=snap()
   if device=='desktop':page.keyboard.press('KeyF')
   else:
    # Mixed CDP drag / Playwright tap can omit the compatibility click. Use
    # a real UI mouse click at mobile size for defend; locomotion/fire are touch.
    page.locator('[data-action="defend"]').click()
   page.wait_for_function("HonroApp.engine.b.round>1||HonroApp.engine.b.phase!=='aim'||HonroApp.engine.active.acted",timeout=3000)
   deadline=time.monotonic()+45
   while time.monotonic()<deadline:
    finish_dialogue()
    if page.evaluate('HonroApp.engine.b.round>1&&HonroApp.canInput()'):break
    page.wait_for_timeout(80)
   page.wait_for_timeout(600);b=snap();assert b['round']>a['round'] and b['canInput'] and not b['manual'] and not b['intent']['manual'],(a,b);q=b['screen'];assert 0<q['x']<q['w'];rows.append({'device':device,'case':kind+'-natural-next-player-turn','before':a,'after':b});shot(kind+'-next-player-turn')
   # Real HUD selection in an explicit prepared roster.
   fresh();page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,u=a.engine.active;b.units.push(HONRO_CORE.makeUnit('mage',0,u.x+80,u.y,{id:'camera-fixture-mage',loadout:['M01']}));a.heroSig=null;a.updateHUD(true);}""");pan(kind);a=snap();page.locator('[data-action="select-hero"][data-id="camera-fixture-mage"]').click(force=True);page.wait_for_timeout(650);b=snap();assert b['active']=='camera-fixture-mage' and not b['manual'] and not b['intent']['manual'],(a,b);q=b['screen'];assert 0<q['x']<q['w'];rows.append({'device':device,'case':kind+'-prepared-roster-real-HUD-selection','before':a,'after':b});shot(kind+'-selected-mage')
   fresh();pan(kind);a=snap()
   if device=='desktop':page.keyboard.down('Space');page.wait_for_timeout(1500);page.keyboard.up('Space')
   else:
    r=page.locator('#fire').bounding_box();c=touch_start(r['x']+r['width']/2,r['y']+r['height']/2);page.wait_for_timeout(1500);end(c)
   page.wait_for_timeout(200);b=snap();assert b['projectiles'] and b['intent']['attacks']>a['intent']['attacks'] and not b['manual'] and not b['intent']['manual'],(a,b);assert abs(b['camera']['x']-a['camera']['x'])>10,(a,b);rows.append({'device':device,'case':kind+'-real-fire','before':a,'after':b});shot(kind+'-real-fire')
  (OUT/'browser.json').write_text(json.dumps({'mode':'before' if BEFORE else 'after','scope':'Ordinary stage1 actual input/loop; selection is a prepared mage roster fixture.','rows':rows,'pageErrors':errors},ensure_ascii=False,indent=2))
  print('PASS',device,'ordinary movement/pan/zoom/minimap/jump/held/next turn and prepared HUD selection',flush=True);ctx.close()
 browser.close();assert not errors,errors
 (OUT/'browser.json').write_text(json.dumps({'mode':'before' if BEFORE else 'after','scope':'Ordinary stage1 real input/clock/simulation; last selection case has one explicit extra mage roster fixture. Stops before stage completion. Mobile is Chromium touch emulation.','rows':rows,'pageErrors':errors},ensure_ascii=False,indent=2))
