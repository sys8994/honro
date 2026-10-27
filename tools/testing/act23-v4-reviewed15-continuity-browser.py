"""Focused Chromium 15→16 continuity; immutable parent build, no build step.
Supported archer poses, inspection camera and won/clear terminal are QA fixtures.
Witness creation, Canvas, save/Continue, history and rest UI use production code.
"""
import hashlib,json,os,pathlib,subprocess
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'_local/reports/act23-v4/reviewed15-continuity-browser';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('HONRO_BASE_URL','http://127.0.0.1:8768')
PAUSE="""()=>{const a=HonroApp,f=a.frame;a.reviewPaused=true;a.frame=function(t){if(this.reviewPaused&&this.engine&&this.scene&&this.screen==='battle'){this.prev=t;this.scene.render(this.engine,0,this.selected,this.power,false,1/60,true);requestAnimationFrame(n=>this.frame(n));}else f.call(this,t);};globalThis.pose15=(x,support='act2-floor')=>{const b=a.engine.b,u=HonroAct23V4.heroes(b).find(u=>u.cls==='archer'),t=b.terrain.find(t=>t.id===support&&!t.broken);Object.assign(u,{x,y:HONRO_CORE.topAt(t,x),vx:0,vy:0,jumping:false,airborne:false,acted:false});if(!HONRO_CORE.validTerrainContactPose(b.terrain,u))throw Error('unsupported archer fixture');Object.assign(b,{active:u.id,side:0,phase:'aim'});a.turnNotice=null;a.updateHUD(true);return{id:u.id,x:u.x,y:u.y,support};};}"""
LAUNCH="""async()=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(15);await HonroCampaignLoader.ensureStage(16);a.stopBattle();a.close();const p=HonroProfileStore.fresh();p.revision=13;p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(let i=1;i<=14;i++)p.cleared[i]={visits:1,rounds:1};for(const c of p.recruited)HONRO_CORE.grantXP(p.heroes[c],HONRO_CORE.xpAtLevel(16));p.seen['act2:first-spirit-encounter']=true;p.seen['map-story-v'+HonroStoryContent.version+'-14']=true;a.profile=p;a.launch(15);a.turnNotice=null;a.lastTurnNotice='1:player';return a.engine.b.honroCampaignMapRevision;}"""
CAMERA={'x':5780,'y':4510,'scale':.75}
FACT='HonroAct23V4Reviewed15.memory(HonroApp.engine.b).continuity?.brokenPulley'
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('HONRO_BROWSER','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1200,'height':800});errors=[];captures=[];assets={}
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp&&!!globalThis.HonroAct23V4Reviewed16');page.evaluate(PAUSE)
 # Compare every byte of canonical minified source, not a feature substring.
 common={a:page.request.get(BASE+'/'+a).body() for a in page.request.get(BASE+'/web/manifest.json').json()['common'] if 'ordered-common' in a}
 for n in [15,16]:
  source=subprocess.check_output(['node','--input-type=module','-e',"import{readFile}from'node:fs/promises';import{minify}from'terser';const s=await readFile(process.argv[1],'utf8');process.stdout.write((await minify(s,{module:true,compress:false,mangle:false,format:{comments:false}})).code.replace(/;$/,''));",f'shared/runtime/act23-v4-reviewed{n}.js'],cwd=ROOT,text=True)
  matched=[(a,b) for a,b in common.items() if source in b.decode()]
  assert len(matched)==1,f'candidate does not match full reviewed{n} source; parent rebuild required'
  asset,body=matched[0];assets[str(n)]={'asset':asset,'assetSHA256':hashlib.sha256(body).hexdigest(),'sourceSHA256':hashlib.sha256((ROOT/f'shared/runtime/act23-v4-reviewed{n}.js').read_bytes()).hexdigest(),'canonicalFullSourceMatch':True}
 assert page.evaluate(LAUNCH)==515
 def render():
  page.evaluate("""p=>{const a=HonroApp,s=a.scene;s.manual=true;s.storyFrame=null;s.storyTween=null;s.cinematic=null;s.goalFocus=null;s.focusUntil=s.speakerUntil=0;Object.assign(s,p);s.render(a.engine,0,a.selected,a.power,false,1/60,true);}""",CAMERA)
 def snap(name):
  page.wait_for_timeout(120);page.screenshot(path=str(OUT/(name+'.png')))
  captures.append({'file':name+'.png','viewport':page.viewport_size,'state':page.evaluate("""()=>{const a=HonroApp;return{screen:a.screen,row:a.dialogue?.lines[a.dialogue.index]?.[2]?.rowId,camera:a.scene&&{x:a.scene.x,y:a.scene.y,scale:a.scene.scale},battle:a.engine?.b.honroStage};}""")})
 def finish():
  for i in range(30):
   if not page.evaluate('!!HonroApp.dialogue'):return
   page.keyboard.press('Enter')
  raise AssertionError('dialogue did not end naturally')
 finish();render();assert not page.evaluate(FACT),'camera alone fabricated witness'
 blocked=page.evaluate("pose15(5900,'fc15-dry-basin-rim')");render();assert not page.evaluate(FACT),'occluded dry-rim observer fabricated witness'
 snap('01-dry-rim-no-receipt')
 clear=page.evaluate('pose15(6100)');render();page.wait_for_function('!!'+FACT)
 receipt=page.evaluate(FACT);assert receipt['observer']==clear['id'];assert receipt['sight']['terrainClear'];assert receipt['sight']['renderedUnderWater']
 assert all(receipt['sight']['viewport'][k]==v for k,v in CAMERA.items()),receipt
 assert receipt['sight']['viewport']['width']>0 and receipt['sight']['viewport']['height']>0
 snap('02-supported-archer-underwater-pulley')
 preserved=page.evaluate('JSON.parse(JSON.stringify({heroes:HonroApp.profile.heroes,cleared:HonroApp.profile.cleared}))')
 session=page.evaluate('HonroApp.engine.b.session')
 page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(PAUSE);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"')
 assert page.evaluate('HonroApp.engine.b.session')==session;assert page.evaluate(FACT)==receipt
 restored=page.evaluate('JSON.parse(JSON.stringify({heroes:HonroApp.profile.heroes,cleared:HonroApp.profile.cleared}))')
 assert restored==preserved,{'before':preserved,'after':restored}
 render();snap('03-continue-same-witness')
 # Declared terminal fixture: it does not claim chapter combat or route completion.
 history=page.evaluate("""()=>{const a=HonroApp,b=a.engine.b;HonroAct23V4.recordOutcome(a,true);return a.profile.honroAct23V4History.stages[15];}""")
 physical=history['reviewedPhysical'];assert history['run']==session==physical['sourceRun'];assert physical['proof']['brokenPulley']==receipt
 assert physical['brokenPulleysObserved'] and not physical['upwardHandsObserved'];assert physical['proof']['upwardHands'] is None
 page.evaluate("""()=>{const a=HonroApp,round=a.engine.b.round;a.stopBattle();a.profile.cleared[15]={visits:1,rounds:round};a.profile.honroBattle=null;a.engine=null;a.dialogue=null;delete HonroRestJourney.state(a.profile).restStageId;HonroRestJourney.showRest(a);}""")
 finish();assert page.evaluate('HonroApp.screen')=='rest';assert page.evaluate('HonroRestJourney.restNext(HonroApp).stageId')==16
 assert not page.evaluate('!!HonroApp.profile.honroBattle'),'pre16 rest must have no active battle'
 assert page.locator('[data-action="rest-talk"][data-class="archer"]').is_enabled()
 assert page.locator('[data-action="rest-talk"][data-class="occultist"]').is_disabled()
 page.locator('[data-action="rest-talk"][data-class="archer"]').click()
 actual=page.evaluate('({id:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId,text:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[1]})')
 assert actual['id']=='EDGE.OPTIONAL_16_ARCHER_0',actual
 approved=json.loads((ROOT/'shared/data/reviewed/act23-v4-ch16.json').read_text())
 assert actual['text']==next(r['text'] for r in approved['rows'] if r['id']==actual['id'])==page.locator('#story-line').text_content()
 snap('04-pre16-exact-archer-optional')
 rest_cursor=page.evaluate('HonroApp.profile.honroJourney.story')
 page.reload();page.wait_for_function('!!globalThis.HonroApp');page.evaluate(PAUSE);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="rest"&&!!HonroApp.dialogue')
 assert page.evaluate('HonroApp.dialogue.lines[HonroApp.dialogue.index][2].rowId')==actual['id']
 assert page.locator('#story-line').text_content()==actual['text'];snap('05-pre16-rest-cursor-continued');finish()
 assert page.evaluate('HonroApp.profile.honroAct23V4History.stages[15]')==history
 assert not errors,errors
 report={'sourceHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'base':BASE,'candidateHTMLSHA256':hashlib.sha256(page.request.get(BASE+'/HONRO.html').body()).hexdigest(),'scriptSHA256':hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(),'loadedRuntimes':assets,'fixtures':{'blockedArcher':blocked,'clearArcher':clear,'inspectionCamera':CAMERA,'terminal':'recordOutcome(true) plus cleared[15]; no combat/route completion claim'},'receipt':receipt,'history':history,'pre16Optional':actual,'restCursor':rest_cursor,'captures':captures,'pageErrors':errors,'checks':['Full canonical served reviewed15 and reviewed16 source match.','Real Canvas water/prop presentation creates witness only for supported nearby archer with clear production terrain ray; camera alone and actual blocked rim do not.','Actual localStorage reload and Continue preserve receipt, run, hero growth and cleared keys.','Won-outcome production history binds receipt to same sourceRun; unsupported below-sluice hands remain false/null.','Actual pre16 rest archer button opens exact approved optional row without an active battle; occultist unavailable.','Actual rest optional cursor survives localStorage reload/Continue and Enter completion.'],'limits':['Supported archer poses and inspection camera are declared fixtures; no normal-input traversal claim.','Won outcome and chapter15 clear are declared terminal fixtures; no chapter15 combat/route completion claim.','Screenshots require direct visual review; no audio listening, mobile, build, commit, deployment or broader chapter acceptance.']}
 (OUT/'capture.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');browser.close()
 print('PASS reviewed15→16 Chromium water witness, Continue, same-run history and exact pre16 rest archer optional; inspect screenshots separately')
