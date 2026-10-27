"""Focused approved-common Chromium UI; declared perception/action-boundary fixtures.
No normal combat, skill-hit, chapter completion, audio or deployment claim.
"""
import hashlib,json,os,pathlib,subprocess
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'_local/reports/act23-v4/reviewed-common-browser';OUT.mkdir(parents=True,exist_ok=True)
BASE=os.getenv('HONRO_BASE_URL','http://127.0.0.1:8768')
PAUSE="""()=>{const a=HonroApp;if(a.commonReviewPaused)return;const frame=a.frame;a.commonReviewPaused=true;a.frame=function(t){if(this.engine&&this.scene&&this.screen==='battle'){this.prev=t;this.scene.render(this.engine,0,this.selected,this.power,false,0,true);requestAnimationFrame(n=>this.frame(n));}else frame.call(this,t);};}"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1280,'height':800});errors=[];rows=[];views=[];proof={}
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/HONRO.html');page.wait_for_function('!!globalThis.HonroAct23V4ReviewedCommon&&!!globalThis.HonroApp');page.evaluate(PAUSE)
 assert page.evaluate('HonroAct23V4ReviewedCommon.enabled()')
 assert page.evaluate('HONRO_ACT23_V4_REVIEWED_COMMON')==json.loads((ROOT/'shared/data/reviewed/act23-v4-common.json').read_text())
 served={};bundles=[];manifest=page.request.get(BASE+'/web/manifest.json').json()
 for asset in manifest['common']+manifest['gameOnly']:
  if '/runtime/' in asset:bundles.append((asset,page.request.get(BASE+'/'+asset).body()))
 paths=['shared/runtime/act23-v4-reviewed-common.js','shared/runtime/act2.js','shared/runtime/act3-void.js','shared/runtime/story.js']
 for path in paths:
  compiled=subprocess.run(['node','--input-type=module','-e',"import{minify}from'terser';import{readFileSync}from'node:fs';process.stdout.write((await minify(readFileSync(0,'utf8'),{module:true,compress:false,mangle:false,format:{comments:false}})).code);"],input=(ROOT/path).read_text(),text=True,capture_output=True,check=True).stdout.rstrip(';')
  matches=[(asset,body)for asset,body in bundles if compiled in body.decode()]
  assert matches,'Served candidate differs from canonical source: '+path
  served[path]={'asset':matches[0][0],'sha256':hashlib.sha256(matches[0][1]).hexdigest()}
 def launch(stage,seen=True):
  page.evaluate("""async({stage,seen})=>{const a=HonroApp;await HonroCampaignLoader.ensureStage(stage);a.stopBattle();a.close();const p=HonroProfileStore.fresh();p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];for(let n=1;n<stage;n++)p.cleared[n]={visits:1,rounds:1};for(const cls of p.recruited)HONRO_CORE.grantXP(p.heroes[cls],HONRO_CORE.xpAtLevel(16));if(seen)p.seen['act2:first-spirit-encounter']=true;a.profile=p;a.launch(stage);a.turnNotice=null;Object.assign(a.engine.b,{side:0,phase:'aim'});}""",{'stage':stage,'seen':seen})
 def snap(name):
  page.wait_for_timeout(80);page.screenshot(path=str(OUT/(name+'.png')));views.append({'file':name+'.png','viewport':page.viewport_size})
 def finish():
  for _ in range(20):
   if not page.evaluate('!!HonroApp.dialogue'):return
   page.keyboard.press('Enter')
  raise AssertionError('dialogue did not close')
 def resume():
  page.evaluate('HonroApp.stopBattle()');page.reload();page.wait_for_function('!!globalThis.HonroApp&&HonroApp.screen==="title"');page.evaluate(PAUSE);page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"');page.evaluate('HonroApp.turnNotice=null')
 for branch in ['manifest','lamp','neither','fallback']:
  launch(11,False)
  setup=page.evaluate("""branch=>{const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE,M=HonroAct23V4ReviewedCommon,s=e.heroesAlive().find(u=>u.cls==='occultist'),spirit=b.units.find(u=>u.side===1&&u.honroSpirit);Object.assign(s,{acted:false,focus:branch==='fallback'?0:999,maxFocus:999,cooldowns:{},loadout:branch==='manifest'?['O01','O08']:branch==='fallback'?['O08']:['O01']});Object.assign(spirit,{x:s.x+220,y:s.y,vx:0,vy:0});for(const m of b.honroMarkers)if(m.id?.startsWith('spirit-lamp'))m.collected=true;let lamp=null;if(branch==='lamp'){const x=s.x+440,y=e.surface(x).y;lamp={id:'spirit-lamp-browser-fixture',action:'act2',x,y,radius:1200};b.honroMarkers.push(lamp);}a.selectedByUnit[s.id]='O01';a.selectHero(s.id);if(e.active.id!==s.id||!M.selectable(e,s))throw Error('Sodan is not actually selectable');a.updateHUD(true);return{sodan:s.id,active:e.active.id,manifestSkill:C.SKILLS.O08.name,manifestUsable:M.usable(e,s,'O08'),skillAllowed:e.skillAllowed(C.SKILLS.O08,s),manaCost:e.manaCost(C.SKILLS.O08,s),lamp:lamp&&{id:lamp.id,distance:Math.hypot(s.x-lamp.x,s.y-lamp.y),available:M.lampAvailable(e,lamp,spirit,e.heroesAlive())},soulName:C.SKILLS.O01.name};}""",branch)
  assert setup['active']==setup['sodan']
  if branch=='manifest':
   assert setup['manifestUsable'] and setup['skillAllowed'];page.locator('[data-action="combat-skill"][data-skill="O08"]').click();assert page.evaluate('HonroApp.selected')=='O08';snap('01-real-O08-skill-selected')
  if branch=='lamp':assert setup['lamp']['distance']>300 and setup['lamp']['available']
  ls=page.evaluate("""()=>{const a=HonroApp,b=a.engine.b;a.actorBoundary=false;HonroAct2.firstSpiritEncounter(a,a.engine.heroesAlive());const lines=structuredClone(b.honroState.storyQueue);b.honroState.actorTurnSerial=(b.honroState.actorTurnSerial||0)+1;a.actorBoundary=b.active;HonroStory.tick(a,performance.now());a.actorBoundary=false;return lines;}""")
  assert len(ls)==6,(branch,ls)
  reply='MANIFEST'if branch=='manifest'else'LAMP'if branch=='lamp'else'NEITHER'
  assert ls[4][2]['canonicalId']=='EDGE.VALUES_FIRSTSPIRIT_REPLY_'+reply
  for i,line in enumerate(ls):
   assert page.locator('#story-line').text_content()==line[1],(branch,i)
   if i<5:assert line[1]==page.evaluate('id=>HonroAct23V4ReviewedCommon.row(id).text',line[2]['canonicalId'])
   rows.append({'branch':branch,'id':line[2]['canonicalId'],'text':line[1]})
   if i in [4,5]:snap('02-'+branch+'-'+str(i))
   if branch=='fallback'and i==5:assert line[1].startswith('소단의 혼 공격은')and setup['soulName']not in line[1]
   if i==5:
    variants=page.evaluate('HONRO_ACT23_V4_REVIEWED_COMMON.dynamic_variants');prefix=variants[1]['text']if branch=='fallback'else variants[0]['text'].replace('${C.SKILLS[soul].name}',setup['soulName']);suffix=next(r['text']for r in variants if r['when']==('neither'if branch in ['neither','fallback']else branch));assert line[1]==prefix+suffix
   page.keyboard.press('Enter')
  assert not page.evaluate('!!HonroApp.dialogue')
  proof[branch]={'setup':setup,'queuedRows':ls}
 # The instruction to select Sodan must be withheld when selection is impossible.
 for invalid in ['acted','dead','enemy-turn']:
  launch(11,False)
  state=page.evaluate("""invalid=>{const a=HonroApp,e=a.engine,b=e.b,s=e.heroesAlive().find(u=>u.cls==='occultist'),spirit=b.units.find(u=>u.side===1&&u.honroSpirit);Object.assign(spirit,{x:s.x+220,y:s.y});if(invalid==='acted')s.acted=true;if(invalid==='dead'){s.dead=true;s.hp=0;}if(invalid==='enemy-turn')b.side=1;HonroAct2.firstSpiritEncounter(a,e.heroesAlive());HonroStory.tick(a,performance.now());return{queue:b.honroState.storyQueue.length,dialogue:!!a.dialogue,seen:!!a.profile.seen['act2:first-spirit-encounter']};}""",invalid)
  assert state=={'queue':0,'dialogue':False,'seen':False},(invalid,state)
  proof['unselectable-'+invalid]=state
 launch(16)
 proof['temple']=page.evaluate("""()=>{const a=HonroApp,b=a.engine.b;return{stage:b.honroStage,available:HonroAct23V4ReviewedCommon.templeAvailable(b),actors:['objective','resident-1'].map(id=>({id,alive:HonroAct23V4.alive(a.engine.unit(id))})),steps:HonroAct23V4.steps(b).map(s=>s.id),guide:HonroObjectives.help(a).guide};}""")
 assert proof['temple']['available']
 page.locator('[data-action="battle-help"]').click();assert page.locator('.battle-help-goal').inner_text().find(proof['temple']['guide'])>=0;assert proof['temple']['guide']==page.evaluate('HonroAct23V4ReviewedCommon.row("EDGE.RUNTIME.TEMPLE.GUIDE").text');snap('03-actual-temple-help-modal');page.locator('.battle-help-dialog .primary[data-action="close"]').click()
 launch(27)
 proof['voidInitial']=page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,archer=b.units.find(u=>u.side===0&&u.cls==='archer'),m=HonroAct23V4.marker(b,'family-manifest');if(!archer||!m||!HonroAct3Void.enabled(b))throw Error('real stage27 void/archer/manifest unavailable');return{void:b.honroAct3Void,archer:{id:archer.id,x:archer.x,y:archer.y},marker:m,zone:b.honroMap.act3.voidEncounter?.trigger||b.honroMap.act3.crossings.at(-1).landing};}""")
 assert page.evaluate('HonroAct3Void.beforeManifest(HonroApp,HonroAct23V4.marker(HonroApp.engine.b,"family-manifest"))')
 expected=page.evaluate('HonroAct23V4ReviewedCommon.row("EDGE.RUNTIME.VOID.REJOIN_PROMPT").text');assert page.locator('#story-line').text_content()==expected;assert'명세'not in expected;snap('04-actual-void-rejoin-guide');resume();assert page.locator('#story-line').text_content()==expected;snap('05-void-guide-resumed');finish()
 proof['voidJoined']=page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,u=b.units.find(u=>u.side===0&&u.cls==='archer'),z=b.honroMap.act3.voidEncounter?.trigger||b.honroMap.act3.crossings.at(-1).landing;Object.assign(u,{x:(z.left+z.right)/2,y:z.y,vx:0,vy:0,airborne:false,jumping:false});const allowed=HonroAct23V4ReviewedCommon.allowed(a,{rowId:'EDGE.RUNTIME.VOID.REJOIN_PROMPT'}),result=HonroAct3Void.beforeManifest(a,HonroAct23V4.marker(b,'family-manifest'));return{allowed,result,dialogue:a.dialogue?.lines||null,state:b.honroAct3Void.state};}""")
 assert not proof['voidJoined']['allowed']and not proof['voidJoined']['dialogue'];snap('06-void-rejoin-guide-suppressed')
 assert not errors,errors
 sources={path:hashlib.sha256((ROOT/path).read_bytes()).hexdigest()for path in paths+['shared/data/reviewed/act23-v4-common.json','tools/testing/act23-v4-reviewed-common-browser.py']}
 (OUT/'capture.json').write_text(json.dumps({'base':BASE,'scope':'Focused actual Chromium DOM/Canvas/Enter; declared prior-clear/level/loadout/perception/lamp/action-boundary/archer-rejoin pose fixtures. No natural combat, skill impact, chapter completion, audio or deployment claim.','sources':sources,'servedSources':served,'rows':rows,'views':views,'proof':proof,'pageErrors':errors},ensure_ascii=False,indent=2)+'\n')
 browser.close();print('PASS common Chromium: exact7 locked bodies, one-of3 replies, real O08 skill HUD, distant reachable lamp, no-skill fallback, selectable Sodan, temple help, saved void guide and rejoin suppression; no page errors')
