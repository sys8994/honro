"""Isolated action checkpoints exercise real interactions, staged custody and Continue.
Not a normal-resource campaign completion. User storage is never loaded.
"""
import ast,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
OUT=ROOT/'_local/reports/required-story';BASE=story_base_url();reports=[];errors=[]
m=ast.parse((ROOT/'tests/evidence-quests-browser.py').read_text());SETUP=next(ast.literal_eval(n.value)for n in m.body if isinstance(n,ast.Assign)and any(isinstance(t,ast.Name)and t.id=='SETUP'for t in n.targets))
with sync_playwright()as p:
 browser=launch(p)
 for mobile in [False,True]:
  tag='mobile'if mobile else'desktop';ctx=browser.new_context(viewport={'width':390,'height':844}if mobile else{'width':1440,'height':900},is_mobile=mobile,has_touch=mobile);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/HONRO.html');page.wait_for_function('window.HonroApp')
  def drain(save=False):
   heard=[];saved=False
   for i in range(100):
    if not page.evaluate('!!HonroApp.dialogue'):
     if not page.evaluate('HonroApp.engine?.b.honroState.storyQueue?.length'):break
     page.evaluate('()=>{const a=HonroApp;a.actorBoundary=a.engine.b.active;a.engine.b.honroState.actorTurnSerial++;a.startQueuedStory();}')
     if not page.evaluate('!!HonroApp.dialogue'):break
    page.wait_for_selector('#story-line');assert not page.locator('.story-document,[data-story-tool="history"],[data-action="journal"]').count();text=page.locator('#story-line').inner_text();assert '선택해 읽'not in text and '원문은'not in text;heard.append(text)
    if save and not saved and '호적에' in text:
     page.wait_for_timeout(500);before=page.evaluate('JSON.stringify({d:HonroApp.dialogue,m:HonroApp.engine.b.honroState.act3,c:HonroApp.engine.b.honroState.evidenceScene})');page.screenshot(path=str(OUT/f'{tag}-register-scene.png'));page.reload();page.wait_for_function('window.HonroApp');page.locator('[data-action="continue"]').click();page.wait_for_selector('#story-line');assert page.evaluate('HonroApp.engine.b.honroState.act3.done["upper-register"]');saved=True
    page.locator('[data-action="dialogue-next"]').click()
   return heard
  page.evaluate(SETUP,22);page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;a.checkMission=()=>false;for(const u of b.units)if(u.side===1){u.dead=true;u.hp=0;}a.turnNotice=null;const m=HonroAct3.memory(b);m.done['archive-seal']=true;const gate=HonroQuestTargets.records(b).find(t=>t.id==='archive-door');if(gate)gate.broken=true;}''');heard=[]
  for goal,cls in [('ledger-case','knight'),('upper-register','archer')]:
   ok=page.evaluate('''([id,cls])=>{const a=HonroApp,b=a.engine.b,m=b.honroMarkers.find(m=>m.id===id),u=b.units.find(u=>u.side===0&&u.cls===cls);Object.assign(u,{x:m.x,y:m.y,acted:false,vx:0,vy:0});b.active=u.id;b.side=0;b.phase='aim';a.actorBoundary=u.id;return HonroAct3.use(a,m);}''',[goal,cls]);assert ok;heard+=drain(goal=='upper-register')
  assert any('아이, 노인' in x for x in heard);assert not any('주민 전원을 살해' in x for x in heard);assert page.evaluate('Object.keys(HonroApp.engine.b.honroState.evidenceScene||{}).length')>=2
  # Runtime authored scene samples cover all remaining evidence events without optional reading.
  for id,key in [(16,'witness'),(19,'old-soul'),(26,'investigation-record'),(28,'suppression-order'),(29,'hyeonmuk-letter'),(30,'transport-map')]:
   page.evaluate(SETUP,id)
   page.evaluate('''key=>{const a=HonroApp,b=a.engine.b;a.actorBoundary=b.active;const c=HonroObjectiveRevision.contentFor(b,a.stage);const lines=(b.honroStage<21?HonroAct2Content:HonroAct3Content).scene('act-'+b.honroStage+'-'+key,a.stage.name,c.beats[key]);HonroStory.start(a,lines);a.turnNotice=null;}''',key)
   page.wait_for_selector('#story-line');page.wait_for_timeout(300);page.screenshot(path=str(OUT/f'{tag}-stage{id}.png'));texts=drain();reports.append({'device':tag,'stage':id,'heard':texts})
  # Saved optional-era line is compatible but never exposes the archive, even at rest.
  page.evaluate('''()=>{const a=HonroApp;for(let i=0;a.dialogue&&i<100;i++)HonroStory.finish(a);a.profile.honroEvidenceDocuments=[{id:'old',text:'legacy',meta:{documentTitle:'old'}}];HonroStory.start(a,[['서술','확인한 단서.\\n원문은 여정의 기록에서 선택해 읽을 수 있다.',{kind:'narration'}]],{index:0});}''');assert '선택'not in page.locator('#story-line').inner_text();assert page.locator('.story-actions button').count()==3;page.keyboard.press('Tab');page.keyboard.press('Enter');drain()
  page.evaluate('()=>{HonroApp.setDebugMode(true);HonroApp.showRest();}');page.wait_for_timeout(300);assert not page.locator('[data-action="journal"],[data-story-tool="history"],.evidence-list').count();ctx.close()
 browser.close()
assert not errors,errors
(OUT/'browser.json').write_text(json.dumps({'passed':True,'checks':reports,'scope':'real Stage22 two interactions + saved-scene Continue; other chapters directed event samples; rest/debug controls'},ensure_ascii=False,indent=2));print('PASS desktop/mobile action dialogue/custody, Continue, mandatory facts and no optional UI')
