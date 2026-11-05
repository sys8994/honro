"""Tool-assisted real Chromium keyboard/pointer combat from the same synthetic
entry save as the native comparison. No combat-state writes after entry.
Uses current rendered marker/actor geometry and current-shot predictions; not pixel-only perception or a human success-rate test. No hidden kill roster, escort destination, spawn schedule, or fixed stage-route coordinates drive decisions. Diagnostic state logging and save assertions are separate from policy. All evidence local.
"""
import sys,os,json,time,hashlib,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
from stage21_source_preview import install_source_preview,source_preview_metadata
sys.path.insert(0,str(ROOT/'tools/act4-ci'))
from precise_aim import aim_with_joystick
entry_path=ROOT/os.environ.get('HONRO_STAGE21_ENTRY','_local/reports/stage21-current/clear-route/initial.json')
entry=json.loads(entry_path.read_text());out=ROOT/os.environ.get('HONRO_STAGE21_UI_OUT','_local/reports/stage21-current/ui-play');out.mkdir(parents=True,exist_ok=True)
planner=(ROOT/'tests/stage21-visible-plan.js').read_text()
(out/'controller-plan.js').write_text(planner)
(out/'controller-ui.py').write_text(Path(__file__).read_text())
result={'sourcePreview':source_preview_metadata(),'scope':__doc__,'entrySha256':hashlib.sha256(entry_path.read_bytes()).hexdigest(),'servedSource':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'servedManifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'plannerSha256':hashlib.sha256(planner.encode()).hexdigest(),'completed':False,'errors':[],'resume':[]};events=[]
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw);page=browser.new_page(viewport={'width':1280,'height':800});install_source_preview(page);page.on('pageerror',lambda e:result['errors'].append(str(e)))
 def state():return page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,V=HonroAct23V4;return {stage:b.honroStage,round:b.round,side:b.side,phase:b.phase,active:u?.id,cls:u?.cls,x:u?.x,y:u?.y,angle:u?.angle,facing:u?.facing,moveLeft:u?.moveLeft,can:a.canInput(),grounded:u&&e.grounded(u),dialogue:!!a.dialogue,shots:b.shots,enemyHpSum:b.units.filter(v=>v.side===1&&!v.dead).reduce((n,v)=>n+v.hp,0),enemyUnits:b.units.filter(v=>v.side===1).map(v=>({id:v.id,hp:v.hp,dead:v.dead})),health:b.units.filter(v=>v.side===0&&!v.summoned).map(v=>({id:v.id,hp:v.hp,dead:v.dead})),objective:V.state(b).targets.find(t=>t.id==='21-wreck-review')?.id||V.current(b)?.id,city:HonroAct23V4City.memory(b),done:a.done,objectiveText:document.querySelector('#objective-text')?.textContent};}''')
 def record(kind,extra=None):
  row={'kind':kind,'time':time.monotonic(),'state':state(),**(extra or {})};events.append(row)
  with (out/'events.jsonl').open('a') as f:f.write(json.dumps(row,ensure_ascii=False)+'\n')
  print(kind,row['state']['round'],row['state']['active'],row['state']['objective'],flush=True)
 def ready():
  for _ in range(150):
   s=state()
   if s['phase'] in ['won','lost'] or s['done']:return False
   if s['dialogue']:page.wait_for_timeout(250);page.keyboard.press('Enter')
   elif s['can'] and s['grounded'] and s['objective']:return True
   page.wait_for_timeout(150)
  raise RuntimeError('input boundary timeout')
 def move(goal):
  last=state();stuck=0
  for _ in range(36):
   s=state()
   if not s['can'] or s['active']!=last['active'] or s['moveLeft']<10 or abs(s['x']-goal)<30:break
   key='ArrowRight' if goal>s['x'] else 'ArrowLeft';page.keyboard.down(key);page.wait_for_timeout(min(220,max(30,abs(goal-s['x'])/1.1)));page.keyboard.up(key)
   after=state();stuck=stuck+1 if abs(after['x']-s['x'])<3 else 0
   if stuck>=2 and after['grounded']:page.keyboard.press('Control');stuck=0
  page.wait_for_timeout(200)
 def plan(facing=False):return page.evaluate(planner,facing)['best']
 try:
  page.goto(base+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp');page.evaluate('p=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',{**entry['profile'],'honroBattle':entry['initial']});page.reload();page.wait_for_function('!!globalThis.HonroApp');page.locator('[data-action="continue"]').click();page.wait_for_function('HonroApp.engine?.b?.honroStage===21')
  record('entry');page.screenshot(path=str(out/'entry.png'));saved=False
  for turn in range(200):
   if not ready():break
   start=state()
   if os.environ.get('HONRO_STAGE21_STOP_AT_CLEARANCE')=='1' and page.locator('#objective-text').inner_text()=='남은 길목 적 정리하기':
    record('normal-clearance-instruction');page.screenshot(path=str(out/'normal-clearance-header.png'))
    page.locator('#objective-text').click();assert page.locator('.battle-help-current').inner_text()=='남은 길목 적 정리하기';page.screenshot(path=str(out/'normal-clearance-help.png'));page.locator('button.close[data-action="close"]').click()
    result['instructionVerified']=True;result['scope']='Normal-input continuation of this audit run own R11 save to the cleanup instruction; not another full combat completion.';break
   if start['round']>30:record('round-limit');break
   if start['city'].get('started'):
    # Normal thinking time lets legal escort motion use its existing budget.
    before=start['city'];page.wait_for_timeout(2500)
    if not ready():break
    start=state()
   if not saved and start['city'].get('actors',{}).get('act3-resident',{}).get('distance',0)>80:
    page.keyboard.press('Escape');page.wait_for_timeout(200)
    before=page.evaluate('JSON.parse(localStorage.getItem("honro-first-act-profile-1"))')
    (out/'moving-save.json').write_text(json.dumps(before,ensure_ascii=False))
    page.reload();page.wait_for_function('!!globalThis.HonroApp');page.locator('[data-action="continue"]').click();page.wait_for_function('HonroApp.engine?.b?.honroStage===21');page.keyboard.press('Escape');page.wait_for_timeout(100)
    after=page.evaluate('HonroApp.engine.b');result['resume'].append({'roundBefore':before['honroBattle']['round'],'roundAfter':after['round'],'growthPreserved':before['honroBattle']['heroes']==after['heroes'],'objectivesPreserved':before['honroBattle']['honroState']['act23v4']['done']==after['honroState']['act23v4']['done'],'residentDistanceBefore':before['honroBattle']['honroState']['act23v4']['city']['actors']['act3-resident']['distance'],'residentDistanceAfter':after['honroState']['act23v4']['city']['actors']['act3-resident']['distance']});page.keyboard.press('Escape');saved=True;ready();start=state();record('resume')
   observation=page.evaluate("""()=>{const a=HonroApp,e=a.engine,u=e.active,scene=a.scene,{w,h}=scene.size(),v=HonroAct23V4.state(e.b),m=v.targets[0],screen=p=>HonroCamera.screen(scene,w,h,p),p=m&&screen(m),visible=p&&p.x>=20&&p.x<=w-20&&p.y>=80&&p.y<=h-100;return {instruction:document.querySelector('#objective-text').textContent,marker:m?{label:m.label,kind:m.kind,visible:!!visible,x:visible?m.x:null,y:visible?m.y:null,direction:p?{x:Math.sign(p.x-w/2),y:Math.sign(p.y-h/2)}:null}:null,actor:{x:u.x,y:u.y,screen:screen({x:u.x,y:u.y-u.h/2}),facing:u.facing},scale:scene.scale,width:w,height:h};}""")
   record('visible-decision',{'observation':observation})
   if observation['marker'] and observation['marker']['label']=='남은 길목 적':
    assert observation['instruction']=='남은 길목 적 정리하기',observation
    if not result.get('cleanupInstructionObserved'):
     result['cleanupInstructionObserved']={'round':start['round'],'text':observation['instruction']}
     page.screenshot(path=str(out/'normal-clearance-header.png'))
   marker=observation['marker'];choice=plan()
   # A marker outside the viewport supplies direction only. Pan by a bounded
   # screen gesture, never set the camera or navigate to its hidden coordinates.
   for scan in range(6):
    if not marker or marker['visible']:break
    d=marker['direction'];page.mouse.move(640,350);page.mouse.down();page.mouse.move(640-d['x']*210,350-d['y']*140,steps=12);page.mouse.up();page.wait_for_timeout(250)
    observation=page.evaluate("""()=>{const a=HonroApp,scene=a.scene,{w,h}=scene.size(),m=HonroAct23V4.state(a.engine.b).targets[0],p=m&&HonroCamera.screen(scene,w,h,m),visible=p&&p.x>=20&&p.x<=w-20&&p.y>=80&&p.y<=h-100;return {marker:m?{label:m.label,kind:m.kind,visible:!!visible,x:visible?m.x:null,y:visible?m.y:null,direction:p?{x:Math.sign(p.x-w/2),y:Math.sign(p.y-h/2)}:null}:null,scale:scene.scale};}""")
    marker=observation['marker'];record('camera-observe',{'observation':observation});choice=plan()
   if marker:
    if marker['visible']:
     here=state();dx=marker['x']-here['x']
     if marker['label']=='호송길 막힘':
      if abs(dx)<220:move(here['x']+(-1 if dx>0 else 1)*280);record('visible-body-clear')
     elif marker['kind']=='enemy':
      if not choice:
       # Approach in ordinary bounded steps. If already under a high target,
       # continue across its silhouette to find a fresh angle, then re-aim.
       direction=1 if dx>=0 else -1
       if abs(dx)<260:direction=here['facing']
       for attempt in range(4):
        if state()['moveLeft']<100:break
        move(state()['x']+direction*240)
        if not ready():break
        if state()['active']!=start['active']:break
        choice=plan();record('visible-angle-search',{'direction':direction,'foundShot':bool(choice)})
        if choice:break
     elif marker['label']=='주민 호송':
      if abs(dx)>240:move(marker['x']-(1 if dx>0 else -1)*170)
     else:move(marker['x'])
    elif not choice or marker['kind']=='exit':
     # A displayed exit takes priority over optional targets. Follow its
     # visible direction with the current turn's movement budget; no distance
     # or unseen destination coordinates are supplied by the observer.
     d=marker['direction']['x']
     for travel in range(5):
      before=state()
      if before['moveLeft']<100:break
      move(before['x']+d*min(360,before['moveLeft']-20))
      if not ready():break
      after=state()
      if after['active']!=start['active'] or abs(after['x']-before['x'])<40:break
      visible_goal=page.evaluate("""()=>{const a=HonroApp,scene=a.scene,{w,h}=scene.size(),m=HonroAct23V4.state(a.engine.b).targets[0];if(!m)return null;const p=HonroCamera.screen(scene,w,h,m);return p.x>=20&&p.x<=w-20&&p.y>=80&&p.y<=h-100?{x:m.x,kind:m.kind}:null;}""")
      record('follow-displayed-direction',{'direction':d,'visibleGoal':visible_goal})
      if visible_goal:
       if visible_goal['kind']=='exit':move(visible_goal['x'])
       break
   if not ready():break
   if state()['active']!=start['active']:continue
   # E is an ordinary attempted interaction at the currently displayed marker.
   page.keyboard.press('e');page.wait_for_timeout(150)
   if state()['dialogue']:record('visible-interaction');continue
   choice=plan()
   if choice:
    face=-1 if choice['angle']>90 else 1
    if state()['facing']!=face:page.keyboard.down('ArrowLeft' if face<0 else 'ArrowRight');page.wait_for_timeout(60);page.keyboard.up('ArrowLeft' if face<0 else 'ArrowRight');choice=plan(True)
   if choice:
    page.keyboard.press('Digit'+str(choice['idx']+1));aim=aim_with_joystick(page,choice['angle'],state)
    if not aim['passed']:record('aim-retry',{'aim':aim});continue
    safe=page.evaluate('''q=>{const e=HonroApp.engine,u=e.active,t=e.unit(q.target),v=HONRO_CORE.shotViable(e,u,HONRO_CORE.SKILLS[q.id],t,u.angle,q.power);return v.ok&&v.risk<1;}''',choice)
    if not safe:page.keyboard.press('f');record('unsafe-defend',{'choice':choice});continue
    page.keyboard.down('Space')
    try:page.wait_for_function('power=>HonroApp.charging&&HonroApp.chargePower(performance.now())>=power',arg=choice['power'],timeout=8000,polling=16)
    finally:page.keyboard.up('Space')
    record('fire',{'choice':choice})
   else:page.keyboard.press('f');record('defend')
   if turn%12==0:page.screenshot(path=str(out/f'combat-{turn}.png'))
  ready();result['final']=state();result['completed']=result['final']['phase']=='won';result['profile']=page.evaluate('HonroApp.profile');page.screenshot(path=str(out/'result.png'))
  for name,w,h in [('portrait',390,844),('landscape',844,390)]:page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(300);page.screenshot(path=str(out/(name+'-result.png')))
 except BaseException as ex:
  result['exception']=repr(ex)
  try:result['final']=state();result['profile']=page.evaluate('HonroApp.profile');page.screenshot(path=str(out/'failure.png'))
  except Exception:pass
 finally:
  (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));browser.close()
if os.environ.get('HONRO_STAGE21_STOP_AT_CLEARANCE')=='1':
 assert result.get('instructionVerified') and not result['errors'],result.get('exception')
 print('PASS normal-input cleanup instruction transition',result['final']['round'])
else:
 assert result['completed'] and result['final']['round']<=20 and not result['errors'],{k:v for k,v in result.items() if k!='profile'}
 assert result['resume'] and all(q['growthPreserved'] and q['objectivesPreserved'] and q['roundBefore']==q['roundAfter'] and q['residentDistanceAfter']>=q['residentDistanceBefore'] for q in result['resume']),result['resume']
 print('PASS browser real combat and exit',result['final']['round'])
