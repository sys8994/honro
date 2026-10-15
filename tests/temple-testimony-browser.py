"""Isolated fresh chapter checkpoint; real rescue/clear/open/outcome/next-chapter flow.
Enemy pressure and movement are controlled, not a normal-resource combat clear.
No optional original is opened on the progression path.
"""
import ast,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
OUT=ROOT/'_local/reports/temple-testimony';OUT.mkdir(parents=True,exist_ok=True);BASE=story_base_url();reports=[];errors=[]
m=ast.parse((ROOT/'tests/evidence-quests-browser.py').read_text());SETUP=next(ast.literal_eval(n.value)for n in m.body if isinstance(n,ast.Assign)and any(isinstance(t,ast.Name)and t.id=='SETUP'for t in n.targets))
with sync_playwright()as p:
 browser=launch(p)
 for mobile in [False,True]:
  tag='mobile' if mobile else 'desktop';ctx=browser.new_context(viewport={'width':390,'height':844}if mobile else{'width':1440,'height':900},is_mobile=mobile,has_touch=mobile);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/HONRO.html');page.wait_for_function('window.HonroApp');page.evaluate(SETUP,16);heard=[];saved=False
  def advance(save_witness=False):
   global saved
   for _ in range(130):
    data=page.evaluate('''()=>({dialogue:HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[1],phase:HonroApp.engine?.b.phase,stage:HonroApp.stage?.id,staging:!!HonroApp.dialogue?.staging&&!HonroApp.dialogue.staging.complete,queue:HonroApp.engine?.b.honroState.storyQueue?.length||0})''')
    if not data.get('dialogue'):
     page.wait_for_timeout(60)
     if page.evaluate('!!HonroApp.dialogue'):continue
     if data['queue'] and data['phase']not in ['won','lost']:
      page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;a.actorBoundary=b.active;b.honroState.actorTurnSerial++;a.startQueuedStory();}''');continue
     break
    if data['staging']:
     page.locator('[data-action="dialogue-next"]').click();continue
    assert page.locator('.story-document').count()==0,'optional original was made mandatory'
    text=page.locator('#story-line').inner_text();heard.append(text)
    if save_witness and not saved and '사흘 동안 종을 두드리며' in text:
     snapshot=page.evaluate('JSON.stringify({d:HonroApp.dialogue,s:HonroApp.engine.b.honroAct2Steps,a:HonroApp.engine.b.honroState.act2,docs:HonroApp.profile.honroEvidenceDocuments})');page.wait_for_timeout(300);page.screenshot(path=str(OUT/f'{tag}-witness.png'));page.reload();page.wait_for_function('window.HonroApp');page.locator('[data-action="continue"]').click();page.wait_for_selector('#story-line');assert snapshot==page.evaluate('JSON.stringify({d:HonroApp.dialogue,s:HonroApp.engine.b.honroAct2Steps,a:HonroApp.engine.b.honroState.act2,docs:HonroApp.profile.honroEvidenceDocuments})');saved=True
    page.locator('[data-action="dialogue-next"]').click()
   else:raise AssertionError('dialogue loop did not drain')
  result=page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,steps=HonroAct2.steps(b),threats=steps.find(s=>s.id==='clear-rescue-threat').defeatIds;for(const u of b.units)if(u.side===1){if(threats.includes(u.id)){u.x=b.width-200;u.y=200;}else{u.dead=true;u.hp=0;}}const m=b.honroMarkers.find(m=>m.id==='monk'),u=b.units.find(u=>u.side===0&&u.cls==='occultist');b.active=u.id;b.side=0;b.phase='aim';Object.assign(u,{x:m.x,y:m.y,acted:false});a.turnNotice=null;a.actorBoundary=b.active;const ok=HonroAct2.use(a,m);return {ok,rescued:HonroAct2.memory(b).done.monk,witness:!!HonroAct2.memory(b).done.witness,threats};}''');assert result['ok']and result['rescued']and not result['witness'],result;advance()
  page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;for(const id of HonroAct2.steps(b).find(s=>s.id==='clear-rescue-threat').defeatIds){const u=b.units.find(u=>u.id===id);u.hp=0;u.dead=true;}a.actorBoundary=b.active;b.honroState.actorTurnSerial++;HonroAct2.tick(a,0);a.startQueuedStory();}''');advance(True);assert saved
  assert any('사흘 동안 종을 두드리며 물을 달라고' in x for x in heard);assert any('종지기가 인양축을 빼고 문을 잠갔' in x for x in heard);assert any('작업굴에서 빠진 축을 직접 확인' in x for x in heard)
  result=page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,m=b.honroMarkers.find(m=>m.id==='hall'),u=b.units.find(u=>u.side===0&&!u.dead);b.active=u.id;b.side=0;b.phase='aim';Object.assign(u,{x:m.x,y:m.y,acted:false});a.turnNotice=null;a.actorBoundary=b.active;const ok=HonroAct2.use(a,m);return {ok,phase:b.phase,record:!!HonroAct2.memory(b).done.record};}''');assert result['ok']and result['phase']!='won'and not result['record'],'record must commit before chapter can win';advance()
  page.wait_for_selector('.result-title');assert page.evaluate('HonroApp.profile.cleared[16].visits')==1
  assert any('칠십 년 전의 이송 기록' in x and '종지기 사건과는 따로' in x for x in heard),heard
  assert page.evaluate("HonroApp.engine.b.honroState.act2.done.record")
  page.screenshot(path=str(OUT/f'{tag}-chapter16-complete.png'))
  page.locator('[data-action="result-continue"]').click();advance()
  if page.evaluate('HonroApp.screen')=='rest':page.locator('[data-action="journey-enter"]').click();advance()
  assert page.evaluate('HonroApp.engine.b.honroStage')==17
  assert any('승려 말대로라면' in x and '직접 확인' in x for x in heard),heard
  assert page.evaluate("HonroApp.profile.honroEvidenceDocuments.some(d=>d.id==='original-16-witness')&&HonroApp.profile.honroEvidenceDocuments.some(d=>d.id==='temple-transfer')")
  page.screenshot(path=str(OUT/f'{tag}-chapter17.png'));reports.append({'device':tag,'heard':heard,'saveContinue':saved,'optionalOpened':0,'rescuedBeforeThreatClear':result,'chapter17':True});ctx.close()
 ctx=browser.new_context(viewport={'width':1440,'height':900});page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/HONRO_WORKSHOP.html');page.wait_for_function('window.HonroWorkshopAPI');page.evaluate("HonroWorkshopAPI.selectStage('stage-16')");page.locator('[data-tab="play"]').click();page.wait_for_selector('iframe');frame=page.frames[-1];frame.wait_for_function('window.HonroApp');frame.evaluate("()=>{const a=HonroApp,b=a.engine.b;for(let i=0;a.dialogue&&i<100;i++)HonroStory.finish(a);for(const u of b.units)if(u.side===1){u.dead=true;u.hp=0;}HonroAct2.memory(b).done.monk=true;a.actorBoundary=b.active;HonroAct2.tick(a,0);b.honroState.actorTurnSerial++;a.startQueuedStory();for(let i=0;a.dialogue&&!a.profile.honroEvidenceDocuments?.length&&i<100;i++)HonroStory.finish(a);}");frame.wait_for_selector('#story-line');assert '사흘 동안' in frame.locator('#story-line').inner_text();assert frame.locator('.story-document').count()==0;page.wait_for_timeout(300);page.screenshot(path=str(OUT/'workshop-witness.png'));reports.append({'workshopSharedTestimony':True});ctx.close();browser.close()
assert not errors,errors
(OUT/'browser.json').write_text(json.dumps({'passed':True,'reports':reports,'errors':errors},ensure_ascii=False,indent=2));print('PASS fresh rescue→threat clear→automatic testimony/key→record room→chapter17, no optional document, mid-testimony Continue desktop/mobile')
