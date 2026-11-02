"""Real browser Stage31 play, seeded entry profile; not a natural campaign.
Only initial profile setup writes state. Combat and boarding use UI/key inputs.
Planner reads runtime predictions, so results are tool-assisted, not human rates.
"""
import json,time,os,hashlib,atexit,lzma
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];out=Path(os.environ.get('HONRO_RUN_DIR',str(root/'_local/act4-rc/fullplay31')));out.mkdir(parents=True,exist_ok=True); events=out/'tactical-v8-events.jsonl';profile=json.loads((root/'tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile'];f=events.open('x')
errors=[]
result={'passed':False,'releaseApproved':False,'sourceCommit':os.environ.get('GITHUB_SHA'),
        'scope':'tool-assisted normal-input Stage31 battle and boarding from synthetic campaign entry',
        'errors':errors}
def finish():
 f.flush()
 (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
 for path in (out/'storage-snapshots').glob('*.json'):
  path.with_suffix('.json.xz').write_bytes(lzma.compress(path.read_bytes()))
  path.unlink()
atexit.register(finish)
with sync_playwright() as w:
 b=w.chromium.launch(headless=True);p=b.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:errors.append(str(e)));p.goto(os.environ.get('HONRO_QA_ORIGIN','http://127.0.0.1:8870')+'/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',profile);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.get_by_text('여정 이어가기',exact=True).click();p.wait_for_timeout(2500);p.get_by_text('스테이지 진입',exact=False).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===31',timeout=60000);p.wait_for_timeout(3000)
 captured=set()
 def capture(path):
  path=Path(path); name=path.name
  kind=('warning-before' if name.startswith('warning-v8-before') else
        'warning-after' if name.startswith('warning-v8-after') else
        'survival' if name.startswith('survival-before') else name)
  if name.startswith('tactical-v8-') and name not in ['tactical-v8-entry.png','tactical-v8-combat-end.png','tactical-v8-0.png']:return
  if kind in captured:return
  captured.add(kind);p.screenshot(path=str(path))
 started=time.monotonic()
 def state():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active;return{round:b.round,side:b.side,phase:b.phase,active:u?.id,cls:u?.cls,x:u?.x,y:u?.y,angle:u?.angle,facing:u?.facing,moveLeft:u?.moveLeft,drop:u&&e.canDrop(),support:u&&e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id,enemyHpSum:b.units.filter(v=>v.side===1&&!v.dead).reduce((n,v)=>n+v.hp,0),enemyUnits:b.units.filter(v=>v.side===1).map(v=>({id:v.id,hp:v.hp,dead:v.dead})),camera:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale,manual:a.scene.manual},grounded:u&&e.grounded(u),can:a.canInput(),dialogue:!!a.dialogue,shots:b.shots,enemies:b.units.filter(v=>v.side===1&&!v.dead).length,health:b.units.filter(v=>v.side===0&&!v.summoned).map(v=>({id:v.id,hp:v.hp,maxHp:v.maxHp,shield:v.shield,dead:v.dead,x:v.x,y:v.y})),boat:b.honroAct4PreviewState?.boat,seed:b.seed,rng:b.rng}}''')
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
 def plan(onlyFacing=False):return p.evaluate('''onlyFacing=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,C=HONRO_CORE,sc=a.scene,rect=sc.canvas.getBoundingClientRect(),lo=sc.world(0,0),hi=sc.world(rect.width,rect.height);const allies=b.units.filter(v=>v.side===0&&!v.dead&&v.id!==u.id);const visible=b.units.filter(v=>v.side===1&&!v.dead&&v.x>=Math.min(lo.x,hi.x)&&v.x<=Math.max(lo.x,hi.x)&&v.y>=Math.min(lo.y,hi.y)&&v.y-v.h<=Math.max(lo.y,hi.y));let best=null;const intersects=(a,z,u)=>{const bounds=[u.x-u.r-18,u.x+u.r+18,u.y-u.h-18,u.y+18];let lo=0,hi=1;for(const [v,d,min,max] of [[a.x,z.x-a.x,bounds[0],bounds[1]],[a.y,z.y-a.y,bounds[2],bounds[3]]]){if(Math.abs(d)<1e-9){if(v<min||v>max)return false;continue}let t0=(min-v)/d,t1=(max-v)/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return false}return true};for(const t of visible.sort((x,y)=>Math.abs(x.x-u.x)-Math.abs(y.x-u.x)).slice(0,4)){for(let idx=0;idx<u.loadout.length;idx++){const id=u.loadout[idx],s=C.SKILLS[id];if(!s||s.passive||['O13','S08'].includes(id)||!e.skillAllowed(s,u)||e.cooldownLeft(u,id)>0||!e.canAfford(s,u,.65)||s.mode==='charge'||id==='S00'&&Math.hypot(t.x-u.x,t.y-u.y)>160)continue;for(const z of e.shotSeeds(u,s,t)){if(onlyFacing&&(z.angle>90?-1:1)!==u.facing)continue;const h=e.predict(u,s,z.angle,z.power,t,false),safe=C.shotViable(e,u,s,t,z.angle,z.power);if(!safe.ok||safe.risk>=.5)continue;const points=e.predict(u,s,z.angle,z.power,t,true).points||[];if(allies.some(v=>points.slice(1).some((q,i)=>intersects(points[i],q,v))))continue;const r=e.effective(s,u).radius||0,dist=Math.hypot(h.x-t.x,h.y-(t.y-t.h*.52));const score=(h.unit===t.id?300:r>0&&dist<r?200:0)+(safe.enemyDamage||0);if(score>150&&(!best||score>best.score))best={id,idx,angle:z.angle,power:z.power,target:t.id,score};}}}return {best,visible:visible.map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp})),observed:b.units.filter(v=>v.side===1&&v.x>=Math.min(lo.x,hi.x)&&v.x<=Math.max(lo.x,hi.x)&&v.y>=Math.min(lo.y,hi.y)&&v.y-v.h<=Math.max(lo.y,hi.y)).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead}))}}''',onlyFacing)
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
 incomingDamage={}
 previousHp={}
 def observe(pl):
  for enemy in pl['observed']:
   if enemy['dead']:memory.pop(enemy['id'],None)
   else:memory[enemy['id']]=enemy
 # Read-only survival planning uses only visible enemies and actually observed warnings.
 def survival():return p.evaluate('''incoming=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,sc=a.scene,r=sc.canvas.getBoundingClientRect(),lo=sc.world(0,0),hi=sc.world(r.width,r.height),on=(x,y)=>x>=Math.min(lo.x,hi.x)&&x<=Math.max(lo.x,hi.x)&&y>=Math.min(lo.y,hi.y)&&y<=Math.max(lo.y,hi.y);const enemy=b.units.filter(v=>v.side===1&&!v.dead&&on(v.x,v.y-v.h*.5)),warnings=b.units.filter(v=>v.side===1&&!v.dead&&v.honroPilotCombat?.phase==='telegraph').map(v=>v.honroPilotCombat.target).filter(t=>t?.seen&&on(t.x,t.y));const observedDamage=incoming[u.id]||0,critical=u.hp+u.shield<=Math.max(u.maxHp*.35,observedDamage*1.35),low=u.hp+u.shield<=Math.max(u.maxHp*.45,observedDamage*1.35),exposed=warnings.some(t=>Math.hypot(u.x-t.x,(u.y-u.h*.5)-t.y)<200),near=enemy;if(!exposed&&!(low&&near.length))return {needed:false,low,critical,observedDamage,exposed,hp:u.hp,maxHp:u.maxHp};const score=(x,y)=>Math.min(...near.map(v=>Math.hypot(v.x-x,v.y-y)),6000)+Math.min(...warnings.map(t=>Math.hypot(x-t.x,y-u.h*.5-t.y)*2),1000);const start=score(u.x,u.y),paths=[];for(const dir of [-1,1]){let y=u.y,ok=true;for(let step=50;step<=300;step+=50){const hit=e.contactSurface(u.x+dir*step,y-85,y+85);if(!hit||Math.abs(hit.y-y)>80){ok=false;break}y=hit.y}if(ok){const value=score(u.x+dir*300,y);if(value>start+70)paths.push({dir,value,y})}}paths.sort((x,y)=>y.value-x.value);return {needed:true,low,critical,observedDamage,exposed,hp:u.hp,maxHp:u.maxHp,shield:u.shield,visibleEnemies:near.map(v=>({id:v.id,x:v.x,y:v.y})),warnings:warnings.map(t=>({id:t.id,x:t.x,y:t.y})),path:paths[0]||null}}''',incomingDamage)
 def survive(n):
  initial=survival()
  if not initial['needed']:return False
  # Projectile safety is not survival safety. Critical HP or an observed
  # incoming-volley deficit must not be bypassed by a viable outgoing shot.
  if not initial['exposed'] and not initial['critical'] and plan()['best']:
   record('survival-safe-offense-'+str(n),{'assessment':initial});return False
  record('survival-before-'+str(n),{'assessment':initial});capture(path=str(out/('survival-before-'+str(n)+'.png')))
  # Use remaining normal movement instead of stopping after two short pulses.
  # Visible ranged enemies remain threats beyond the old 1400-unit cutoff.
  for attempt in range(16):
   q=survival()
   if not q['needed'] or not q['path'] or not state()['can'] or (state().get('moveLeft') or 0)<=0:break
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
 check=p.evaluate('''async()=>{const c=await (await fetch('/candidate31.json')).json(),s=HONRO_PROJECT.stages.find(x=>x.metadata?.stageId===31),b=HonroApp.engine.b;return {stageEqual:JSON.stringify(s)===JSON.stringify(c.stages[0]),assets:c.library.map(v=>({id:v.id,equal:JSON.stringify(v)===JSON.stringify(HONRO_PROJECT.library.find(x=>x.id===v.id))})),enemies:b.units.filter(x=>x.side===1).length,allies:b.units.filter(x=>x.side===0&&!x.summoned).length,custom:b.honroCustom}}''');assert check['stageEqual'] and all(x['equal'] for x in check['assets']) and check['enemies']==34 and check['allies']==4 and not check['custom'],check
 record('entry',{'candidateCheck':check});capture(path=str(out/'tactical-v8-entry.png'))
 for n in range(120):
  if time.monotonic()-started>1200:raise TimeoutError('Bounded normal-input play budget exceeded')
  if not waitready():record('stopped-wait');break
  for hero in state()['health']:
   old=previousHp.get(hero['id'],hero['hp']);loss=max(0,old-hero['hp'])
   incomingDamage[hero['id']]=max(incomingDamage.get(hero['id'],0),loss);previousHp[hero['id']]=hero['hp']
  if state()['round']>20:record('round-limit');break
  if any(h['dead'] for h in state()['health']):
   record('party-loss');capture(path=out/'party-loss.png');break
  if state()['enemies']==0:record('boarding-transition');break
  warning=p.evaluate('''()=>{const a=HonroApp;return a.engine.b.units.filter(v=>v.honroPilotCombat?.phase==='telegraph').map(v=>({id:v.id,target:v.honroPilotCombat.target,visible:HonroAct4TerrainPreview.eventAPI.inView(a,v.honroPilotCombat.target,25)}))}''')
  if warning:
   record('warning-before-'+str(n),{'warning':warning,'body':p.locator('body').inner_text()[:1800]});capture(path=str(out/('warning-v8-before-'+str(n)+'.png')));p.wait_for_timeout(2500);record('warning-after-'+str(n),{'warning':warning});capture(path=str(out/('warning-v8-after-'+str(n)+'.png')))
  stance=p.evaluate('''()=>{const a=HonroApp,e=a.engine,u=e.active,s=HONRO_CORE.SKILLS.S08;
   if(u?.cls!=='knight'||u.hp>u.maxHp*.55||!e.grounded(u)||!a.canInput())return null;
   const idx=u.loadout.indexOf('S08');if(idx<0||!e.skillAllowed(s,u)||e.cooldownLeft(u,'S08')>0||!e.canAfford(s,u,.3))return null;
   const sc=a.scene,r=sc.canvas.getBoundingClientRect(),lo=sc.world(0,0),hi=sc.world(r.width,r.height);
   return e.b.units.some(v=>v.side===1&&!v.dead&&Math.hypot(v.x-u.x,v.y-u.y)<1100&&v.x>=lo.x&&v.x<=hi.x&&v.y>=lo.y&&v.y<=hi.y)?{idx,hp:u.hp,maxHp:u.maxHp}:null;
  }''')
  if stance:
   record('counter-stance-'+str(n),{'assessment':stance})
   p.keyboard.press('Digit'+str(stance['idx']+1));p.wait_for_timeout(100);p.keyboard.down('Space')
   try:p.wait_for_function('HonroApp.charging && HonroApp.chargePower(performance.now())>=.28',timeout=8000,polling=16)
   finally:p.keyboard.up('Space')
   p.wait_for_timeout(3000);record('counter-stance-result-'+str(n));continue
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
   before=state()
   allies=sorted(h['x'] for h in before['health'] if not h['dead'] and h['id']!=before['active'])
   hero=next(h for h in before['health'] if h['id']==before['active'])
   pursuit_safe=hero['hp']+hero['shield']>max(hero['maxHp']*.6,incomingDamage.get(hero['id'],0)*1.5)
   if allies and before['x']>allies[len(allies)//2]+800 and not pursuit_safe:
    record('formation-hold-'+str(n),{'allyXs':allies,'healthyPursuit':pursuit_safe});break
   if allies and before['x']>allies[len(allies)//2]+800:
    record('healthy-pursuit-'+str(n),{'allyXs':allies,'hpBuffer':hero['hp']+hero['shield']})
   known=sorted(memory.values(),key=lambda x:abs(x['x']-before['x'])+abs(x['y']-before['y'])*.7);target=known[0] if known else None
   if target and target['y']-before['y']>180 and abs(target['x']-before['x'])<650 and before['drop']:
    p.keyboard.press('Alt');p.wait_for_timeout(1500);record('drop-'+str(n))
   else:
    key='ArrowLeft' if target and target['x']<before['x']-100 else 'ArrowRight';p.keyboard.down(key);p.wait_for_timeout(850);p.keyboard.up(key);p.wait_for_timeout(600)
    if abs(state()['x']-before['x'])<15 and state()['grounded']:
     p.keyboard.press('Control');p.keyboard.down(key);p.wait_for_timeout(500);p.keyboard.up(key);p.wait_for_timeout(1200)
   if not state()['grounded']:p.wait_for_timeout(1500)
   pl=plan();observe(pl)
  record('post-move-'+str(n),{'visible':pl['visible'],'choice':pl['best']})
  if state()['active']!=start['active'] or not state()['can'] or not state()['grounded']:
   record('movement-handoff-'+str(n));continue
  choice=pl['best']
  if choice:
   desired_facing=-1 if choice['angle']>90 else 1
   if state()['facing']!=desired_facing:
    key='ArrowLeft' if desired_facing<0 else 'ArrowRight';p.keyboard.down(key);p.wait_for_timeout(80);p.keyboard.up(key);p.wait_for_timeout(300);pl=plan(True);observe(pl);choice=pl['best']
  if choice:
   p.keyboard.press('Digit'+str(choice['idx']+1));p.wait_for_timeout(200)
   for _ in range(16):
    s=state();delta=choice['angle']-s['angle']
    if abs(delta)<2:break
    key='ArrowUp' if delta*state()['facing']>0 else 'ArrowDown';p.keyboard.down(key);p.wait_for_timeout(min(250,max(30,abs(delta)/62*1000)));p.keyboard.up(key);p.wait_for_timeout(100)
   aligned=state()
   if abs(aligned['angle']-choice['angle'])>2.5 or aligned['facing']!=(-1 if choice['angle']>90 else 1):
    record('aim-not-aligned-'+str(n),{'choice':choice});continue
   shot_actor=state()['active'];before=state();p.keyboard.down('Space')
   try:
    p.wait_for_function('''target=>HonroApp.charging && HonroApp.chargePower(performance.now())>=target''',arg=max(0,choice['power']-.02),timeout=8000,polling=16)
    observed=p.evaluate('''()=>HonroApp.chargePower(performance.now())''')
   except Exception as ex:
    p.keyboard.up('Space');record('charge-failure-'+str(n),{'choice':choice,'error':str(ex)});break
   p.keyboard.up('Space');p.wait_for_timeout(100)
   launch=p.evaluate('''id=>({shots:HonroApp.engine.b.shots,last:HonroApp.engine.b.lastShots?.[id]||null})''',shot_actor)
   record('launch-'+str(n),{'choice':choice,'chargeAtRelease':observed,'actual':launch['last'],'enemyHpBefore':before['enemyHpSum'],'shotCountBefore':before['shots'],'shotCountAfter':launch['shots']})
   if launch['shots']!=before['shots']+1 or not launch['last'] or launch['last']['skill']!=choice['id']:
    record('launch-mismatch-'+str(n),{'choice':choice,'actual':launch});break
  else:p.keyboard.press('f')
  p.wait_for_timeout(3000);record('action-'+str(n),{'choice':choice});capture(path=str(out/('tactical-v8-'+str(n)+'.png')))
  if state()['enemies']==0:record('boarding-transition');capture(path=str(out/'tactical-v8-combat-end.png'));break
  if state()['phase'] in ('won','lost'):break

 # Current battle must actually finish; boarding preserves normal turn accounting.
 result['lastCombatState']=state()
 assert state()['enemies']==0 and state()['round']<=20,state()
 from boarding_inputs import board_party
 final=board_party(p,lambda label,value:record(label,{'boarding':value}),lambda name:capture(path=out/(name+'.png')))
 assert final['round']<=20,final
 assert len(final['heroes'])==4 and all(h['hp']>0 and not h['dead'] for h in final['heroes']),final
 assert not errors,errors
 result.update(passed=True,final=final,complete=True,browserVersion=b.version)
 b.close()
