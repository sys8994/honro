"""View an actual native normal-input checkpoint in final published-source UI.
No combat replay or art change. Freeze frame scheduling, production Continue,
then render at a declared inspection camera without editing gameplay state.
"""
import json,sys,shutil,subprocess,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from story_browser_server import story_base_url
stageId=int(sys.argv[2]) if len(sys.argv)>2 else 16
nextStageId=stageId+1
path=ROOT/sys.argv[1];record=json.loads(path.read_text());profile=record['profile'];expected=profile['honroBattle'];out=ROOT/f'_local/reports/stage{stageId}-current-pacing-20261022/browser';out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=browser.new_page(viewport={'width':1180,'height':757});errors=[];http=[]
 p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',lambda r:http.append({'url':r.url,'status':r.status})if r.status>=400 else None)
 p.goto(story_base_url()+'/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=90000)
 p.evaluate('async id=>{await HonroCampaignLoader.ensureStage(id);HonroApp.frame=()=>{};}',stageId);p.wait_for_timeout(80)
 p.evaluate('profile=>{const a=HonroApp;a.debugMode=false;a.profile=profile;a.normalProfile=profile;a.continue();}',profile)
 p.wait_for_function('(id)=>HonroApp.engine?.b.honroStage===id',arg=stageId,timeout=90000)
 actual=json.loads(p.evaluate('JSON.stringify(HonroApp.engine.b)'));assert actual==expected,'Production browser Continue changed whole battle'
 p.wait_for_function('(id)=>HonroAuthoredFarArt.ready(id)',arg=stageId,timeout=90000)
 info=p.evaluate('''()=>{const a=HonroApp,b=a.engine.b,goal=HonroAct2.current(b),m=b.honroMarkers.find(m=>m.id===goal?.id)||(b.honroStage===18?b.honroMarkers.find(m=>m.id==='clear-bell'):null),s=a.scene;a.close();a.updateHUD(true);Object.assign(s,{manual:true,x:m?.x||(b.honroStage===17?8530:5650),y:(m?.y||(b.honroStage===17?4580:4250))-100,scale:.4,goalFocus:null,cinematic:null,storyTween:null});s.render(a.engine,0,'',.6,false,0);return{round:b.round,phase:b.phase,goal:goal?.id,done:HonroAct2.memory(b).done,camera:[s.x,s.y,s.scale],heroes:b.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,dead:u.dead})),enemies:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).length}}''')
 p.screenshot(path=str(out/'actual-stop.jpg'),type='jpeg',quality=85);assert(out/'actual-stop.jpg').stat().st_size<1_000_000
 assert json.loads(p.evaluate('JSON.stringify(HonroApp.engine.b)'))==actual,'Inspection render changed gameplay'
 lifecycle=None
 if len(sys.argv)>3 and sys.argv[3]=='outcome':
  assert actual['phase']=='won'
  p.evaluate('HonroApp.outcome()')
  assert p.evaluate('!!HonroApp.dialogue'),'Ordinary outro must display'
  p.screenshot(path=str(out/'actual-outro.jpg'),type='jpeg',quality=85)
  dialogue=[]
  def finish_story():
   for _ in range(50):
    if not p.evaluate('!!HonroApp.dialogue'):return
    dialogue.append(p.evaluate('({title:HonroApp.dialogue.title,index:HonroApp.dialogue.index,line:HonroApp.dialogue.lines[HonroApp.dialogue.index]})'))
    p.locator('[data-action=dialogue-next]').click()
    p.wait_for_timeout(30)
   assert not p.evaluate('!!HonroApp.dialogue')
  finish_story()
  assert p.evaluate('id=>HonroApp.done&&HonroApp.profile.cleared[id].visits===1',stageId)
  p.screenshot(path=str(out/'actual-result.jpg'),type='jpeg',quality=85)
  settlement=p.evaluate('''id=>{const a=HonroApp,b=a.engine.b,k=b.units.find(u=>u.id==='act2-keeper'),step=HonroAct2.steps(b).find(s=>s.id==='clear-bell');return{clear:a.profile.cleared[id],heroes:Object.fromEntries(a.profile.recruited.map(c=>[c,{xp:a.profile.heroes[c].xp,level:HONRO_CORE.levelOf(a.profile.heroes[c]),ranks:a.profile.heroes[c].ranks,statTraining:a.profile.heroes[c].statTraining}])),report:b.honroReport?.final,keeper:k?{hp:k.hp,side:k.side,subdued:k.honroSubdued,dead:k.dead}:null,localThreats:step?HonroAct2.enemiesFor(b,step).map(u=>u.id):[],livingDistantEnemies:a.engine.alive(1).map(u=>u.id)}}''',stageId)
  if stageId==18:
   assert settlement['keeper']=={'hp':1,'side':2,'subdued':True,'dead':False}
   assert not settlement['localThreats']
  earned=p.evaluate('JSON.stringify(HonroApp.profile.heroes)')
  p.evaluate('HonroApp.outcome()')
  assert p.evaluate('id=>HonroApp.profile.cleared[id].visits===1',stageId)
  assert p.evaluate('JSON.stringify(HonroApp.profile.heroes)')==earned
  p.locator('[data-action=result-continue]').click();p.wait_for_timeout(350);finish_story()
  p.wait_for_function('id=>HonroApp.screen==="rest"||HonroApp.engine?.b.honroStage===id',arg=nextStageId)
  if p.evaluate('HonroApp.screen==="rest"'):
   p.locator(f'[data-action=journey-enter][data-id="{nextStageId}"]').click()
  p.wait_for_function('id=>HonroApp.engine?.b.honroStage===id',arg=nextStageId,timeout=90000);finish_story()
  assert p.evaluate('JSON.stringify(HonroApp.engine.b.heroes)')==earned
  p.wait_for_function('id=>HonroAuthoredFarArt.ready(id)',arg=nextStageId,timeout=90000)
  next_view=p.evaluate('''()=>{const a=HonroApp,b=a.engine.b;a.close();a.updateHUD(true);a.scene.render(a.engine,0,'',.6,false,0);return{stage:b.honroStage,round:b.round,phase:b.phase,goal:HonroAct2.current(b)?.id,heroes:b.units.filter(u=>u.side===0).map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,focus:u.focus,maxFocus:u.maxFocus,level:u.level}))}}''')
  p.screenshot(path=str(out/'actual-next-stage.jpg'),type='jpeg',quality=85)
  next_battle=p.evaluate('JSON.stringify(HonroApp.engine.b)')
  with p.expect_download() as download_info:p.evaluate('HonroApp.export()')
  exported=json.loads(Path(download_info.value.path()).read_text())
  p.evaluate('v=>{const a=HonroApp;a.profile=v;a.normalProfile=v;a.continue();}',exported)
  p.wait_for_function('id=>HonroApp.engine?.b.honroStage===id',arg=nextStageId)
  assert p.evaluate('JSON.stringify(HonroApp.engine.b)')==next_battle
  lifecycle={'ordinaryOutroDisplayed':True,'dialogue':dialogue,'settlement':settlement,'nextView':next_view,'rewardOnce':True,'nextStage':nextStageId,'nextStageArrived':True,'growthExact':True,'nextStageExportContinueWholeBattleExact':True,'scope':f'Actual stage{stageId} terminal save restored; no new combat replay.'}
 result={'checkedCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'input':str(path.relative_to(ROOT)),'inputSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'wholeBattleContinueExact':True,'renderPure':True,'lifecycle':lifecycle,'scope':__doc__,'view':info,'errors':errors,'httpFailures':http};(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');assert not errors,errors;assert not http,http;browser.close();print('PASS actual normal-input checkpoint browser Continue whole battle exact, render pure; errors0')
