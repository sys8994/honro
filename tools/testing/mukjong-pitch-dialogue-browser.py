"""Prepared stage18 boundaries using built Chromium, actual AudioBuffer/Engine/Story.
Rounds/near-keeper coordinates/objective readiness are fixtures, not a full playthrough.
"""
import json,sys,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/mukjong-pitch-dialogue-20261023';OUT.mkdir(parents=True,exist_ok=True)
entry=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import{appHarness,plain}from'./tests/app-regression-helpers.mjs';const h=await appHarness(),a=h.load(h.profileThrough(17));a.launch(18);h.finish(a);a.close();a.turnNotice=null;a.engine.b.honroState.mukjongAudio??={version:1,sign:false,keeperSerial:0};delete a.engine.b.honroState.mukjongPitchDialogue;delete a.engine.b.honroState.mukjongAudio.pitch;a.engine.b.honroState.mukjongAudio.echoStep=-1;delete a.engine.b.honroState.mukjongAudio.lastToneRound;a.profile.honroBattle=plain(a.engine.b);console.log(JSON.stringify(a.profile));"],cwd=ROOT))
with serve_game()as base,sync_playwright()as pw:
 browser=launch(pw);p=browser.new_page(viewport={'width':390,'height':844},has_touch=True);errors=[];http=[]
 p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',lambda r:http.append({'url':r.url,'status':r.status})if r.status>=400 else None)
 p.add_init_script('if(!localStorage.getItem("honro-first-act-profile-1"))localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(entry))+');')
 p.goto(base+'/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady',timeout=90000)
 p.evaluate('window.__pitchFrame=HonroApp.frame;HonroApp.frame=()=>{}');p.locator('[data-action=continue]').click()
 p.wait_for_function('HonroApp.engine?.b.honroStage===18&&HonroMukjongAudio.stats(HonroApp.audio)?.ready',timeout=90000)
 print('ready',p.evaluate('({audio:HonroMukjongAudio.stats(HonroApp.audio),m:HonroApp.engine.b.honroState.mukjongAudio,dialogue:!!HonroApp.dialogue,modal:HonroApp.modal.className})'),flush=True);p.evaluate('HonroApp.turnNotice=null;HonroApp.frame=window.__pitchFrame;requestAnimationFrame(t=>HonroApp.frame(t))');p.wait_for_function('HonroMukjongAudio.stats(HonroApp.audio)?.plays===1');p.evaluate('HonroApp.frame=()=>{}')
 print('base played',flush=True)
 stats=lambda:p.evaluate('HonroMukjongAudio.stats(HonroApp.audio)')
 state=lambda:p.evaluate('structuredClone(HonroApp.engine.b.honroState.mukjongPitchDialogue)')
 def snap(name):
  # Wait for the real .2s entry transition; render the paused world at the current viewport.
  p.wait_for_function('getComputedStyle(document.querySelector(".dialogue-presentation")).opacity==="1"')
  p.evaluate('window.__pitchFrame.call(HonroApp,performance.now())')
  p.wait_for_function('document.querySelector(".story-portrait canvas")?.dataset.portraitState==="ready"',timeout=30000)
  rects=p.evaluate('''()=>[...document.querySelectorAll('.story-actions button')].map(n=>{const r=n.getBoundingClientRect();return{text:n.textContent,enabled:!n.disabled,x:r.x,y:r.y,w:r.width,h:r.height,hit:n.disabled||n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};})''')
  assert all(r['x']>=0 and r['y']>=0 and r['x']+r['w']<=p.viewport_size['width']+1 and r['y']+r['h']<=p.viewport_size['height']+1 and r['hit']for r in rects),rects
  p.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=88)
  return{'line':p.locator('#story-line').inner_text(),'row':p.evaluate('HonroApp.dialogue.lines[HonroApp.dialogue.index][2].rowId'),'buttons':rects,'portrait':p.locator('.story-portrait canvas').get_attribute('data-portrait-state')}
 def next():p.locator('[data-action=dialogue-next]').click()
 p.evaluate('''()=>{const a=HonroApp;a.engine.b.round+=2;HonroMukjongAudio.observe(a);HonroMukjongAudio.update(a);window.__pitchFrame.call(a,performance.now());}''')
 p.wait_for_function('HonroApp.dialogue?.pitchEvent==="first"');print('first opened',flush=True);first=snap('first-rise-mobile');assert first['row']=='18.beats.pitch-first:sodan'
 # Persist the actual open dialogue, then Continue through the production restore path.
 saved=p.evaluate('''()=>{const a=HonroApp;a.profile.honroBattle=structuredClone(a.engine.b);return structuredClone(a.profile);}''')
 before=state();count=stats()['plays'];p.evaluate('v=>{const a=HonroApp;a.profile=v;a.normalProfile=v;a.continue();a.turnNotice=null;}',saved)
 assert state()==before and stats()['plays']==count
 next();assert p.evaluate('HonroApp.dialogue.index')==1;p.locator('[data-action=dialogue-prev]').click();assert p.evaluate('HonroApp.dialogue.index')==0
 next();damheo=snap('first-rise-damheo');next();assert state()['first']['readComplete']
 p.evaluate('for(let i=0;i<20;i++)HonroMukjongPitchDialogue.tick(HonroApp)');assert p.evaluate('!HonroApp.dialogue')
 p.evaluate('''()=>{const a=HonroApp;a.engine.b.round+=4;HonroMukjongAudio.observe(a);HonroMukjongAudio.update(a);}''');count=stats()['plays']
 p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,k=e.unit('act2-keeper');for(const[i,u]of e.heroesAlive().entries()){const x=k.x-220-i*90,s=e.contactSurface(x,k.y-400,k.y+300);if(!s)throw Error('No fixture surface');Object.assign(u,{x,y:s.y,vx:0,vy:0});}e.refreshActivation();b.active=k.id;b.queue=[k.id];b.side=1;b.phase='enemy';k.lastAct=b.round;e.checkEnd=()=>false;e.enemyAction();HonroMukjongPitchDialogue.tick(a);}''')
 assert p.evaluate('!!HonroApp.engine.b.keeperRitual.cast&&!HonroApp.dialogue');assert state()['tighten']['status']=='pending' and stats()['plays']==count
 pending=p.evaluate('''()=>{const a=HonroApp;a.profile.honroBattle=structuredClone(a.engine.b);return structuredClone(a.profile);}''')
 p.evaluate('''()=>{const a=HonroApp,e=a.engine;for(let i=0;i<1500&&!(e.b.side===0&&e.b.phase==='aim');i++)e.tick(HONRO_CORE.STEP);if(e.b.side!==0||e.b.phase!=='aim')throw Error('Ritual did not finish');a.turnNotice=null;window.__pitchFrame.call(a,performance.now());}''')
 p.wait_for_function('HonroApp.dialogue?.pitchEvent==="tighten"');print('later opened',flush=True);late=snap('later-ritual-mobile');assert late['row']=='18.beats.pitch-tighten:keeper'
 p.set_viewport_size({'width':844,'height':390});p.evaluate('HonroStory.draw(HonroApp)');snap('later-ritual-landscape');p.set_viewport_size({'width':390,'height':844})
 next();next();assert state()['tighten']['readComplete']
 # Restore the real pending-ritual snapshot, then use actual nonlethal keeper damage.
 terminal=p.evaluate('''v=>{const a=HonroApp;a.profile=v;a.normalProfile=v;a.continue();a.turnNotice=null;const e=a.engine,b=e.b,k=e.unit('act2-keeper'),q=HonroAct2.memory(b);for(const s of b.honroAct2Steps)if(s.id!=='keeper')q.done[s.id]=true;e.hurt(k,k.maxHp*100,'p-knight',true);HonroMukjongPitchDialogue.tick(a);return{keeper:{hp:k.hp,side:k.side,subdued:k.honroSubdued},event:structuredClone(b.honroState.mukjongPitchDialogue.tighten)};}''',pending)
 assert terminal['keeper']['subdued'] and terminal['event']['status']=='discarded',terminal
 # Canonical outro reader; quest readiness above is explicit, not a normal victory claim.
 p.evaluate("HonroStory.start(HonroApp,HonroStoryContent.outros[18],{title:'묵종'})")
 assert p.evaluate('HonroApp.dialogue.lines[HonroApp.dialogue.index][2].rowId')=='18.outro:b196accb21'
 next();release=snap('after-subdue-mobile');assert release['row']=='18.outro:pitch-release-sodan'
 next();assert p.evaluate('HonroApp.dialogue.lines[HonroApp.dialogue.index][2].rowId')=='18.outro:e8c4944c23'
 family=p.locator('#story-line').inner_text();next();reply=p.locator('#story-line').inner_text()
 assert '가족' in family
 assert stats()['requests']==1 and stats()['decodes']==1
 assert not errors and not http,{'errors':errors,'http':http}
 report={'gameEntry':json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'],'first':first,'damheo':damheo,'late':late,'terminal':terminal,'release':release,'familyRequest':family,'followingReply':reply,'continueExact':True,'previousManualNext':True,'sameRoundCoalesced':True,'actualRitualCastPriority':True,'audio':stats(),'errors':errors,'httpErrors':http,'scope':'Built headless Chromium. Prepared rounds, nearby coordinates and quest readiness. Actual WebAudio start, Engine.enemyAction/hurt, App.frame safe-boundary and Story readers. Canonical outro explicitly opened after subdue. No normal full18 completion, physical device or listening-quality claim.'}
 (OUT/'browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('PASS Chromium first/later/subdued, actual sound/ritual, Continue/previous, portraits/buttons, family request, one buffer',flush=True);browser.close()
