"""Small ordinary stage1 control smoke. No arena/HP/turn/time/Engine/frame edits.
Fresh profile, ordinary intro controls and speed settings; stops after one player
cast, manual camera movement, and the next natural accepted attack. Not fullplay.
"""
import json,sys,time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tests'))
from browser_support import ROOT,launch,serve_game
from playwright.sync_api import sync_playwright
OUT=ROOT/'_local/reports/attack-camera-live';OUT.mkdir(parents=True,exist_ok=True)
SNAP='''()=>{const a=HonroApp,b=a.engine.b,s=a.scene;return{at:performance.now(),phase:b.phase,round:b.round,active:b.active,dialogue:!!a.dialogue,manual:s.manual,camera:{x:s.x,y:s.y,scale:s.scale},attack:HonroAttackCamera.status(s),projectiles:b.projectiles.map(p=>({id:p.id,owner:p.owner,shot:p.shot,x:p.x,y:p.y,damageRoll:p.damageRoll,attackSide:p.attackSide})),hp:b.units.filter(u=>u.side===0).map(u=>({id:u.id,hp:u.hp}))};}'''
with serve_game() as url,sync_playwright() as p:
 browser=launch(p);rows=[];errors=[]
 for device,size in [('desktop',{'width':1280,'height':800}),('mobile',{'width':390,'height':844})]:
  ctx=browser.new_context(viewport=size,has_touch=True);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(url+'/HONRO.html');page.wait_for_function('window.HonroApp',timeout=120000)
  page.evaluate('''()=>{const a=HonroApp;a.profile=HONRO_TOOLS.fresh();a.profile.settings.speed=4;a.profile.settings.playerSpeed=1;a.launch(1);}''');page.wait_for_function('HonroApp.engine?.b.honroStage===1',timeout=120000)
  def advance_dialogue():
   if page.evaluate('!!HonroApp.dialogue'):
    button=page.locator('[data-action="dialogue-skip"]');button=button if button.count() else page.locator('[data-action="dialogue-next"]');button.click();return True
   return False
  deadline=time.monotonic()+45
  while page.evaluate('!!HonroApp.dialogue') and time.monotonic()<deadline:advance_dialogue();page.wait_for_timeout(80)
  page.wait_for_function('HonroApp.canInput()&&HonroApp.engine.grounded(HonroApp.engine.active)',timeout=30000)
  before=page.evaluate(SNAP)
  def cast_input():
   if device=='desktop':page.keyboard.down('Space');page.wait_for_timeout(1500);page.keyboard.up('Space')
   else:
    box=page.locator('#fire').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2;cdp=ctx.new_cdp_session(page);cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});page.wait_for_timeout(1500);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});cdp.detach()
  cast_input()
  page.wait_for_function('HonroAttackCamera.status(HonroApp.scene).attacks>0&&HonroApp.engine.b.projectiles.length>0',timeout=10000);cast=page.evaluate(SNAP);page.screenshot(path=str(OUT/f'{device}-00-player-attack.png'))
  x,y=size['width']*.55,size['height']*.40
  if device=='desktop':page.mouse.move(x,y);page.mouse.wheel(0,160)
  else:
   cdp=ctx.new_cdp_session(page);cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+55,'y':y+25}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});cdp.detach()
  page.wait_for_timeout(40);manual=page.evaluate(SNAP);assert manual['manual'] and manual['attack']['manual'],manual;page.screenshot(path=str(OUT/f'{device}-01-manual.png'))
  deadline=time.monotonic()+60
  while page.evaluate('HonroAttackCamera.status(HonroApp.scene).attacks')<=manual['attack']['attacks'] and time.monotonic()<deadline:
   if not advance_dialogue():
    if page.evaluate('HonroApp.canInput()&&!HonroApp.engine.active.retreat'):cast_input()
    else:page.wait_for_timeout(60)
  next_attack=page.evaluate(SNAP);assert next_attack['attack']['attacks']>manual['attack']['attacks'],next_attack;assert not next_attack['manual'] and not next_attack['attack']['manual'],next_attack;page.wait_for_timeout(100);page.screenshot(path=str(OUT/f'{device}-02-natural-next-attack.png'));rows.append({'device':device,'before':before,'cast':cast,'manual':manual,'next':next_attack});print('PASS ordinary stage1',device,'player',cast['active'],'manual -> natural next attack',next_attack['active'],flush=True);ctx.close()
 assert not errors,errors;(OUT/'browser.json').write_text(json.dumps({'scope':'Fresh ordinary stage1. No HP/pose/terrain/turn/clock/Engine/frame substitutions. Real keyboard/mobile fire and pan, then natural next accepted attack; stops before stage completion. Enemy speed4, player speed1.','rows':rows,'pageErrors':errors},ensure_ascii=False,indent=2));browser.close()
