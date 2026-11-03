"""Rendered public current Stage22, a declared entry-profile fixture and normal
keyboard E. Camera inspection is not normal combat completion.
Prepared smoke tool; this revision has not successfully launched in this environment."""
import os,json,pathlib,hashlib
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[2]
out=root/os.environ.get('HONRO_BROWSER_OUT','_local/reports/stage22-current/browser');out.mkdir(parents=True,exist_ok=True)
assert not any(out.iterdir()), 'Preserve old browser evidence: select a new HONRO_BROWSER_OUT'
entry=json.loads((root/'_local/reports/stage22-current/baseline-005/initial.json').read_text())
profile=entry['initial']['profile'];profile.pop('honroBattle',None)
base=os.environ.get('HONRO_BASE_URL','https://sys8994.github.io/honro')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('if(!localStorage.getItem("honro-first-act-profile-1"))localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile,ensure_ascii=False))+');')
 page.goto(base+'/HONRO.html',wait_until='domcontentloaded',timeout=120000)
 page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroCampaignLoader',timeout=120000)
 page.evaluate('async()=>{await HonroCampaignLoader.ensureStage(22);}')
 stage_text=page.evaluate('JSON.stringify(HONRO_PROJECT.stages[21])');stage_sha=hashlib.sha256(stage_text.encode()).hexdigest()
 expected=json.loads((root/'_local/reports/stage22-current/baseline-005/provenance.json').read_text())['stageSha256']
 page.evaluate('HonroApp.launch(22)')
 page.wait_for_function('HonroApp.engine?.b.honroStage===22',timeout=120000)
 for _ in range(35):
  if page.evaluate('!!HonroApp.dialogue'):page.keyboard.press('Enter')
  page.wait_for_timeout(120)
  if page.evaluate('HonroApp.canInput()'):break
 before=page.evaluate('()=>({revision:HonroApp.engine.b.honroCampaignMapRevision,goal:HonroAct3.current(HonroApp.engine.b),initial:HonroApp.engine.alive(1).length,hero:HonroApp.engine.active.id,events:HonroApp.engine.b.honroEvents})')
 # Ordinary hero portrait selection and E. No actor/terrain/HP writes.
 page.evaluate('HonroApp.selectHero("p-knight")');page.keyboard.press('e');page.wait_for_timeout(800)
 for _ in range(20):
  if not page.evaluate('!!HonroApp.dialogue'):break
  page.keyboard.press('Enter');page.wait_for_timeout(120)
 after=page.evaluate('()=>({goal:HonroAct3.current(HonroApp.engine.b),door:HonroApp.engine.b.terrain.find(t=>t.id==="archive-door").broken,done:HonroAct3.memory(HonroApp.engine.b).done})')
 assert after['door'] and after['done'].get('archive-seal'), after
 rows=[]
 for tag,w,h,x,y,z in [('structure',1200,1000,2200,3350,.16),('entry',1440,900,1270,5070,.57),('records',1440,900,1500,3630,.70),('roof',1440,900,2670,2560,.70),('upper',1440,900,2420,1140,.65),('mobile-records',390,844,1450,3470,.48)]:
  page.set_viewport_size({'width':w,'height':h})
  page.evaluate('q=>{let a=HonroApp;Object.assign(a.scene,{x:q[0],y:q[1],scale:q[2],manual:true,goalFocus:null,focusUntil:0,focusId:null,storyTween:null});a.turnNotice=null;}',[x,y,z])
  page.wait_for_timeout(180);file=tag+'.png';page.screenshot(path=str(out/file));rows.append({'file':file,'camera':page.evaluate('({x:HonroApp.scene.x,y:HonroApp.scene.y,z:HonroApp.scene.scale})'),'size':[w,h]})
 page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp',timeout=120000);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.engine?.b.honroStage===22',timeout=120000)
 saved=page.evaluate('()=>({round:HonroApp.engine.b.round,door:HonroApp.engine.b.terrain.find(t=>t.id==="archive-door").broken,done:HonroAct3.memory(HonroApp.engine.b).done})');assert saved['door'] and saved['done'].get('archive-seal'),saved
 report={'savedContinue':saved,'scope':__doc__,'base':base,'loadedStageSha256':stage_sha,'nativeExpectedStageSha256':expected,'stageMatchesNative':stage_sha==expected,'before':before,'after':after,'screenshots':rows,'pageErrors':errors,'stage':page.evaluate('HonroApp.engine.b.honroStage'),'compiledUnitCount':page.evaluate('HonroApp.engine.b.units.length')}
 (out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));browser.close()
 print(json.dumps({'before':before,'after':after,'errors':errors},ensure_ascii=False))
