"""Controlled current-game UI roof jump/drop, desktop and mobile. One initial actor pose per case; not normal combat."""
import ast,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
BASE=story_base_url();OUT=ROOT/'review/stage26';rows=[];errors=[]
m=ast.parse((ROOT/'tests/evidence-quests-browser.py').read_text());SETUP=next(ast.literal_eval(n.value)for n in m.body if isinstance(n,ast.Assign)and any(isinstance(t,ast.Name)and t.id=='SETUP'for t in n.targets))
with sync_playwright()as p:
 browser=launch(p)
 for mobile in [False,True]:
  tag='mobile'if mobile else'desktop';ctx=browser.new_context(viewport={'width':390,'height':844}if mobile else{'width':1440,'height':900},is_mobile=mobile,has_touch=mobile);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/HONRO.html');page.wait_for_function('window.HonroApp')
  for cls in ['knight','occultist']:
   for place,x,y in [('workshop',2500,2700),('refuge',4580,2150)]:
    page.evaluate(SETUP,26);start=page.evaluate('''v=>{const a=HonroApp,e=a.engine,b=e.b,u=b.units.find(u=>u.side===0&&u.cls===v[0]);Object.assign(u,{x:v[1],y:v[2],vx:0,vy:0,airborne:false,jumping:false});e.select(u.id);a.actorBoundary=u.id;a.turnNotice=null;a.scene.storyTween=null;a.scene.manual=false;a.updateHUD(true);return {hp:u.hp,move:u.moveLeft,x:u.x,y:u.y};}''',[cls,x,y]);page.wait_for_timeout(120)
    page.locator('#jump').tap()if mobile else page.locator('#jump').click();page.wait_for_function('HonroApp.engine.active.jumping||HonroApp.engine.active.y<'+str(y-5));page.wait_for_function('!HonroApp.engine.active.jumping&&HonroApp.engine.grounded(HonroApp.engine.active)');roof=page.evaluate('({x:HonroApp.engine.active.x,y:HonroApp.engine.active.y,hp:HonroApp.engine.active.hp,canDrop:HonroApp.engine.canDrop()})');assert roof['y']<y-130 and roof['canDrop'] and roof['hp']==start['hp'],roof
    page.evaluate('''v=>{const a=HonroApp;a.scene.storyTween=null;Object.assign(a.scene,{x:v[0],y:v[1]-100,scale:v[2],manual:true,goalFocus:null,focusUntil:0});}''',[x,y,.43 if mobile else .8]);page.wait_for_timeout(150);page.screenshot(path=str(OUT/f'roof-{tag}-{cls}-{place}.png'))
    page.locator('#drop').tap()if mobile else page.locator('#drop').click();page.wait_for_function('!HonroApp.engine.active.platformDrop&&HonroApp.engine.active.y>'+str(y-2));end=page.evaluate('({x:HonroApp.engine.active.x,y:HonroApp.engine.active.y,hp:HonroApp.engine.active.hp})');assert abs(end['y']-y)<2 and end['hp']==start['hp'];rows.append({'device':tag,'cls':cls,'place':place,'start':start,'roof':roof,'end':end,'inputs':['jump button','drop button']})
  ctx.close()
 browser.close()
assert not errors,errors
(OUT/'roof-browser.json').write_text(json.dumps({'scope':__doc__,'rows':rows,'errors':errors},ensure_ascii=False,indent=2));print('PASS actual desktop/mobile both heroes jump/drop buttons at workshop/refuge roofs')
