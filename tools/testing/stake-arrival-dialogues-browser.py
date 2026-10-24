"""Normal App frames, mobile current-reach checkpoints; no full route/combat claim."""
from pathlib import Path
import json,sys
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/stake-arrival-dialogues/browser';OUT.mkdir(parents=True,exist_ok=True)
profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text());profile['cleared'].update({str(i):True for i in range(1,31)})
results=[]
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw)
 stages=[int(x.split('=')[1]) for x in sys.argv if x.startswith('--stage=')] or [25,27]
 for stage in stages:
  c=browser.new_context(viewport={'width':390,'height':844},has_touch=True);p=c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  p.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');');p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp?.screen==="title"')
  p.evaluate('''async id=>{await HonroCampaignLoader.ensureStage(id);const a=HonroApp;a.launch(id);for(let i=0;a.dialogue&&i<80;i++)HonroStory.finish(a);a.close();const b=a.engine.b,A=HonroAct3;b.honroState.storyQueue=[];for(const s of A.steps(b)){if(s.id==='stake-arrival-1')break;A.memory(b).done[s.id]=true;const m=A.marker(b,s.id);if(m)m.collected=true;}a.actorBoundary=b.active;window.arrivalStops=[];const say=a.sayLines.bind(a),event=a.event.bind(a);a.sayLines=lines=>{arrivalStops.push({kind:'dialogue',goal:lines[0]?.[2]?.evidenceGoal});return say(lines);};a.event=(text,meta)=>{if(meta?.kind==='narration')arrivalStops.push({kind:'narration',goal:meta.source});return event(text,meta);};window.framesObserved=0;const count=()=>{framesObserved++;requestAnimationFrame(count)};requestAnimationFrame(count);}''',stage)
  def drain():
   for _ in range(30):
    active=p.evaluate('!!HonroApp.dialogue')
    if not active:
     p.evaluate('HonroApp.startQueuedStory()');p.wait_for_timeout(80)
     if not p.evaluate('!!HonroApp.dialogue'):return
    button=p.locator('[data-action="dialogue-skip"]')
    if button.count():button.click()
    else:p.wait_for_timeout(100)
   raise AssertionError('dialogue queue did not drain')
  rows=[]
  for i in range(1,6 if stage==25 else 5):
   p.evaluate('''i=>{const a=HonroApp,b=a.engine.b,m=HonroAct3.marker(b,'stake-arrival-'+i);b.honroStakeCrossing.index=i;for(const[j,u]of a.engine.heroesAlive().entries())Object.assign(u,{x:m.x-30+j*60,y:m.y,vx:0,vy:0,jumping:false,airborne:false,acted:false});b.side=0;b.phase='aim';a.actorBoundary=b.active;a.scene.manual=true;a.scene.x=m.x;a.scene.y=m.y-130;a.scene.scale=.65;a.scene.goalFocus=a.scene.storyTween=null;HonroAct3.tick(a,0);}''',i)
   p.wait_for_function("i=>HonroAct3.memory(HonroApp.engine.b).done['stake-arrival-'+i]",arg=i)
   p.wait_for_timeout(200)
   if stage==27 and i==4:
    p.wait_for_function('HonroApp.engine.b.honroAct3Void.state!=="READY"');p.locator('.honro-void-skip').click();p.wait_for_function('HonroApp.engine.b.honroAct3Void.state==="RESOLVED"');drain()
   p.evaluate('HonroApp.startQueuedStory()');p.wait_for_timeout(450)
   state=p.evaluate('''()=>({hud:HonroAct3.state(HonroApp.engine.b).summary,dialogue:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId||null,goals:arrivalStops.map(s=>s.goal),frames:framesObserved})''');rows.append({'arrival':i,**state})
   if stage==27 and i==2:p.wait_for_timeout(1200)
   if (stage==25 and i in [1,2,5])or(stage==27 and i in [2,4]):p.screenshot(path=str(OUT/f'390-stage{stage}-arrival{i}.jpg'),type='jpeg',quality=90)
   drain()
   if stage==25 and i in [2,4,5]:assert p.evaluate('(i)=>HonroEvidenceQuests.field(HonroApp.engine.b).events["stake-arrival-"+i].progress===1',i)
  trace=p.evaluate('arrivalStops');expected=['stake-arrival-1','stake-arrival-3','household-tally'] if stage==25 else []
  assert [x['goal'] for x in trace]==expected,trace
  if stage==25:assert p.evaluate('!!HonroEvidenceQuests.field(HonroApp.engine.b).cargo["25:household-tally"]')
  else:
   assert p.evaluate('HonroAct3.current(HonroApp.engine.b).id==="family-manifest"&&!HonroAct3.memory(HonroApp.engine.b).done["family-manifest"]')
   p.evaluate('''()=>{const a=HonroApp,b=a.engine.b,u=a.engine.heroesAlive().find(u=>u.cls==='mage'),m=HonroAct3.marker(b,'family-manifest');Object.assign(u,{x:m.x-30,y:m.y,vx:0,vy:0,acted:false});b.active=u.id;b.side=0;b.phase='aim';a.actorBoundary=u.id;a.scene.inspectUnitId=null;a.updateHUD(true);}''')
   p.keyboard.press('e');p.wait_for_function('HonroAct3.memory(HonroApp.engine.b).done["family-manifest"]');p.wait_for_timeout(450);p.screenshot(path=str(OUT/'390-stage27-manual-manifest.jpg'),type='jpeg',quality=90);drain()
  assert not errors,errors
  results.append({'stage':stage,'rows':rows,'trace':trace,'errors':errors,'normalAppFrame':True,'scope':'Initial prerequisite and per-landing positions/traversal index prepared by tool; actual goal ticks/dialogue buttons/void skip/manual E use under normal frames; no full crossing combat claim.'});c.close()
 browser.close()
(OUT/('browser-'+str(stages[0])+'.json' if len(stages)==1 else 'browser.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2));print('PASS mobile25/27 normal-frame arrival feedback, tally once, quiet physical visuals, actual27 encounter skip and manual manifest')
