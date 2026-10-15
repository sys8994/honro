"""Isolated browser art/Continue review. Camera/state fixtures are labelled; no combat completion claim."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
OUT=ROOT/'review/stage30';OUT.mkdir(parents=True,exist_ok=True)
BASE=story_base_url();rows=[];errors=[]
with sync_playwright() as p:
 browser=launch(p)
 for mobile in [False,True]:
  ctx=browser.new_context(viewport={'width':390,'height':844} if mobile else {'width':1440,'height':900},is_mobile=mobile,has_touch=mobile)
  page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/HONRO.html');page.wait_for_function('window.HonroApp')
  page.evaluate('''()=>{const a=HonroApp;a.close();a.stopBattle();const p=HONRO_TOOLS.fresh();for(let i=1;i<30;i++)p.cleared[i]={visits:1,rounds:5};p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];p.settings.sound=false;p.settings.music=false;a.profile=p;a.normalProfile=p;a.launch(30);while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;a.close();a.frame=()=>{};const u=a.engine.active;Object.assign(a.scene,{x:u.x+500,y:u.y-200,scale:.6,manual:true,storyTween:null,goalFocus:null,cinematic:null,focusId:null,speakerId:null,focusUntil:0,speakerUntil:0});a.lastTurnNotice=`${a.engine.b.round}:player`;const banner=document.getElementById('turn-banner');if(banner)banner.hidden=true;a.updateHUD(true);a.scene.render(a.engine,0,a.selected,a.power,false,0,true);window.reviewInitial=structuredClone(a.engine.b)}''')
  prefix='mobile' if mobile else 'desktop'
  page.wait_for_timeout(200);page.evaluate("()=>{const a=HonroApp;const banner=document.getElementById('turn-banner');if(banner)banner.hidden=true;a.scene.render(a.engine,0,a.selected,a.power,false,0,true)}");page.screenshot(path=str(OUT/f'{prefix}-entry-hud.png'))
  # Actual serialized production battle retained through App.continue.
  result=page.evaluate('''async()=>{const a=HonroApp,b=a.engine.b;await a.persist(true);const before=JSON.stringify({terrain:b.terrain,units:b.units,state:b.honroState,steps:b.honroAct3Steps});a.stopBattle();await a.continue();while(a.dialogue)HonroStory.finish(a);const z=a.engine.b;return {stage:z.honroStage,retained:before===JSON.stringify({terrain:z.terrain,units:z.units,state:z.honroState,steps:z.honroAct3Steps})}}''');rows.append({'view':prefix,'continue':result})
  page.evaluate('''()=>{HonroApp.frame=()=>{};const cv=document.createElement('canvas');cv.width=innerWidth;cv.height=innerHeight;cv.style.cssText='display:block;width:100vw;height:100vh';document.body.replaceChildren(cv);window.reviewCanvas=cv}''')
  views=[('overview',5600,4200,.122,True),('quay',5050,5360,.55,False),('settled-ferry',6760,5790,.58,False)] if not mobile else [('quay',5120,5380,.48,False),('settled-ferry',6860,5730,.42,False)]
  for name,x,y,z,editor in views:
   row=page.evaluate('''v=>{const b=structuredClone(reviewInitial);if(v.name==='settled-ferry'){b.honroState.ferry={status:'settled',elapsed:.8,duration:.8,commitCount:1};for(const ts of [b.terrain,b.honroWorldTerrain])for(const t of ts){if(t.id==='sf-settled-barge')t.broken=false;if(t.id==='sf-outbank-screen')t.broken=true;}b.sceneVersion++;}const e=new HONRO_CORE.Engine(b,()=>{},true),s=new HonroScene(reviewCanvas);Object.assign(s,{x:v.x,y:v.y,scale:v.z,manual:true,time:2,editorView:v.editor,skillPreview:v.editor});window.reviewScene={s,e};s.render(e,0,'',.6,false,0);return{phase:b.phase,units:b.units.length,fixture:v.name==='settled-ferry'?'settled event pose; original actors':'original entry battle; inspection camera'}}''',dict(name=name,x=x,y=y,z=z,editor=editor));page.wait_for_timeout(200);page.evaluate("reviewScene.s.render(reviewScene.e,0,'',.6,false,0)");page.screenshot(path=str(OUT/f'{prefix}-{name}.png'));rows.append({'file':f'{prefix}-{name}.png',**row})
  ctx.close()
 browser.close()
(OUT/'browser-results.json').write_text(json.dumps({'rows':rows,'errors':errors,'limits':['Isolated fresh profiles only. Entry HUD is actual App launch.','Overview is editor camera; quay and ferry are production renderer camera fixtures.','Settled art fixture is not normal completion. Normal-resource proof is the separate native fullplay trace.']},ensure_ascii=False,indent=2))
assert not errors,errors
assert all(r['continue']['retained'] for r in rows if 'continue' in r),rows
print('PASS isolated desktop/mobile launch, serialized Continue and actual browser production renderer captures')
