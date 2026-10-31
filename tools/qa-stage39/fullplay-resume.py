"""Isolated official-entry QA fixture. No combat outcomes or mission flags injected."""
import sys,json,threading,functools,hashlib
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'tests'));from browser_support import launch
raw=(root/'_local/inputs/stage39-presentation/stage39.json').read_bytes();assert hashlib.sha256(raw).hexdigest()=='0bb8dd43bf33af941c88800c4e7e13bbf2c7d3dd924444c035c997daad8f5dcb';project=json.loads(raw);out=root/'_local/reports/stage39-fullplay-run2-resumed';out.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)));threading.Thread(target=srv.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{srv.server_port}';result={'scope':'Isolated official-entry fixture with prior 1–38 cleared, official entry-level XP, official automatic talent training and mandatory/recruit equipment migration. No claim of actually playing prior chapters. Candidate is injected in memory only.','candidateSha256':hashlib.sha256(raw).hexdigest(),'errors':[]}
with sync_playwright() as pw:
 browser=launch(pw);ctx=browser.new_context(viewport={'width':1440,'height':900});page=ctx.new_page()
 storage=json.loads((root/'_local/reports/stage39-fullplay-run2/browser-storage.json').read_text())
 value=next(x['value'] for x in storage['origins'][0]['localStorage'] if x['name']=='honro-first-act-profile-1')
 page.add_init_script("localStorage.setItem('honro-first-act-profile-1',"+json.dumps(value)+");")
 page.on('pageerror',lambda e:result['errors'].append(str(e)));page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp&&window.HONRO_PROJECT&&window.HONRO_AUTHORED_FAR',timeout=60000)
 page.evaluate("""async project=>{await HonroCampaignLoader.ensureStage(39);const all=HONRO_PROJECT;all.stages=all.stages.filter(s=>s.metadata.stageId!==39).concat(project.stages);const ids=new Set(project.library.map(x=>x.id));all.library=all.library.filter(x=>!ids.has(x.id)).concat(project.library);HONRO_AUTHORED_FAR.images.act4Estuary='/_local/inputs/stage32-sharp/act4-estuary.webp'}""",project)
 page.locator('[data-action="continue"]').first.click(timeout=30000);page.wait_for_function('HonroApp.engine?.b?.honroStage===39',timeout=60000)
 page.wait_for_timeout(1000)
 # Live input only from here; all game evaluations below read state/predict only.
 import time
 events=(out/'events.jsonl').open('a',encoding='utf8')
 def snapshot():
  return page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,q=b.honroAct4PreviewState||{};return {round:b.round,side:b.side,phase:b.phase,shot:b.shot,active:u?.id,cls:u?.cls,x:u?.x,y:u?.y,angle:u?.angle,facing:u?.facing,grounded:u&&e.grounded(u),drop:u&&e.canDrop(),support:u&&e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id,retreat:!!u?.retreat,can:a.canInput(),canAct:e.canAct(),selected:a.selected,charging:a.charging,projectiles:b.projectiles.length,dialogue:!!a.dialogue,dialogueText:document.querySelector('#story-line')?.innerText,heroes:b.units.filter(v=>v.side===0&&!v.summoned).map(v=>({id:v.id,hp:v.hp,dead:v.dead,x:v.x,y:v.y,acted:v.acted})),residents:b.units.filter(v=>v.honroAct4Resident).map(v=>({id:v.id,hp:v.hp,dead:v.dead,x:v.x,y:v.y})),foes:b.units.filter(v=>v.side===1&&!v.dead).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp})),tide:q.tide,artillery:q.artillery,netOpen:q.netOpen,exitStable:q.exitStable,rescued:q.rescued,failure:q.failure,complete:q.complete,screen:a.screen}}''')
 def record(kind,**extra):
  x={'kind':kind,'time':time.time(),'state':snapshot(),**extra};events.write(json.dumps(x,ensure_ascii=False)+'\n');events.flush();print(json.dumps(x,ensure_ascii=False),flush=True);return x['state']
 def plan():
  return page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,C=HONRO_CORE;if(!u)return null;const protectedUnits=b.units.filter(v=>v!==u&&!v.dead&&v.hp>0&&(v.side===0||v.honroAct4Resident));const enemies=b.units.filter(v=>v.side===1&&!v.dead&&v.id!=='a4-wreck').sort((x,y)=>Math.hypot(x.x-u.x,x.y-u.y)-Math.hypot(y.x-u.x,y.y-u.y)).slice(0,5);let best=null;for(const t of enemies){for(let idx=0;idx<u.loadout.length;idx++){const id=u.loadout[idx],s=C.SKILLS[id];if(!s||s.passive||['O13','S08'].includes(id)||!e.skillAllowed(s,u)||e.cooldownLeft(u,id)>0||s.mode==='charge')continue;const aims=[...e.shotSeeds(u,s,t),...[-35,-15,0,15,30,45,60,75].flatMap(angle=>[.3,.5,.7,.9,1].map(power=>({angle:t.x>=u.x?angle:180-angle,power})))];for(const z of aims){if(!e.canAfford(s,u,z.power))continue;const v=C.shotViable(e,u,s,t,z.angle,z.power);if(!v.ok||v.risk>0||!v.enemyDamage)continue;const h=v.hit,r=e.effective(s,u).radius||0;if(protectedUnits.some(p=>Math.hypot(p.x-h.x,(p.y-p.h*.5)-h.y)<Math.max(r+90,120)))continue;if(h.unit==='a4-wreck')continue;const score=v.enemyDamage+(v.enemyDamage>=t.hp?600:0)+(h.unit===t.id?100:0);if(!best||score>best.score)best={id,idx,angle:z.angle,power:z.power,target:t.id,hit:h.unit,score,damage:v.enemyDamage};}}}return best}''')
 def held(key,ms):
  page.keyboard.down(key)
  try:page.wait_for_timeout(int(ms))
  finally:page.keyboard.up(key)
 def ready():
  for i in range(180):
   s=snapshot()
   if s['phase'] in ('won','lost') or s.get('failure') or s.get('complete'):return False
   if s['dialogue']:
    record('dialogue');page.wait_for_timeout(1300);page.keyboard.press('Enter');page.wait_for_timeout(300)
   elif s['can'] and s['side']==0 and s['phase']=='aim' and s['grounded']:return True
   else:page.wait_for_timeout(500)
  record('wait-timeout');return False
 record('start');page.screenshot(path=str(out/'start.png'));history={};warnings=set()
 for turn in range(160):
  if not ready():record('terminal-or-wait');break
  s=record('turn-start',index=turn)
  if s.get('retreat'):
   page.keyboard.press('f');page.wait_for_timeout(450);record('finish-retreat');continue
  if s.get('artillery'):
   n=s['artillery'].get('next')
   if n and n.get('warningSeen') and (n.get('dueRound'),n.get('x'),n.get('y')) not in warnings:
    warnings.add((n.get('dueRound'),n.get('x'),n.get('y')));page.screenshot(path=str(out/f'artillery-{turn}.png'));record('visible-artillery')
  if s.get('tide') and s['tide'].get('warned') and 'tide' not in warnings:
   warnings.add('tide');page.screenshot(path=str(out/f'tide-{turn}.png'));record('tide-state')
  enemies=[v for v in s['foes'] if v['id']!='a4-wreck']
  if not enemies:
   record('combat-ended-needs-route');break
  signature=(round(sum(v['hp'] for v in enemies)),s['support'],round(s['x']/100),round(s['y']/100));h=history.setdefault(s['active'],[]);h.append(signature)
  if len(h)>=4 and h[-1]==h[-2]==h[-3]==h[-4]:record('watchdog-no-progress',history=h[-4:]);break
  choice=plan();record('plan',choice=choice)
  if not choice:
   target=min(enemies,key=lambda v:abs(v['x']-s['x'])+.8*abs(v['y']-s['y']))
   # Movement is limited to short supported walks; never advance blindly across a ledge.
   if target['y']>s['y']+250 and abs(target['x']-s['x'])<650 and s['drop']:
    page.keyboard.press('Alt');page.wait_for_timeout(1500);record('drop',target=target)
   else:
    key='ArrowLeft' if target['x']<s['x']-100 else 'ArrowRight';held(key,650);page.wait_for_timeout(500);after=snapshot();record('walk',target=target)
    if abs(after['x']-s['x'])<12 and after['grounded']:
     page.keyboard.press('Control');held(key,350);page.wait_for_timeout(1000);record('jump')
   choice=plan() if snapshot()['can'] and snapshot()['grounded'] else None
  if choice:
   s=snapshot();desired=-1 if choice['angle']>90 else 1
   if s['facing']!=desired:
    held('ArrowLeft' if desired<0 else 'ArrowRight',80);page.wait_for_timeout(200);choice=plan()
   if choice:
    page.keyboard.press('Digit'+str(choice['idx']+1));page.wait_for_timeout(120)
    for _ in range(20):
     st=snapshot();delta=choice['angle']-st['angle']
     if abs(delta)<.8 or not st['can']:break
     held('ArrowUp' if delta*st['facing']>0 else 'ArrowDown',min(200,max(20,abs(delta)*1000/62)));page.wait_for_timeout(70)
    duration=page.evaluate('''()=>HonroApp.engine.chargeDuration(HonroApp.engine.active,HONRO_CORE.SKILLS[HonroApp.selected])''');page.keyboard.down('Space');page.wait_for_timeout(max(80,round(duration*choice['power']*1000)));actual=page.evaluate('''()=>({angle:HonroApp.engine.active.angle,power:HonroApp.power})''');page.keyboard.up('Space');record('fired',choice=choice,actual=actual)
  else:
   record('no-safe-shot-no-action');break
  page.wait_for_timeout(3000);after=record('post-shot',index=turn);page.screenshot(path=str(out/f'action-{turn:03d}.png'));
  if after['phase']=='aim' and after['side']==0 and after['active']==s['active'] and not after['dialogue'] and not after.get('retreat'):
   page.keyboard.press('Tab');page.wait_for_timeout(300);record('switch-hero')
 else:record('iteration-limit')
 page.screenshot(path=str(out/'stop.png'));ctx.storage_state(path=str(out/'browser-storage.json'));events.close();ctx.close();browser.close()
srv.shutdown();srv.server_close()
