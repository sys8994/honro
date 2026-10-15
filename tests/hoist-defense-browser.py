"""Controlled chapter checkpoint, real browser tick/save/Continue; not a full combat clear."""
import ast,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
OUT=ROOT/'_local/reports/hoist-defense';BASE=story_base_url();reports=[];errors=[]
m=ast.parse((ROOT/'tests/evidence-quests-browser.py').read_text());SETUP=next(ast.literal_eval(n.value)for n in m.body if isinstance(n,ast.Assign)and any(isinstance(t,ast.Name)and t.id=='SETUP'for t in n.targets))
PREP='''progress=>{const a=HonroApp,b=a.engine.b,A=HonroAct2,m=A.memory(b);for(const s of A.steps(b).slice(0,4))m.done[s.id]=true;for(const u of b.units)if(u.side===1){u.dead=true;u.hp=0;}const at=b.honroMarkers.find(m=>m.id==='hold-hoist');for(const [i,u]of a.engine.heroesAlive().entries())Object.assign(u,{x:at.x+i*15,y:at.y,vx:0,vy:0});b.round=14;m.events['story:hold-hoist']=true;m.holds={'hold-hoist':{progress,spawned:0,lastRound:14,continuous:true,guarded:true}};a.actorBoundary=b.active;a.turnNotice=null;a.dirty=true;HonroStory.save(a);return true;}'''
with sync_playwright()as p:
 browser=launch(p)
 for mobile in [False,True]:
  tag='mobile'if mobile else'desktop';ctx=browser.new_context(viewport={'width':390,'height':844}if mobile else{'width':1440,'height':900},is_mobile=mobile,has_touch=mobile);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+'/_local/reports/hoist-defense/before.html');page.wait_for_function('window.HonroApp');page.evaluate(SETUP,17);page.evaluate(PREP,7);page.wait_for_timeout(300);assert not page.evaluate('HonroAct2.memory(HonroApp.engine.b).done.notes');page.screenshot(path=str(OUT/f'{tag}-before-7-of-5.png'))
  # Same origin stores the genuine stuck battle; load updated build and press Continue.
  page.goto(BASE+'/HONRO.html');page.wait_for_function('window.HonroApp');page.locator('[data-action="continue"]').click();page.wait_for_function('HonroApp.engine?.b.honroState.act2.done.notes');page.wait_for_timeout(300);page.screenshot(path=str(OUT/f'{tag}-continue-recovered.png'));assert page.evaluate("HonroAct2.memory(HonroApp.engine.b).checkpoints.filter(x=>x.id==='notes').length")==1
  page.evaluate(SETUP,17);page.evaluate(PREP,4);assert page.evaluate('HonroAct2.memory(HonroApp.engine.b).holds["hold-hoist"].progress')==4;page.evaluate('()=>{const a=HonroApp;a.engine.b.round++;HonroAct2.tick(a,0);}');assert page.evaluate('HonroAct2.memory(HonroApp.engine.b).done.notes');assert page.evaluate('HonroAct2.memory(HonroApp.engine.b).holds["hold-hoist"].spawned')==0;page.wait_for_timeout(300);page.screenshot(path=str(OUT/f'{tag}-fifth-round.png'));page.evaluate('()=>{HonroApp.setDebugMode(true);HonroApp.launch(17);for(let i=0;HonroApp.dialogue&&i<100;i++)HonroStory.finish(HonroApp);HonroApp.turnNotice=null;}');page.evaluate(PREP,4);page.evaluate('()=>{HonroApp.engine.b.round++;HonroAct2.tick(HonroApp,0);}');assert page.evaluate('HonroApp.debugMode&&HonroAct2.memory(HonroApp.engine.b).done.notes');reports.append({'debugFinalInterval':True,'device':tag,'beforeStuck':True,'continueRecovered':True,'actualFinalInterval':True});ctx.close()
 browser.close()
assert not errors,errors
(OUT/'browser.json').write_text(json.dumps({'passed':True,'checks':reports,'scope':'isolated checkpoint; original user saves untouched'},ensure_ascii=False,indent=2));print('PASS desktop/mobile stuck7/5 Continue and actual4→5 tick')
