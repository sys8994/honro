"""Actual desktop/mobile HTML scene with controlled late-stage poses.
No normal combat completion or performance acceptance is claimed here.
"""
import json
import os
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT = ROOT / '_local/reports/act3-void-browser'
OUT.mkdir(parents=True, exist_ok=True)
SETUP = r'''() => {
 const app=HonroApp;app.close();app.stopBattle();app.debugMode=false;
 const p=HONRO_TOOLS.fresh();for(let i=1;i<=26;i++)p.cleared[i]={visits:1,rounds:5};
 p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];p.settings.sound=false;p.settings.music=true;p.settings.musicVolume=.2;
 for(const c of p.recruited)p.heroes[c].xp=HONRO_CORE.xpAtLevel(20);
 app.profile=p;app.normalProfile=p;app.audio.configure(p.settings);app.launch(27);
 while(app.dialogue)HonroStory.finish(app);app.turnNotice=null;app.close();
 const e=app.engine,b=e.b,z=b.honroMap.act3.crossings.at(-1).landing,x=(z.left+z.right)/2;
 for(const u of b.units.filter(u=>u.side===1)){u.dead=true;u.hp=0;}
 for(const [i,u]of b.units.filter(u=>u.side===0&&!u.summoned).entries())Object.assign(u,{x:x-60+i*120,y:z.y,vx:0,vy:0,airborne:false,jumping:false,acted:false});
 b.phase='aim';b.side=0;b.projectiles=[];b.volley=undefined;b.active=b.units.find(u=>u.side===0&&u.cls==='mage').id;
 // Keep the deliberate approach idle until the test takes its baseline.
 b.honroAct3Void.recovered=true;
 // This controlled pose starts after entry-camera release. Do not retain an
 // entrance tween while teleporting the fixture to the actual deep gallery.
 Object.assign(app.scene,{x,y:z.y-160,scale:.9,manual:true,storyTween:null,goalFocus:null,cinematic:null,focusId:null,speakerId:null,focusUntil:0,speakerUntil:0});
 app.lastTurnNotice=`${b.round}:player`;app.turnNotice=null;const banner=document.getElementById('turn-banner');if(banner)banner.hidden=true;
 app.updateHUD(true);app.scene.render(e,0,app.selected,app.power,false,0,true);app.updateAudio();
 window.voidBefore={units:structuredClone(b.units),items:structuredClone(b.items),teamEnds:structuredClone(b.teamEnds),active:b.active,round:b.round,phase:b.phase};
 return {revision:b.honroAct3Void.revision,roster:b.units.filter(u=>u.side===0&&!u.summoned).map(u=>u.cls)};
}'''
BEGIN = r'''()=>{const a=HonroApp;window.voidMusic=a.audio.music.current;window.voidMusicTime=voidMusic?.currentTime||0;const b=a.engine.b;window.voidBefore={units:structuredClone(b.units),items:structuredClone(b.items),teamEnds:structuredClone(b.teamEnds),active:b.active,round:b.round,phase:b.phase,camera:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale,manual:a.scene.manual}};return HonroAct3Void.begin(a)}'''
checks=[]
errors=[]
RETURN_ONLY=os.environ.get('HONRO_VOID_RETURN_ONLY')=='1'

with sync_playwright() as p:
 browser=launch(p)
 for mobile in [False,True]:
  context=browser.new_context(viewport={'width':390,'height':844} if mobile else {'width':1440,'height':900},is_mobile=mobile,has_touch=mobile)
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(os.environ.get('HONRO_BASE_URL','http://127.0.0.1:8765').rstrip('/')+'/HONRO.html');page.wait_for_function('window.HonroApp')
  # Real user activation unlocks the same BGM stream used during the scene.
  page.locator('.title-actions button').first.click()
  setup=page.evaluate(SETUP);assert setup['revision']==1 and setup['roster']==['archer','mage'],setup
  page.wait_for_function('HonroApp.audio.music.current?.readyState>=2')
  page.wait_for_timeout(250)
  assert page.evaluate(BEGIN)
  if RETURN_ONLY:
   page.evaluate('HonroAct3Void.skip(HonroApp)');page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="RESOLVED" && !!HonroApp.dialogue')
   result=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;return {units:JSON.stringify(b.units)===JSON.stringify(voidBefore.units),camera:JSON.stringify(a.storyCamera)===JSON.stringify(voidBefore.camera),id:a.dialogue.lines[0][2].storyId,who:a.dialogue.lines[0][0],saved:a.profile.honroBattle.honroAct3Void.state,savedDialogue:a.profile.honroBattle.honroStory.lines[0][2].storyId}}''')
   assert result=={'units':True,'camera':True,'id':'act3-void-v1-return','who':'담허','saved':'RESOLVED','savedDialogue':'act3-void-v1-return'},result
   page.wait_for_timeout(650);page.screenshot(path=str(OUT/('mobile-return.png' if mobile else 'desktop-return.png')))
   page.locator('[data-action="dialogue-skip"]').click();page.wait_for_timeout(550)
   assert page.evaluate('!HonroApp.dialogue && !HonroApp.root.inert && HonroApp.engine.b.units.filter(u=>u.side===0&&!u.summoned).every(u=>HonroApp.engine.grounded(u))')
   page.screenshot(path=str(OUT/('mobile-resumed.png' if mobile else 'desktop-resumed.png')))
   checks.append({'viewport':'mobile' if mobile else 'desktop','checks':['immediate normal aftermath dialogue','exact restored positions and pre-dialogue camera','resolved safe battle and dialogue saved together','normal skip returns to grounded world']});print('PASS',checks[-1],flush=True);context.close();continue
  page.wait_for_timeout(350)
  falling=page.evaluate('({state:HonroApp.engine.b.honroAct3Void.state,visual:HonroAct3Void.visual(HonroApp.engine.b)})')
  assert falling['state']=='FALLING' and 0<falling['visual']['progress']<1,falling
  assert not page.locator('#turn-banner').is_visible()
  page.screenshot(path=str(OUT/('mobile-falling.png' if mobile else 'desktop-falling.png')))
  page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="VOID"')
  assert page.evaluate('HonroApp.audio.music.paused && HonroApp.audio.music.current===voidMusic && voidMusic.paused')
  assert page.evaluate('document.getElementById("app").inert && !document.getElementById("modal").inert')
  assert page.locator('.honro-void-text').inner_text()=='……여긴 어디지.'
  assert page.locator('.honro-void-actor').is_visible()
  assert not page.locator('.battle-head').is_visible()
  assert page.evaluate('HonroApp.canInput()') is False
  before=page.evaluate('JSON.stringify({units:HonroApp.engine.b.units,items:HonroApp.engine.b.items,round:HonroApp.engine.b.round,ends:HonroApp.engine.b.teamEnds})')
  page.wait_for_timeout(500)
  assert before==page.evaluate('JSON.stringify({units:HonroApp.engine.b.units,items:HonroApp.engine.b.items,round:HonroApp.engine.b.round,ends:HonroApp.engine.b.teamEnds})')
  page.screenshot(path=str(OUT/('mobile-void.png' if mobile else 'desktop-void.png')))
  # Actual Tab exposes focus-only controls; an ordinary scene has no buttons.
  page.keyboard.press('Tab');page.keyboard.press('Tab')
  assert page.evaluate('document.activeElement.classList.contains("honro-void-pause")')
  page.keyboard.press('Escape');assert page.locator('#modal.open').is_visible()
  page.locator('[data-action="settings"]').click();assert page.locator('#setting-music').is_enabled()
  page.locator('#setting-music').uncheck();page.locator('#modal [data-action="close"]').click()
  assert page.evaluate('HonroApp.profile.settings.music') is False
  # Rotation changes only the overlay surface, never the saved return point.
  if mobile:
   page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(150)
   page.screenshot(path=str(OUT/'mobile-landscape-void.png'))
   page.set_viewport_size({'width':390,'height':844})
   page.locator('.honro-void-surface').tap();page.wait_for_timeout(100)
   # A second immediate tap is debounced by the silent line's minimum hold.
   line=page.evaluate('HonroApp.honroVoidSession.line');page.locator('.honro-void-surface').tap();assert page.evaluate('HonroApp.honroVoidSession.line')==line
   page.locator('.honro-void-surface').dispatch_event('pointerdown',{'pointerId':4,'pointerType':'touch'})
   page.wait_for_function('HonroApp.modal.classList.contains("open")')
  else:
   page.keyboard.press('Space');line=page.evaluate('HonroApp.honroVoidSession.line');page.keyboard.press('Space');assert page.evaluate('HonroApp.honroVoidSession.line')==line
   page.keyboard.press('Escape')
  page.locator('[data-action="void-skip"]').click();page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="RESOLVED"')
  result=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;return {units:JSON.stringify(b.units)===JSON.stringify(voidBefore.units),active:b.active===voidBefore.active,round:b.round===voidBefore.round,ends:JSON.stringify(b.teamEnds)===JSON.stringify(voidBefore.teamEnds),music:a.profile.settings.music,stream:a.audio.music.current===voidMusic,time:a.audio.music.current?.currentTime,beforeTime:voidMusicTime,inert:a.root.inert,overlay:!!document.querySelector('.honro-void-scene'),witness:a.profile.honroStoryEvents['act3-void-v1']}}''')
  assert result['units'] and result['active'] and result['round'] and result['ends'],result
  assert result['music'] is False and result['stream'] and result['time']>=result['beforeTime'],result
  assert not result['inert'] and not result['overlay'] and result['witness'],result
  # Let the real return dialogue frame the restored actors before taking the
  # evidence image, then let its normal camera-release finish on the gallery.
  page.wait_for_timeout(600)
  page.screenshot(path=str(OUT/('mobile-return.png' if mobile else 'desktop-return.png')))
  page.evaluate('while(HonroApp.dialogue)HonroStory.finish(HonroApp)')
  page.wait_for_timeout(550)
  assert page.evaluate('HonroApp.engine.b.units.filter(u=>u.side===0&&!u.summoned).every(u=>HonroApp.engine.grounded(u))')
  page.screenshot(path=str(OUT/('mobile-resumed.png' if mobile else 'desktop-resumed.png')))
  checks.append({'viewport':'mobile' if mobile else 'desktop','checks':['actual temporary solo fall','no simulation clocks','nameless text and existing rig','real keyboard/touch and rapid input','accessible pause/settings/focus','rotation' if mobile else 'desktop focus','same BGM stream and user mute preserved','exact safe return']})
  # Reload during the real scene uses saved pre-fall safety and does not resume
  # the overlay until the player makes another deliberate movement.
  page.evaluate(SETUP);assert page.evaluate(BEGIN);page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="VOID"')
  page.reload();page.wait_for_function('window.HonroApp');page.locator('[data-action="continue"]').click();page.wait_for_timeout(150)
  reloaded=page.evaluate('({phase:HonroApp.engine.b.honroAct3Void.state,recovered:HonroApp.engine.b.honroAct3Void.recovered,overlay:!!document.querySelector(".honro-void-scene"),grounded:HonroApp.engine.grounded(HonroApp.engine.b.units.find(u=>u.side===0&&u.cls==="archer"))})')
  assert reloaded=={'phase':'READY','recovered':True,'overlay':False,'grounded':True},reloaded
  checks[-1]['checks'].append('actual browser reload to READY safe world')
  print('PASS',checks[-1],flush=True);context.close()
 if not RETURN_ONLY:
  # The editor Playtest uses the same film and fresh-map opt-in in its real iframe.
  context=browser.new_context(viewport={'width':1440,'height':900});owner=context.new_page();owner.on('pageerror',lambda e:errors.append(str(e)))
  owner.goto(os.environ.get('HONRO_BASE_URL','http://127.0.0.1:8765').rstrip('/')+'/HONRO_WORKSHOP.html');owner.click('[data-tab="play"]');owner.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
  frame=owner.frames[1];assert frame.evaluate(SETUP)['revision']==1;assert frame.evaluate(BEGIN)
  frame.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="VOID"');frame.locator('.honro-void-scene').screenshot(path=str(OUT/'workshop-void.png'))
  assert frame.locator('.honro-void-text').inner_text()=='……여긴 어디지.';assert not frame.locator('.battle-head').is_visible()
  frame.evaluate('HonroAct3Void.skip(HonroApp)');frame.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="RESOLVED"');assert not frame.evaluate('HonroApp.root.inert')
  checks.append({'host':'Workshop Playtest iframe','checks':['same authored revision','real solo void overlay','shared quiet return and HUD restoration']});print('PASS',checks[-1],flush=True);context.close()
 browser.close()
assert not errors,errors
(OUT/('return-summary.json' if RETURN_ONLY else 'summary.json')).write_text(json.dumps({'status':'passed','checks':checks,'errors':errors,'limits':['Late-stage safe pose fixtures, not normal combat completion.','No performance benchmark.','Workshop Stage View itself is not an interactive story host; Playtest iframe is covered.']},ensure_ascii=False,indent=2))
