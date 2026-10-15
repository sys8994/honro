"""Before/after rendered timing at a controlled safe Stage27 checkpoint.
The renderer and requestAnimationFrame run normally; no campaign completion claim.
"""
import ast,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
OUT=ROOT/'_local/reports/void-pacing';OUT.mkdir(parents=True,exist_ok=True);BASE=story_base_url()
m=ast.parse((ROOT/'tests/act3-void-browser.py').read_text());SETUP=next(ast.literal_eval(n.value)for n in m.body if isinstance(n,ast.Assign)and any(isinstance(t,ast.Name)and t.id=='SETUP'for t in n.targets))
results=[]
with sync_playwright()as p:
 browser=launch(p)
 for mobile in [False,True]:
  tag='mobile'if mobile else'desktop'
  for before in [True,False]:
   ctx=browser.new_context(viewport={'width':390,'height':844}if mobile else{'width':1440,'height':900},is_mobile=mobile,has_touch=mobile);page=ctx.new_page();page.goto(BASE+('/_local/reports/void-pacing/before.html'if before else'/HONRO.html'));page.wait_for_function('window.HonroApp');page.evaluate(SETUP)
   page.evaluate('HonroAct3Void.begin(HonroApp)');rows=[]
   for t in ([.3,.85,1.3]if before else[.3,2,3.7,4.8,5.2]):
    page.wait_for_function('(t)=>HonroApp.honroVoidSession.elapsed>=t',arg=t)
    row=page.evaluate('''()=>{const a=HonroApp,s=a.honroVoidSession,u=a.engine.b.units.find(u=>u.side===0&&u.cls==='archer');return {elapsed:s.elapsed,state:a.engine.b.honroAct3Void.state,dark:getComputedStyle(s.host).getPropertyValue('--void-dark'),hudOpacity:getComputedStyle(document.querySelector('.battle-head')).opacity,hudVisibility:getComputedStyle(document.querySelector('.battle-head')).visibility,camera:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale},actor:{x:u.x,y:u.y},text:s.text.textContent}}''');rows.append(row)
    page.screenshot(path=str(OUT/f'{tag}-{"before"if before else"after"}-{t}.png'))
   if not before:
    assert rows[1]['state']=='FALLING'and float(rows[1]['dark'])==0
    assert rows[2]['state']=='DARKENING'and 0<float(rows[2]['dark'])<1
    assert rows[3]['hudVisibility']=='hidden'and not rows[3]['text']
    assert rows[4]['state']=='VOID'and rows[4]['hudVisibility']=='hidden'
    for r in rows:assert abs(r['camera']['x']-r['actor']['x'])<.01 and abs(r['camera']['y']-(r['actor']['y']-48))<.01
   results.append({'viewport':tag,'version':'before'if before else'after','timeline':rows,'lines':page.evaluate('HonroAct3Void.sceneLines')});ctx.close()
 browser.close()
(OUT/'timeline.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print('PASS desktop/mobile before-after fall, darkness, centered camera and hidden HUD timing')
