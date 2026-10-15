"""Fresh profiles; real browser game rendering with authored inspection cameras.
No enemy removal, victory override or normal-combat completion claim.
"""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
OUT=ROOT/'review/stage27/browser';OUT.mkdir(parents=True,exist_ok=True)
BASE=story_base_url();errors=[];rows=[]
with sync_playwright() as p:
 browser=launch(p)
 for mobile in [False,True]:
  context=browser.new_context(viewport={'width':844,'height':390} if mobile else {'width':1440,'height':900},is_mobile=mobile,has_touch=mobile)
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+'/HONRO.html');page.wait_for_function('window.HonroApp')
  page.evaluate('''()=>{const a=HonroApp;a.close();a.stopBattle();const p=HONRO_TOOLS.fresh();for(let i=1;i<=26;i++)p.cleared[i]={visits:1,rounds:5};p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];p.settings.sound=false;p.settings.music=false;for(const c of p.recruited)p.heroes[c].xp=HONRO_CORE.xpAtLevel(20);a.profile=p;a.normalProfile=p;a.launch(27);while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;a.close();a.scene.storyTween=null;a.scene.goalFocus=null;a.scene.cinematic=null;a.lastTurnNotice=`${a.engine.b.round}:player`;document.getElementById('turn-banner').hidden=true;a.updateHUD(true);}''')
  for name,x,y,scale in [('entry',700,4430,.68),('loading',5400,4590,.68),('manifest',1900,2420,.68)]:
   page.evaluate('''([x,y,scale])=>{const a=HonroApp;Object.assign(a.scene,{x,y,scale,manual:true,storyTween:null,goalFocus:null,cinematic:null,focusId:null,speakerId:null,focusUntil:0,speakerUntil:0});a.scene.render(a.engine,0,a.selected,a.power,false,0,true);}''',[x,y,scale if not mobile else .48])
   page.wait_for_timeout(250)
   file=('mobile-' if mobile else 'desktop-')+name+'.png';page.screenshot(path=str(OUT/file))
   rows.append({'file':file,'mode':'real browser, authored inspection camera; unmodified enemy roster','state':page.evaluate('''()=>({stage:HonroApp.engine.b.honroStageId,units:HonroApp.engine.b.units.length,objectives:HonroApp.engine.b.honroState,camera:{x:HonroApp.scene.x,y:HonroApp.scene.y,scale:HonroApp.scene.scale}})''')})
  # Save/continue the actual new battle without replacing its terrain snapshot.
  result=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,terrain=JSON.stringify(b.terrain);a.profile.honroBattle=structuredClone(b);a.persist();return {saved:!!a.profile.honroBattle,terrainCount:b.terrain.length,terrain};}''')
  rows.append({'mobile':mobile,'save':{'saved':result['saved'],'terrainCount':result['terrainCount']}})
  context.close()
 browser.close()
assert not errors,errors
(OUT/'manifest.json').write_text(json.dumps({'scope':'Real game HTML; controlled camera and prepared fresh stage profile. No fullplay claim.','rows':rows,'errors':errors},ensure_ascii=False,indent=2))
print('PASS Stage27 fresh desktop/mobile browser captures and save, no JS errors')
