"""Stage2 real Chromium keyboard/pointer run; read-only isolated shot planning.
Declared prior-stage entry fixture; no engine move/fire/tick or battle writes.
"""
import json,os,sys,time,traceback,subprocess,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tests'))
from browser_support import launch
from stage21_source_preview import install_source_preview,source_preview_metadata
OUT=Path(os.environ.get('HONRO_STAGE2_OUT','_local/reports/stage02-current/full-ui'));OUT.mkdir(parents=True,exist_ok=True)
TOUCH=os.environ.get('HONRO_STAGE2_TOUCH')=='1'
POLICY=os.environ.get('HONRO_STAGE2_UI_POLICY','advance')
SHOT_POLICY=os.environ.get('HONRO_STAGE2_SHOT_POLICY','all')
ENTRY=Path(os.environ.get('HONRO_STAGE2_ENTRY','tests/fixtures/act1-art/stage02-entry.json'))
EXPORT_ROUND=int(os.environ.get('HONRO_STAGE2_EXPORT_ROUND','0'))
URL=os.environ.get('HONRO_QA_URL','http://127.0.0.1:8842/HONRO.html')
R={'method':'Real keyboard movement/aim/charge/drop and pointer dialogue/defend; ordinary production animation loop. Isolated copy used only for shot planning. Legal prior-stage fixture, not campaign continuity or human fun approval.','policy':POLICY,'shotPolicy':SHOT_POLICY,'source':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'actions':[],'turns':[],'dialogues':[],'escort':[],'errors':[],'passed':False}
STATE='''()=>{const a=HonroApp,e=a.engine,b=e?.b,u=e?.active,c=e?.unit('objective');const unit=v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:!!v.dead,move:v.moveLeft,ground:e.grounded(v),vx:v.vx,vy:v.vy,drop:v.platformDrop?.phase,angle:v.angle,facing:v.facing,speed:v.walkSpeed,support:e.contactSurface(v.x,v.y-4,v.y+5)?.t.id});return {screen:a.screen,can:a.canInput(),done:a.done,dialogue:a.dialogue?{id:a.dialogue.id,index:a.dialogue.index,line:a.dialogue.lines[a.dialogue.index]}:null,round:b?.round,phase:b?.phase,side:b?.side,shot:b?.shot,u:u?unit(u):null,car:c?unit(c):null,allies:b?b.units.filter(v=>v.honroAlly&&!v.dead).map(v=>({...unit(v),role:v.allyRole,civilian:!!v.honroCivilian})):[],queue:b?.queue,allyQueue:b?.honroState.allyQueue,pause:b?.honroState.carriagePauseUntilRound,threats:c?e.alive(1).filter(v=>Math.abs(v.x-c.x)<1150&&Math.abs(v.y-c.y)<650).map(unit):[],foes:b?e.alive(1).map(unit):[],flags:b?.honroState.flags};}'''
PLAN='''(shotPolicy)=>{const a=HonroApp,C=HONRO_CORE,e=new C.Engine(structuredClone(a.engine.b),()=>{},true),u=e.active,s=C.SKILLS.A01;for(const t of e.alive(1).filter(t=>shotPolicy!=='defer-roost'||!HonroStage2Airborne.roost(t)).sort((v,w)=>Number(w.awake)-Number(v.awake)||Math.hypot(v.x-u.x,v.y-u.y)-Math.hypot(w.x-u.x,w.y-u.y)))for(const p of e.shotSeeds(u,s,t)){const pred=e.predict(u,s,p.angle,p.power,t,false);if(pred.unit===t.id){const v=C.shotViable(e,u,s,t,p.angle,p.power);if(v.risk<1&&v.friendlyDamage===0)return{target:t.id,...p,duration:e.chargeDuration(u,s)};}}return null;}'''
route=[(1600,'left-tree-branch-upper',False),(1100,'left-tree-branch-upper',True),(1450,'left-tree-branch-middle',False),(1050,'left-tree-branch-middle',True),(1500,'left-tree-branch-lower',False),(1350,'left-tree-branch-lower',True),(1050,'left-descent-stone-low',False),(1460,'canyon-ground',False),(1830,'canyon-ground',False)]
started=time.monotonic();last_dialogue=None;last_escort=None;page=None

def save(): (OUT/'result.json').write_text(json.dumps(R,ensure_ascii=False,indent=2))
def state():
 s=page.evaluate(STATE)
 if TOUCH:
  audio=page.evaluate("""()=>{const a=HonroApp.audio,c=a?.context,m=a?.music,v=m?.current;if(a?.master&&c&&!window.qaMeter){window.qaMeter=c.createAnalyser();qaMeter.fftSize=256;a.master.connect(qaMeter);}let rms=0;if(window.qaMeter){const data=new Float32Array(qaMeter.fftSize);qaMeter.getFloatTimeDomainData(data);rms=Math.sqrt(data.reduce((n,x)=>n+x*x,0)/data.length);}return {state:c?.state,time:c?.currentTime,playCount:a?.playCount,voices:a?.voices?.size,rms,bgm:v?{time:v.currentTime,paused:v.paused,src:v.currentSrc,ready:v.readyState,error:v.error?.message,volume:v.volume}:null,musicErrors:m?.errors};}""")
  R.setdefault('audio',[]).append(audio)
 return s

def press(locator):
 if TOUCH:locator.tap()
 else:locator.click()

def touch(selector,dx,dy,ms):
 box=page.locator(selector).bounding_box();assert box,selector
 x,y=box['x']+box['width']/2,box['y']+box['height']/2
 c=page.context.new_cdp_session(page)
 try:
  c.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
  if dx or dy:c.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+dx,'y':y+dy}]})
  page.wait_for_timeout(ms)
 finally:c.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});c.detach()

def capture_checkpoint(route_index):
 before=state();press(page.locator('[data-action="pause"]'));press(page.locator('[data-action="settings"]:visible').last)
 press(page.locator('[data-action="settings-page"][data-id="records"]'))
 with page.expect_download() as pending:press(page.locator('[data-action="export"]:visible'))
 download=pending.value;raw=Path(download.path()).read_bytes();profile=json.loads(raw)
 assert profile['honroBattle']['round']==before['round']
 for actor in ['u','car']:
  saved=next(u for u in profile['honroBattle']['units'] if u['id']==before[actor]['id'])
  for field in ['x','y','hp']:assert abs(saved[field]-before[actor][field])<1
 payload={'scope':'Unmodified real touch UI export checkpoint; same-state comparison, not a fresh campaign start.','profile':profile,'routeIndex':route_index,'servedBundle':R['servedBundle'],'sourceRun':str(OUT)}
 file=OUT/f'checkpoint-{before["round"]}.json';file.write_text(json.dumps(payload,ensure_ascii=False))
 R.setdefault('checkpoints',[]).append({'path':str(file),'round':before['round'],'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
 # Records -> settings root -> pause -> battle, all ordinary touch/click UI.
 for _ in range(5):
  if not page.locator('#modal.open').count():break
  close=page.locator('#modal [data-action="close"]:visible')
  if close.count():press(close.first)
  else:press(page.locator('#modal .menu-close'))
 assert ready();assert state()['round']==before['round'];save()

def log(op,**kw):
 row={'op':op,'elapsed':round(time.monotonic()-started,2),**kw};R['actions'].append(row)
 with (OUT/'actions.jsonl').open('a') as f:f.write(json.dumps(row,ensure_ascii=False)+'\n')
def hold(key,ms):
 if TOUCH:
  if key=='Space':touch('#fire',0,0,ms)
  else:
   axes={'ArrowLeft':(-40,0),'ArrowRight':(40,0),'ArrowUp':(0,-40),'ArrowDown':(0,40)}
   dx,dy=axes[key];touch('#joystick',dx,dy,ms)
  return
 page.keyboard.down(key)
 try:page.wait_for_timeout(ms)
 finally:page.keyboard.up(key)
def observe(s):
 global last_escort
 if s.get('car'):
  q=s.get('allyQueue') or {};key=(s['round'],s['phase'],q.get('index'),q.get('carTarget'),round(s['car']['x']/40))
  if key!=last_escort:
   last_escort=key;R['escort'].append({k:s[k] for k in ['round','phase','side','car','queue','allyQueue','pause','threats','allies']})
def ready():
 global last_dialogue
 for _ in range(2400):
  s=state();observe(s)
  if time.monotonic()-started>1800:raise TimeoutError('30 minute observation budget')
  if s['dialogue']:
   d=s['dialogue'];key=(d['id'],d['index'],str(d['line']))
   if key!=last_dialogue:R['dialogues'].append({'round':s['round'],**d});last_dialogue=key
   nxt=page.locator('[data-action="dialogue-next"]:visible')
   if nxt.count() and nxt.last.is_enabled():press(nxt.last)
   elif not TOUCH:page.keyboard.press('Enter')
   page.wait_for_timeout(160);continue
  if s.get('phase') in ['won','lost']:return False
  if s['can'] and s['u'] and s['u']['ground']:return True
  page.wait_for_timeout(150)
 raise TimeoutError('Input did not return')
def move_to(x,tolerance=12):
 first=state();u=first['u'];stuck=0;jumps=0
 for _ in range(120):
  s=state();observe(s)
  if not s['can'] or s['dialogue'] or s['u']['move']<12:break
  u=s['u'];delta=x-u['x']
  if abs(delta)<tolerance:break
  hold('ArrowRight' if delta>0 else 'ArrowLeft',min(160,max(18,abs(delta)/(u['speed']*1.5)*1000)))
  after=state()['u'];stuck=stuck+1 if abs(after['x']-u['x'])<.5 else 0
  if stuck>=3 and after['ground']:
   if jumps>=3:break
   press(page.locator('#jump')) if TOUCH else page.keyboard.press('Control');jumps+=1;stuck=0;page.wait_for_timeout(180)
 log('move',round=first['round'],target=x,start=u,end=state()['u'],jumps=jumps)
def fire():
 p=page.evaluate(PLAN,SHOT_POLICY)
 if not p:return False
 for _ in range(3):
  s=state();face=-1 if p['angle']>90 else 1
  if s['u']['facing']==face:break
  hold('ArrowLeft' if face<0 else 'ArrowRight',35)
  if not ready():return False
  p=page.evaluate(PLAN,SHOT_POLICY)
  if not p:return False
 for _ in range(50):
  s=state();u=s['u'];delta=(p['angle']-u['angle'])*u['facing']
  if abs(delta)<.75:break
  if not s['can']:return False
  hold('ArrowUp' if delta>0 else 'ArrowDown',min(160,max(16,abs(delta)/62*1000)))
 before=state()
 if not before['can']:return False
 hold('Space',max(20,p['duration']*p['power']*1000))
 page.wait_for_timeout(80);after=state();ok=after['shot']>before['shot'];log('fire',round=before['round'],plan=p,before=before,after=after,accepted=ok);return ok
try:
 with sync_playwright() as w:
  browser=launch(w);page=browser.new_page(viewport={'width':844,'height':390} if TOUCH else {'width':1440,'height':900},is_mobile=TOUCH,has_touch=TOUCH);page.on('pageerror',lambda e:R['errors'].append(str(e)))
  install_source_preview(page);R['sourcePreview']=source_preview_metadata()
  page.add_init_script("window.qaInputs={keys:[],pointers:[],touches:0};document.addEventListener('keydown',e=>qaInputs.keys.push(e.code),true);document.addEventListener('pointerdown',e=>qaInputs.pointers.push({type:e.pointerType,trusted:e.isTrusted,target:e.target.id||e.target.closest('[data-action]')?.dataset.action}),true);document.addEventListener('touchstart',()=>qaInputs.touches++,true);" )
  response=page.goto(URL);page.wait_for_function('window.HonroApp',timeout=60000)
  R['servedBundle']={'url':URL,'htmlSha256':hashlib.sha256(response.body()).hexdigest(),'resources':page.evaluate("performance.getEntriesByType('resource').filter(v=>v.name.includes('/web/')&&v.name.endsWith('.js')).map(v=>v.name)"),'checkoutIsNotBuildProof':True}
  fixture=json.loads(ENTRY.read_text());R['fixture']=fixture['scope'];R['entrySha256']=hashlib.sha256(ENTRY.read_bytes()).hexdigest()
  page.evaluate('(p)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',fixture['profile']);page.reload();page.wait_for_function('window.HonroApp');
  if TOUCH:
   R['method']='Touch-only gameplay: CDP touchStart/move/end joystick/fire and locator.tap buttons; no keyboard/mouse calls. Ordinary RAF. Browser reload is navigation, not a game-state import.'
   press(page.get_by_role('button',name='설정',exact=True));press(page.locator('[data-action="settings-page"][data-id="sound"]'))
   for selector in ['#setting-sound','#setting-music']:
    if not page.locator(selector).is_checked():press(page.locator(selector))
   press(page.locator('#modal .menu-close'));R['soundSettings']=page.evaluate('HonroApp.profile.settings')
  press(page.locator('[data-action="continue"]:visible').first) if fixture['profile'].get('honroBattle') else press(page.get_by_role('button',name='여정 이어가기',exact=True))
  for _ in range(300):
   s=state()
   if s.get('car'):break
   if s['dialogue']:
    nxt=page.locator('[data-action="dialogue-next"]:visible')
    if TOUCH:
     if nxt.count() and nxt.last.is_enabled():press(nxt.last)
    else:page.keyboard.press('Enter')
   else:
    enter=page.locator('[data-action="journey-enter"]:visible')
    if enter.count():press(enter.first)
   page.wait_for_timeout(150)
  assert ready();R['initial']=state();page.screenshot(path=str(OUT/'entry.png'))
  idx=fixture.get('routeIndex',0);first=not bool(fixture['profile'].get('honroBattle'));seen=set();resumed=False;checkpoint=False
  for action in range(130):
   if not ready():break
   s=state()
   if s['round'] not in seen:
    seen.add(s['round']);R['turns'].append(s);(OUT/f'round-{s["round"]}-battle.json').write_text(json.dumps(page.evaluate('HonroApp.engine.b'),ensure_ascii=False));print('round',s['round'],'route',idx,'hero',round(s['u']['x']),round(s['u']['y']),'car',round(s['car']['x']),'foes',len(s['foes']),flush=True);save()
   if TOUCH and s['round']>=6 and not resumed:
    press(page.locator('[data-action="pause"]'));before=state();R['inputBeforeReload']=page.evaluate('qaInputs');page.screenshot(path=str(OUT/'touch-before-reload.png'))
    page.reload();page.wait_for_function('window.HonroApp');press(page.locator('[data-action="continue"]:visible').first);assert ready();after=state()
    assert before['round']==after['round'] and before['flags']==after['flags']
    for actor in ['u','car']:
     for field in ['x','y','hp','move']:assert abs(before[actor][field]-after[actor][field])<1,(actor,field,before[actor],after[actor])
    R['resume']={'before':before,'after':after,'method':'touch pause; browser reload navigation/pagehide autosave; touch Continue; no profile injection'};resumed=True;s=after;page.screenshot(path=str(OUT/'touch-after-reload.png'));save()
   if EXPORT_ROUND and s['round']>=EXPORT_ROUND and not checkpoint:
    capture_checkpoint(idx);checkpoint=True;s=state()
   if first:
    first=False
    if fire():continue
   if idx<len(route):
    x,support,drop=route[idx];move_to(x,12);s=state()
    if s['dialogue']:continue
    if s['u']['ground'] and abs(s['u']['x']-x)<18 and s['u']['support']==support:
     log('route',index=idx,state=s)
     if drop:
      # A moving foot cancels the real180ms anticipation. Wait for release inertia,
      # and verify that the tap actually starts a drop before advancing the route.
      for _ in range(60):
       before=state()
       if abs(before['u'].get('vx',0))<=3 and abs(before['u'].get('vy',0))<=3:break
       page.wait_for_timeout(50)
      press(page.locator('[data-action="drop"]'));page.wait_for_timeout(250);after=state()
      accepted=bool(after['u'].get('drop')) or after['u']['y']>before['u']['y']+6
      log('drop',index=idx,before=before['u'],after=after['u'],accepted=accepted)
      if not accepted:continue
     idx+=1
     if not drop and idx in [1,3] and fire():continue
     if s['u']['move']>40:continue
   else:
    # Continue the lower route towards threats/convoy instead of stopping at1830.
    goal=min(4050,max(s['car']['x']+400,s['u']['x']+350))
    if POLICY=='rejoin' and s['foes']:
     # Keep the archer in the convoy fight; choose a firing flank near the last aerial threat.
     target=min(s['foes'],key=lambda v:abs(v['x']-s['car']['x']))
     goal=min(4050,max(1500,min(s['car']['x']+500,target['x']+500)))
    elif (POLICY=='return' and s['round']>=17 or POLICY=='recover-aerial' and s['u']['x']>3400 and len(s['foes'])<=2) and s['foes']:
     target=min(s['foes'],key=lambda v:abs(v['x']-s['u']['x']))
     goal=max(1500,min(4050,target['x']+500))
    if s['u']['move']>40:move_to(goal)
   if not ready():break
   if not fire():
    s=state();press(page.locator('[data-action="defend"]'));log('defend',state=s)
  R['final']=state();R['routeIndex']=idx;R['passed']=R['final']['phase']=='won' and not R['errors'];page.screenshot(path=str(OUT/'terminal.png'))
  # Save via ordinary pause menu when unfinished; victory persistence is automatic.
  R['profile']=page.evaluate('HonroApp.profile');R['inputFinal']=page.evaluate('qaInputs')
  if TOUCH:
   assert resumed
   for audit in [R['inputBeforeReload'],R['inputFinal']]:assert not audit['keys'] and all(e['type']=='touch' and e['trusted'] for e in audit['pointers']) and audit['touches']>0,audit
  browser.close()
except Exception:
 R['failure']=traceback.format_exc()
 if page:
  try:R['last']=state();page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
finally:save();print(json.dumps({k:R.get(k) for k in ['passed','final','failure']},ensure_ascii=False),flush=True)
if not R['passed']:raise SystemExit(1)
