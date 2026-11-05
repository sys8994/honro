"""Tool-assisted real Chromium keyboard/pointer combat from the same synthetic
entry save as the native comparison. No combat-state writes after entry.
Uses production predictions (not a human success-rate test); all evidence local.
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
planner=(ROOT/'tests/stage21-current-plan.js').read_text()
(out/'controller-plan.js').write_text(planner)
(out/'controller-ui.py').write_text(Path(__file__).read_text())
result={'sourcePreview':source_preview_metadata(),'scope':__doc__,'entrySha256':hashlib.sha256(entry_path.read_bytes()).hexdigest(),'servedSource':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'servedManifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'plannerSha256':hashlib.sha256(planner.encode()).hexdigest(),'completed':False,'errors':[],'resume':[]};events=[]
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw);page=browser.new_page(viewport={'width':1280,'height':800});install_source_preview(page);page.on('pageerror',lambda e:result['errors'].append(str(e)))
 def state():return page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,V=HonroAct23V4;return {stage:b.honroStage,round:b.round,side:b.side,phase:b.phase,active:u?.id,cls:u?.cls,x:u?.x,y:u?.y,angle:u?.angle,facing:u?.facing,moveLeft:u?.moveLeft,can:a.canInput(),grounded:u&&e.grounded(u),dialogue:!!a.dialogue,shots:b.shots,enemyHpSum:b.units.filter(v=>v.side===1&&!v.dead).reduce((n,v)=>n+v.hp,0),enemyUnits:b.units.filter(v=>v.side===1).map(v=>({id:v.id,hp:v.hp,dead:v.dead})),health:b.units.filter(v=>v.side===0&&!v.summoned).map(v=>({id:v.id,hp:v.hp,dead:v.dead})),objective:V.current(b)?.id,city:HonroAct23V4City.memory(b),done:a.done,objectiveText:document.querySelector('#objective-text')?.textContent};}''')
 def record(kind,extra=None):
  row={'kind':kind,'time':time.monotonic(),'state':state(),**(extra or {})};events.append(row)
  with (out/'events.jsonl').open('a') as f:f.write(json.dumps(row,ensure_ascii=False)+'\n')
  print(kind,row['state']['round'],row['state']['active'],row['state']['objective'],flush=True)
 def ready():
  for _ in range(150):
   s=state()
   if s['phase'] in ['won','lost'] or s['done']:return False
   if s['dialogue']:page.wait_for_timeout(250);page.keyboard.press('Enter')
   elif s['can'] and s['grounded']:return True
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
   goal=page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,V=HonroAct23V4,s=V.current(b),u=e.active,city=HonroAct23V4City.memory(b);if(s.id==='city-exit')return V.marker(b,s.id).x;if(!city.started){const t=(s.target&&e.unit(s.target))||e.unit(s.id)||V.marker(b,s.id),foe=e.alive(1).filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<1050).sort((a,z)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(z.x-u.x,z.y-u.y))[0];if(foe&&Math.abs(foe.x-t.x)<700)return foe.x+(u.x<foe.x?-1:1)*(u.cls==='knight'?100:430);return t.x;}const req=new Set([...b.honroV4CitySpec.localIds,...(city.pressure.ids||[])]),threat=e.alive(1).filter(t=>req.has(t.id)).sort((a,z)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(z.x-u.x,z.y-u.y))[0];if(threat)return threat.x+(u.x<threat.x?-1:1)*(u.cls==='knight'?110:260);return {archer:1400,mage:1500,knight:2850,occultist:3030}[u.cls];}''')
   # Before spending movement, get behind the NPC's actual direction of travel.
   retreat=page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,c=HonroAct23V4City.memory(b),q=b.honroV4CitySpec;if(!c.started)return null;for(const [id,m]of Object.entries(c.actors||{})){const n=e.unit(id);if(!n||m.safe||!['body-or-terrain','terrain'].includes(m.blocked)||Math.abs(n.y-u.y)>110||Math.abs(n.x-u.x)>190)continue;const target=id===q.guard&&!c.proof.pickup?e.unit(q.resident).x+75:q.destination.x+(id===q.guard?90:0),dir=target<n.x?-1:1;if((u.x-n.x)*dir>-30)return n.x-dir*220;}return null;}""")
   move(retreat if retreat is not None else goal)
   if retreat is not None:record('clear-escort-body')
   if not ready():break
   if state()['active']!=start['active']:continue
   interact=page.evaluate('''()=>{const a=HonroApp,V=HonroAct23V4,s=V.current(a.engine.b);return s?.kind==='v4-city-rescue'&&!HonroAct23V4City.memory(a.engine.b).started&&V.eligibility(a,V.marker(a.engine.b,s.id)).ok;}''')
   if interact:page.keyboard.press('e');record('rescue-interact');continue
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
  try:result['final']=state();page.screenshot(path=str(out/'failure.png'))
  except Exception:pass
 finally:
  (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));browser.close()
assert result['completed'] and result['final']['round']<=20 and not result['errors'],{k:v for k,v in result.items() if k!='profile'}
assert result['resume'] and all(q['growthPreserved'] and q['objectivesPreserved'] and q['roundBefore']==q['roundAfter'] and q['residentDistanceAfter']>=q['residentDistanceBefore'] for q in result['resume']),result['resume']
print('PASS browser real combat and exit',result['final']['round'])
