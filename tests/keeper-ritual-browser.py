"""Prepared production18 art/ritual fixtures. Native Canvas/DOM, not a normal fullplay."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/keeper-ritual/browser';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw,serve_game() as url:
 browser=launch(pw);page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(url+'/HONRO.html');page.wait_for_function('window.HonroApp');page.locator('.title-actions button').first.click()
 page.evaluate('''()=>{const a=HonroApp;a.close();a.stopBattle();const p=HONRO_TOOLS.fresh();for(let i=1;i<18;i++)p.cleared[i]={visits:1,rounds:5};p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];p.settings.sound=p.settings.music=false;for(const c of p.party)p.heroes[c].xp=HONRO_CORE.xpAtLevel(13);a.profile=a.normalProfile=p;a.launch(18);}''');page.wait_for_function('HonroApp.engine?.b.honroStage===18',timeout=45000)
 result=page.evaluate('''()=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);a.close();a.turnNotice=null;a.frame=()=>{};a.cancelInput();const e=a.engine,b=e.b,k=e.unit('act2-keeper');window.keeperCheck={k:{x:k.x,y:k.y,hp:k.hp},scope:'Prepared production18 fixture; actual renderer/cast, not fullplay'};a.scene.storyTween=a.scene.goalFocus=a.scene.cinematic=null;a.scene.focusId=null;a.scene.focusUntil=a.scene.speakerUntil=0;a.scene.x=k.x-190;a.scene.y=k.y-150;a.scene.scale=1.35;a.scene.manual=true;document.querySelector('#turn-banner').hidden=true;a.updateHUD(true);a.scene.render(e,0,a.selected,a.power,false,0,true);return keeperCheck;}''')
 page.screenshot(path=str(OUT/'first-world.jpg'),type='jpeg',quality=88)
 # Same real enemy action and tick used by gameplay; fixture prepares a legal supported target and enemy queue.
 cast=page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,k=e.unit('act2-keeper'),u=e.unit('p-archer'),x=k.x-380,s=e.contactSurface(x,k.y-400,k.y+300);Object.assign(u,{x,y:s.y,vx:0,vy:0,acted:false});Object.assign(b,{active:k.id,queue:[k.id],side:1,phase:'enemy'});b.keeperRitual.next=1;k.lastAct=b.round;e.enemyAction();for(let i=0;i<20;i++)e.tick(HONRO_CORE.STEP);a.scene.render(e,0,a.selected,a.power,false,0,true);return {ritual:b.keeperRitual,valid:HONRO_CORE.validTerrainContactPose(b.terrain,u)};}''')
 page.screenshot(path=str(OUT/'first-cast.jpg'),type='jpeg',quality=88)
 # Actual unified portrait resolver + normal story DOM. Text is exact approved source.
 page.evaluate('''()=>{const a=HonroApp,k=a.engine.unit('act2-keeper');HonroStory.start(a,HonroNarrativeCatalogue.data.stages[18].story.filter(l=>l[0]==='종지기'),{title:'묵종',index:0});a.scene.storyTween=null;a.scene.x=k.x-190;a.scene.y=k.y-150;a.scene.scale=1.1;a.scene.manual=true;a.scene.render(a.engine,0,a.selected,a.power,false,0,true);}''')
 page.wait_for_timeout(800);page.screenshot(path=str(OUT/'first-portrait.jpg'),type='jpeg',quality=88)
 (OUT/'first-summary.json').write_text(json.dumps({'setup':result,'cast':cast,'errors':errors},ensure_ascii=False,indent=2));assert not errors,errors;browser.close()
print(OUT)
