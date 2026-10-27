"""Actual DOM/Canvas/Enter/E/localStorage; prior history, combat deaths and
hero poses are declared fixtures. This is not normal chapter completion."""
import json,os,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act23-v4/reviewed22-browser';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.environ.get('HONRO_BASE_URL','http://127.0.0.1:8770')
PAUSE="""()=>{const a=HonroApp,f=a.frame;a.reviewPaused=true;a.frame=function(t){if(this.reviewPaused&&this.engine&&this.scene&&this.screen==='battle'){this.prev=t;this.scene.render(this.engine,0,this.selected,this.power,false,0,true);requestAnimationFrame(n=>this.frame(n));}else f.call(this,t);};}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=browser.new_page(viewport={'width':1280,'height':800});errors=[];rows=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroAct23V4Chapter22Reviewed');page.evaluate(PAUSE)
 def tick(n=100):page.evaluate("""n=>{const a=HonroApp;for(let i=0;i<n&&!a.dialogue;i++){Object.assign(a.engine.b,{side:0,phase:'aim'});HonroAct23V4.tick(a,.025);}a.updateHUD();}""",n)
 def at(id):
  actual=page.evaluate('({id:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId,text:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[1]})');assert actual['id']==id,actual;assert page.locator('#story-line').text_content()==actual['text'];rows.append(actual)
 def next():page.keyboard.press('Enter')
 def finish():
  for _ in range(20):
   if not page.evaluate('!!HonroApp.dialogue'):return
   next()
  assert not page.evaluate('!!HonroApp.dialogue')
 def shot(name):page.screenshot(path=str(OUT/(name+'.png')))
 def resume():
  page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(PAUSE);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"');page.evaluate('HonroApp.turnNotice=null')
 assert page.evaluate("""async()=>{await HonroCampaignLoader.ensureStage(22);const a=HonroApp,p=HonroProfileStore.fresh();p.revision=13;p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(let i=1;i<=21;i++)p.cleared[i]={visits:1,rounds:1};for(const c of p.recruited)HONRO_CORE.grantXP(p.heroes[c],HONRO_CORE.xpAtLevel(16));p.seen['act2:first-spirit-encounter']=true;p.seen['map-story-v'+HonroStoryContent.version+'-21']=true;p.honroAct23V4History={revision:1,stages:{19:{run:'fixture-19',slots:['19.transport-traces'],transportTraces:{ids:['mumyeong-transfer','royal-seal','jeomungol-mark']}},21:{run:'fixture-21',reviewedNarrative:{revision:1,rescued:true}}}};a.profile=p;a.launch(22);a.turnNotice=null;return a.engine.b.honroCampaignMapRevision;}""")==422
 tick();at('EDGE.ARRIVALS_22_0');shot('01-arrival-structure');next();tick();at('A3.S22.INTRO.01');shot('02-seal-shelf-detail');resume();at('A3.S22.INTRO.01');finish()
 def pose_marker(id,clear=False):
  page.evaluate("""({id,clear})=>{const a=HonroApp,b=a.engine.b,V=HonroAct23V4,m=V.marker(b,id),u=V.heroes(b).find(u=>u.cls==='knight');Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0,airborne:false,jumping:false,acted:false});Object.assign(b,{active:u.id,side:0,phase:'aim'});a.turnNotice=null;if(clear)for(const v of b.units)if(v.side===1&&V.near(v,m,390)&&V.alive(v))a.engine.hurt(v,999999,u.id);a.updateHUD();}""",{'id':id,'clear':clear})
 pose_marker('archive-seal');page.keyboard.press('e');tick();at('A3.S22.SEAL.01');shot('03-open-seal');finish();pose_marker('v4.record-bundle',True);page.keyboard.press('e');tick();at('A3.S22.DOC.REPORT');next();at('A3.S22.DOC.REGISTER');resume();at('A3.S22.DOC.REGISTER');next();at('A3.S22.COMPARE.01');shot('04-report-register-compare')
 for _ in range(6):next()
 at('A3.S22.DOC.MAP');assert not page.evaluate('!!HonroAct23V4Chapter22Reviewed.journal(HonroApp.profile,22)');page.set_viewport_size({'width':390,'height':844});shot('05-map-mobile');page.set_viewport_size({'width':1280,'height':800});resume();at('A3.S22.DOC.MAP');finish();tick();assert page.evaluate('!!HonroAct23V4Chapter22Reviewed.journal(HonroApp.profile,22)')
 pose_marker('archive-exit');tick();at('A3.S22.EXIT.01');shot('06-exit-soul-motion');resume();at('A3.S22.EXIT.01');finish();tick();assert page.evaluate('HonroAct23V4Chapter22Reviewed.complete(HonroApp.engine.b)');assert not errors,errors
 (OUT/'capture.json').write_text(json.dumps({'scope':'Actual Chromium DOM/Canvas/Enter/E/localStorage. Prior fresh-v4 proof, enemy deaths and hero poses are fixtures; no normal combat completion.','rows':rows,'pageErrors':errors},ensure_ascii=False,indent=2)+'\n');browser.close()
print('PASS Chromium chapter22 actual E/bundle/comparison/map/exit and saved cursors; pageerror0')
