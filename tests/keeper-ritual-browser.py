"""Prepared production18 art/ritual fixtures. Native Canvas/DOM, not a normal fullplay."""
import json,os
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
# Actual R10 normal-input save; no won/HP/quest/reward injection.
terminal=json.loads((ROOT/(os.environ.get('HONRO_KEEPER_FULLPLAY','_local/reports/keeper-ritual/fullplay')+'/terminal-checkpoint.json')).read_text())['profile']
with sync_playwright() as pw,serve_game() as url:
 browser=launch(pw);p=browser.new_page(viewport={'width':1440,'height':900});errs=[];p.on('pageerror',lambda e:errs.append(str(e)))
 p.goto(url+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('profile=>{const a=HonroApp;a.frame=()=>{};a.profile=a.normalProfile=profile;a.continue();}',terminal);p.wait_for_function('HonroApp.engine?.b.honroStage===18',timeout=45000)
 before=p.evaluate('()=>JSON.parse(JSON.stringify(HonroApp.engine.b))');assert before==terminal['honroBattle'],'Actual R10 browser Continue whole battle exact'
 p.evaluate('()=>{const a=HonroApp;a.outcome();a.scene.render(a.engine,0,a.selected,a.power,false,0,true);}')
 poses=[];captured=set()
 for _ in range(50):
  row=p.evaluate('''()=>{const a=HonroApp,d=a.dialogue;return {dialogue:!!d,row:d?.lines[d.index]?.[2]?.rowId,pose:a.engine.b.honroState.keeperStaging?.pose,done:a.done,index:d?.index};}''');poses.append(row)
  if not row['dialogue']:break
  if row.get('row')=='18.beats.keeper:49ba953239':assert row['pose']=='weak';p.wait_for_timeout(500);p.screenshot(path=str(OUT/'actual-last-command.jpg'),type='jpeg',quality=88);captured.add('command')
  if row.get('row','').startswith('18.outro:') and 'outro' not in captured:
   assert row['pose']=='bound';p.evaluate('()=>{const a=HonroApp;a.scene.render(a.engine,0,a.selected,a.power,false,0,true);}');p.wait_for_timeout(500);p.screenshot(path=str(OUT/'actual-bound-outro.jpg'),type='jpeg',quality=88);captured.add('outro')
  p.locator('[data-action="dialogue-next"]').click();p.evaluate('()=>{const a=HonroApp;a.scene.render(a.engine,0,a.selected,a.power,false,0,true);}')
 assert p.evaluate('HonroApp.done && HonroApp.profile.cleared[18].visits===1')
 p.screenshot(path=str(OUT/'actual-result.jpg'),type='jpeg',quality=88)
 growth=p.evaluate('JSON.stringify(HonroApp.profile.heroes)');p.evaluate('HonroApp.outcome()');assert p.evaluate('HonroApp.profile.cleared[18].visits')==1
 p.locator('[data-action="result-continue"]').click()
 p.wait_for_timeout(250)
 if p.evaluate('HonroApp.screen')=='rest':p.locator('[data-action="journey-enter"][data-id="19"]').click()
 p.wait_for_function('HonroApp.engine?.b.honroStage===19',timeout=45000)
 for _ in range(40):
  if not p.locator('[data-action="dialogue-next"]:visible').count():break
  p.locator('[data-action="dialogue-next"]').click()
 assert p.evaluate('JSON.stringify(HonroApp.profile.heroes)')==growth
 assert p.evaluate('HonroApp.engine.b.round')==1
 p.screenshot(path=str(OUT/'actual-stage19.jpg'),type='jpeg',quality=88)
 assert not errs,errs
 (OUT/'actual-result-summary.json').write_text(json.dumps({'wholeBattleContinueExact':True,'poses':poses,'captured':list(captured),'rewardOnce':True,'stage19':True,'growthExact':True,'errors':errs,'scope':'Actual R10 saved normal-input result; normal story next/result-continue. No19 combat.'},ensure_ascii=False,indent=2));browser.close()
