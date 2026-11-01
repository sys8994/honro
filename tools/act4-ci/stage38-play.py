"""Fresh normal-input Stage38 route test; no actor or quest-state injection.
Prepared legal skill/equipment entry profile, not natural 1–37 campaign proof.
"""
import os,json,time,hashlib,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];route=os.environ.get('HONRO38_ROUTE','upper');assert route in ['upper','lower']
out=Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=True)
profile=json.loads((root/'tools/act4-ci/stage38/entry-profile.json').read_text())['profile']
source=out/'entry-profile.json';source.write_text(json.dumps(profile,ensure_ascii=False))
control=os.environ.get('HONRO38_CONTROL')=='hold'
result={'passed':False,'releaseApproved':False,'route':route,'scope':'fresh stage38 UI entry from prepared level25 fully spent skill profile; tool-assisted route inputs','sourceCommit':os.environ.get('GITHUB_SHA'),'errors':[],'events':[]}
state_js='''()=>{const a=HonroApp,e=a.engine,b=e.b,q=b.honroAct4PreviewState,u=e.active;return{stage:b.honroStage,round:b.round,phase:b.phase,side:b.side,active:b.active,can:a.canInput(),dialogue:!!a.dialogue,
 x:u?.x,y:u?.y,grounded:u&&e.grounded(u),drop:u&&e.canDrop(),move:u?.moveLeft,shots:b.shots,
 heroes:b.units.filter(v=>v.side===0&&!v.summoned).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,maxHp:v.maxHp,shield:v.shield,dead:v.dead,acted:v.acted,grounded:e.grounded(v)})),
 residents:b.units.filter(v=>v.honroAct4Resident).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead})),
 foes:b.units.filter(v=>v.side===1&&!v.dead).length,connection:q.connected||null,probe:q.connectionProbe||null,
 observed:q.observed||{},receipts:q.receipts||[],complete:!!q.complete,exit:b.honroAct4Design.exit,
 shotSerial:b.shot,enemyActions:b.enemyActions,anchorAction:q.anchorAction||null,
 enemyState:b.units.filter(v=>v.side===1).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,awake:v.awake,acted:v.acted})),
 toe:b.terrain.some(t=>t.id==='a4-rescue-rock-step')};}'''
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True);p=browser.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:result['errors'].append(str(e)))
 def state():return p.evaluate(state_js)
 def record(label,inputs=None):
  s=state();row={'step':label,'inputs':inputs,'state':s};result['events'].append(row);(out/'progress.json').write_text(json.dumps(result,ensure_ascii=False));print(json.dumps({'step':label,'round':s['round'],'actor':s['active'],'x':s['x'],'y':s['y'],'foes':s['foes'],'connected':bool(s['connection'])}),flush=True);return s
 def screenshot(name):p.screenshot(path=str(out/(name+'.jpg')),type='jpeg',quality=88)
 def ready():
  for _ in range(160):
   s=state()
   if s['phase'] in ['won','lost']:return False
   if s['dialogue']:p.wait_for_timeout(700);p.keyboard.press('Enter');continue
   if route=='lower' and s.get('anchorAction'):
    point=p.evaluate('HonroApp.engine.b.honroAct4Design.connection.entry');dims=p.evaluate('({w:HonroApp.engine.b.width,h:HonroApp.engine.b.height})');box=p.locator('#minimap').bounding_box()
    p.mouse.click(box['x']+box['width']*point['x']/dims['w'],box['y']+box['height']*point['y']/dims['h']);p.wait_for_timeout(800);continue
   if route=='lower' and s['probe'] and s['probe'].get('phase') in ['entry','wrong-exit']:
    key='probeEntryPoint' if s['probe']['phase']=='entry' else 'probeWrongPoint'
    point=p.evaluate('(key)=>HonroApp.engine.b.honroAct4Design.geometry38[key]',key)
    dims=p.evaluate('({w:HonroApp.engine.b.width,h:HonroApp.engine.b.height})');box=p.locator('#minimap').bounding_box()
    p.mouse.click(box['x']+box['width']*point['x']/dims['w'],box['y']+box['height']*point['y']/dims['h']);p.wait_for_timeout(800);continue
   if s['can'] and s['side']==0 and s['phase']=='aim' and s['grounded']:
    p.wait_for_timeout(350)
    if not state()['dialogue']:return True
   p.wait_for_timeout(400)
  record('readiness-timeout');screenshot('readiness-timeout');raise TimeoutError('Normal input did not become available')
 def hold(direction,ms,jump=False):
  if jump:p.keyboard.press('Control')
  p.keyboard.down(direction);p.wait_for_timeout(ms);p.keyboard.up(direction);p.wait_for_timeout(550)
 def go_right(label):
  before=state();hold('ArrowRight',550);after=state();record(label,['ArrowRight',550])
  if after['active']==before['active'] and after['can'] and after['grounded'] and abs(after['x']-before['x'])<14 and after['move']>90:
   hold('ArrowRight',350,True);record(label+'-jump',['Control','ArrowRight',350])
 try:
  p.goto(os.environ['HONRO_CAPTURE_URL'],wait_until='domcontentloaded');p.wait_for_function('window.HonroApp')
  p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str(source.resolve()))
  p.wait_for_function('HonroApp.profile?.lastStage===37',timeout=30000);p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('여정 이어가기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===38',timeout=60000)
  ready();initial=record('entry');assert initial['toe'] and len(initial['heroes'])==4 and len(initial['residents'])==4 and initial['foes']==31,initial;screenshot('initial')
  p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===38',timeout=60000);ready();restored=record('same-context-reload')
  assert restored['round']==initial['round'] and restored['toe'];assert {h['id']:h['hp'] for h in restored['heroes']}=={h['id']:h['hp'] for h in initial['heroes']}
  assert all(abs(a['x']-b['x'])<1 and abs(a['y']-b['y'])<1 for a,b in zip(initial['heroes'],restored['heroes']))
  result['sameContextEntryReloadPassed']=True
  if route=='lower':
   dims=p.evaluate('({w:HonroApp.engine.b.width,h:HonroApp.engine.b.height})');box=p.locator('#minimap').bounding_box();p.mouse.click(box['x']+box['width']*4600/dims['w'],box['y']+box['height']*2600/dims['h']);p.wait_for_timeout(1800);ready();record('look-ahead-residents',['minimap',4600,2600])
   p.locator('[data-action="select-hero"][data-id="'+state()['active']+'"]').click();p.wait_for_timeout(500)
  started=time.monotonic();stalls={};descended=set()
  for step in range(240):
   if time.monotonic()-started>1200:raise TimeoutError('Bounded route budget exceeded')
   if not ready():break
   s=state()
   if control:
    if s['round']>4 or any(h['hp']<=0 or h['dead'] for h in s['heroes']):break
    p.keyboard.press('f');p.wait_for_timeout(1200);record('stationary-defend-control',['f']);continue
   assert s['round']<=20,s
   assert all(h['hp']>0 and not h['dead'] for h in s['heroes']+s['residents']),s
   def goal(h):return h['x']>s['exit']['x']-300 and abs(h['y']-s['exit']['y'])<=240 and h['grounded']
   if all(goal(h) for h in s['heroes']):p.keyboard.press('e');p.wait_for_timeout(1600);record('exit-interaction',['e']);break
   remaining=[h for h in s['heroes'] if not goal(h)];available=[h for h in remaining if not h['acted']]
   if route=='lower' and s['probe'] and s['probe'].get('phase')=='observed' and not s['connection']:
    available.sort(key=lambda h:h['id']!='mage')
   if not available:p.keyboard.press('f');p.wait_for_timeout(1200);record('end-action-no-unacted-target',['f']);continue
   hero=available[0]
   if s['active']!=hero['id']:
    p.locator('[data-action="select-hero"][data-id="'+hero['id']+'"]').click();p.wait_for_timeout(500);s=state()
    if s['active']!=hero['id']:record('selection-not-accepted');continue
   if s['move']<100:p.keyboard.press('f');p.wait_for_timeout(1200);record('end-action-movement-budget',['f']);continue
   signature=(round(s['x']/50),round(s['y']/50),s['round']);key=s['active'];history=stalls.setdefault(key,[]);history.append(signature)
   if len(history)>8 and len(set(history[-8:]))==1:record('stalled');screenshot('stalled');raise AssertionError('No route progress for eight attempts')
   if route=='lower' and s['x']<4000:
    if key not in descended and s['drop']:
     p.keyboard.press('Alt');p.wait_for_timeout(1800);descended.add(key);record('descend-to-middle-once',['Alt']);continue
    if s['x']<2830:go_right('approach-connection');continue
    if not s['probe'] or s['probe'].get('phase')!='observed':p.keyboard.press('e');p.wait_for_timeout(1800);record('probe-connection',['e']);continue
    if not s['connection']:
     if key=='mage':p.keyboard.press('e');p.wait_for_timeout(1800);record('anchor-connection',['e']);continue
     p.keyboard.press('f');p.wait_for_timeout(1200);record('wait-for-mage',['f']);continue
    p.keyboard.press('e');p.wait_for_timeout(1200);record('cross-connection',['e']);continue
   if route=='lower' and s['x']>=4000 and s['y']>2400:
    if s['x']<4620:go_right('approach-rescue-rock');continue
    if s['x']>4935:hold('ArrowLeft',350);record('approach-toe-from-right',['ArrowLeft',350]);continue
    if s['x']>=4870:hold('ArrowLeft',180,True);record('jump-to-central-rock',['Control','ArrowLeft',180]);continue
    hold('ArrowRight',350,True);record('jump-from-rescue-rock',['Control','ArrowRight',350]);continue
   if route=='lower' and s['x']<4930:hold('ArrowRight',350,True);record('jump-to-east-pillar',['Control','ArrowRight',350]);continue
   if route=='lower' and s['x']>=5750 and s['y']>1250:hold('ArrowRight',350,True);record('join-upper-exit-route',['Control','ArrowRight',350]);continue
   go_right('advance-route')
  ready();final=record('final');screenshot('outcome');result['final']=final
  if control:
   result['scope']='deliberately stationary defense control through four rounds, not ordinary play or clear acceptance'
   result['observationComplete']=True;result['clearClaim']=False
  else:
   assert final['phase']=='won' and final['complete'] and final['round']<=20,final
   assert all(h['hp']>0 and not h['dead'] for h in final['heroes']+final['residents']),final
   if route=='lower':assert final['connection'] and final['connection']['stageOnly'] and final['probe']['phase']=='observed',final
  assert not result['errors'],result['errors'];result['passed']=True
 except Exception as e:
  result['failure']=str(e);result['traceback']=traceback.format_exc()
  try:record('failure');screenshot('failure')
  except Exception:pass
  raise
 finally:
  (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');browser.close()
