"""로컬 Chromium: 준비한 입장/진입 위치/빈 이동로 fixture, 정상 frame과 실제 버튼."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/stage16-escort-pilot-a';entry=json.loads((OUT/'normal-entry.json').read_text());rows=[];errors=[]
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw);p=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp',timeout=90000)
 p.evaluate('''async data=>{await HonroCampaignLoader.ensureStage(16);const a=HonroApp;Object.assign(a.profile,{heroes:data.heroes,cleared:data.cleared,recruited:data.recruited,party:data.recruited,lastStage:16,mapNode:16});a.profile.settings.difficulty='normal';a.launch(16);window.frameCount=0;const frame=a.frame.bind(a);a.frame=(...args)=>{frameCount++;return frame(...args)};}''',entry)
 def finish():
  for _ in range(80):
   if not p.evaluate('!!HonroApp.dialogue'):return
   p.locator('[data-action=dialogue-next]').tap();p.wait_for_timeout(35)
  raise AssertionError('대화가 종료되지 않음')
 def camera(x,y,z=.52):p.evaluate('''v=>{const a=HonroApp,s=a.scene;a.close();Object.assign(s,{manual:true,x:v[0],y:v[1],scale:v[2],goalFocus:null,cinematic:null,storyTween:null});a.updateHUD(true)}''',[x,y,z]);p.wait_for_timeout(300)
 def shot(name):p.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=88)
 def state():return p.evaluate('''()=>{const a=HonroApp,b=a.engine.b;return{frameCount,round:b.round,phase:b.phase,goal:HonroAct2.current(b)?.id,done:structuredClone(HonroAct2.memory(b).done),monks:b.units.filter(u=>u.honroCivilian).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,moveLeft:u.moveLeft})),targets:HonroObjectives.state(b,a.stage).targets,camera:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale}}}''')
 finish();p.wait_for_function('HonroApp.canInput()&&!HonroApp.turnNotice',timeout=30000)
 p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b;for(const u of b.units)if(u.side===1){u.dead=true;u.hp=0}const u=e.heroesAlive().find(u=>u.cls==='occultist'),m=b.honroMarkers.find(m=>m.id==='monk');Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0,acted:false});b.active=u.id;b.phase='aim';b.side=0;a.turnNotice=null;a.updateHUD(true);HonroInteractions.refresh(a)}''')
 camera(3060,4840,.6);shot('390-rescue-site');p.locator('[data-context-interact=monk]').tap()
 for _ in range(80):
  if p.evaluate("HonroApp.dialogue?.lines.some(r=>r[2]?.rowId==='16.beats.witness:escort-pilot-a')"):break
  if p.evaluate('!!HonroApp.dialogue'):p.locator('[data-action=dialogue-next]').tap()
  else:p.wait_for_timeout(100)
 else:raise AssertionError('증언 대화를 열지 못함')
 # 자동 증언 안의 승인된 마지막 행과 모바일 본문 영역을 확인한다.
 for _ in range(30):
  if p.evaluate("HonroApp.dialogue?.lines[HonroApp.dialogue.index]?.[2]?.rowId==='16.beats.witness:escort-pilot-a'"):break
  p.locator('[data-action=dialogue-next]').tap()
 assert p.locator('#story-line').inner_text()=='두 분은 법당 툇마루로 가시오. 앞은 우리가 맡겠소.'
 r=p.locator('#story-line').bounding_box();assert r and r['height']>20;shot('390-witness-order');finish()
 p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,m=b.honroMarkers.find(m=>m.id==='hall');Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0,acted:false});b.phase='aim';a.updateHUD(true);HonroInteractions.refresh(a)}''')
 assert p.locator('[data-context-interact=hall]').is_disabled();assert '두 승려가 아직 툇마루에 도착하지 않았습니다.' in p.locator('#context-interact').inner_text();rows.append({'earlyDoor':True,'state':state()})
 camera(3770,4620,.43);p.wait_for_timeout(1000);shot('390-monks-moving');start=state();assert start['frameCount']>60
 # 통상 방어 입력으로 적 없는 fixture의 팀 턴만 진행한다. 라운드 직접 변경 없음.
 waits=0
 for _ in range(70):
  finish()
  if p.evaluate("!!HonroAct2.memory(HonroApp.engine.b).done['temple-escort']"):break
  if p.evaluate('HonroApp.canInput()&&!HonroApp.turnNotice'):
   p.locator('[data-action=defend]').tap();waits+=1
  p.wait_for_timeout(600)
 else:raise AssertionError('피신 fixture가 도착하지 않음: '+json.dumps(state(),ensure_ascii=False))
 camera(5630,4110,.68);shot('390-veranda-arrived');rows.append({'actualWaitInputs':waits,'state':state()})
 # 문만 열어도 기록은 아직 얻지 못한다. 동행을 문으로 준비한 뒤 실제 버튼 사용.
 p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.heroesAlive().find(u=>!u.acted)||e.heroesAlive()[0],m=b.honroMarkers.find(m=>m.id==='hall');Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0,acted:false});b.active=u.id;b.phase='aim';b.side=0;a.turnNotice=null;a.updateHUD(true);HonroInteractions.refresh(a)}''')
 p.locator('[data-context-interact=hall]').tap();finish();p.wait_for_timeout(250);assert not p.evaluate('!!HonroAct2.memory(HonroApp.engine.b).done.record');finish();camera(6120,4100,.6);finish();camera(6120,4100,.6);shot('390-open-record-room')
 p.set_viewport_size({'width':844,'height':390});camera(5910,4160,.45);shot('844-open-record-room')
 # 기록함 실제 접근/획득 이후 정상 결과 대화와 결과 UI.
 p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.heroesAlive()[0],m=b.honroMarkers.find(m=>m.id==='record');Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0,acted:false});b.active=u.id;b.phase='aim';b.side=0;a.turnNotice=null;}''')
 p.wait_for_function('HonroApp.dialogue!=null',timeout=30000);p.set_viewport_size({'width':390,'height':844});p.wait_for_timeout(400);shot('390-record-dialogue');finish();p.wait_for_function("HonroApp.modalKind==='result'",timeout=30000);shot('390-complete');assert p.evaluate('HonroApp.profile.cleared[16].visits===1');rows.append({'result':state(),'source':'상호작용/이동로 준비 fixture; 통상 frame 및 실제 대화/방어/문 버튼'})
 assert not errors,errors
 (OUT/'browser.json').write_text(json.dumps({'entry':json.loads((ROOT/'web/manifest.json').read_text())['gameEntry'],'rows':rows,'errors':errors,'scope':'로컬 Chromium 390×844 touch/844×390. 입장 프로필·동행 접근 위치와 적 없는 경로는 도구 준비. 정상 App frame 유지, 실제 UI 버튼으로 구조/증언/피신 턴/문/기록 대화/결과 확인. 공개판·실기기·정상 전투 완주 근거가 아님.'},ensure_ascii=False,indent=2));browser.close();print('PASS 정상 frame, 구조/증언/조기 문/피신/문/현장 기록/승리 UI')
