import json,os,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright,TimeoutError
o=Path(os.environ['OUT']);events=[];attacks=[];shots=[];seen={};start=None;result=None
read='''()=>{const a=HonroApp,b=a.engine?.b,s=a.scene,c=s?.canvas,r=c?.getBoundingClientRect(),m=b?.honroState?.act23v4?.stage30,u=a.engine?.active;
const D=a.dialogue?document.querySelector('.story-dialogue,#story-dialogue,[role=dialog]'):null;
const B=document.querySelector('#turn-banner'); const v=b?.honroV4Stage30;
return{stage:b?.honroStage,revision:b?.honroAct23V4Revision,legacyMarker:b?.honroMarkers?.some(x=>x.id==='transport-map'),debug:a.debugMode,shot:b?.shot,charging:a.charging,power:a.power,selected:a.selected,enemies:b?.units?.filter(v=>v.side===1&&!v.honroObjectiveTarget).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead,h:v.h,r:v.r,cls:v.cls,loadout:v.loadout})),projectiles:b?.projectiles?.map(p=>({id:p.id,owner:p.owner,skill:p.skill,x:p.x,y:p.y})),phase:b?.phase,side:b?.side,round:b?.round,serial:b?.honroState?.actorTurnSerial,dialogue:!!a.dialogue,modal:!!a.modal?.classList.contains('open'),banner:!!B&&!B.hidden,can:!a.dialogue&&!a.modal?.classList.contains('open')&&b?.phase==='aim'&&b?.side===0&&u&&!u.dead&&!u.acted&&!u.airborne&&!u.jumping,active:u?{id:u.id,x:u.x,y:u.y,hp:u.hp,move:u.moveLeft,acted:u.acted,angle:u.angle,facing:u.facing,loadout:u.loadout,cls:u.cls,r:u.r,h:u.h}:null,
heroes:b?.units?.filter(u=>u.side===0&&!u.summoned).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead})),ready:m?.ready||false,boat:m?.boat??null,rescued:m?.rescued??[],waves:m?.waves??{},hold:m?.hold??null,probe:!!v,
canvas:r?{left:r.left,top:r.top,width:r.width,height:r.height,dpr:devicePixelRatio}:null,camera:s?{x:s.x,y:s.y,scale:s.scale}:null,objective:(document.querySelector('.battle-info')?.innerText||'').slice(0,250)};}'''
def save():
 (o/'proof.json').write_text(json.dumps({'scope':'One actual stock desktop V4 path; fresh profile predecessor/entry XP only prior to App.launch; no game writes after launch; movement/defense/aim/charge ordinary keys with stock read-only preview, read-only observation. Partial accepted as evidence of where attempt stopped, not success.','start':start,'phaseSnapshots':seen,'events':events,'attacks':attacks,'shots':shots,'final':result},indent=2))
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
    if wave.get('admitted') and not s['ready'] and u['x']>=5200 and len([k for k in attacks if k['status']=='released'])<12 and attempt(page,s,targets):
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
