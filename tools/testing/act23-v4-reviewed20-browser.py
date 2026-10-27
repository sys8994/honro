"""Chromium chapter20 acceptance with explicit prior-clear/combat/initial-pose fixtures.
Production care, impulse recovery, convoy walk and time/news/seat owners."""
import hashlib,json,os,pathlib,subprocess
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act23-v4/reviewed20-browser';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('HONRO_BASE_URL','http://127.0.0.1:8768')
PAUSE="""()=>{const a=HonroApp,f=a.frame;a.reviewPaused=true;a.frame=function(t){if(this.reviewPaused&&this.engine&&this.scene&&this.screen==='battle'){this.prev=t;this.scene.render(this.engine,0,this.selected,this.power,false,0,true);requestAnimationFrame(n=>this.frame(n));}else f.call(this,t);};globalThis.tick20=(n=1)=>{for(let i=0;i<n&&!a.dialogue;i++){Object.assign(a.engine.b,{side:0,phase:'aim'});HonroAct23V4.tick(a,.025);if(!a.dialogue)a.engine.stepUnits(.025);}};globalThis.pose20=(u,x,y)=>Object.assign(u,{x,y,vx:0,vy:0,jumping:false,airborne:false,acted:false});globalThis.ground20=(u,x)=>{const t=a.engine.b.terrain.find(t=>t.id==='act2-floor');x=Math.max(t.x+60,Math.min(x,t.x+t.w-60));pose20(u,x,HonroMapEngine.surfaceY(a.engine.b.terrain,x,undefined,'act2-floor').y);};globalThis.use20=(id,cls='occultist')=>{const p=HonroAct23V4.marker(a.engine.b,id),u=a.engine.b.units.find(u=>u.cls===cls);pose20(u,p.x,p.y);Object.assign(a.engine.b,{active:u.id,side:0,phase:'aim'});if(!HonroAct23V4.use(a,p))throw Error('use '+id);};}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=browser.new_page(viewport={'width':1280,'height':800});errors=[];rows=[];views=[];proof={};page.on('pageerror',lambda e:errors.append(str(e)))
 def boot():
  page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroAct23V4Reviewed20');page.evaluate(PAUSE)
 def current():return page.evaluate('HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId')
 def record():
  id=current()
  if id:
   assert page.locator('#story-line').text_content()==page.evaluate('id=>HonroAct23V4ReviewedChapters.row(id,20).text',id);rows.append(id)
 def at(id):
  page.evaluate('tick20(650)');assert current()==id,(id,current(),page.evaluate('HonroAct23V4Reviewed20.memory(HonroApp.engine.b)'));record()
 def finish():
  for _ in range(30):
   if not current():break
   record();page.keyboard.press('Enter')
  assert not current()
 def capture(name,point=None,scale=.7):
  if point:page.evaluate('({p,z})=>{const a=HonroApp,s=a.scene;s.manual=true;s.storyTween=null;s.cinematic=null;s.goalFocus=null;s.x=p[0];s.y=p[1];s.scale=z;s.render(a.engine,0,a.selected,a.power,false,0,true);}',{'p':point,'z':scale})
  page.wait_for_timeout(80);page.screenshot(path=str(OUT/(name+'.png')));views.append({'file':name+'.png','viewport':page.viewport_size,'point':point,'scale':scale if point else 'production','row':current()})
 def resume():
  page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(PAUSE);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"')
 boot()
 served_sources={}
 bundles=[]
 for asset in page.request.get(BASE+'/web/manifest.json').json()['common']:
  if 'ordered-common' in asset:bundles.append((asset,page.request.get(BASE+'/'+asset).body()))
 for path in ['shared/runtime/act23-v4-reviewed20.js','shared/runtime/act23-v4-reviewed-chapters.js' ,'shared/runtime/act23-v4-act3.js']:
  source=(ROOT/path).read_text();compiled=subprocess.run(['node','--input-type=module','-e',"import{minify}from'terser';import{readFileSync}from'node:fs';process.stdout.write((await minify(readFileSync(0,'utf8'),{module:true,compress:false,mangle:false,format:{comments:false}})).code);"],input=source,text=True,capture_output=True,check=True).stdout.rstrip(';');matches=[(asset,body)for asset,body in bundles if compiled in body.decode()]
  assert matches,'Served candidate differs from local source: '+path
  served_sources[path]={'asset':matches[0][0],'sha256':hashlib.sha256(matches[0][1]).hexdigest()}
 page.evaluate("""async history=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(20);a.stopBattle();a.close();const p=HonroProfileStore.fresh();p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(let i=1;i<20;i++)p.cleared[i]={visits:1,rounds:1};for(const c of p.recruited)HONRO_CORE.grantXP(p.heroes[c],HONRO_CORE.xpAtLevel(16));p.seen['act2:first-spirit-encounter']=true;p.honroAct23V4History=history;a.profile=p;a.launch(20);a.turnNotice=null;}""",json.loads((ROOT/'_local/reports/act23-v4/reviewed19-browser/completed-profile.json').read_text())['honroAct23V4History'])
 assert page.evaluate('HonroApp.engine.b.honroCampaignMapRevision')==520
 at('EDGE.ARRIVALS_20_0');capture('01-entry-production');finish();page.evaluate('HonroRestJourney.showRest(HonroApp)');page.locator('[data-action="rest-talk"][data-class="occultist"]').click();at('EDGE.OPTIONAL_20_OCCULTIST_0');capture('01b-observed-family-optional');finish();resume();page.evaluate('use20("20.ring","mage")');at('A2.S20.INTRO.01');resume();at('A2.S20.INTRO.01');finish()
 # Unrelated combat and pre-care mission checkpoints are explicit fixtures.
 page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,V=HonroAct23V4;for(const u of b.units)if(u.side===1){u.dead=true;u.hp=0;}const r=V.mem(b);for(const s of V.steps(b)){if(s.id==='escort-mid')break;r.done[s.id]=true;}r.convoyStarted=true;for(const [i,h]of V.heroes(b).entries())ground20(h,7000-i*110);ground20(a.engine.unit('objective'),4000);ground20(a.engine.unit('convoy-mason'),4700);ground20(a.engine.unit('convoy-gilchan'),4800);a.engine.hurt(a.engine.unit('objective'),20,'declared-browser-damage');}""")
 at('A2.S20.MID.01');finish();at('A2.S20.MID.06');capture('02-injured-waiting');assert not page.evaluate('HonroAct23V4Reviewed20.outside(HonroApp.engine.b)');finish()
 # Guide only heroes; all three convoy actors walk through production escort.
 GUIDE="""(n)=>{const a=HonroApp,b=a.engine.b;for(let i=0;i<n&&!a.dialogue;i++){const u=a.engine.unit('objective'),f=a.engine.unit('convoy-mason'),s=a.engine.unit('convoy-gilchan');ground20(a.engine.unit('p-knight'),u.x-110);ground20(a.engine.unit('p-archer'),f.x+600);ground20(a.engine.unit('p-mage'),s.x-400);ground20(a.engine.unit('p-occultist'),Math.max(f.x,s.x)+800);if(i%100===0)b.round++;tick20();}}"""
 page.evaluate('ground20(HonroApp.engine.unit("p-knight"),4110)');page.evaluate('tick20(8)');assert page.evaluate('HonroAct23V4Act3.convoyCare(HonroApp.engine.b).injured.supportedDistance')>0;capture('03-real-support',[4060, page.evaluate('HonroApp.engine.unit("objective").y')],.85);resume();assert page.evaluate('HonroAct23V4Act3.convoyCare(HonroApp.engine.b).injured.supportId')=='p-knight'
 for _ in range(80):
  if current():break
  page.evaluate(GUIDE,20)
 at('A2.S20.MID.02');capture('04-one-bag-handoff');finish()
 page.evaluate('()=>{const e=HonroApp.engine;e.impulse(e.unit("convoy-gilchan"),350,-160);e.stepUnits(.025);}')
 page.evaluate('tick20(2)');assert page.evaluate('HonroAct23V4Act3.convoyCare(HonroApp.engine.b).baggage.transfers')==0;resume()
 page.evaluate('()=>{const e=HonroApp.engine;for(let i=0;i<1000&&!e.grounded(e.unit("convoy-gilchan"));i++)e.stepUnits(.025);tick20();}')
 assert page.evaluate('HonroAct23V4Act3.convoyCare(HonroApp.engine.b).baggage.status')=='with-mason'
 for i in range(100):
  if page.evaluate('HonroAct23V4Act3.convoyCare(HonroApp.engine.b).baggage.status')=='carried':break
  page.evaluate(GUIDE,20)
  if current():finish()
 assert page.evaluate('HonroAct23V4Reviewed20.baggage(HonroApp.engine.b)'),page.evaluate('({care:HonroAct23V4Act3.convoyCare(HonroApp.engine.b),current:HonroAct23V4.current(HonroApp.engine.b),poses:HonroApp.engine.b.units.filter(u=>u.honroProtected).map(u=>({id:u.id,x:u.x,y:u.y,d:u.honroV4Distance})),wp:HonroAct23V4.mem(HonroApp.engine.b).escortWaypoints,markers:HonroApp.engine.b.honroMarkers.filter(p=>["escort-mid","hold-convoy"].includes(p.id)),safe:HonroAct23V4.safe(HonroApp),heroes:HonroAct23V4.heroes(HonroApp.engine.b).map(u=>({x:u.x,y:u.y})),budget:HonroApp.engine.unit("convoy-mason").moveLeft})')
 proof['recoveredBaggage']=page.evaluate('HonroAct23V4Act3.convoyCare(HonroApp.engine.b).baggage');capture('05-recovered-single-item',[page.evaluate('HonroApp.engine.unit("convoy-mason").x'),page.evaluate('HonroApp.engine.unit("convoy-mason").y')],.8)
 for i in range(120):
  if page.evaluate('HonroAct23V4.mem(HonroApp.engine.b).done["hold-convoy"]'):break
  page.evaluate(GUIDE,50)
  if current():finish()
 assert page.evaluate('HonroAct23V4.mem(HonroApp.engine.b).done["hold-convoy"]'),page.evaluate('({current:HonroAct23V4.current(HonroApp.engine.b),care:HonroAct23V4Act3.convoyCare(HonroApp.engine.b),positions:HonroApp.engine.b.units.filter(u=>u.honroProtected).map(u=>({id:u.id,x:u.x,y:u.y}))})')
 proof['careAtRest']=page.evaluate('({care:HonroAct23V4Act3.convoyCare(HonroApp.engine.b),current:HonroAct23V4.current(HonroApp.engine.b),poses:HonroApp.engine.b.units.filter(u=>u.honroProtected).map(u=>({id:u.id,x:u.x,y:u.y,d:u.honroV4Distance})),wp:HonroAct23V4.mem(HonroApp.engine.b).escortWaypoints,markers:HonroApp.engine.b.honroMarkers.filter(p=>["escort-mid","hold-convoy"].includes(p.id)),safe:HonroAct23V4.safe(HonroApp),heroes:HonroAct23V4.heroes(HonroApp.engine.b).map(u=>({x:u.x,y:u.y})),budget:HonroApp.engine.unit("convoy-mason").moveLeft})')
 # Production finite admission, with real offered/ended actions; combat removal fixture follows.
 for cls in ['archer','mage','knight','occultist']:
  page.evaluate('cls=>{const a=HonroApp,u=a.engine.unit("p-"+cls);Object.assign(a.engine.b,{active:u.id,side:0,phase:"aim"});u.acted=false;tick20();a.engine.finishAction();for(let i=0;i<150&&a.engine.b.phase==="review";i++)a.engine.tick(.025);}',cls)
  if current():finish()
 page.evaluate('tick20(5)')
 assert page.evaluate('HonroAct23V4.mem(HonroApp.engine.b).convoyAmbush.admitted'),page.evaluate('HonroAct23V4.mem(HonroApp.engine.b).convoyAmbush')
 proof['finiteAmbush']=page.evaluate('HonroAct23V4.mem(HonroApp.engine.b).convoyAmbush')
 page.evaluate('()=>{for(const u of HonroApp.engine.b.units)if(u.side===1){u.dead=true;u.hp=0;}}');at('A2.S20.MID.07');finish()
 for i in range(160):
  if page.evaluate('HonroAct23V4Reviewed20.outside(HonroApp.engine.b)'):break
  page.evaluate(GUIDE,60)
  if current():break
 assert page.evaluate('HonroAct23V4Reviewed20.outside(HonroApp.engine.b)'),page.evaluate('({current:HonroAct23V4.current(HonroApp.engine.b),care:HonroAct23V4Act3.convoyCare(HonroApp.engine.b),positions:HonroApp.engine.b.units.filter(u=>u.honroProtected).map(u=>({id:u.id,x:u.x,y:u.y,d:u.honroV4Distance}))})')
 at('A2.S20.BRANCH.01');capture('06-all-three-outside-production');finish()
 for i in range(1,7):
  at('A2.S20.TIME.0'+str(i))
  if i==4:resume();at('A2.S20.TIME.04')
  finish()
 assert page.evaluate('HonroApp.profile.record.filter(r=>r.rowId==="A2.S20.JOURNAL.01").length')==0
 # Clear the seat with hero approach fixtures; father must perform the actual last walk.
 page.evaluate('()=>{const a=HonroApp,s=a.engine.b.honroV4Reviewed20;for(const [i,h]of HonroAct23V4.heroes(a.engine.b).entries())ground20(h,s.outside.x-430-i*95);}')
 page.evaluate('()=>{for(let i=0;i<10&&!HonroApp.dialogue;i++){HonroApp.engine.b.round++;tick20(100);}}');at('A2.S20.TIME.07');capture('07-seated-handoff-production');proof['seated']=page.evaluate('HonroAct23V4Reviewed20.memory(HonroApp.engine.b).seated');finish();at('A2.S20.TIME.08');finish()
 at('A2.S20.NEWS.01');capture('08-actual-town-reporter');resume();at('A2.S20.NEWS.01');page.set_viewport_size({'width':390,'height':844});page.evaluate('HonroStory.draw(HonroApp)');capture('09-mobile-news-production');page.set_viewport_size({'width':1280,'height':800});finish();at('A2.S20.COMPLETE.01');capture('10-safe-arrival-production');finish();page.evaluate('tick20(3)')
 assert page.evaluate('HonroAct23V4Reviewed20.complete(HonroApp.engine.b)');proof['physical']=page.evaluate('HonroAct23V4Reviewed20.memory(HonroApp.engine.b)');proof['careFinal']=page.evaluate('({care:HonroAct23V4Act3.convoyCare(HonroApp.engine.b),current:HonroAct23V4.current(HonroApp.engine.b),poses:HonroApp.engine.b.units.filter(u=>u.honroProtected).map(u=>({id:u.id,x:u.x,y:u.y,d:u.honroV4Distance})),wp:HonroAct23V4.mem(HonroApp.engine.b).escortWaypoints,markers:HonroApp.engine.b.honroMarkers.filter(p=>["escort-mid","hold-convoy"].includes(p.id)),safe:HonroAct23V4.safe(HonroApp),heroes:HonroAct23V4.heroes(HonroApp.engine.b).map(u=>({x:u.x,y:u.y})),budget:HonroApp.engine.unit("convoy-mason").moveLeft})');assert proof['careFinal']['care']['baggage']['transfers']==1
 for id in ['A2.S20.JOURNAL.01','A2.S20.JOURNAL.02']:assert page.evaluate('id=>HonroApp.profile.record.filter(r=>r.rowId===id).length',id)==1
 capture('11-final-overall',[8660,page.evaluate('HonroApp.engine.b.honroV4Reviewed20.outside.y')-100],.6)
 # Let production mission/outcome record this actual run and render the ending.
 for _ in range(100):
  if page.evaluate('!!HonroAct23V4.mem(HonroApp.engine.b).convoyGoals?.escape'):break
  page.evaluate(GUIDE,60)
 assert page.evaluate('!!HonroAct23V4.mem(HonroApp.engine.b).convoyGoals?.escape')
 page.evaluate('use20("20.outside","knight")');page.evaluate('tick20(45)')
 page.evaluate('()=>{const a=HonroApp;if(!a.checkMission(a.engine)||a.engine.b.phase!=="won")throw Error("real mission completion");a.outcome();}')
 assert page.evaluate('HonroApp.screen')=='act-ending'
 proof['mission']=page.evaluate('({screen:HonroApp.screen,cleared:HonroApp.profile.cleared[20],history:HonroApp.profile.honroAct23V4History.stages[20]})')
 for i in range(4):
  id='EDGE.ACTENDINGS_20_LINES_'+str(i);assert page.locator('.act-ending-copy').text_content()==page.evaluate('id=>HonroAct23V4ReviewedChapters.row(id,20).text',id);rows.append(id);capture('12-ending-'+str(i));page.wait_for_timeout(370);page.keyboard.press('Enter')
 page.wait_for_timeout(370);page.keyboard.press('Enter');page.wait_for_function('HonroApp.screen==="rest"')
 at('EDGE.RESTENDINGS_20_REQUIRED_0');capture('13-required-rest');finish()
 for cls in ['archer','mage','knight','occultist']:
  page.locator('[data-action="rest-talk"][data-class="'+cls+'"]').click();at('EDGE.RESTENDINGS_20_OPTIONAL_'+cls.upper()+'_0');capture('14-rest-'+cls);finish()
 assert page.evaluate('HonroApp.profile.honroAct23V4History.stages[20].reviewed20.complete')
 (OUT/'completed-profile.json').write_text(json.dumps(page.evaluate('HonroApp.profile'),ensure_ascii=False,indent=2)+'\n')
 assert not errors,errors
 sources={str(p):hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['shared/runtime/act23-v4-reviewed20.js','shared/data/reviewed/act23-v4-ch20.json','tools/testing/act23-v4-reviewed20-browser.py']}
 (OUT/'capture.json').write_text(json.dumps({'scope':'Actual Chromium DOM/Canvas/Enter/localStorage; prior clears, unrelated combat removals, pre-care checkpoints, initial convoy/hero approach poses explicit fixtures. Production support/knockback/bag recovery, all-roster walking to outside, time/news and seat. No normal fullplay/audio/public-deploy claim. Observed family-call gesture receipts come from the actual completed19 browser run. Default forbidden loss branch held; no audio/spoken-name performance claim.','sources':sources,'servedSources':served_sources,'rows':sorted(set(rows)),'views':views,'proof':proof,'pageErrors':errors},ensure_ascii=False,indent=2)+'\n');print('PASS20 actual Chromium care/bag impulse recovery/all-roster outside/TIME08/news/seat and saved motion/dialogue; no page errors');browser.close()
