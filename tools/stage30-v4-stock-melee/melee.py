import json,os,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright,TimeoutError
o=Path(os.environ['OUT']);events=[];attacks=[];melee=[];holds=[];shots=[];seen={};start=None;result=None;clearlane=set()
read='''()=>{const a=HonroApp,b=a.engine?.b,s=a.scene,c=s?.canvas,r=c?.getBoundingClientRect(),m=b?.honroState?.act23v4?.stage30,u=a.engine?.active;
const D=a.dialogue?document.querySelector('.story-dialogue,#story-dialogue,[role=dialog]'):null;
const B=document.querySelector('#turn-banner'); const v=b?.honroV4Stage30;
return{stage:b?.honroStage,revision:b?.honroAct23V4Revision,legacyMarker:b?.honroMarkers?.some(x=>x.id==='transport-map'),debug:a.debugMode,shot:b?.shot,charging:a.charging,power:a.power,selected:a.selected,enemies:b?.units?.filter(v=>v.side===1&&!v.honroObjectiveTarget).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead,h:v.h,r:v.r,cls:v.cls,loadout:v.loadout})),projectiles:b?.projectiles?.map(p=>({id:p.id,owner:p.owner,skill:p.skill,x:p.x,y:p.y})),phase:b?.phase,side:b?.side,round:b?.round,serial:b?.honroState?.actorTurnSerial,dialogue:!!a.dialogue,modal:!!a.modal?.classList.contains('open'),banner:!!B&&!B.hidden,can:!a.dialogue&&!a.modal?.classList.contains('open')&&b?.phase==='aim'&&b?.side===0&&u&&!u.dead&&!u.acted&&!u.airborne&&!u.jumping,active:u?{id:u.id,x:u.x,y:u.y,hp:u.hp,move:u.moveLeft,acted:u.acted,angle:u.angle,facing:u.facing,loadout:u.loadout,cls:u.cls,r:u.r,h:u.h,action:u.meleeAction?{skill:u.meleeAction.skill,range:u.meleeAction.range,shot:u.meleeAction.shot}:null}:null,
heroes:b?.units?.filter(u=>u.side===0&&!u.summoned).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead})),ready:m?.ready||false,boat:m?.boat??null,rescued:m?.rescued??[],waves:m?.waves??{},hold:m?.hold??null,probe:!!v,
canvas:r?{left:r.left,top:r.top,width:r.width,height:r.height,dpr:devicePixelRatio}:null,camera:s?{x:s.x,y:s.y,scale:s.scale}:null,objective:(document.querySelector('.battle-info')?.innerText||'').slice(0,250)};}'''
def save():
 (o/'proof.json').write_text(json.dumps({'scope':'One actual stock desktop V4 path; fresh profile predecessor/entry XP only prior to App.launch; no game writes after launch; movement/defense/aim/charge ordinary keys with stock read-only preview, read-only observation. Partial accepted as evidence of where attempt stopped, not success.','start':start,'phaseSnapshots':seen,'events':events,'attacks':attacks,'melee':melee,'guardedDecisions':holds,'shots':shots,'final':result},indent=2))
def snapshot(page,name,state):
 if not state['canvas']:return
 img=page.locator('#battlecanvas').screenshot(path=str(o/(name+'.png')),timeout=5000);shots.append({'file':name+'.png','sha256':hashlib.sha256(img).hexdigest(),'camera':state['camera'],'boat':state['boat']});save()
# Only equipped basic ranged attacks; native preview includes all friend/NPC/terrain contacts.
planner="""q=>{const a=HonroApp,e=a.engine,u=e.active,C=HONRO_CORE,skill=C.SKILLS[q.skill];if(!skill||!u.loadout.includes(q.skill)||!e.grounded(u)||!e.skillAllowed(skill,u)||!e.canAfford(skill,u,0)||e.cooldownLeft(u,q.skill)>0)return null;
const live=e.b.units.filter(v=>q.targets.includes(v.id)&&!v.dead&&v.hp>0).sort((x,y)=>Math.hypot(x.x-u.x,x.y-u.y)-Math.hypot(y.x-u.x,y.y-u.y));
const get=(an,p)=>{const z=e.predict(u,skill,an,p,undefined,false,false);return {unit:z.unit||null,terrain:z.terrain||null,x:z.x,y:z.y,contacts:(z.contacts||[]).map(q=>q.unit?.id||q.unit||q.unitId||null).filter(x=>typeof x==='string')}};const legal=(r,t)=>r.unit===t&&!r.contacts.some(id=>id!==t&&e.b.units.some(v=>v.id===id&&(v.side===0||v.honroProtected||v.honroV4RescueRole)))&&(q.skill!=='M01'||!e.b.units.some(v=>!v.dead&&(v.side===0||v.honroProtected||v.honroV4RescueRole)&&Math.hypot(v.x-r.x,v.y-v.h*.5-r.y)<105+(v.r||0)));
for(const v of live){const dir=Math.sign(v.x-u.x);if(dir!==u.facing||Math.hypot(v.x-u.x,v.y-u.y)<45||Math.hypot(v.x-u.x,v.y-u.y)>1650)continue;
const display=Math.atan2((u.y-u.h*.63)-(v.y-v.h*.52),Math.abs(v.x-u.x))*180/Math.PI;
const angles=q.fixed?[u.angle]:[0,7,-7,14,-14,24,-24,35,-35,48].map(d=>Math.max(-70,Math.min(80,display+d))).map(p=>dir>0?p:180-p);
for(const ang of angles)for(const pow of (q.power?[q.power]:[.22,.34,.45,.57,.70,.83,.94])){
 const r=get(ang,pow);if(!legal(r,v.id))continue;
 const range=[pow-.035,pow+.035];if(!range.every(p=>legal(get(ang,p),v.id)))continue;
 return {target:v.id,angle:ang,power:pow,contact:r,seconds:e.chargeDuration(u,skill),world:[v.x,v.y],range};}}
return null;}"""
def attempt(page,state,targets):
 u=state['active']; skill={'archer':'A01','mage':'M01'}.get(u['cls'])
 if not skill or skill not in u['loadout']:return False
 page.keyboard.press(str(u['loadout'].index(skill)+1));q={'skill':skill,'targets':targets}
 plan=page.evaluate(planner,q)
 if not plan:
  live=[v for v in state['enemies'] if v['id'] in targets and not v['dead'] and v['hp']>0]
  if live:
   closest=min(live,key=lambda v:abs(v['x']-u['x']));wanted=1 if closest['x']>u['x'] else -1
   if wanted!=u['facing'] and abs(closest['x']-u['x'])>95 and u['move']>=25:
    k='d' if wanted==1 else 'a';page.keyboard.down(k);page.wait_for_timeout(72);page.keyboard.up(k);page.wait_for_timeout(160)
    events.append({'key':k,'purpose':'normal facing correction','before':state,'after':page.evaluate(read)});plan=page.evaluate(planner,q)
 if not plan:return False
 receipt={'planned':plan,'actor':u['id'],'skill':skill,'status':'aiming'};attacks.append(receipt);save()
 for _ in range(8):
  s=page.evaluate(read);act=s['active']
  if not s['can'] or act['id']!=u['id']:receipt['status']='turn changed before firing';return False
  delta=(plan['angle']-act['angle'])*act['facing']
  if abs(delta)<=2.5:break
  key='ArrowUp' if delta>0 else 'ArrowDown';page.keyboard.down(key);page.wait_for_timeout(max(18,min(340,abs(delta)*13)));page.keyboard.up(key);page.wait_for_timeout(42)
 fixed=page.evaluate(planner,{**q,'fixed':True,'power':plan['power'],'targets':[plan['target']]})
 if not fixed:receipt['status']='actual angle lacks safe target preview';save();return False
 pre=page.evaluate(read)
 if pre['selected']!=skill or not pre['can'] or pre['active']['id']!=u['id']:receipt['status']='selected state changed';return False
 receipt.update(status='normal-charge-start',before=pre,actualAnglePreview=fixed);save()
 if not any(x.get('status')=='released' for x in attacks):snapshot(page,'before-first-shot',pre)
 page.keyboard.down('Space')
 try:
  page.wait_for_function('p=>HonroApp.charging && HonroApp.power >= p',arg=max(0.08,fixed['power']-.012),timeout=3200,polling='raf')
  charged=page.evaluate(read);receipt['chargeSample']=charged['power']
 except TimeoutError:receipt['chargeSample']='timeout'
 finally:page.keyboard.up('Space')
 receipt['status']='released';receipt['observations']=[]
 for k in range(34):
  s=page.evaluate(read)
  if s['shot']!=pre['shot'] or s['projectiles'] or k==0:
   hit={v['id']:v['hp'] for v in s['enemies'] if v['id']==fixed['target']}
   receipt['observations'].append({'k':k,'shot':s['shot'],'phase':s['phase'],'side':s['side'],'projectiles':s['projectiles'],'targetHP':hit,'heroes':s['heroes']})
   if s['projectiles'] and not (o/'first-projectile.png').exists():snapshot(page,'first-projectile',s)
  if s['shot']!=pre['shot'] and s['phase'] not in ['aim','flight'] and not s['projectiles']:break
  page.wait_for_timeout(90)
 receipt['after']=page.evaluate(read);save()
 if not (o/'first-shot-after.png').exists():snapshot(page,'first-shot-after',receipt['after'])
 return True
guard_s00="""target=>{const a=HonroApp,e=a.engine,u=e.active,t=e.unit(target),k=HONRO_CORE.SKILLS.S00;
 if(!t||t.dead||!k||u.cls!=='knight'||!u.loadout.includes('S00')||!e.canAct()||!e.grounded(u)||!e.skillAllowed(k,u)||!e.canAfford(k,u,0)||e.cooldownLeft(u,'S00')>0)return{ok:false,reason:'native S00 unavailable'};
 const from={x:u.x,y:u.y-u.h/2},to={x:t.x,y:t.y-t.h/2},dx=to.x-from.x,dy=to.y-from.y,dis=Math.hypot(dx,dy),a0=-u.angle*Math.PI/180,theta=Math.atan2(dy,dx),dev=Math.abs(Math.atan2(Math.sin(theta-a0),Math.cos(theta-a0)))*180/Math.PI;
 const base=k.radius,rangeUpper=base*1.65,body=(v)=>({x:v.x,y:v.y-v.h*.5});
 const blocks=e.b.units.filter(v=>v.id!==u.id&&v.id!==t.id&&!v.dead).filter(v=>{const z=body(v),x=z.x-from.x,y=z.y-from.y,d=Math.hypot(x,y),delta=Math.abs(Math.atan2(Math.sin(Math.atan2(y,x)-a0),Math.cos(Math.atan2(y,x)-a0)));return d<=rangeUpper+(v.r||0)+20&&delta<=.5+Math.asin(Math.min(.98,((v.r||0)+15)/Math.max(1,d)));}).map(v=>({id:v.id,side:v.side,x:v.x,y:v.y}));
 const terrain=e.collision(from,to,1,u.id,[],false)?.terrain?.id||null;
 const gear=JSON.stringify([u.equipment,u.gear,e.b.heroes?.[u.cls]?.equipment]);
 const ok=u.facing===Math.sign(dx)&&Math.abs(dy)<45&&dis>=45&&dis<=Math.min(135,base*.8)&&dev<=9&&!terrain&&!blocks.length&&!/co_cursed/.test(gear)&&e.attackAllows(t,u.id,{autonomous:false});
 return {ok,from,to,dis,dev,base,rangeUpper,blocks,terrain,grounded:e.grounded(u),target:t.id};}"""
def nudge(page,key,ms,purpose):
 b=page.evaluate(read);page.keyboard.down(key);page.wait_for_timeout(ms);page.keyboard.up(key);page.wait_for_timeout(130)
 a=page.evaluate(read);events.append({'key':key,'purpose':purpose,'before':b,'after':a});save();return a
def choose_melee(page,starting,hound):
 u=starting['active']; receipt={'before':starting,'actor':u['id'],'skill':'S00','target':hound['id'],'status':'guarded'};melee.append(receipt);save()
 if 'S00' not in u['loadout'] or not(5660<hound['x']<5820) or abs(hound['y']-6110)>30:
  receipt['reason']='hound outside proven near ford lane';return False
 # Reposition a little east first where necessary, so turning west cannot step into the target.
 s=starting
 if u['x']-hound['x']<75 and u['move']>=70 and u['x']<5880:
  s=nudge(page,'d',85,'separate knight before facing west')
 if not s['can'] or not s['active'] or s['active']['id']!=u['id']:
  receipt['reason']='turn changed after east move';return False
 if s['active']['facing']!= -1:
  s=nudge(page,'a',55,'native westward facing')
 if not s['can'] or s['active']['id']!=u['id'] or abs(s['active']['y']-6110)>20 or not(5700<s['active']['x']<5940):
  receipt['reason']='movement or contact guard';return False
 page.keyboard.press(str(u['loadout'].index('S00')+1))
 for _ in range(7):
  s=page.evaluate(read);act=s['active'];t=next((v for v in s['enemies'] if v['id']==hound['id']),None)
  if not(s['can'] and act['id']==u['id'] and t and t['hp']>0 and act['x']>t['x']):receipt['reason']='target or turn changed';return False
  import math
  desired=180-math.degrees(math.atan2((act['y']-act['h']/2)-(t['y']-t['h']/2),act['x']-t['x']))
  delta=(desired-act['angle'])*act['facing']
  if abs(delta)<=3:break
  key='ArrowUp' if delta>0 else 'ArrowDown';page.keyboard.down(key);page.wait_for_timeout(max(20,min(320,abs(delta)*13)));page.keyboard.up(key);page.wait_for_timeout(55)
 guard=page.evaluate(guard_s00,hound['id']);receipt['guard']=guard
 if not guard['ok']:receipt['reason']='conservative target sector check';save();return False
 s=page.evaluate(read);receipt['beforeRelease']=s;snapshot(page,'before-melee-'+str(len(melee)),s)
 page.keyboard.down('Space')
 try:
  page.wait_for_function('()=>HonroApp.charging && HonroApp.power>=.39',timeout=3500,polling='raf')
  receipt['meter']=page.evaluate(read)['power']
 except TimeoutError:receipt['meter']='timeout'
 finally:page.keyboard.up('Space')
 receipt['status']='released';receipt['samples']=[]
 for k in range(40):
  a=page.evaluate(read); act=a['active'];match=next((v for v in a['enemies'] if v['id']==hound['id']),None)
  receipt['samples'].append({'shot':a['shot'],'side':a['side'],'phase':a['phase'],'action':(act or{}).get('action'),'targetHP':match and match['hp'],'heroes':a['heroes']})
  if a['shot']!=s['shot'] and a['phase'] not in ('aim','flight') and k>=3:break
  page.wait_for_timeout(50)
 receipt['after']=page.evaluate(read);save();snapshot(page,'after-melee-'+str(len(melee)),receipt['after']);return True
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True);page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1);errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 try:
  page.goto('http://127.0.0.1:8884/HONRO.html',wait_until='domcontentloaded',timeout=180000)
  page.wait_for_function("document.documentElement.dataset.honroReady==='true' && window.HonroCampaignLoader",timeout=180000)
  page.evaluate('''async()=>{await HONRO_APP_READY;const a=HonroApp;await HonroCampaignLoader.ensureStage(30);a.profile.settings.music=false;a.profile.settings.sound=false;
   for(let n=1;n<30;n++)a.profile.cleared[n]=true;for(const hero of Object.values(a.profile.heroes))hero.xp=HonroProgression.xpAt(HonroProgression.plan(30).entryLevel);
   a.launch(30);if(a.engine?.b.honroStage!==30)throw Error('Actual stock Stage30 not reached');}''')
  start=page.evaluate(read); save()
  assert start['revision']==1 and not start['legacyMarker'] and not start['debug'] and start['probe'] and not start['ready'] and not start['rescued'] and not start['waves'] and ((start['boat'] or {}).get('leg',0)==0),start
  page.locator('#battlecanvas').wait_for(state='visible',timeout=20000)
  status='bounded-input-budget'
  for i in range(175):
   s=page.evaluate(read); bo=s['boat'] or {};phase=bo.get('status')
   if phase in ['boarding','outbound','unboarding','returning'] and phase not in seen:
    seen[phase]=s;snapshot(page,'v4-'+phase,s)
    if len(seen)==4:status='four-native-phases-observed';break
   if s['phase'] in ['won','lost'] or s['stage']!=30:status='stage-outcome-or-exit';break
   if s['modal']:status='unexpected-modal';snapshot(page,'blocked-modal',s);break
   key=None
   if s['dialogue']:key='Space';page.keyboard.press(key);page.wait_for_timeout(260)
   elif s['can'] and not s['banner']:
    u=s['active'];wave=s['waves'].get('act3-response-30-0',{});targets=[x for w in s['waves'].values() for x in w.get('ids',[])];
    a3=next((v for v in s['enemies'] if v['id']=='event-3'),None); hound=next((v for v in s['enemies'] if v['id']=='event-1'),None); focused=bool(a3 and a3['dead'])
    if focused and hound and not hound['dead']:
     if u['cls']=='archer' and u['x']<5910 and u['move']>=160 and s['round'] not in clearlane:
      clearlane.add(s['round']);nudge(page,'d',245,'clear the knight west attack lane via ordinary movement');continue
     if u['cls']=='knight' and len(melee)<5 and choose_melee(page,s,hound):continue
     if s['round']>=10 and len(melee)>=4 and not any(v['status']=='released' for v in melee):status='stopped-no-safe-S00';break
    if focused and hound and hound['dead'] and u['cls']=='archer' and any(v['id']=='event-2' and not v['dead'] for v in s['enemies']):
     if u['x']>5310 and u['move']>=50:
      nudge(page,'a',min(410,max(70,(u['x']-5220)/1.1)),'west ford separated angle against elite');continue
     if 5020<u['x']<=5310 and attempt(page,s,['event-2']):continue
    if not focused and wave.get('admitted') and not s['ready'] and u['x']>=5200 and len([k for k in attacks if k['status']=='released'])<10 and attempt(page,s,targets):
     continue
    if s['ready'] and phase in ['boarding','outbound','unboarding','returning']:
     page.wait_for_timeout(700);continue
    if u['move']>=25 and u['x']<5750:
     key='d';page.keyboard.down('d');page.wait_for_timeout(520);page.keyboard.up('d');page.wait_for_timeout(180)
     t=page.evaluate(read)
     if t['can'] and t['active']['id']==u['id'] and t['active']['x']-u['x']<13:
      key='d then f';page.keyboard.press('f');page.wait_for_timeout(350)
    else:key='f';page.keyboard.press('f');page.wait_for_timeout(400)
   else:page.wait_for_timeout(350)
   if key:events.append({'index':i,'key':key,'before':s,'after':page.evaluate(read)});save()
   if i in [6,25,55,99]:snapshot(page,f'checkpoint-{i}',page.evaluate(read))
  result={'status':status,'state':page.evaluate(read),'errors':errs};snapshot(page,'final',result['state']);assert not errs,errs
 except Exception as e:
  result={'status':'exception','error':str(e),'errors':errs};raise
 finally:save();browser.close()
