"""Actual jump/drop controls at the roof, isolated archer and one initial pose. Horizontal steering uses keyboard in both viewport sizes; mobile jump/drop use touch. Not combat."""
import ast,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
BASE=story_base_url();OUT=ROOT/'review/stage22/browser';rows=[];errors=[]
m=ast.parse((ROOT/'tests/evidence-quests-browser.py').read_text());SETUP=next(ast.literal_eval(n.value)for n in m.body if isinstance(n,ast.Assign)and any(isinstance(t,ast.Name)and t.id=='SETUP'for t in n.targets))
with sync_playwright()as p:
 browser=launch(p)
 for mobile in [False,True]:
  tag='mobile'if mobile else'desktop';ctx=browser.new_context(viewport={'width':390,'height':844}if mobile else{'width':1440,'height':900},is_mobile=mobile,has_touch=mobile);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/HONRO.html');page.wait_for_function('window.HonroApp');page.evaluate(SETUP,22)
  start=page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=b.units.find(u=>u.cls==='archer'&&u.side===0);b.units=[u];b.queue=[u.id];b.active=u.id;b.side=0;b.phase='aim';e.checkEnd=()=>false;a.checkMission=()=>false;Object.assign(u,{x:2170,y:2705,vx:0,vy:0,jumping:false,airborne:false,acted:false});a.actorBoundary=u.id;a.turnNotice=null;Object.assign(a.scene,{x:2470,y:2620,scale:.48,manual:true,goalFocus:null,focusUntil:0,focusId:null,storyTween:null});a.updateHUD(true);return {hp:u.hp,move:u.moveLeft};}''')
  page.locator('#jump').tap()if mobile else page.locator('#jump').click();page.keyboard.down('d');page.wait_for_function('HonroApp.engine.active.x>=2386',polling='raf');page.keyboard.up('d');page.wait_for_function('!HonroApp.engine.active.jumping&&HonroApp.engine.grounded(HonroApp.engine.active)');roof=page.evaluate('({x:HonroApp.engine.active.x,y:HonroApp.engine.active.y,hp:HonroApp.engine.active.hp,drop:HonroApp.engine.canDrop(),support:HonroApp.engine.contactSurface(HonroApp.engine.active.x,HonroApp.engine.active.y-2,HonroApp.engine.active.y+2)?.t.id})');assert roof['support']=='v22-art-main-document-archive:collision:0'and roof['drop'],roof
  page.screenshot(path=str(OUT/f'roof-contact-{tag}.png'));page.locator('#drop').tap()if mobile else page.locator('#drop').click();page.wait_for_function('!HonroApp.engine.active.platformDrop&&HonroApp.engine.active.y>2849');end=page.evaluate('({x:HonroApp.engine.active.x,y:HonroApp.engine.active.y,hp:HonroApp.engine.active.hp})');assert abs(end['y']-2850)<1 and end['hp']==start['hp'];rows.append({'device':tag,'start':start,'roof':roof,'end':end});ctx.close()
 browser.close()
assert not errors,errors
(OUT/'roof-controls.json').write_text(json.dumps({'scope':__doc__,'rows':rows,'errors':errors},indent=2));print('PASS desktop/mobile actual jump/drop roof contact')
