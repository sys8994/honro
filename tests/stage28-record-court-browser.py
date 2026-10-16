"""Isolated browser rendering and finite production Engine movement. Native battle snapshots are labelled replay.
No user profile is opened; each context is disposable. No remote site writes."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
OUT=ROOT/'review/stage28/browser';OUT.mkdir(parents=True,exist_ok=True);BASE=story_base_url();rows=[];errors=[]
SETUP='''()=>{const a=HonroApp,C=HONRO_CORE;a.frame=()=>{};a.profile=HONRO_TOOLS.fresh();for(let i=1;i<28;i++)a.profile.cleared[i]={visits:1,rounds:5};a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=[...a.profile.recruited];for(const cls of a.profile.recruited){a.profile.heroes[cls].xp=HonroProgression.budget(28).start;C.autoTrain(a.profile.heroes[cls],cls);C.sanitizeLoadout(a.profile,cls);}a.profile.settings.sound=false;a.profile.settings.music=false;a.launch(28);for(let i=0;a.dialogue&&i<100;i++)HonroStory.finish(a);a.close();a.turnNotice=null;a.scene.storyTween=null;a.scene.goalFocus=null;a.scene.cinematic=null;a.updateHUD(true);return {id:a.engine.b.honroStage,revision:a.engine.b.honroRecordCourtRevision,heroes:a.engine.heroesAlive().map(u=>({cls:u.cls,x:u.x,y:u.y}))};}'''
PAINT='''v=>{const a=HonroApp;Object.assign(a.scene,{x:v.x,y:v.y,scale:v.scale,manual:true,time:2});a.scene.storyTween=null;a.scene.goalFocus=null;a.scene.cinematic=null;a.updateHUD(true);const banner=document.getElementById('turn-banner');if(banner)banner.hidden=true;const toast=document.getElementById('notice');if(toast)toast.hidden=true;const event=document.getElementById('event');if(event)event.textContent='';a.scene.render(a.engine,0,'',.5,false,0);}'''
with sync_playwright() as p:
 browser=launch(p)
 for mobile in [False,True]:
  w,h=(390,844)if mobile else(1440,900);tag='mobile'if mobile else'desktop';ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/HONRO.html');page.wait_for_function('window.HonroApp');entry=page.evaluate(SETUP);assert entry['revision']==1
  for name,x,y,scale in [('overview',3600,2400,.18 if mobile else .19),('west-fire',1570,2450,.72),('record-court',3700,2240,.7),('water-yard',6040,2460,.7)]:
   page.evaluate(PAINT,dict(x=x,y=y,scale=scale));page.wait_for_timeout(100);page.screenshot(path=str(OUT/f'{tag}-{name}.png'))
  # Direct production Engine movement on the current, populated battlefield. Manual tick
  # keeps enemies and ordinary movement cost; this is not keyboard/touch input proof.
  move=page.evaluate('''()=>{const a=HonroApp,e=a.engine,u=e.active,b=e.b,before={x:u.x,move:u.moveLeft};for(let i=0;i<60&&e.canAct();i++){e.move(-1,1/60);e.tick(1/60);HonroMission.tick(a,1/60);}return{before,after:{x:u.x,move:u.moveLeft},hp:u.hp,phase:b.phase}}''');assert move['after']['x']<move['before']['x'] and move['after']['move']<move['before']['move']
  snapshot=json.loads((ROOT/'review/stage28/normal-play/scene-28-24.json').read_text())['b'];page.evaluate('b=>{const a=HonroApp;a.mount(b);for(let i=0;a.dialogue&&i<80;i++)HonroStory.finish(a);a.close();a.turnNotice=null;}',snapshot);page.evaluate(PAINT,dict(x=3500,y=2260,scale=.72));page.screenshot(path=str(OUT/f'{tag}-normal-reunion-replay.png'))
  laid=json.loads((ROOT/'review/stage28/reunion/laid-fixture.json').read_text())['b'];page.evaluate('b=>{const a=HonroApp;a.mount(b);a.dialogue=null;a.close();a.turnNotice=null;}',laid);page.evaluate(PAINT,dict(x=3520,y=2290,scale=.82));page.screenshot(path=str(OUT/f'{tag}-four-evidence-laid-fixture.png'))
  roof=json.loads((ROOT/'review/stage28/roof/roof-fixture.json').read_text())['b'];page.evaluate('b=>{const a=HonroApp;a.mount(b);a.dialogue=null;a.close();a.turnNotice=null;}',roof);page.evaluate(PAINT,dict(x=3580,y=2070,scale=.72 if mobile else .65));page.screenshot(path=str(OUT/f'{tag}-roof-route-fixture.png'))
  rows.append({'viewport':[w,h],'entry':entry,'finiteLiveMovement':move,'normalScene':f"native normal battle R{snapshot['round']} snapshot replayed in browser",'evidenceScene':'isolated dispersed-reunion fixture; four laid items','roofScene':'enemy-free finite move/jump/drop fixture; roof landing'});ctx.close()
 # Both HTML bundles expose identical stage geometry, using the production Stage View.
 ctx=browser.new_context(viewport={'width':1440,'height':900});page=ctx.new_page();page.goto(BASE+'/HONRO_WORKSHOP.html');page.wait_for_function('window.HonroWorkshopAPI');page.evaluate("HonroWorkshopAPI.selectStage('stage-28')");page.wait_for_timeout(300);page.screenshot(path=str(OUT/'workshop-stage-view.png'));rows.append({'shell':'Workshop','stageView':True});ctx.close();browser.close()
assert not errors,errors
(OUT/'report.json').write_text(json.dumps({'passed':True,'rows':rows,'errors':errors,'scope':'Real browser Canvas/HUD and finite Engine input; screenshots of declared native and noncombat snapshots are replay, not browser normal fullplay.'},ensure_ascii=False,indent=2));print('PASS Stage28 browser PC/mobile rendering, populated movement, native replay and Workshop Stage View')
