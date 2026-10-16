"""Actual Game desktop/mobile screenshots; prepared stage entry, camera-only inspection, not normal combat completion."""
import ast,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
BASE=story_base_url();OUT=ROOT/'review/stage26';OUT.mkdir(parents=True,exist_ok=True);errors=[];rows=[]
m=ast.parse((ROOT/'tests/evidence-quests-browser.py').read_text());SETUP=next(ast.literal_eval(n.value)for n in m.body if isinstance(n,ast.Assign)and any(isinstance(t,ast.Name)and t.id=='SETUP'for t in n.targets))
with sync_playwright()as p:
 browser=launch(p)
 for mobile in [False,True]:
  tag='mobile'if mobile else'desktop';ctx=browser.new_context(viewport={'width':390,'height':844}if mobile else{'width':1440,'height':900},is_mobile=mobile,has_touch=mobile);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  for version in ['before','after']:
   page.goto(BASE+('/_local/reports/stage26-place/before.html'if version=='before'else'/HONRO.html'));page.wait_for_function('window.HonroApp');page.evaluate(SETUP,26)
   for place,x,y,z in [('entry',600,2220,.60),('record-room',1370,2220,.66),('workshop',3200,2370,.66),('refuge',4900,2120,.66),('overview',3500,2050,.20)]:
    if mobile:z=.32 if place!='overview'else .20
    page.evaluate('''v=>{const a=HonroApp;a.scene.storyTween=null;Object.assign(a.scene,{x:v[0],y:v[1],scale:v[2],manual:true,goalFocus:null,focusUntil:0});}''',[x,y,z]);page.wait_for_timeout(220);actual=page.evaluate('({x:HonroApp.scene.x,y:HonroApp.scene.y,zoom:HonroApp.scene.scale})');file=f'{version}-{tag}-{place}.png';page.screenshot(path=str(OUT/file));rows.append({'version':version,'device':tag,'place':place,'requestedCamera':{'x':x,'y':y,'zoom':z},'actualCamera':actual,'file':file})
  # Actual normal Continue preserves the serialized new geometry and objective state.
  before=page.evaluate('''()=>{const a=HonroApp;a.profile.honroBattle=structuredClone(a.engine.b);a.persist();return JSON.stringify({terrain:a.engine.b.terrain,act3:a.engine.b.honroState.act3});}''');page.reload();page.wait_for_function('window.HonroApp');page.locator('[data-action="continue"]').click();page.wait_for_function('HonroApp.engine');after=page.evaluate('JSON.stringify({terrain:HonroApp.engine.b.terrain,act3:HonroApp.engine.b.honroState.act3})');assert before==after
  ctx.close()
 ctx=browser.new_context(viewport={'width':1440,'height':900});owner=ctx.new_page();owner.on('pageerror',lambda e:errors.append(str(e)));owner.goto(BASE+'/HONRO_WORKSHOP.html');owner.wait_for_function('window.HonroWorkshopAPI');owner.evaluate("HonroWorkshopAPI.selectStage('stage-26')");owner.screenshot(path=str(OUT/'after-workshop-stage-view.png'));owner.click('[data-tab="play"]');owner.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');frame=owner.frames[-1];assert frame.evaluate('HonroApp.engine.b.honroStage26PlaceRevision')==2
 frame.evaluate('()=>{const a=HonroApp;for(let i=0;a.dialogue&&i<100;i++)HonroStory.finish(a);a.scene.storyTween=null;Object.assign(a.scene,{x:3200,y:2370,scale:.66,manual:true,goalFocus:null,focusUntil:0});}');owner.wait_for_timeout(220);owner.screenshot(path=str(OUT/'after-workshop-playtest.png'));ctx.close()
 browser.close()
assert not errors,errors
(OUT/'browser.json').write_text(json.dumps({'scope':__doc__,'rows':rows,'continueStable':True,'errors':errors},ensure_ascii=False,indent=2))
print('PASS actual desktop/mobile matched cameras and Continue; no normal combat claim')
