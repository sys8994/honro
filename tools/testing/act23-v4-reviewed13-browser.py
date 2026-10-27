"""Chapter 13 DOM/Canvas/localStorage acceptance; explicit combat/hero fixtures.
NPC escort, enemy approach/ascent and upper gate-route jumps use actual Engine.
"""
import hashlib, json, os, pathlib
from playwright.sync_api import sync_playwright

ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'_local/reports/act23-v4/reviewed13-browser'
OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('HONRO_BASE_URL','http://127.0.0.1:8768')
PAUSE="""()=>{const a=HonroApp,f=a.frame;a.reviewPaused=true;a.frame=function(t){if(this.reviewPaused&&this.engine&&this.scene&&this.screen==='battle'){this.prev=t;this.scene.render(this.engine,0,this.selected,this.power,false,0,true);requestAnimationFrame(n=>this.frame(n));}else f.call(this,t);};globalThis.t13=(n=1)=>{for(let i=0;i<n&&!a.dialogue;i++){Object.assign(a.engine.b,{side:0,phase:'aim'});HonroAct23V4.tick(a,.025);if(!a.dialogue)a.engine.stepUnits(.025);}};globalThis.pose13=(u,x,y)=>Object.assign(u,{x,y,vx:0,vy:0,jumping:false,airborne:false,acted:false});globalThis.hero13=cls=>a.engine.heroesAlive().find(u=>u.cls===cls);globalThis.ground13=(u,x)=>pose13(u,x,HONRO_CORE.topAt(a.engine.b.terrain.find(t=>t.id==='act2-floor'),x));}"""
LAUNCH="""async choice=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(13);a.stopBattle();a.close();const p=HonroProfileStore.fresh();p.revision=13;p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(let i=1;i<=12;i++)p.cleared[i]={visits:1,rounds:1};for(const c of p.recruited)HONRO_CORE.grantXP(p.heroes[c],HONRO_CORE.xpAtLevel(16));p.seen['act2:first-spirit-encounter']=true;p.seen['map-story-v'+HonroStoryContent.version+'-12']=true;if(choice)p.honroRouteHandoff={revision:1,choice,fromStage:12,toStage:13,sourceRun:'browser13-fixture'};a.profile=p;a.launch(13);a.turnNotice=null;a.lastTurnNotice='1:player';return a.engine.b.honroCampaignMapRevision;}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1280,'height':800});errors=[];rows=[];views=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def boot():
  page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroAct23V4Reviewed13');page.evaluate(PAUSE)
 def at(id):
  page.evaluate('()=>{if(HonroApp.screen==="battle"){t13(650);HonroApp.updateHUD(true);}}');actual=page.evaluate('HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId')
  assert actual==id,(id,actual,page.evaluate('HonroAct23V4ReviewedChapters.memory(HonroApp.engine.b)'))
  assert page.locator('#story-line').text_content()==page.evaluate('id=>HonroAct23V4ReviewedChapters.row(id,13).text',id);rows.append(id)
 def finish():
  for _ in range(20):
   if not page.evaluate('!!HonroApp.dialogue'):break
   page.keyboard.press('Enter')
  assert not page.evaluate('!!HonroApp.dialogue')
 def next():page.keyboard.press('Enter')
 def capture(name,point=None,scale=.7):
  if point:page.evaluate('({p,z})=>{const a=HonroApp,s=a.scene;s.manual=true;s.storyTween=null;s.cinematic=null;s.goalFocus=null;s.x=p[0];s.y=p[1];s.scale=z;s.render(a.engine,0,a.selected,a.power,false,0,true);}',{'p':point,'z':scale})
  page.wait_for_timeout(100);page.screenshot(path=str(OUT/(name+'.png')));views.append({'file':name+'.png','viewport':page.viewport_size,'point':point,'scale':scale if point else 'production framing','row':page.evaluate('HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId')})
 def resume():
  page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(PAUSE);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"')
 def objective(id):
  page.evaluate('HonroApp.updateHUD(true)');assert page.locator('#objective-text').text_content()==page.evaluate('id=>HonroAct23V4ReviewedChapters.row(id,13).text',id);rows.append(id)
 boot();assert page.evaluate(LAUNCH,None)==513;objective('A2.S13.OBJECTIVE.01')
 page.evaluate("""()=>{for(const u of HonroApp.engine.b.units)if(u.side===1&&!['resident-spirit-1','a2-enemy-3','a2-enemy-40'].includes(u.id)){u.dead=true;u.hp=0;}}""")
 at('EDGE.ARRIVALS_13_0');assert page.evaluate('HonroApp.engine.unit("resident-1").name')=='???';capture('01-arrival-production');capture('02-entry-rope-unknown',[2455,3360],.9);resume();at('EDGE.ARRIVALS_13_0');finish()
 page.evaluate("""()=>{ground13(hero13('occultist'),2290);ground13(hero13('mage'),2160);ground13(hero13('knight'),2820);pose13(hero13('archer'),3000,3380.25);}""")
 for id in ['A2.S13.BRANCH.03','A2.S13.INTRO.01','A2.S13.INTRO.02','A2.S13.MID.01','A2.S13.MID.02']:
  at(id)
  if id=='A2.S13.INTRO.02':capture('03-attached-arm-production')
  finish()
 page.evaluate("""()=>{const a=HonroApp,e=a.engine;e.hurt(e.unit('a2-enemy-3'),999999,hero13('archer').id);ground13(hero13('archer'),2130);e.b.active=hero13('archer').id;let aim;for(let angle=-40;angle<=70&&!aim;angle+=2)for(let power=.1;power<=1;power+=.025){const p=e.predict(hero13('archer'),HONRO_CORE.SKILLS.A01,angle,power);if(p.unit==='resident-1'){aim={angle,power};break;}}if(!aim)throw Error('actual civilian trajectory');}""")
 at('A2.S13.POPUP.01');capture('04-living-person-warning');finish()
 page.evaluate("""()=>{const a=HonroApp;ground13(hero13('archer'),3000);ground13(hero13('mage'),2180);ground13(hero13('occultist'),2310);Object.assign(a.engine.b,{active:hero13('occultist').id,side:0,phase:'aim'});if(HonroAct23V4.use(a,HonroAct23V4.marker(a.engine.b,'13.extract'))!==false)throw Error('preamble must precede extraction');}""")
 at('A2.S13.MID.03');capture('05-rescue-preamble');resume();at('A2.S13.MID.03');finish()
 page.evaluate("""()=>{const a=HonroApp;Object.assign(a.engine.b,{active:hero13('occultist').id,side:0,phase:'aim'});if(!HonroAct23V4.use(a,HonroAct23V4.marker(a.engine.b,'13.extract')))throw Error('actual extraction');}""")
 at('A2.S13.MID.04');objective('A2.S13.OBJECTIVE.02');capture('06-supported-rescue');assert page.evaluate('HONRO_CORE.validTerrainContactPose(HonroApp.engine.b.terrain,HonroApp.engine.unit("resident-1"))');finish()
 page.evaluate("""()=>{for(const [i,u]of HonroApp.engine.heroesAlive().entries())ground13(u,1500+i*110);ground13(hero13('archer'),2900);HonroApp.engine.b.active=hero13('archer').id;}""")
 at('A2.S13.MID.05');objective('A2.S13.OBJECTIVE.03');assert page.evaluate('HonroAct23V4Act2Scenes.memory(HonroApp.engine.b).walks["13.escort"].distance>200');capture('07-safe-family-production');next();at('A2.S13.MID.06');next();at('A2.S13.MID.07');next();at('A2.S13.MID.08');finish()
 at('A2.S13.MID.09');capture('08-latch-production');capture('09-latch-close',[2735,3415],1.25);assert page.evaluate('HonroAct23V4ReviewedChapters.memory(HonroApp.engine.b).latch.latched');finish()
 page.evaluate("""()=>{const a=HonroApp;ground13(hero13('occultist'),2830);Object.assign(a.engine.b,{active:hero13('occultist').id,side:0,phase:'aim'});if(!HonroAct23V4.use(a,HonroAct23V4.marker(a.engine.b,'13.release')))throw Error('safe release');ground13(hero13('archer'),4280);a.engine.b.active=hero13('archer').id;}""")
 at('A2.S13.MID.10');capture('10-closed-door-production');capture('11-upper-route-and-bolt',[4410,3840],.72);finish();at('A2.S13.MID.11');assert page.evaluate('HonroApp.dialogue.lines[HonroApp.dialogue.index][2].camera.id')=='reviewed13.inside-bolt';capture('12-bolt-point-production');resume();at('A2.S13.MID.11');finish()
 before=page.evaluate('HonroApp.engine.b.units.length');at('A2.S13.MID.12');assert page.evaluate('HonroApp.engine.b.units.length')==before+2;assert page.evaluate('HonroApp.dialogue.lines[HonroApp.dialogue.index][2].camera.id')=='reviewed13.lower-arrivals';capture('13-two-arrivals-production');capture('14-two-real-ascending-souls',[5350,4080],.8);page.set_viewport_size({'width':390,'height':844});page.evaluate('HonroStory.draw(HonroApp)');capture('15a-two-arrivals-production-mobile');capture('15-two-arrivals-mobile',[5325,4060],.48);page.set_viewport_size({'width':1280,'height':800});resume();at('A2.S13.MID.12');finish();page.evaluate('t13(20)');assert page.evaluate('HonroApp.engine.b.units.length')==before+2
 page.evaluate("""()=>{const a=HonroApp,b=a.engine.b;ground13(hero13('archer'),4400);Object.assign(b,{active:hero13('archer').id,side:0,phase:'aim'});if(HonroAct23V4.use(a,HonroAct23V4.marker(b,'gate'))!==false)throw Error('outside bolt');ground13(hero13('archer'),4050);for(const u of a.engine.heroesAlive().filter(u=>u!==hero13('archer')))ground13(u,1800+(u.cls==='mage'?120:u.cls==='knight'?240:0));let jumps=0;for(const p of [{x:4220,y:3940},{x:4350,y:3795},{x:4470,y:3648.1},{x:4630,y:4092.9}]){let landed=false;for(let i=0;i<300;i++){const u=hero13('archer');u.moveLeft=Math.max(u.moveLeft,180);if(a.engine.grounded(u)&&u.y>p.y+35&&a.engine.jump(u))jumps++;a.engine.walk(u,Math.sign(p.x-u.x),Math.min(.025,Math.abs(p.x-u.x)/(u.walkSpeed||230)));a.engine.stepUnits(.025);if(Math.abs(u.x-p.x)<28&&a.engine.grounded(u)&&Math.abs(u.y-p.y)<38){landed=true;break;}}if(!landed)throw Error('upper route '+JSON.stringify(p));}if(jumps<3)throw Error('missing jumps');Object.assign(b,{active:hero13('archer').id,side:0,phase:'aim'});if(!HonroAct23V4.use(a,HonroAct23V4.marker(b,'gate')))throw Error('inside bolt');t13();}""")
 capture('16-opened-inside-bolt',[4495,3850],.72);assert not page.evaluate('HonroAct23V4.state(HonroApp.engine.b).complete')
 page.evaluate("""()=>{for(const [i,u]of HonroApp.engine.heroesAlive().entries())ground13(u,4720+i*90);t13(5);}""")
 at('A2.S13.COMPLETE.01');capture('17-departure-production');next();at('A2.S13.COMPLETE.02');resume();at('A2.S13.COMPLETE.02');finish();page.evaluate('t13(5)');assert page.evaluate('HonroAct23V4.state(HonroApp.engine.b).complete');assert page.evaluate('HonroApp.profile.record.filter(r=>r.rowId==="A2.S13.JOURNAL.01").length')==1;capture('18-final-combined-world',[3670,3710],.4)
 # Journal and all optional rows through the actual rest UI.
 page.evaluate('HonroRestJourney.showRest(HonroApp)');page.locator('[data-action="journey-book"]').click();page.locator('.journey-records > summary').click();assert page.locator('[data-reviewed-row="A2.S13.JOURNAL.01"]').count()==1;rows.append('A2.S13.JOURNAL.01');capture('19-journal')
 page.evaluate("""()=>{const a=HonroApp;a.engine=null;a.profile.honroBattle=null;a.profile.cleared[13]=undefined;a.profile.honroJourney={version:1,talked:{}};HonroRestJourney.showRest(a);}""")
 for cls,count in [('archer',2),('mage',4),('knight',1),('occultist',2)]:
  page.locator('[data-action="rest-talk"][data-class="'+cls+'"]').click()
  for i in range(count):
   at('EDGE.OPTIONAL_13_'+cls.upper()+'_'+str(i));next()
 capture('20-rest-after-optionals')
 # A/B preserve entry positions and require correct actual physical height.
 page.evaluate(LAUNCH,'A');at('EDGE.ARRIVALS_13_0');finish();at('A2.S13.BRANCH.01');finish();page.evaluate(LAUNCH,'B');at('EDGE.ARRIVALS_13_0');finish();page.evaluate('t13(10)');assert not page.evaluate('!!HonroApp.dialogue');page.evaluate("ground13(hero13('knight'),3000)");at('A2.S13.BRANCH.02');finish()
 page.evaluate("""()=>{const a=HonroApp;a.engine.hurt(a.engine.unit('resident-1'),999999,hero13('archer').id);if(HonroAct23V4ReviewedChapters.lineAllowed(a,'석공',{rowId:'A2.S13.COMPLETE.02',reviewedStage:13,reviewedRevision:1}))throw Error('dead speaker');}""")
 failtext=page.evaluate('HonroAct23V4ReviewedChapters.row("A2.S13.FAIL.01",13).text');assert page.evaluate('HonroAct23V4.state(HonroApp.engine.b).failureText')==failtext;page.evaluate('HonroApp.battleHelp()');assert page.get_by_text(failtext,exact=True).count()==1;rows.append('A2.S13.FAIL.01');capture('21-failure-help')
 expected={r['id'] for r in json.loads((ROOT/'shared/data/reviewed/act23-v4-ch13.json').read_text())['rows']};assert set(rows)==expected,(expected-set(rows),set(rows)-expected)
 assert not errors,errors
 sources={str(p):hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['shared/runtime/act23-v4-reviewed13.js','shared/data/reviewed/act23-v4-ch13.json','tools/testing/act23-v4-reviewed13-browser.py']}
 (OUT/'capture.json').write_text(json.dumps({'scope':'Actual Chromium DOM/Canvas/Enter/localStorage. Declared combat removals and hero initial/inspection/exit poses; real NPC escort, enemy approach, two-soul uphill walk, and upper-route Engine jumps. No normal fullplay/audio claim.','sources':sources,'rows':rows,'views':views,'pageErrors':errors},ensure_ascii=False,indent=2)+'\n')
 print('PASS reviewed13 DOM/Canvas/Enter, rescue/bolt/departure save cursors, real escort/ascending pair/upper jumps, journal/rest and death guards; no page errors');browser.close()
