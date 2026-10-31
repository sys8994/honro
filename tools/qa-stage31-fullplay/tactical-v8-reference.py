import json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path('/workspace/honro/_local/reports/stage31-browser-fullplay'); events=out/'tactical-v8-events.jsonl';profile=json.loads((out/'support-entry-fixture.json').read_text())['profile'];f=events.open('w')
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:f.write(json.dumps({'error':str(e)},ensure_ascii=False)+'\n'));p.goto('http://127.0.0.1:8766/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',profile);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.get_by_text('여정 이어가기',exact=True).click();p.wait_for_timeout(2500);p.get_by_text('스테이지 진입',exact=False).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===31',timeout=60000);p.wait_for_timeout(3000)
 def state():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active;return{round:b.round,side:b.side,phase:b.phase,active:u?.id,cls:u?.cls,x:u?.x,y:u?.y,angle:u?.angle,facing:u?.facing,drop:u&&e.canDrop(),support:u&&e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id,enemyHpSum:b.units.filter(v=>v.side===1&&!v.dead).reduce((n,v)=>n+v.hp,0),grounded:u&&e.grounded(u),can:a.canInput(),dialogue:!!a.dialogue,shots:b.shots,enemies:b.units.filter(v=>v.side===1&&!v.dead).length,health:b.units.filter(v=>v.side===0&&!v.summoned).map(v=>({id:v.id,hp:v.hp,dead:v.dead,x:v.x,y:v.y})),boat:b.honroAct4PreviewState?.boat,seed:b.seed,rng:b.rng}}''')
 def record(step,extra={}):
  d={'step':step,'state':state(),'time':time.time(),**extra};f.write(json.dumps(d,ensure_ascii=False)+'\n');f.flush();print(json.dumps(d,ensure_ascii=False),flush=True)
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
 record('entry');p.screenshot(path=str(out/'tactical-v8-entry.png'))
 for n in range(120):
  if not waitready():record('stopped-wait');break
  if state()['enemies']==0:record('boarding-transition');break
  warning=p.evaluate('''()=>{const a=HonroApp;return a.engine.b.units.filter(v=>v.honroPilotCombat?.phase==='telegraph').map(v=>({id:v.id,target:v.honroPilotCombat.target,visible:HonroAct4TerrainPreview.eventAPI.inView(a,v.honroPilotCombat.target,25)}))}''')
  if warning:
   record('warning-before-'+str(n),{'warning':warning,'body':p.locator('body').inner_text()[:1800]});p.screenshot(path=str(out/('warning-v8-before-'+str(n)+'.png')));p.wait_for_timeout(2500);record('warning-after-'+str(n),{'warning':warning});p.screenshot(path=str(out/('warning-v8-after-'+str(n)+'.png')))
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
   elif op=='stop': break
   record('interactive-'+op);p.screenshot(path=str(out/'tactical-v8-interactive.png'))
  except Exception as ex: print('ERROR',repr(ex),flush=True)
 b.close();f.close()
