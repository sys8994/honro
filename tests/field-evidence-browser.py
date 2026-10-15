"""Real HTML interaction/cue rendering at controlled noncombat checkpoints.
Route evidence is in field-evidence-route/waterworks.mjs, not this fixture.
"""
import ast,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
OUT=ROOT/'_local/reports/field-evidence';OUT.mkdir(parents=True,exist_ok=True);BASE=story_base_url();rows=[];errors=[]
m=ast.parse((ROOT/'tests/evidence-quests-browser.py').read_text());SETUP=next(ast.literal_eval(n.value)for n in m.body if isinstance(n,ast.Assign)and any(isinstance(t,ast.Name)and t.id=='SETUP'for t in n.targets))
with sync_playwright()as p:
 browser=launch(p)
 for mobile in [False,True]:
  tag='mobile'if mobile else'desktop';ctx=browser.new_context(viewport={'width':390,'height':844}if mobile else{'width':1440,'height':900},is_mobile=mobile,has_touch=mobile);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/HONRO.html');page.wait_for_function('window.HonroApp')
  def setup(stage):
   page.evaluate(SETUP,stage);page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;a.checkMission=()=>false;a.turnNotice=null;for(const u of b.units)if(u.side===1){u.dead=true;u.hp=0;}a.actorBoundary=b.active;}''')
  def drain():
   for i in range(50):
    if not page.evaluate('!!HonroApp.dialogue'):
     if not page.evaluate('!!HonroApp.engine.b.honroState.storyQueue?.length'):break
     page.evaluate('()=>{const a=HonroApp;a.actorBoundary=a.engine.b.active;a.engine.b.honroState.actorTurnSerial++;a.startQueuedStory();}')
     if not page.evaluate('!!HonroApp.dialogue'):break
    assert not page.locator('.story-document,[data-action="journal"],[data-story-tool="history"]').count()
    page.locator('[data-action="dialogue-next"]').click()
  def start_queue():
   if not page.evaluate('!!HonroApp.dialogue'):page.evaluate('()=>{const a=HonroApp;a.actorBoundary=a.engine.b.active;a.engine.b.honroState.actorTurnSerial++;a.startQueuedStory();}')
  def use(goal,cls):
   assert page.evaluate('''([id,cls])=>{const a=HonroApp,b=a.engine.b,m=b.honroMarkers.find(q=>q.id===id),u=b.units.find(q=>q.side===0&&q.cls===cls),at=m.target?b.units.find(q=>q.id===m.target):m;Object.assign(u,{x:at.x-35,y:at.y,vx:0,vy:0,acted:false});b.active=u.id;b.side=0;b.phase='aim';a.actorBoundary=u.id;return (b.honroStage<21?HonroAct2:HonroAct3).use(a,m);}''',[goal,cls]);start_queue()
  setup(22);page.evaluate("HonroAct3.memory(HonroApp.engine.b).done['archive-seal']=true");knight=page.evaluate('HonroApp.engine.b.units.find(u=>u.side===0&&u.cls==="knight").x');use('ledger-case','mage');page.wait_for_timeout(1900);page.screenshot(path=str(OUT/f'{tag}-22-carrier.png'));drain();assert page.evaluate('HonroApp.engine.b.units.find(u=>u.side===0&&u.cls==="knight").x')==knight
  use('upper-register','archer');page.wait_for_timeout(1900);drain();assert page.evaluate('!HonroEvidenceQuests.pairReady(HonroApp.engine.b)')
  page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,m=b.honroMarkers.find(m=>m.id==='compare-ledgers'),qs=Object.values(HonroEvidenceQuests.field(b).cargo);for(const [i,q]of qs.entries()){const u=b.units.find(u=>u.id===q.actor);Object.assign(u,{x:m.x-280+i*75,y:m.y,vx:0,vy:0});}const h=HonroAct3.memory(b).holds['compare-ledgers']={progress:2,spawned:2,lastEnemyEnd:b.teamEnds[1],continuous:true};HonroAct3.tick(a,0);}''');start_queue()
  page.wait_for_function('Object.values(HonroEvidenceQuests.field(HonroApp.engine.b).cargo).every(q=>q.phase==="laid")');page.screenshot(path=str(OUT/f'{tag}-22-laid.png'));page.wait_for_function('Object.values(HonroEvidenceQuests.field(HonroApp.engine.b).cargo).every(q=>q.phase==="carry")');drain();rows.append({'viewport':tag,'stage':22,'actualPickupActors':['mage','archer'],'speakerStayedOtherFloor':True,'realCueWalkUnpackPlacePack':True})
  # Each landing inspection is acquired through the actual current reach goal.
  setup(25);page.evaluate("HonroAct3.memory(HonroApp.engine.b).done['depot-entry-seal']=true")
  for i in range(1,6):
   page.evaluate('''i=>{const a=HonroApp,b=a.engine.b,m=b.honroMarkers.find(m=>m.id==='stake-arrival-'+i);b.honroStakeCrossing.index=i;for(const [j,u]of b.units.filter(u=>u.side===0&&!u.summoned).entries())Object.assign(u,{x:m.x-35+j*70,y:m.y,vx:0,vy:0,acted:false});a.scene.x=m.x;a.scene.y=m.y-100;a.scene.scale=.95;a.scene.manual=true;HonroAct3.tick(a,0);}''',i);start_queue();page.wait_for_timeout(250);page.screenshot(path=str(OUT/f'{tag}-25-{i}-covered.png'));page.wait_for_function('(i)=>HonroEvidenceQuests.field(HonroApp.engine.b).events["stake-arrival-"+i]?.progress===1',arg=i);page.screenshot(path=str(OUT/f'{tag}-25-{i}-opened.png'));drain()
  assert page.evaluate('!!HonroEvidenceQuests.field(HonroApp.engine.b).cargo["25:household-tally"]');rows.append({'viewport':tag,'stage':25,'fiveActualReachGoalsAndLidAnimations':True})
  setup(19);page.evaluate('''()=>{const b=HonroApp.engine.b,A=HonroAct2;for(const s of A.steps(b)){if(s.id==='old-soul')break;A.memory(b).done[s.id]=true;}}''');use('old-soul','occultist');page.wait_for_timeout(250);page.screenshot(path=str(OUT/f'{tag}-19-before-wipe.png'));page.wait_for_function('HonroEvidenceQuests.field(HonroApp.engine.b).events["old-soul"]?.progress===1');page.screenshot(path=str(OUT/f'{tag}-19-after-wipe.png'));drain();rows.append({'viewport':tag,'stage':19,'actualInscriptionInteractionAndWipe':True})
  setup(26);use('hidden-latch','knight');drain();assert page.evaluate('!HonroAct3.memory(HonroApp.engine.b).done["investigation-record"]');page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,m=b.honroMarkers.find(m=>m.id==='investigation-record'),u=b.units.find(u=>u.side===0&&u.cls==='occultist');Object.assign(u,{x:m.x-35,y:m.y,vx:0,vy:0});HonroAct3.tick(a,0);}''');start_queue();drain();use('artisan-resident','knight');page.wait_for_timeout(1900);page.screenshot(path=str(OUT/f'{tag}-26-handoff.png'));drain();assert page.evaluate('HonroEvidenceQuests.field(HonroApp.engine.b).cargo["26:casting-tally"].origin.x===HonroApp.engine.b.units.find(u=>u.id==="act3-resident").x');rows.append({'viewport':tag,'stage':26,'noRemoteDoorAcquisition':True,'npcHandoff':True})
  ctx.close()
 browser.close()
assert not errors,errors
(OUT/'browser.json').write_text(json.dumps({'passed':True,'rows':rows,'scope':'Actual goals and staging from controlled noncombat poses; compare hold progress and reached traversal indices seeded. Separate native tests traverse routes without later pose/resource writes.'},ensure_ascii=False,indent=2));print('PASS',rows)
