"""Stage2 real Chromium keyboard/pointer run; read-only isolated shot planning.
Declared prior-stage entry fixture; no engine move/fire/tick or battle writes.
"""
import json,os,sys,time,traceback,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tests'))
from browser_support import launch
OUT=Path(os.environ.get('HONRO_STAGE2_OUT','_local/reports/stage02-current/full-ui'));OUT.mkdir(parents=True,exist_ok=True)
URL=os.environ.get('HONRO_QA_URL','http://127.0.0.1:8842/HONRO.html')
R={'method':'Real keyboard movement/aim/charge/drop and pointer dialogue/defend; ordinary production animation loop. Isolated copy used only for shot planning. Legal prior-stage fixture, not campaign continuity or human fun approval.','source':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'actions':[],'turns':[],'dialogues':[],'escort':[],'errors':[],'passed':False}
STATE='''()=>{const a=HonroApp,e=a.engine,b=e?.b,u=e?.active,c=e?.unit('objective');const unit=v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:!!v.dead,move:v.moveLeft,ground:e.grounded(v),angle:v.angle,facing:v.facing,speed:v.walkSpeed,support:e.contactSurface(v.x,v.y-4,v.y+5)?.t.id});return {screen:a.screen,can:a.canInput(),done:a.done,dialogue:a.dialogue?{id:a.dialogue.id,index:a.dialogue.index,line:a.dialogue.lines[a.dialogue.index]}:null,round:b?.round,phase:b?.phase,side:b?.side,shot:b?.shot,u:u?unit(u):null,car:c?unit(c):null,queue:b?.queue,allyQueue:b?.honroState.allyQueue,pause:b?.honroState.carriagePauseUntilRound,threats:c?e.alive(1).filter(v=>Math.abs(v.x-c.x)<1150&&Math.abs(v.y-c.y)<650).map(unit):[],foes:b?e.alive(1).map(unit):[],flags:b?.honroState.flags};}'''
PLAN='''()=>{const a=HonroApp,C=HONRO_CORE,e=new C.Engine(structuredClone(a.engine.b),()=>{},true),u=e.active,s=C.SKILLS.A01;for(const t of e.alive(1).sort((v,w)=>Number(w.awake)-Number(v.awake)||Math.hypot(v.x-u.x,v.y-u.y)-Math.hypot(w.x-u.x,w.y-u.y)))for(const p of e.shotSeeds(u,s,t)){const pred=e.predict(u,s,p.angle,p.power,t,false);if(pred.unit===t.id){const v=C.shotViable(e,u,s,t,p.angle,p.power);if(v.risk<1&&v.friendlyDamage===0)return{target:t.id,...p,duration:e.chargeDuration(u,s)};}}return null;}'''
route=[(1600,'left-tree-branch-upper',False),(1100,'left-tree-branch-upper',True),(1450,'left-tree-branch-middle',False),(1050,'left-tree-branch-middle',True),(1500,'left-tree-branch-lower',False),(1350,'left-tree-branch-lower',True),(1050,'left-descent-stone-low',False),(1460,'canyon-ground',False),(1830,'canyon-ground',False)]
started=time.monotonic();last_dialogue=None;last_escort=None;page=None

def save(): (OUT/'result.json').write_text(json.dumps(R,ensure_ascii=False,indent=2))
def state(): return page.evaluate(STATE)
def log(op,**kw):
 row={'op':op,'elapsed':round(time.monotonic()-started,2),**kw};R['actions'].append(row)
 with (OUT/'actions.jsonl').open('a') as f:f.write(json.dumps(row,ensure_ascii=False)+'\n')
def hold(key,ms):
 page.keyboard.down(key)
 try:page.wait_for_timeout(ms)
 finally:page.keyboard.up(key)
def observe(s):
 global last_escort
 if s.get('car'):
  q=s.get('allyQueue') or {};key=(s['round'],s['phase'],q.get('index'),q.get('carTarget'),round(s['car']['x']/40))
  if key!=last_escort:
   last_escort=key;R['escort'].append({k:s[k] for k in ['round','phase','side','car','queue','allyQueue','pause','threats']})
def ready():
 global last_dialogue
 for _ in range(2400):
  s=state();observe(s)
  if time.monotonic()-started>1800:raise TimeoutError('30 minute observation budget')
  if s['dialogue']:
   d=s['dialogue'];key=(d['id'],d['index'],str(d['line']))
   if key!=last_dialogue:R['dialogues'].append({'round':s['round'],**d});last_dialogue=key
   nxt=page.locator('[data-action="dialogue-next"]:visible')
   if nxt.count() and nxt.last.is_enabled():nxt.last.click()
   else:page.keyboard.press('Enter')
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
   page.keyboard.press('Control');jumps+=1;stuck=0;page.wait_for_timeout(180)
 log('move',round=first['round'],target=x,start=u,end=state()['u'],jumps=jumps)
def fire():
 p=page.evaluate(PLAN)
 if not p:return False
 for _ in range(3):
  s=state();face=-1 if p['angle']>90 else 1
  if s['u']['facing']==face:break
  hold('ArrowLeft' if face<0 else 'ArrowRight',35)
  if not ready():return False
  p=page.evaluate(PLAN)
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
  browser=launch(w);page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:R['errors'].append(str(e)))
  page.goto(URL);page.wait_for_function('window.HonroApp',timeout=60000)
  fixture=json.loads(Path('tests/fixtures/act1-art/stage02-entry.json').read_text());R['fixture']=fixture['scope']
  page.evaluate('(p)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',fixture['profile']);page.reload();page.wait_for_function('window.HonroApp');page.get_by_role('button',name='여정 이어가기',exact=True).click()
  for _ in range(300):
   s=state()
   if s.get('car'):break
   if s['dialogue']:page.keyboard.press('Enter')
   else:
    enter=page.locator('[data-action="journey-enter"]:visible')
    if enter.count():enter.first.click()
   page.wait_for_timeout(150)
  assert ready();R['initial']=state();page.screenshot(path=str(OUT/'entry.png'))
  idx=0;first=True;seen=set()
  for action in range(130):
   if not ready():break
   s=state()
   if s['round'] not in seen:
    seen.add(s['round']);R['turns'].append(s);print('round',s['round'],'route',idx,'hero',round(s['u']['x']),round(s['u']['y']),'car',round(s['car']['x']),'foes',len(s['foes']),flush=True);save()
   if first:
    first=False
    if fire():continue
   if idx<len(route):
    x,support,drop=route[idx];move_to(x,12);s=state()
    if s['dialogue']:continue
    if s['u']['ground'] and abs(s['u']['x']-x)<18 and s['u']['support']==support:
     log('route',index=idx,state=s)
     if drop:page.locator('[data-action="drop"]').click();log('drop',index=idx)
     idx+=1
     if not drop and idx in [1,3] and fire():continue
     if s['u']['move']>40:continue
   else:
    # Continue the lower route towards threats/convoy instead of stopping at1830.
    goal=min(4050,max(s['car']['x']+400,s['u']['x']+350))
    if s['u']['move']>40:move_to(goal)
   if not ready():break
   if not fire():
    s=state();page.locator('[data-action="defend"]').click();log('defend',state=s)
  R['final']=state();R['routeIndex']=idx;R['passed']=R['final']['phase']=='won' and not R['errors'];page.screenshot(path=str(OUT/'terminal.png'))
  # Save via ordinary pause menu when unfinished; victory persistence is automatic.
  R['profile']=page.evaluate('HonroApp.profile');browser.close()
except Exception:
 R['failure']=traceback.format_exc()
 if page:
  try:R['last']=state();page.screenshot(path=str(OUT/'failure.png'))
  except Exception:pass
finally:save();print(json.dumps({k:R.get(k) for k in ['passed','final','failure']},ensure_ascii=False),flush=True)
if not R['passed']:raise SystemExit(1)
