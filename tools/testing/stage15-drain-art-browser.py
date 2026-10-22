"""Final generated UI: prepared arrival -> production sluice/reveal -> real
downloaded export -> Continue twice. This is not normal combat arrival/fullplay.
Frame scheduling is paused for deterministic inspection; production story,
interaction, reveal, Engine ticks, export and Continue methods remain intact.
A read-only observer delegates the production transition unchanged and captures
its adjacent actor states; ordinary sluice/story effects are outside that scope.
"""
import json,sys,shutil,subprocess,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from story_browser_server import story_base_url
out=ROOT/'_local/reports/stage15-drain-art-release-20261022';out.mkdir(parents=True,exist_ok=True)
record=json.loads((out/'browser-input.json').read_text());rows=[];errors=[];http=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 p=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.on('response',lambda r:http.append({'url':r.url,'status':r.status})if r.status>=400 else None)
 p.goto(story_base_url()+'/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=90000)
 p.evaluate('async()=>{await HonroCampaignLoader.ensureStage(15);HonroApp.frame=()=>{};}');p.wait_for_timeout(80)
 p.evaluate('profile=>{const a=HonroApp;a.debugMode=false;a.profile=profile;a.normalProfile=profile;a.continue();}',record['profile'])
 p.wait_for_function('HonroApp.screen==="battle"&&HonroApp.engine?.b.honroStage===15',timeout=90000)
 def finish():
  for _ in range(30):
   if not p.evaluate('!!HonroApp.dialogue'):break
   skip=p.locator('[data-action=dialogue-skip]');nxt=p.locator('[data-action=dialogue-next]')
   if skip.count():skip.click()
   elif nxt.count():nxt.click()
   else:raise AssertionError('No dialogue UI control')
  assert not p.evaluate('!!HonroApp.dialogue')
 finish();p.evaluate('HonroApp.close()');p.wait_for_function('HonroAuthoredFarArt.ready(15)',timeout=90000)
 def snap(name):
  row=p.evaluate('''()=>{const a=HonroApp,b=a.engine.b,s=a.scene;Object.assign(s,{manual:true,x:6000,y:4470,scale:.65,goalFocus:null,cinematic:null,storyTween:null});a.updateHUD(true);s.render(a.engine,0,'',.6,false,0);return{round:b.round,phase:b.phase,goal:HonroAct2.current(b)?.id,objectiveText:document.querySelector('#objective-text')?.textContent,ledgeBroken:b.terrain.find(t=>t.id==='fc15-drained-ledge').broken,drain:HonroAct2.memory(b),actors:b.units.filter(u=>['a2-enemy-15','a2-enemy-17'].includes(u.id)).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,acted:u.acted,validContact:HONRO_CORE.validTerrainContactPose(b.terrain,u)}))}}''')
  p.screenshot(path=str(out/(name+'.jpg')),type='jpeg',quality=85);assert(out/(name+'.jpg')).stat().st_size<1_000_000
  rows.append({'file':name+'.jpg','camera':'Fixed production render at6000,4470,.65; frame scheduler paused',**row});return row
 before=snap('drain-before');assert before['ledgeBroken'] and not before['drain']['done'].get('sluice')
 p.evaluate('''()=>{const a=HonroApp,b=a.engine.b,m=b.honroMarkers.find(m=>m.id==='sluice');window.__beforeDrainActors=structuredClone(b.units);const original=HonroStage15Drain.transition;window.__restoreDrainObserver=()=>{HonroStage15Drain.transition=original;};HonroStage15Drain.transition=function(b){const before=structuredClone(b.units),result=original(b);if(result.ok&&result.activate)window.__observedDrain={before,after:structuredClone(b.units),result:structuredClone(result)};return result;};if(!HonroInteractions.use(a,m))throw Error('Production sluice refused');if(!HonroAct2.memory(b).drainRevealPending)throw Error('No pending reveal');HonroNarrativeRevision.tick(a,0);if(!b.terrain.find(t=>t.id==='fc15-drained-ledge').broken)throw Error('Dialogue/review did not postpone reveal');}''')
 finish();p.evaluate('HonroApp.close()')
 # Production story boundary scheduling; do not supply completion/geometry facts.
 for _ in range(180):
  finish()
  done=p.evaluate('''()=>{const a=HonroApp;HonroStory.turn(a);if(a.dialogue)return false;HonroStory.tick(a,performance.now()+10000);if(!HonroStory.turnPaused(a)){a.engine.tick(HONRO_CORE.STEP);a.missionTick(HONRO_CORE.STEP);}return !HonroAct2.memory(a.engine.b).drainRevealPending;}''')
  if done:break
 else:raise AssertionError('Production reveal did not complete within180 inspection ticks')
 finish();p.evaluate('HonroApp.close()');after=snap('drain-after')
 assert not after['ledgeBroken'] and all(a['validContact'] for a in after['actors'])
 verification=p.evaluate('''()=>{const b=HonroApp.engine.b,observed=window.__observedDrain;if(!observed)throw Error('No production transition observed');window.__restoreDrainObserver();const old=observed.before,moves=observed.result.moves,changed=new Set(moves.map(m=>m.id)),protectedActor=u=>{const v=structuredClone(u);for(const k of ['x','y','vx','vy','jumping','airborne'])delete v[k];return JSON.stringify(v);};for(const u of observed.after){const before=old.find(v=>v.id===u.id);if(changed.has(u.id)){if(protectedActor(u)!==protectedActor(before))throw Error('Resource/AI/action actor fields changed '+u.id);}else if(JSON.stringify(u)!==JSON.stringify(before))throw Error('Uninvolved actor changed '+u.id);}for(let i=0;i<20;i++)HonroApp.engine.tick(HONRO_CORE.STEP);for(const id of changed)if(!HONRO_CORE.validTerrainContactPose(b.terrain,b.units.find(u=>u.id===id)))throw Error('Contact invalid after20ticks');return{moves,all26ActorsRetained:b.units.length===26,protectedActorFieldsExact:true,observerScope:'Adjacent production transition call; wrapper delegates original unchanged, records copies only, then restores original function',ordinaryInteractionOrStoryChangedActors:b.units.filter(u=>JSON.stringify(u)!==JSON.stringify(window.__beforeDrainActors.find(v=>v.id===u.id))).map(u=>u.id),twentyTicksValid:true};}''')
 for n in range(2):
  with p.expect_download() as download:p.evaluate('HonroApp.export()')
  path=out/('actual-export-'+str(n+1)+'.json');download.value.save_as(str(path));exported=json.loads(path.read_text())
  expected=p.evaluate('HonroApp.engine.b');assert exported['honroBattle']==expected
  p.evaluate('profile=>{const a=HonroApp;a.profile=profile;a.normalProfile=profile;a.continue();}',exported)
  p.wait_for_function('HonroApp.engine?.b.honroStage===15');actual=p.evaluate('HonroApp.engine.b');assert actual==expected,'Whole battle changed after downloaded export/Continue'
  rows.append({'case':'downloaded export/Continue '+str(n+1),'wholeBattleExact':True,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
 snap('drain-continue');assert not errors,errors;assert not http,http
 report={'checkedCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'scope':__doc__,'inputScope':record['scope'],'prepared':record['prepared'],'verification':verification,'rows':rows,'errors':errors,'httpFailures':http,'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest()}
 (out/'browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');browser.close()
 print('PASS generated UI production sluice/reveal, original minecarts contact/resource preservation,20ticks, downloaded export/Continue twice; errors0')
