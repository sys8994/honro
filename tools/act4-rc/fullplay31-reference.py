import json,time,os,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];out=Path(os.environ.get('HONRO_RUN_DIR',str(root/'_local/act4-rc/fullplay31')));out.mkdir(parents=True,exist_ok=True); events=out/'tactical-v8-events.jsonl';profile=json.loads((root/'tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile'];f=events.open('x')
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:f.write(json.dumps({'error':str(e)},ensure_ascii=False)+'\n'));p.goto(os.environ.get('HONRO_QA_URL','http://127.0.0.1:8770')+'/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',profile);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.get_by_text('여정 이어가기',exact=True).click();p.wait_for_timeout(2500);p.get_by_text('스테이지 진입',exact=False).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===31',timeout=60000);p.wait_for_timeout(3000)
 def state():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active;return{round:b.round,side:b.side,phase:b.phase,active:u?.id,cls:u?.cls,x:u?.x,y:u?.y,angle:u?.angle,facing:u?.facing,drop:u&&e.canDrop(),support:u&&e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id,enemyHpSum:b.units.filter(v=>v.side===1&&!v.dead).reduce((n,v)=>n+v.hp,0),grounded:u&&e.grounded(u),can:a.canInput(),dialogue:!!a.dialogue,shots:b.shots,enemies:b.units.filter(v=>v.side===1&&!v.dead).length,health:b.units.filter(v=>v.side===0&&!v.summoned).map(v=>({id:v.id,hp:v.hp,maxHp:v.maxHp,shield:v.shield,dead:v.dead,x:v.x,y:v.y})),boat:b.honroAct4PreviewState?.boat,seed:b.seed,rng:b.rng}}''')
 snapshot_dir=out/'storage-snapshots';snapshot_dir.mkdir(exist_ok=True);snapshot_seq=0
 def snapshot(step,live):
  global snapshot_seq
  raw=p.evaluate("localStorage.getItem('honro-first-act-profile-1')")
  if raw is None:return {'ok':False,'reason':'no stored profile'}
  blob=raw.encode('utf-8');snapshot_seq+=1;path=snapshot_dir/f'{snapshot_seq:04d}.json'
  with path.open('xb') as target:target.write(blob)
  try:
   saved=json.loads(raw);battle=saved.get('honroBattle') or {};summary={'stage':battle.get('honroStage'),'round':battle.get('round'),'phase':battle.get('phase'),'clear31':(saved.get('cleared') or {}).get('31')}
  except (ValueError,TypeError):summary={'parse':'invalid'}
  return {'ok':True,'path':str(path),'sha256':hashlib.sha256(blob).hexdigest(),'bytes':len(blob),'stored':summary,'liveRound':live.get('round'),'step':step}
 def record(step,extra={}):
  live=state();d={'step':step,'state':live,'time':time.time(),**extra}
  if step=='entry' or step.startswith(('action-','survival-defend-','boarding-transition','interactive-')):d['storageSnapshot']=snapshot(step,live)
  f.write(json.dumps(d,ensure_ascii=False)+'\n');f.flush();print(json.dumps(d,ensure_ascii=False),flush=True)
 def plan():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,C=HONRO_CORE,sc=a.scene,rect=sc.canvas.getBoundingClientRect(),lo=sc.world(0,0),hi=sc.world(rect.width,rect.height);const allies=b.units.filter(v=>v.side===0&&!v.dead&&v.id!==u.id);const visible=b.units.filter(v=>v.side===1&&!v.dead&&v.x>=Math.min(lo.x,hi.x)&&v.x<=Math.max(lo.x,hi.x)&&v.y>=Math.min(lo.y,hi.y)&&v.y-v.h<=Math.max(lo.y,hi.y));let best=null;const intersects=(a,z,u)=>{const bounds=[u.x-u.r-18,u.x+u.r+18,u.y-u.h-18,u.y+18];let lo=0,hi=1;for(const [v,d,min,max] of [[a.x,z.x-a.x,bounds[0],bounds[1]],[a.y,z.y-a.y,bounds[2],bounds[3]]]){if(Math.abs(d)<1e-9){if(v<min||v>max)return false;continue}let t0=(min-v)/d,t1=(max-v)/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return false}return true};for(const t of visible.sort((x,y)=>Math.abs(x.x-u.x)-Math.abs(y.x-u.x)).slice(0,4)){if(allies.some(v=>Math.hypot(v.x-t.x,(v.y-v.h*.5)-(t.y-t.h*.5))<220))continue;for(let idx=0;idx<u.loadout.length;idx++){const id=u.loadout[idx],s=C.SKILLS[id];if(!s||s.passive||['O13','S08'].includes(id)||!e.skillAllowed(s,u)||e.cooldownLeft(u,id)>0||!e.canAfford(s,u,.65)||s.mode==='charge'||id==='S00'&&Math.hypot(t.x-u.x,t.y-u.y)>160)continue;for(const z of e.shotSeeds(u,s,t)){const h=e.predict(u,s,z.angle,z.power,t,false),safe=C.shotViable(e,u,s,t,z.angle,z.power);if(!safe.ok||safe.risk>=.5)continue;const points=e.predict(u,s,z.angle,z.power,t,true).points||[];if(allies.some(v=>points.slice(1).some((q,i)=>intersects(points[i],q,v))))continue;const r=e.effective(s,u).radius||0,dist=Math.hypot(h.x-t.x,h.y-(t.y-t.h*.52));const score=(h.unit===t.id?300:r>0&&dist<r?200:0)+(safe.enemyDamage||0);if(score>150&&(!best||score>best.score))best={id,idx,angle:z.angle,power:z.power,target:t.id,score};}}}return {best,visible:visible.map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp})),observed:b.units.filter(v=>v.side===1&&v.x>=Math.min(lo.x,hi.x)&&v.x<=Math.max(lo.x,hi.x)&&v.y>=Math.min(lo.y,hi.y)&&v.y-v.h<=Math.max(lo.y,hi.y)).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead}))}}''')
 def waitready():
  for _ in range(100):
   s=state()
   if s['dialogue']:p.wait_for_timeout(1200);p.keyboard.press('Enter')
   elif s['can'] and s['side']==0 and s['phase']=='aim' and s['grounded']:return True
   elif s['phase'] in ('won','lost'):return False
   p.wait_for_timeout(500)
  return False
 memory={}
 history={}
 def observe(pl):
  for enemy in pl['observed']:
   if enemy['dead']:memory.pop(enemy['id'],None)
   else:memory[enemy['id']]=enemy
 # Read-only survival planning uses only visible enemies and actually observed warnings.
 def survival():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,sc=a.scene,r=sc.canvas.getBoundingClientRect(),lo=sc.world(0,0),hi=sc.world(r.width,r.height),on=(x,y)=>x>=Math.min(lo.x,hi.x)&&x<=Math.max(lo.x,hi.x)&&y>=Math.min(lo.y,hi.y)&&y<=Math.max(lo.y,hi.y);const enemy=b.units.filter(v=>v.side===1&&!v.dead&&on(v.x,v.y-v.h*.5)),warnings=b.units.filter(v=>v.side===1&&!v.dead&&v.honroPilotCombat?.phase==='telegraph').map(v=>v.honroPilotCombat.target).filter(t=>t?.seen&&on(t.x,t.y));const low=u.hp<=u.maxHp*.45,exposed=warnings.some(t=>Math.hypot(u.x-t.x,(u.y-u.h*.5)-t.y)<200),near=enemy.filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<1400);if(!exposed&&!(low&&near.length))return {needed:false,low,exposed,hp:u.hp,maxHp:u.maxHp};const score=(x,y)=>Math.min(...near.map(v=>Math.hypot(v.x-x,v.y-y)),2000)+Math.min(...warnings.map(t=>Math.hypot(x-t.x,y-u.h*.5-t.y)*2),1000);const start=score(u.x,u.y),paths=[];for(const dir of [-1,1]){let y=u.y,ok=true;for(let step=50;step<=300;step+=50){const hit=e.contactSurface(u.x+dir*step,y-85,y+85);if(!hit||Math.abs(hit.y-y)>80){ok=false;break}y=hit.y}if(ok){const value=score(u.x+dir*300,y);if(value>start+70)paths.push({dir,value,y})}}paths.sort((x,y)=>y.value-x.value);return {needed:true,low,exposed,hp:u.hp,maxHp:u.maxHp,shield:u.shield,visibleEnemies:near.map(v=>({id:v.id,x:v.x,y:v.y})),warnings:warnings.map(t=>({id:t.id,x:t.x,y:t.y})),path:paths[0]||null}}''')
 def survive(n):
  initial=survival()
  if not initial['needed']:return False
  record('survival-before-'+str(n),{'assessment':initial});p.screenshot(path=str(out/('survival-before-'+str(n)+'.png')))
  for attempt in range(2):
   q=survival()
   if not q['needed'] or not q['path'] or not state()['can']:break
   before=state();key='ArrowLeft' if q['path']['dir']<0 else 'ArrowRight';p.keyboard.down(key);p.wait_for_timeout(550);p.keyboard.up(key);p.wait_for_timeout(1300);after=state();record('survival-move-'+str(n),{'assessment':q,'input':key,'beforeX':before['x']})
   for _ in range(20):
    if after['grounded'] or after['active']!=before['active'] or not after['can']:break
    p.wait_for_timeout(500);after=state()
   record('survival-landing-'+str(n),{'assessment':q,'beforeX':before['x']})
   if after['active']!=before['active'] or not after['can'] or not after['grounded']:return True
   if abs(after['x']-before['x'])<20:break
  q=survival()
  if state()['can'] and state()['grounded'] and (initial['low'] or q['exposed']):
   p.keyboard.press('f');p.wait_for_timeout(2500);record('survival-defend-'+str(n),{'assessment':q});return True
  return False
 record('entry');p.screenshot(path=str(out/'tactical-v8-entry.png'))
 for n in range(120):
  if not waitready():record('stopped-wait');break
  if state()['round']>20:record('round-limit');break
  if state()['enemies']==0:record('boarding-transition');break
  warning=p.evaluate('''()=>{const a=HonroApp;return a.engine.b.units.filter(v=>v.honroPilotCombat?.phase==='telegraph').map(v=>({id:v.id,target:v.honroPilotCombat.target,visible:HonroAct4TerrainPreview.eventAPI.inView(a,v.honroPilotCombat.target,25)}))}''')
  if warning:
   record('warning-before-'+str(n),{'warning':warning,'body':p.locator('body').inner_text()[:1800]});p.screenshot(path=str(out/('warning-v8-before-'+str(n)+'.png')));p.wait_for_timeout(2500);record('warning-after-'+str(n),{'warning':warning});p.screenshot(path=str(out/('warning-v8-after-'+str(n)+'.png')))
  if survive(n):continue
  start=state();pl=plan();observe(pl)
  if not pl['visible']:
   p.mouse.move(720,350);p.mouse.wheel(0,1400);p.wait_for_timeout(500);p.mouse.move(700,600);p.mouse.down();p.mouse.move(700,350,steps=15);p.mouse.up();p.wait_for_timeout(600);pl=plan();observe(pl);record('camera-scan-'+str(n),{'visible':pl['visible']})
  signature=(round(start['enemyHpSum'],1),start.get('support'),round(start['x']/400),round(start['y']/400));prior=history.setdefault(start['active'],[]);prior.append(signature)
  if ((len(prior)>=3 and prior[-1]==prior[-2]==prior[-3]) or
      (len(prior)>=4 and prior[-1]==prior[-3] and prior[-2]==prior[-4])):
   record('watchdog-idle',{'history':prior[-4:]});break
  record('planning',{'visible':pl['visible'],'choice':pl['best']})
  for move_attempt in range(5):
   if pl['best'] or state()['active']!=start['active'] or not state()['can']:break
   before=state();known=sorted(memory.values(),key=lambda x:abs(x['x']-before['x'])+abs(x['y']-before['y'])*.7);target=known[0] if known else None
   if target and target['y']-before['y']>180 and abs(target['x']-before['x'])<650 and before['drop']:
    p.keyboard.press('Alt');p.wait_for_timeout(1500);record('drop-'+str(n))
   else:
    key='ArrowLeft' if target and target['x']<before['x']-100 else 'ArrowRight';p.keyboard.down(key);p.wait_for_timeout(850);p.keyboard.up(key);p.wait_for_timeout(600)
    if abs(state()['x']-before['x'])<15 and state()['grounded']:
     p.keyboard.press('Control');p.keyboard.down(key);p.wait_for_timeout(500);p.keyboard.up(key);p.wait_for_timeout(1200)
   if not state()['grounded']:p.wait_for_timeout(1500)
   pl=plan();observe(pl)
  record('post-move-'+str(n),{'visible':pl['visible'],'choice':pl['best']})
  choice=pl['best']
  if choice:
   desired_facing=-1 if choice['angle']>90 else 1
   if state()['facing']!=desired_facing:
    key='ArrowLeft' if desired_facing<0 else 'ArrowRight';p.keyboard.down(key);p.wait_for_timeout(80);p.keyboard.up(key);p.wait_for_timeout(300);pl=plan();observe(pl);choice=pl['best']
  if choice:
   p.keyboard.press('Digit'+str(choice['idx']+1));p.wait_for_timeout(200)
   for _ in range(16):
    s=state();delta=choice['angle']-s['angle']
    if abs(delta)<2:break
    key='ArrowUp' if delta*state()['facing']>0 else 'ArrowDown';p.keyboard.down(key);p.wait_for_timeout(min(250,max(30,abs(delta)/62*1000)));p.keyboard.up(key);p.wait_for_timeout(100)
   duration=p.evaluate('''()=>HonroApp.engine.chargeDuration(HonroApp.engine.active,HONRO_CORE.SKILLS[HonroApp.selected])''');p.keyboard.down('Space');p.wait_for_timeout(max(80,round(duration*choice['power']*1000)));p.keyboard.up('Space')
  else:p.keyboard.press('f')
  p.wait_for_timeout(3000);record('action-'+str(n),{'choice':choice});p.screenshot(path=str(out/('tactical-v8-'+str(n)+'.png')))
  if state()['enemies']==0:record('boarding-transition');p.screenshot(path=str(out/'tactical-v8-combat-end.png'));break
  if state()['phase'] in ('won','lost'):break
 record('interactive')
 for line in __import__('sys').stdin:
  z=line.strip().split()
  try:
   op=z[0]
   if op=='state': pass
   elif op=='key': p.keyboard.press(z[1]);p.wait_for_timeout(int(z[2]) if len(z)>2 else 700)
   elif op=='hold': p.keyboard.down(z[1]);p.wait_for_timeout(int(z[2]));p.keyboard.up(z[1]);p.wait_for_timeout(int(z[3]) if len(z)>3 else 700)
   elif op=='wheel': p.mouse.move(float(z[1]),float(z[2]));p.mouse.wheel(0,float(z[3]));p.wait_for_timeout(700)
   elif op=='drag': p.mouse.move(float(z[1]),float(z[2]));p.mouse.down();p.mouse.move(float(z[3]),float(z[4]),steps=20);p.mouse.up();p.wait_for_timeout(700)
   elif op=='wait': p.wait_for_timeout(int(z[1]))
   elif op=='save': p.keyboard.press('Escape');p.wait_for_timeout(500);print('BUTTONS',p.locator('button:visible').all_text_contents(),flush=True)
   elif op=='reload':
    before=p.evaluate('''()=>{const p=JSON.parse(localStorage.getItem('honro-first-act-profile-1'));return {stage:p.honroBattle?.honroStage,round:p.honroBattle?.round,cleared:p.cleared,heroes:p.heroes,equipment:p.equipment,recruited:p.recruited,proof:p.honroAct4,units:p.honroBattle?.units?.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead}))}}''');p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('(n)=>HonroApp.engine?.b?.honroStage===n',arg=before['stage'],timeout=60000);p.wait_for_timeout(1200);after=p.evaluate('''()=>({stage:HonroApp.engine.b.honroStage,round:HonroApp.engine.b.round,cleared:HonroApp.profile.cleared,heroes:HonroApp.profile.heroes,equipment:HonroApp.profile.equipment,recruited:HonroApp.profile.recruited,proof:HonroApp.profile.honroAct4,units:HonroApp.engine.b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead}))})''');assert before==after,(before,after);print('SAME_CONTEXT_RELOAD',after['stage'],after['round'],flush=True)
   elif op=='stop': break
   record('interactive-'+op,{'input':z[1:]});p.screenshot(path=str(out/'tactical-v8-interactive.png'))
  except Exception as ex: print('ERROR',repr(ex),flush=True)
 b.close();f.close()
