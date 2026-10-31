"""Isolated official-entry QA fixture. No combat outcomes or mission flags injected."""
import sys,json,threading,functools,hashlib
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'tests'));from browser_support import launch
raw=(root/'_local/inputs/stage39-presentation/stage39.json').read_bytes();assert hashlib.sha256(raw).hexdigest()=='0bb8dd43bf33af941c88800c4e7e13bbf2c7d3dd924444c035c997daad8f5dcb';project=json.loads(raw);out=root/'_local/reports/stage39-fullplay-pilot-fresh';out.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)));threading.Thread(target=srv.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{srv.server_port}';result={'scope':'Isolated official-entry fixture with prior 1–38 cleared, official entry-level XP, official automatic talent training and mandatory/recruit equipment migration. No claim of actually playing prior chapters. Candidate is injected in memory only.','candidateSha256':hashlib.sha256(raw).hexdigest(),'errors':[]}
with sync_playwright() as pw:
 browser=launch(pw);ctx=browser.new_context(viewport={'width':1440,'height':900});page=ctx.new_page();page.on('pageerror',lambda e:result['errors'].append(str(e)));page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp&&window.HONRO_PROJECT&&window.HONRO_AUTHORED_FAR',timeout=60000)
 result['fixture']=page.evaluate('''async data=>{const {project,fixed}=data;const a=HonroApp,C=HONRO_CORE,s=project.stages[0],p={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(s)};if(!C.autoTrain||!C.pointsEarned||!C.pointsSpent)throw Error('official progression functions missing');p.cleared={};for(let i=1;i<=38;i++)p.cleared[i]={visits:1,rounds:10};p.recruited=['archer','mage','knight','occultist'];p.party=[...p.recruited];p.lastStage=39;p.settings={...p.settings,debugMode:false,sound:false,music:false,speed:1,playerSpeed:1};for(const id of p.recruited){C.autoTrain(p.heroes[id],id);C.sanitizeLoadout(p,id);}delete p.equipment;HonroEquipment.migrate(p);const used=new Set();for(const cls of p.recruited){for(const slot of ['personal','common']){const item=[...p.equipment.ownedItemIds].reverse().find(id=>{const x=C.EQUIPMENT_MAP[id];return x.slot===slot&&(!x.characterClass||x.characterClass===cls)&&!used.has(id)});if(item){p.equipment.equippedByClass[cls][slot]=item;used.add(item);}}}HonroEquipment.sync(p);HonroEquipment.validate(p.equipment);Object.assign(p,fixed);HonroEquipment.validate(p.equipment);const rec=p.recruited.map(cls=>({cls,level:C.levelOf(p.heroes[cls]),xp:p.heroes[cls].xp,earned:C.pointsEarned(p.heroes[cls]),spent:C.pointsSpent(p.heroes[cls],cls),left:C.pointsLeft(p.heroes[cls],cls),ranks:p.heroes[cls].ranks,loadout:p.loadouts[cls],equipment:p.equipment.equippedByClass[cls]}));if(rec.some(x=>x.spent>x.earned||x.level!==HonroProgression.plan(39).entryLevel))throw Error('illegal entry build');await HonroCampaignLoader.ensureStage(39);const s39=project.stages[0],all=globalThis.HONRO_PROJECT;all.stages=all.stages.filter(s=>s.metadata.stageId!==39).concat([s39]);const ids=new Set(project.library.map(x=>x.id));all.library=all.library.filter(x=>!ids.has(x.id)).concat(project.library);HONRO_AUTHORED_FAR.images.act4Estuary='/_local/inputs/stage32-sharp/act4-estuary.webp';a.profile=p;a.normalProfile=p;if(!a.profileStore.save(p))throw Error('fixture profile save failed');return{profile:p,build:rec,plan:HonroProgression.plan(39),equipment:{owned:p.equipment.ownedItemIds,ledger:p.equipment.rewardLedger,validated:true},schema:HonroMaps.validate(project).filter(e=>e.level==='err')};}''',{'project':project,'fixed':json.loads((root/'art/act4-sharpness-followups/stage39-fullplay/entry-pilot/entry-profile.json').read_text())})
 fixture=result['fixture'];assert not fixture['schema'];profile_json=json.dumps(fixture.pop('profile'),ensure_ascii=False,separators=(',',':')).encode();(out/'entry-profile.json').write_bytes(profile_json);fixture['profileSha256']=hashlib.sha256(profile_json).hexdigest();result['launch']=page.evaluate('''()=>{const a=HonroApp;a.launch(39);const e=a.engine;if(!e)throw Error('campaign launch deferred or blocked');const b=e.b;return{stage:b.honroStage,official:b.honroAct4Official,custom:b.honroCustom,mode:b.mode,phase:b.phase,units:b.units.map(u=>({id:u.id,side:u.side,x:u.x,y:u.y,hp:u.hp,maxHp:u.maxHp,loadout:u.loadout,grounded:e.grounded(u)})),dialogue:!!a.dialogue}}''');page.wait_for_timeout(1200);page.screenshot(path=str(out/'initial.png'));result['afterWait']=page.evaluate('''()=>({screen:HonroApp.screen,dialogue:!!HonroApp.dialogue,phase:HonroApp.engine.b.phase,round:HonroApp.engine.b.round,events:HonroApp.engine.b.honroAct4PreviewState?.events,storage:HonroApp.profileStore.locked})''');(out/'entry.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'fixture':fixture,'launch':result['launch'],'afterWait':result['afterWait'],'errors':result['errors']},ensure_ascii=False));

 check=page.evaluate('''()=>({module:!!HonroAct4PilotCombat?.attach,reference:HONRO_ACT4_PILOT_COMBAT_REFERENCE?.version,mid:HonroApp.engine.b.units.filter(u=>u.honroPilotMidboss).map(u=>({id:u.id,tag:u.honroPilotMidboss,equipped:HonroAct4PilotCombat.equipped(HonroApp.engine.b,u)}))})''')
 assert check['module'] and check['reference']==2 and len(check['mid'])==1 and check['mid'][0]['equipped'],check
 result['pilotPreflight']=check
 # Live input only from here; all game evaluations below read state/predict only.
 import time
 events=(out/'events.jsonl').open('a',encoding='utf8')
 def snapshot():
  return page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,q=b.honroAct4PreviewState||{};return {round:b.round,side:b.side,phase:b.phase,shot:b.shot,active:u?.id,cls:u?.cls,x:u?.x,y:u?.y,angle:u?.angle,facing:u?.facing,grounded:u&&e.grounded(u),drop:u&&e.canDrop(),support:u&&e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id,moveLeft:u?.moveLeft,retreat:!!u?.retreat,can:a.canInput(),canAct:e.canAct(),selected:a.selected,charging:a.charging,projectiles:b.projectiles.length,dialogue:!!a.dialogue,dialogueText:document.querySelector('#story-line')?.innerText,heroes:b.units.filter(v=>v.side===0&&!v.summoned).map(v=>({id:v.id,hp:v.hp,maxHp:v.maxHp,dead:v.dead,x:v.x,y:v.y,acted:v.acted})),residents:b.units.filter(v=>v.honroAct4Resident).map(v=>({id:v.id,hp:v.hp,dead:v.dead,x:v.x,y:v.y})),foes:b.units.filter(v=>v.side===1&&!v.dead).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp})),pilot:b.units.filter(v=>v.honroPilotMidboss).map(v=>({id:v.id,hp:v.hp,combat:v.honroPilotCombat})),tide:q.tide,artillery:q.artillery,netOpen:q.netOpen,exitStable:q.exitStable,rescued:q.rescued,failure:q.failure,complete:q.complete,screen:a.screen}}''')
 def record(kind,**extra):
  x={'kind':kind,'time':time.time(),'state':snapshot(),**extra};events.write(json.dumps(x,ensure_ascii=False)+'\n');events.flush();print(json.dumps(x,ensure_ascii=False),flush=True);return x['state']
 def plan():
  return page.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,C=HONRO_CORE;if(!u)return null;const protectedUnits=b.units.filter(v=>v!==u&&!v.dead&&v.hp>0&&(v.side===0||v.honroAct4Resident));const enemies=b.units.filter(v=>v.side===1&&!v.dead&&v.id!=='a4-wreck').sort((x,y)=>Math.hypot(x.x-u.x,x.y-u.y)-Math.hypot(y.x-u.x,y.y-u.y)).slice(0,5);let best=null;for(const t of enemies){for(let idx=0;idx<u.loadout.length;idx++){const id=u.loadout[idx],s=C.SKILLS[id];if(!s||s.passive||['O13','S08'].includes(id)||!e.skillAllowed(s,u)||e.cooldownLeft(u,id)>0||s.mode==='charge')continue;const aims=[...e.shotSeeds(u,s,t),...[-35,-15,0,15,30,45,60,75].flatMap(angle=>[.3,.5,.7,.9,1].map(power=>({angle:t.x>=u.x?angle:180-angle,power})))];for(const z of aims){if(!e.canAfford(s,u,z.power))continue;const v=C.shotViable(e,u,s,t,z.angle,z.power);if(!v.ok||v.risk>0||!v.enemyDamage)continue;const h=v.hit,r=e.effective(s,u).radius||0;if(protectedUnits.some(p=>Math.hypot(p.x-h.x,(p.y-p.h*.5)-h.y)<Math.max(r+90,120)))continue;if(h.unit==='a4-wreck'||protectedUnits.some(p=>p.id===h.unit))continue;const points=h.points||[];if(protectedUnits.some(p=>points.some(q=>Math.abs(q.x-p.x)<p.r+12&&q.y>p.y-p.h-12&&q.y<p.y+12)))continue;const score=v.enemyDamage+(v.enemyDamage>=t.hp?600:0)+(h.unit===t.id?100:0);if(!best||score>best.score)best={id,idx,angle:z.angle,power:z.power,target:t.id,hit:h.unit,score,damage:v.enemyDamage};}}}return best}''')
 def held(key,ms):
  page.keyboard.down(key)
  try:page.wait_for_timeout(int(ms))
  finally:page.keyboard.up(key)
 def ready():
  for i in range(180):
   s=snapshot()
   for w in s.get('pilot',[]):
    t=(w.get('combat') or {}).get('target') or {}
    key=('midboss',w['id'],t.get('round'))
    if t.get('seen') and key not in warnings:
     warnings.add(key);record('pilot-warning-observed',warning=w);page.screenshot(path=str(out/f'pilot-warning-{len(warnings)}.png'))
   if s['phase'] in ('won','lost') or s.get('failure') or s.get('complete'):return False
   if s['dialogue']:
    record('dialogue');page.wait_for_timeout(1300);page.keyboard.press('Enter');page.wait_for_timeout(300)
   elif s['can'] and s['side']==0 and s['phase']=='aim' and s['grounded']:return True
   else:page.wait_for_timeout(500)
  record('wait-timeout');return False
 record('start');page.screenshot(path=str(out/'start.png'));history={};warnings=set();stalls={}
 for turn in range(2000):
  if not ready():record('terminal-or-wait');break
  s=record('turn-start',index=turn)
  if s.get('retreat'):
   if s['x']<3900 and all(abs(v['x']-s['x'])>350 or abs(v['y']-s['y'])>300 for v in s['foes'] if v['id']!='a4-wreck'):
    held('ArrowRight',450);page.wait_for_timeout(350);record('retreat-advance')
   page.keyboard.press('f');page.wait_for_timeout(450);record('finish-retreat');continue
  pending=(s.get('artillery') or {}).get('next')
  if pending and pending.get('warningSeen') and pending.get('target')==s['active'] and s['round']>=pending.get('dueRound',9999):
   held('ArrowRight' if s['x']<pending['x']+120 else 'ArrowLeft',450);page.wait_for_timeout(600);record('artillery-evasion');s=snapshot()
  activeHero=next((v for v in s['heroes'] if v['id']==s['active']),None)
  if activeHero and activeHero['hp']<activeHero['maxHp']*.30:
   page.keyboard.press('f');page.wait_for_timeout(600);record('defend-low-health');continue
  if s.get('artillery'):
   n=s['artillery'].get('next')
   if n and n.get('warningSeen') and (n.get('dueRound'),n.get('x'),n.get('y')) not in warnings:
    warnings.add((n.get('dueRound'),n.get('x'),n.get('y')));page.screenshot(path=str(out/f'artillery-{turn}.png'));record('visible-artillery')
  if s.get('tide') and s['tide'].get('warned') and 'tide' not in warnings:
   warnings.add('tide');page.screenshot(path=str(out/f'tide-{turn}.png'));record('tide-state')
  enemies=[v for v in s['foes'] if v['id']!='a4-wreck']
  nearThreat=any(abs(v['x']-s['x'])<800 and abs(v['y']-s['y'])<500 for v in enemies)
  # Once the nearby threat is cleared, use the real connected lower route.
  # The low strand leads east to the ship ladder; never chase an upper-floor
  # enemy west into the submerged tidal rock.
  if s.get('rescued') and all(v['dead'] or v['x']>4600 for v in s['heroes']):
   page.keyboard.press('e');page.wait_for_timeout(2500);record('exit-interact');page.screenshot(path=str(out/f'exit-{turn}.png'));continue
  if s['grounded']:
   anchor={'x':4545,'y':2362.5};net={'x':4050,'y':2317.5}
   target=net if not s.get('netOpen') else anchor if not s.get('exitStable') else {'x':4700,'y':2360}
   distance=((s['x']-target['x'])**2+(s['y']-target['y'])**2)**.5
   interactionRadius=(340 if s['cls']=='occultist' else 180) if not s.get('netOpen') else (360 if s['cls']=='mage' else 180)
   if (not s.get('netOpen') or not s.get('exitStable')) and distance<interactionRadius-20:
    page.keyboard.press('e');page.wait_for_timeout(2200);record('objective-interact',target=target);page.screenshot(path=str(out/f'objective-{turn}.png'));continue
   if not nearThreat and s['x']<target['x']-(30 if s.get('exitStable') and s.get('netOpen') else 100) and (s.get('moveLeft') or 0)>90:
    before=s;held('ArrowRight',650);page.wait_for_timeout(300)
    for _ in range(30):
     if snapshot()['grounded']:break
     page.wait_for_timeout(300)
    after=record('route-east',target=target);stall=stalls.get(s['active'],0)
    stalls[s['active']]=stall+1 if after['x']<before['x']+20 else 0
    if stalls[s['active']]>=2:
     page.keyboard.press('Control');held('ArrowRight',350);page.wait_for_timeout(1200);after=record('route-jump');stalls[s['active']]=0
     if after['x']<before['x']+20 and after['grounded']:
      page.keyboard.press('f');page.wait_for_timeout(500);record('route-blocked-defend')
    continue
   if not nearThreat:
    page.keyboard.press('f');page.wait_for_timeout(500);record('route-wait-defend');continue
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
   
   for landing in range(30):
    if snapshot()['grounded']:break
    page.wait_for_timeout(300)
   record('landing-check',landed=snapshot()['grounded'])
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
   record('no-safe-shot-after-move');page.keyboard.press('f');page.wait_for_timeout(500);record('defend-no-shot');continue
  page.wait_for_timeout(3000);after=record('post-shot',index=turn);page.screenshot(path=str(out/f'action-{turn:03d}.png'));
  if after['phase']=='aim' and after['side']==0 and after['active']==s['active'] and not after['dialogue'] and not after.get('retreat'):
   page.keyboard.press('Tab');page.wait_for_timeout(300);record('switch-hero')
 else:record('iteration-limit')

 final=snapshot();result['final']=final;page.screenshot(path=str(out/'terminal.png'))
 if final['phase']=='won' or final.get('complete'):
  for _ in range(30):
   if not page.evaluate('()=>!!HonroApp.dialogue'):break
   page.wait_for_timeout(1200);page.keyboard.press('Enter')
  page.wait_for_timeout(2000);page.screenshot(path=str(out/'clear-ui.png'))
  result['beforeReload']=page.evaluate('''()=>({done:HonroApp.done,screen:HonroApp.screen,cleared:HonroApp.profile.cleared?.[39],battle:!!HonroApp.profile.honroBattle})''')
  page.reload();page.wait_for_function('window.HonroApp&&window.HONRO_PROJECT',timeout=60000);page.wait_for_timeout(1000)
  result['afterReload']=page.evaluate('''()=>({screen:HonroApp.screen,cleared:HonroApp.profile.cleared?.[39],battle:!!HonroApp.profile.honroBattle})''')
  page.screenshot(path=str(out/'same-context-reload.png'))
  button=page.locator('[data-action="continue"]:visible').first
  if button.count():
   button.click();page.wait_for_timeout(2000);page.screenshot(path=str(out/'same-context-continue.png'));result['afterContinue']=page.evaluate('''()=>({screen:HonroApp.screen,cleared:HonroApp.profile.cleared?.[39],stage:HonroApp.engine?.b?.honroStage})''')
 (out/'final-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 page.screenshot(path=str(out/'stop.png'));ctx.storage_state(path=str(out/'browser-storage.json'));events.close();ctx.close();browser.close()
srv.shutdown();srv.server_close()
