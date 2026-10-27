"""Chromium chapter19 acceptance. Prior clears and hero approach poses are fixtures;
all props, departures, traces and resident return execute production owners."""
import hashlib,json,os,pathlib,subprocess
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act23-v4/reviewed19-browser';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('HONRO_BASE_URL','http://127.0.0.1:8768')
PAUSE="""()=>{const a=HonroApp,f=a.frame;a.reviewPaused=true;a.frame=function(t){if(this.reviewPaused&&this.engine&&this.scene&&this.screen==='battle'){this.prev=t;this.scene.render(this.engine,0,this.selected,this.power,false,0,true);requestAnimationFrame(n=>this.frame(n));}else f.call(this,t);};globalThis.tick19=(n=1)=>{for(let i=0;i<n&&!a.dialogue;i++){Object.assign(a.engine.b,{side:0,phase:'aim'});HonroAct23V4.tick(a,.025);if(!a.dialogue)a.engine.stepUnits(.025);}};globalThis.pose19=(u,x,y)=>Object.assign(u,{x,y,vx:0,vy:0,jumping:false,airborne:false,acted:false});globalThis.ground19=(u,x)=>pose19(u,x,HonroMapEngine.surfaceY(a.engine.b.terrain,x,undefined,'act2-floor').y);globalThis.use19=(id,cls='occultist')=>{const p=HonroAct23V4.marker(a.engine.b,id),u=a.engine.b.units.find(u=>u.cls===cls);pose19(u,p.x,p.y);Object.assign(a.engine.b,{active:u.id,side:0,phase:'aim'});if(!HonroAct23V4.use(a,p))throw Error('use '+id);};}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=browser.new_page(viewport={'width':1280,'height':800});errors=[];rows=[];views=[];proof={};page.on('pageerror',lambda e:errors.append(str(e)))
 def boot():
  page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroAct23V4Reviewed19');page.evaluate(PAUSE)
 def current():return page.evaluate('HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId')
 def record():
  id=current()
  if id:
   assert page.locator('#story-line').text_content()==page.evaluate('id=>HonroAct23V4ReviewedChapters.row(id,19).text',id);rows.append(id)
 def at(id):
  page.evaluate('tick19(650)');assert current()==id,(id,current(),page.evaluate('HonroAct23V4Reviewed19.memory(HonroApp.engine.b)'));record()
 def objective(id):
  page.evaluate('HonroApp.updateHUD(true)');assert page.locator('#objective-text').text_content()==page.evaluate('id=>HonroAct23V4ReviewedChapters.row(id,19).text',id);rows.append(id)
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
 for path in ['shared/runtime/act23-v4-reviewed19.js','shared/runtime/act23-v4-reviewed-chapters.js' ]:
  source=(ROOT/path).read_text();compiled=subprocess.run(['node','--input-type=module','-e',"import{minify}from'terser';import{readFileSync}from'node:fs';process.stdout.write((await minify(readFileSync(0,'utf8'),{module:true,compress:false,mangle:false,format:{comments:false}})).code);"],input=source,text=True,capture_output=True,check=True).stdout.rstrip(';');matches=[(asset,body)for asset,body in bundles if compiled in body.decode()]
  assert matches,'Served candidate differs from local source: '+path
  served_sources[path]={'asset':matches[0][0],'sha256':hashlib.sha256(matches[0][1]).hexdigest()}
 page.evaluate("""async()=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(19);a.stopBattle();a.close();const p=HonroProfileStore.fresh();p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(let i=1;i<19;i++)p.cleared[i]={visits:1,rounds:1};for(const c of p.recruited)HONRO_CORE.grantXP(p.heroes[c],HONRO_CORE.xpAtLevel(16));p.seen['act2:first-spirit-encounter']=true;a.profile=p;a.launch(19);a.turnNotice=null;}""")
 assert page.evaluate('HonroApp.engine.b.honroCampaignMapRevision')==519;objective('A2.S19.OBJECTIVE.01')
 assert page.evaluate('HonroApp.engine.b.units.filter(u=>u.side===1).length')==0
 assert page.evaluate('HonroApp.engine.b.honroEvents.length')==0
 page.evaluate('tick19(8)');assert page.evaluate('HonroAct23V4Reviewed19.memory(HonroApp.engine.b).drops[1].status')=='lowering';capture('01-offerings-lowering')
 at('EDGE.ARRIVALS_19_0');capture('02-entry-production');proof['drops']=page.evaluate('HonroAct23V4Reviewed19.memory(HonroApp.engine.b).drops');finish();at('A2.S19.MID.01');finish()
 assert page.evaluate('HonroApp.engine.unit("p-archer").side')==2;assert page.evaluate('HonroApp.engine.unit("p-knight").side')==2
 page.evaluate('use19("route","mage")');at('A2.S19.MID.02');objective('A2.S19.OBJECTIVE.02');assert page.evaluate('HonroApp.engine.unit("p-mage").side')==2;resume();at('A2.S19.MID.02');finish()
 motion_saved=False
 for n in [3,1,2]:
  if n==2 and 'A2.S19.MID.04' not in rows:
   page.evaluate('()=>{const p=HonroAct23V4.marker(HonroApp.engine.b,"separate-2");ground19(HonroApp.engine.unit("p-occultist"),p.x-100);}')
   at('A2.S19.MID.04');capture('03-two-overlapping-souls');finish()
  page.evaluate('n=>use19("separate-"+n)',n);page.evaluate('tick19(4)')
  if n==3:
   if current()=='A2.S19.MID.04':capture('03-two-overlapping-souls');finish()
   at('A2.S19.MID.03');finish()
  for i in range(100):
   if page.evaluate('n=>!!HonroAct23V4Reviewed19.memory(HonroApp.engine.b).spirits[n].departed',n):break
   if current():finish()
   page.evaluate('tick19(4)')
   if n==3 and i==0:capture('04a-family-call-gesture')
   if n==3 and i==4:capture('04b-linked-spirit-response')
   if n==3 and not motion_saved and page.evaluate('(HonroAct23V4.mem(HonroApp.engine.b).farewell?.["send-3"]?.elapsed||0)>.1'):
    capture('04-moving-departure');before=page.evaluate('HonroAct23V4.mem(HonroApp.engine.b).farewell["send-3"].elapsed');resume();assert page.evaluate('HonroAct23V4.mem(HonroApp.engine.b).farewell["send-3"].elapsed')==before;motion_saved=True
  assert page.evaluate('n=>HonroAct23V4Reviewed19.memory(HonroApp.engine.b).spirits[n].departed',n)
  if current():finish()
 page.evaluate('tick19(3)')
 if current():finish()
 assert page.evaluate('HonroAct23V4Reviewed19.allGone(HonroApp.engine.b)');objective('A2.S19.OBJECTIVE.03');proof['departures']=page.evaluate('HonroAct23V4Reviewed19.memory(HonroApp.engine.b).spirits')
 page.evaluate('use19("old-soul")');at('A2.S19.EVIDENCE.01');assert page.evaluate('HonroAct23V4Reviewed19.allMarks(HonroApp.engine.b)');capture('05-three-traces-production');p=page.evaluate('HonroAct23V4.marker(HonroApp.engine.b,"old-soul")');capture('06-three-traces-close',[p['x'],p['y']],1.15);resume();at('A2.S19.EVIDENCE.01');finish();at('A2.S19.COMPLETE.01');finish();at('A2.S19.COMPLETE.02');capture('07-resident-return-production');finish();at('A2.S19.COMPLETE.03');finish()
 page.set_viewport_size({'width':390,'height':844});capture('08-mobile-return',[p['x']-1200,p['y']],.32);page.set_viewport_size({'width':1280,'height':800})
 for i in range(70):
  if page.evaluate('HonroAct23V4Reviewed19.complete(HonroApp.engine.b)'):break
  page.evaluate('()=>{HonroApp.engine.b.round++;tick19(100);}')
 assert page.evaluate('HonroAct23V4Reviewed19.complete(HonroApp.engine.b)');proof['physical']=page.evaluate('HonroAct23V4Reviewed19.memory(HonroApp.engine.b)');capture('09-final-overall',page.evaluate('()=>{const p=HonroAct23V4.marker(HonroApp.engine.b,"route");return[p.x+1200,p.y-150]}'),.32)
 for id in ['A2.S19.JOURNAL.01','A2.S19.JOURNAL.02']:
  assert page.evaluate('id=>HonroApp.profile.record.filter(r=>r.rowId===id).length',id)==1
 page.evaluate('()=>{const a=HonroApp;if(!a.checkMission(a.engine)||a.engine.b.phase!=="won")throw Error("real mission completion");a.outcome();}');assert page.evaluate('HonroApp.profile.honroAct23V4History.stages[19].reviewed19.familyWitness')==True
 (OUT/'completed-profile.json').write_text(json.dumps(page.evaluate('HonroApp.profile'),ensure_ascii=False,indent=2)+'\n')
 proof['mission']=page.evaluate('({complete:HonroAct23V4.state(HonroApp.engine.b).complete,done:HonroApp.done,screen:HonroApp.screen})')
 capture('10-result-dom');page.locator('[data-action="result-continue"]').click();page.locator('[data-action="journey-book"]').click();page.locator('[data-action="journey-select"][data-id="19"]').click();page.locator('.journey-records > summary').click()
 for id in ['A2.S19.JOURNAL.01','A2.S19.JOURNAL.02']:
  assert page.locator('[data-reviewed-row="'+id+'"]').count()==1;rows.append(id)
 capture('11-journal-dom')
 assert not errors,errors
 sources={str(p):hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['shared/runtime/act23-v4-reviewed19.js','shared/data/reviewed/act23-v4-ch19.json','tools/testing/act23-v4-reviewed19-browser.py']}
 (OUT/'capture.json').write_text(json.dumps({'scope':__doc__+' Actual DOM/Enter/localStorage/Canvas; no normal fullplay/audio/public deploy claim. Three observed call gestures and linked spirit responses are verified; no audible or invented spoken-name claim.','sources':sources,'servedSources':served_sources,'rows':sorted(set(rows)),'views':views,'proof':proof,'pageErrors':errors},ensure_ascii=False,indent=2)+'\n');print('PASS19 actual Chromium lowering/NPC roles/free 3-1-2 separation/auto-departures saved in motion/physical traces/resident return; no page errors');browser.close()
