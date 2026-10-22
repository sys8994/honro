"""Focused Chromium checks using actual built HTML and controlled late-stage poses.
HONRO_VOID_REVIEW=input|layout|state|final selects focused or combined review.
This is not normal chapter completion, real mobile hardware or performance proof.
"""
import json
import os
import subprocess
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
from story_browser_server import story_base_url

REVIEW = os.environ.get('HONRO_VOID_REVIEW', 'final')
OUT = ROOT / 'game/docs/act3-void-dialogue-pacing/evidence' / REVIEW
OUT.mkdir(parents=True, exist_ok=True)
BASE = story_base_url()
SETUP = r'''async () => {
 await HonroCampaignLoader?.ensureStage(27);
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
GEOMETRY = r"""() => {
 const session=HonroApp.honroVoidSession,cv=session.canvas,c=cv.getContext('2d'),pixels=c.getImageData(0,0,cv.width,cv.height).data;
 let left=cv.width,top=cv.height,right=0,bottom=0,count=0;
 for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++)if(pixels[(y*cv.width+x)*4+3]){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);count++;}
 const dpr=cv.width/innerWidth,actor={left:left/dpr,top:top/dpr,right:right/dpr,bottom:bottom/dpr,count};
 const rect=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height});
 const range=document.createRange();range.selectNodeContents(session.text);const glyphs=[...range.getClientRects()].map(rect),text=rect(session.text.getBoundingClientRect());
 const overlap=r=>Math.max(0,Math.min(r.right,actor.right)-Math.max(r.left,actor.left))*Math.max(0,Math.min(r.bottom,actor.bottom)-Math.max(r.top,actor.top));
 return {line:session.line,text:session.text.textContent,align:session.text.dataset.align,actor,textBox:text,glyphs,textBoxOverlap:overlap(text),glyphOverlap:glyphs.reduce((n,r)=>n+overlap(r),0),reservedActor:session.actorBounds,
 buttons:[...session.host.querySelectorAll('.honro-void-access')].map(b=>({text:b.textContent,...rect(b.getBoundingClientRect()),visible:getComputedStyle(b).opacity==='1' && getComputedStyle(b).pointerEvents==='auto'}))};
}"""

def record(name,detail=None):
 checks.append({'name':name,'detail':detail})
 print('PASS',name,flush=True)

def shot(page,name):
 page.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=78)
 assert (OUT/(name+'.jpg')).stat().st_size<1_000_000

def fresh(page):
 result=page.evaluate(SETUP)
 assert result=={'revision':1,'roster':['archer','mage']},result
 page.wait_for_function('HonroApp.audio.music.current?.readyState>=2')
 assert page.evaluate(BEGIN)

def void(page):
 page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="VOID"')

def settled(page):
 page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="RESOLVED" && !!HonroApp.dialogue')
 result=page.evaluate(r"""()=>{const a=HonroApp,b=a.engine.b;return {
 units:JSON.stringify(b.units)===JSON.stringify(voidBefore.units),active:b.active===voidBefore.active,round:b.round===voidBefore.round,ends:JSON.stringify(b.teamEnds)===JSON.stringify(voidBefore.teamEnds),items:JSON.stringify(b.items)===JSON.stringify(voidBefore.items),camera:JSON.stringify(a.storyCamera)===JSON.stringify(voidBefore.camera),
 stream:a.audio.music.current===voidMusic,overlay:!!document.querySelector('.honro-void-scene'),inert:a.root.inert,witness:a.profile.honroStoryEvents['act3-void-v1'],saved:a.profile.honroBattle.honroAct3Void.state,savedDialogue:a.profile.honroBattle.honroStory.lines[0][2].storyId,lines:a.dialogue.lines.map(r=>r.slice(0,2))};}""")
 assert all(result[k] for k in ['units','active','round','ends','items','camera','stream','witness']),result
 assert not result['overlay'] and not result['inert'],result
 assert result['saved']=='RESOLVED' and result['savedDialogue']=='act3-void-v1-return',result
 assert len(result['lines'])==3,result
 return result

with sync_playwright() as p:
 browser=launch(p)
 if REVIEW in ['layout','final']:
  context=browser.new_context(viewport={'width':360,'height':800},is_mobile=True,has_touch=True,device_scale_factor=2)
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+'/HONRO.html');page.wait_for_function('window.HonroApp');page.locator('.title-actions button').first.click()
  metrics=[]
  for width,height in [(360,800),(390,844),(844,390),(1440,900)]:
   page.set_viewport_size({'width':width,'height':height});fresh(page);void(page)
   assert page.evaluate('HonroApp.audio.music.paused && voidMusic.paused && HonroApp.root.inert && !HonroApp.canInput()')
   for line in range(5):
    page.wait_for_function(f'HonroApp.honroVoidSession?.line==={line}')
    page.wait_for_timeout(150)
    m=page.evaluate(GEOMETRY);m['viewport']=[width,height]
    assert m['actor']['count']>100,m
    assert m['glyphOverlap']==0 and m['textBoxOverlap']==0,m
    assert m['textBox']['left']>=20 and m['textBox']['right']<=width-20,m
    assert m['textBox']['top']>=64 and m['textBox']['bottom']<=height-40,m
    assert all(b['visible'] and b['height']>=44 and b['width']>=44 for b in m['buttons']),m
    if m['align']=='far':assert m['textBox']['bottom']+27<=m['actor']['top'],m
    else:assert m['actor']['bottom']+27<=m['textBox']['top'],m
    shot(page,f'{width}x{height}-cut{line+1}');metrics.append(m)
    page.locator('.honro-void-surface').tap()
   settled(page)
   page.evaluate('while(HonroApp.dialogue)HonroStory.finish(HonroApp)')
  # Rotate on the long fourth cut, then return without changing saved pose.
  fresh(page);void(page)
  for _ in range(3):page.keyboard.press('Space');page.wait_for_timeout(160)
  saved=page.evaluate('JSON.stringify(HonroApp.engine.b.honroAct3Void.return)')
  for width,height in [(390,844),(844,390),(360,800)]:
   page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(180);m=page.evaluate(GEOMETRY)
   assert m['line']==3 and m['glyphOverlap']==0 and m['textBoxOverlap']==0,m
   assert page.evaluate('JSON.stringify(HonroApp.engine.b.honroAct3Void.return)')==saved
  page.locator('.honro-void-skip').tap();settled(page)
  record('all five cuts: real alpha-pixel actor versus text bounds at four viewports, plus long-cut rotation',metrics)
  context.close()
 if REVIEW in ['input','final']:
  for mobile in [False,True]:
   context=browser.new_context(viewport={'width':390,'height':844} if mobile else {'width':1440,'height':900},is_mobile=mobile,has_touch=mobile)
   page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(BASE+'/HONRO.html');page.wait_for_function('window.HonroApp');page.locator('.title-actions button').first.click()
   fresh(page)
   assert page.locator('.honro-void-skip').is_visible()
   assert page.locator('.honro-void-skip').bounding_box()['height']>=44
   page.evaluate('window.entryStart=performance.now()')
   void(page)
   elapsed=page.evaluate('performance.now()-entryStart')
   assert elapsed<1900,elapsed
   assert page.locator('.honro-void-text:not(.honro-void-measure)').inner_text()=='여긴…… 누구십니까?'
   shot(page,('mobile' if mobile else 'desktop')+'-immediate-line')
   # One genuine touch produces pointer events and a compatibility click, one cut.
   if mobile:page.locator('.honro-void-surface').tap()
   else:page.locator('.honro-void-surface').click()
   assert page.evaluate('HonroApp.honroVoidSession.line')==1
   page.wait_for_timeout(160)
   if mobile:
    # Repeated synthetic click in the same gesture cannot race through cuts.
    page.evaluate("""()=>{const b=document.querySelector('.honro-void-surface');for(let i=0;i<100;i++)b.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1}));}""")
   else:page.locator('.honro-void-surface').dblclick()
   assert page.evaluate('HonroApp.honroVoidSession.line')==2
   page.wait_for_timeout(160)
   page.keyboard.down('Space');page.keyboard.down('Space');page.keyboard.down('Space');page.keyboard.up('Space')
   assert page.evaluate('HonroApp.honroVoidSession.line')==3
   page.wait_for_timeout(160);page.keyboard.press('Enter');assert page.evaluate('HonroApp.honroVoidSession.line')==4
   # Visible button must not leak to the surface; pause and settings freeze time.
   page.locator('.honro-void-pause').click()
   age=page.evaluate('HonroApp.honroVoidSession.elapsed');page.wait_for_timeout(200)
   assert page.evaluate('HonroApp.honroVoidSession.line')==4
   assert page.evaluate('HonroApp.honroVoidSession.elapsed')==age
   page.locator('[data-action="settings"]').click();page.locator('[data-action="settings-page"][data-id="sound"]').click()
   page.locator('#setting-music').uncheck();page.locator('#modal [data-action="close"]').first.click()
   assert page.evaluate('HonroApp.profile.settings.music') is False
   # Settings X returns to pause; Escape/close reaches scene safely.
   if page.locator('#modal.open').count():page.locator('#modal [data-action="close"]').first.click()
   page.locator('.honro-void-surface').focus();page.keyboard.press('Tab');assert page.evaluate('document.activeElement.classList.contains("honro-void-pause")')
   page.keyboard.press('Tab');assert page.evaluate('document.activeElement.classList.contains("honro-void-skip")')
   page.keyboard.press('Tab');assert page.evaluate('document.activeElement.classList.contains("honro-void-surface")')
   page.keyboard.press('Shift+Tab');assert page.evaluate('document.activeElement.classList.contains("honro-void-skip")')
   # Long press no longer required; focus loss/reentry leaves the cut intact.
   page.evaluate('window.dispatchEvent(new Event("blur"))');page.wait_for_timeout(150);page.evaluate('window.dispatchEvent(new Event("focus"))')
   assert page.evaluate('HonroApp.honroVoidSession.line')==4
   page.keyboard.press('Enter');result=settled(page)
   shot(page,('mobile' if mobile else 'desktop')+'-return')
   page.locator('[data-action="dialogue-skip"]').click();page.wait_for_timeout(550)
   assert page.evaluate('!HonroApp.dialogue && HonroApp.canInput() && !HonroApp.root.inert && HonroApp.engine.b.units.filter(u=>u.side===0&&!u.summoned).every(u=>HonroApp.engine.grounded(u))')
   shot(page,('mobile' if mobile else 'desktop')+'-resumed')
   record(('mobile' if mobile else 'desktop')+' real taps/compatibility click, double input, key repeats, Enter/Space, pause/settings/focus cycle and safe skip',{'entryObservedMs':elapsed,'return':result})
   context.close()
 if REVIEW in ['state','final']:
  context=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+'/HONRO.html');page.wait_for_function('window.HonroApp');page.locator('.title-actions button').first.click()
  for phase in ['FALLING','DARKENING','VOID','RETURNING']:
   fresh(page)
   if phase=='DARKENING':page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="DARKENING"')
   if phase in ['VOID','RETURNING']:void(page)
   if phase=='RETURNING':page.locator('.honro-void-skip').tap()
   # Persist an actual in-flight snapshot and restore through actual Continue.
   page.evaluate('HonroApp.profile.honroBattle=structuredClone(HonroApp.engine.b);HonroApp.persist()')
   assert page.evaluate('HonroApp.profile.honroBattle.honroAct3Void.state')==phase
   page.reload();page.wait_for_function('window.HonroApp');page.locator('[data-action="continue"]').click();page.wait_for_timeout(100)
   resumed=page.evaluate('({phase:HonroApp.engine.b.honroAct3Void.state,recovered:HonroApp.engine.b.honroAct3Void.recovered,overlay:!!document.querySelector(".honro-void-scene"),grounded:HonroApp.engine.grounded(HonroApp.engine.b.units.find(u=>u.side===0&&u.cls==="archer")),witness:!!HonroApp.profile.honroStoryEvents?.["act3-void-v1"]})')
   assert resumed=={'phase':'READY','recovered':True,'overlay':False,'grounded':True,'witness':False},resumed
   record('actual reload during '+phase+' restores READY and safe pose',resumed)
  for phase in ['FALLING','DARKENING','VOID']:
   fresh(page)
   if phase=='DARKENING':page.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="DARKENING"')
   if phase=='VOID':void(page)
   page.locator('.honro-void-skip').tap()
   repeated=page.evaluate('Array.from({length:100},()=>HonroAct3Void.skip(HonroApp))')
   assert not any(repeated)
   result=settled(page)
   # RESOLVED + return dialogue are one recoverable story boundary.
   page.reload();page.wait_for_function('window.HonroApp');page.locator('[data-action="continue"]').click()
   assert page.evaluate('HonroApp.engine.b.honroAct3Void.state==="RESOLVED" && HonroApp.dialogue.lines.length===3 && !HonroApp.root.inert')
   page.wait_for_timeout(300);shot(page,'skip-'+phase.lower()+'-reloaded-return')
   record('visible skip during '+phase+', 100 repeated skips, completion and aftermath reload',result)
  fresh(page);void(page)
  # Exercise document.hidden with a real browser hidden getter override and
  # production frame callbacks; this is not an OS background lifecycle claim.
  page.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"))')
  before=page.evaluate('({elapsed:HonroApp.honroVoidSession.elapsed,units:JSON.stringify(HonroApp.engine.b.units)})');page.wait_for_timeout(300)
  assert page.evaluate('({elapsed:HonroApp.honroVoidSession.elapsed,units:JSON.stringify(HonroApp.engine.b.units)})')==before
  page.evaluate('delete document.hidden;document.dispatchEvent(new Event("visibilitychange"))')
  assert page.locator('#modal.open').is_visible()
  page.locator('#modal [data-action="close"]').first.click()
  page.locator('.honro-void-skip').tap();settled(page)
  record('hidden-document production frame freeze (controlled document.hidden, no OS lifecycle claim)')
  context.close()
 if REVIEW=='final':
  context=browser.new_context(viewport={'width':1440,'height':900});owner=context.new_page();owner.on('pageerror',lambda e:errors.append(str(e)))
  owner.goto(BASE+'/HONRO_WORKSHOP.html');owner.click('[data-tab="play"]');owner.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
  frame=owner.frames[1];fresh(frame);void(frame)
  assert frame.locator('.honro-void-text:not(.honro-void-measure)').inner_text()=='여긴…… 누구십니까?'
  owner.screenshot(path=str(OUT/'workshop-void.jpg'),type='jpeg',quality=78)
  frame.locator('.honro-void-skip').click();settled(frame)
  record('Workshop Playtest actual iframe shares five-cut scene and safe return')
  context.close()
 browser.close()
assert not errors,errors
source=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
(OUT/'summary.json').write_text(json.dumps({'status':'passed','review':REVIEW,'sourceBase':source,'sourceDirty':subprocess.check_output(['git','diff','--stat'],cwd=ROOT,text=True),'checks':checks,'errors':errors,'limits':['Controlled late-stage safe poses; no normal full chapter/combat completion.','Chromium desktop and mobile emulation, no physical mobile device.','document.hidden override is a controlled visibility fixture.','No 30-chapter playthrough or performance benchmark.']},ensure_ascii=False,indent=2)+'\n')
