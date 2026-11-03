"""Fixed upper/drop/rejoin + lower escort policy, actual Chromium UI inputs.
Entry is an earned-XP fixture. No battle state/actor/camera writes after entry.
One attempted run, preserve failure/incomplete; no all-heroes-alive requirement.
"""
import json,time,traceback,os,hashlib,gzip
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('_local/reports/stage6-art-preview/integrated-play');OUT.mkdir(parents=True,exist_ok=True)
R={'source':os.environ.get('GITHUB_SHA'),'scope':'Prepared earned-XP entry; actual Chromium keyboard/button input, natural simulation and camera; not continuous campaign or physical mobile hardware','status':'running','inputs':[],'samples':[],'milestones':[],'errors':[],'quantitative':'Rounds, HP and survivor counts are observations, not automatic quality gates.'}
STATE=r'''()=>{const a=HonroApp,e=a.engine,b=e?.b,u=e?.active,s=a.scene;return {round:b?.round,phase:b?.phase,side:b?.side,can:a.canInput(),dialogue:!!a.dialogue,done:a.done,active:u&&{id:u.id,cls:u.cls,x:u.x,y:u.y,hp:u.hp,move:u.moveLeft,angle:u.angle,display:a.displayAngle(u),facing:u.facing,ground:e.grounded(u),support:e.grounded(u)&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id,canDrop:e.canDrop(u),drop:u.platformDrop?.phase,loadout:u.loadout},enemies:b?.units.filter(v=>v.side===1).map(v=>({id:v.id,hp:v.hp,dead:v.dead,x:v.x,y:v.y,damageBy:v.damageBy})),reviewDamage:b?.reviewDamage,mission:b?.honroState,heroes:e?.heroesAlive().map(v=>({id:v.id,hp:v.hp,x:v.x,y:v.y})),objective:e?.unit('objective')&&{hp:e.unit('objective').hp,x:e.unit('objective').x,y:e.unit('objective').y},boss:e?.unit('midboss-stage6')&&{hp:e.unit('midboss-stage6').hp,x:e.unit('midboss-stage6').x,y:e.unit('midboss-stage6').y,dead:e.unit('midboss-stage6').dead},interaction:G_HONRO_UNUSED, camera:s&&{x:s.x,y:s.y,scale:s.scale,manual:s.manual},warning:document.getElementById('stage6-pursuit-warning')?.innerText||null,nearest:window.HonroInteractions?.nearest(a)?.id,shots:b?.shot,revision:b?.honroCampaignMapRevision};}'''.replace('interaction:G_HONRO_UNUSED,','')
PLAN=r'''()=>{const a=HonroApp,live=a.engine,raw=JSON.stringify(live.b),profile=JSON.stringify(a.profile),C=HONRO_CORE,e=new C.Engine(JSON.parse(raw)),u=e.active;if(!u||u.side!==0||!e.grounded(u))return null;const car=e.unit('objective');let best=null;const targets=e.alive(1).filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<2100).sort((v,w)=>(v.id==='midboss-stage6'?-2000:0)+Math.hypot(v.x-u.x,v.y-u.y)-(w.id==='midboss-stage6'?-2000:0)-Math.hypot(w.x-u.x,w.y-u.y)).slice(0,4);for(const id of u.loadout){const skill=C.SKILLS[id];if(!skill||skill.passive||e.cooldownLeft(u,id)>0||!e.canAfford(skill,u,1))continue;for(const v of targets){if(skill.martial&&skill.branch==='sword'){let angle=Math.atan2(u.y-u.h*.58-(v.y-v.h*.5),v.x-u.x)*180/Math.PI;if(angle< -90)angle+=360;for(const power of [1,.7])if(C.meleeContains(e,u,v,C.meleeRange(u,skill,power),-angle*Math.PI/180,C.meleeSpan(u,skill,power)))best={id,angle,power,target:v.id};continue;}for(const q of e.shotSeeds(u,skill,v)){if(q.angle< -85||q.angle>265)continue;const z=C.shotViable(e,u,skill,v,q.angle,q.power);if(z.ok&&z.risk<.5&&z.enemyDamage>0&&(!best||z.net+(v.id==='midboss-stage6'?900:0)>(best.score||0)))best={id,...q,target:v.id,score:z.net+(v.id==='midboss-stage6'?900:0),targetNearConvoy:car?Math.hypot(v.x-car.x,v.y-car.y):null};}}}if(JSON.stringify(live.b)!==raw||JSON.stringify(a.profile)!==profile)throw Error('Planner changed live state');return best;}'''

def record(op,**kw):R['inputs'].append({'time':round(time.monotonic()-START,2),'op':op,**kw})
def snap(page,label):
 s=page.evaluate(STATE);R['milestones'].append({'label':label,**s});page.screenshot(path=str(OUT/(label+'.png')));return s

def checkpoint(page,label):
 # Preserve a normal serialized checkpoint for narrow follow-up, without
 # rewriting actor state or replacing the live battle.
 ok=page.evaluate('()=>{HonroApp.flushBattleSave();return HonroApp.persist()}')
 saved=page.evaluate('()=>localStorage.getItem("honro-first-act-profile-1")')
 if ok and saved:(OUT/(label+'-save.json.gz')).write_bytes(gzip.compress(saved.encode()))
 record('checkpoint',label=label,ok=ok)

def pulse(page,key,ms):
 page.keyboard.down(key);page.wait_for_timeout(ms);page.keyboard.up(key)

def finish_dialogue(page):
 nxt=page.locator('[data-action="dialogue-next"]:visible')
 if nxt.count() and nxt.first.is_enabled():nxt.first.click(timeout=3000)
 else:page.keyboard.press('Enter')

def shoot_or_defend(page,label):
 shot=page.evaluate(PLAN);before=page.evaluate(STATE)
 if not shot:page.keyboard.press('f');record('defend',label=label,before=before);return
 u=before['active'];index=u['loadout'].index(shot['id']);page.keyboard.press(str(index+1))
 # Facing and angle changes use ordinary keyboard only. No actor assignment.
 desired=-1 if shot['angle']>90 else 1
 if u['facing']!=desired:pulse(page,'ArrowLeft' if desired<0 else 'ArrowRight',35)
 target=180-shot['angle'] if desired<0 else shot['angle']
 for _ in range(10):
  s=page.evaluate(STATE)
  if not s['can'] or s['active']['id']!=u['id']:break
  delta=target-s['active']['display']
  if abs(delta)<.8:break
  pulse(page,'ArrowUp' if delta>0 else 'ArrowDown',max(12,min(280,abs(delta)/62*1000)))
 page.keyboard.down('Space');deadline=time.monotonic()+3
 while time.monotonic()<deadline:
  charge=page.evaluate('()=>({charging:HonroApp.charging,power:HonroApp.chargePower()})')
  if not charge['charging'] or charge['power']>=shot['power']:break
  page.wait_for_timeout(15)
 page.keyboard.up('Space');record('fire',label=label,plan=shot,before=before,after=page.evaluate(STATE));page.wait_for_timeout(100)

def mobile_drop(browser,profile):
 ctx=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
 p=ctx.new_page();p.on('pageerror',lambda e:R['errors'].append('mobile: '+str(e)))
 p.goto('http://127.0.0.1:8870/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=60000)
 p.evaluate('(p)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',profile);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=60000);p.locator('.title-actions button[data-action="continue"]:visible').first.click();p.wait_for_function('HonroApp.canInput()',timeout=60000)
 row={'scope':'Natural desktop checkpoint continued in mobile touch emulation, not a device FPS claim','before':snap(p,'mobile-lookout-before')}
 p.locator('#drop').tap();p.wait_for_function('()=>{const e=HonroApp.engine,u=e.unit("p-archer");return e.grounded(u)&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id==="lower-road"}',timeout=30000)
 row['landed']=snap(p,'mobile-drop-landed')
 # Touch joystick left for normal movement, then use the visible fire control.
 box=p.locator('#joystick').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2;cdp=ctx.new_cdp_session(p)
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x-35,'y':y}]});p.wait_for_timeout(300);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});p.wait_for_timeout(200)
 row['moved']=snap(p,'mobile-drop-moved');row['documentWidth']=p.evaluate('document.documentElement.scrollWidth')
 box=p.locator('#fire').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});p.wait_for_timeout(450);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});p.wait_for_timeout(80);row['fired']=snap(p,'mobile-projectile')
 row['dropHpLoss']=row['before']['active']['hp']-row['landed']['active']['hp'];row['movedLeft']=row['moved']['active']['x']<row['landed']['active']['x'];row['actualShot']=row['fired']['shots']>row['moved']['shots'];R['mobile']=row;ctx.close()

START=time.monotonic()
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox']);ctx=browser.new_context(viewport={'width':1440,'height':900});page=ctx.new_page();page.on('pageerror',lambda e:R['errors'].append(str(e)))
  entry=json.loads(Path('_local/reports/stage6-art-preview/integrated-entry.json').read_text());page.goto('http://127.0.0.1:8870/HONRO.html',wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000)
  page.evaluate('(p)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',entry['profile']);page.reload(wait_until='domcontentloaded');page.get_by_role('button',name='여정 이어가기',exact=True).click()
  deadline=time.monotonic()+120
  while time.monotonic()<deadline:
   ready=page.evaluate('()=>HonroApp.engine?.b?.honroStage===6&&HonroApp.canInput()')
   if ready:break
   if page.evaluate('!!HonroApp.dialogue'):finish_dialogue(page)
   else:
    enter=page.locator('[data-action="journey-enter"]:visible')
    if enter.count():enter.first.click()
   page.wait_for_timeout(150)
  R['entry']=snap(page,'natural-entry');assert R['entry']['revision']==4
  high=[{'x':1250,'jump':1400,'landing':'bridge-west'},{'x':2200,'fire':'west-cover'},{'x':2470,'jump':2820,'landing':'bridge-mid'},{'x':3630,'jump':4020,'landing':'bridge-east'},{'x':4800,'drop':'lower-lookout'},{'x':4800,'fire':'lookout-cover','drop':'lower-road'},{'x':3550},{'x':5350},{'x':6380}]
  low=[{'x':1250},{'x':2450},{'x':3100},{'x':3850},{'x':4100},{'x':5350},{'x':6380}]
  policy={};last_sample=-1;mobile_done=False;last_round=0
  # Wall-clock limit is an infrastructure bound, not a round/fun criterion.
  while time.monotonic()-START<1080:
   s=page.evaluate(STATE)
   if s['phase'] in ['won','lost']:R['status']='terminal-'+s['phase'];break
   if s['dialogue']:finish_dialogue(page);page.wait_for_timeout(100);continue
   if s['round']!=last_round:
    last_round=s['round'];print('ROUND',last_round,'phase',s['phase'],flush=True)
   if time.monotonic()-START-last_sample>2:R['samples'].append(s);last_sample=time.monotonic()-START
   if not s['can']:page.wait_for_timeout(120);continue
   u=s['active'];st=policy.setdefault(u['id'],{'goal':0,'still':0,'lastX':u['x'],'jump':None,'dropping':None,'fired':[]});plan=high if u['cls']=='archer' else low;goal=plan[min(st['goal'],len(plan)-1)]
   if s.get('nearest'):page.keyboard.press('e');record('interact',marker=s['nearest']);page.wait_for_timeout(120);continue
   if st['dropping']:
    if u['ground'] and u['support']==st['dropping']:
     snap(page,'desktop-'+st['dropping']+'-r'+str(s['round']));st['dropping']=None;st['goal']+=1
    page.wait_for_timeout(80);continue
   if st['jump']:
    if u['ground'] and time.monotonic()-st['jump']['at']>.4:
     page.keyboard.up(st['jump']['key']);record('landing',state=s,expected=st['jump']['support'])
     if u['support']!=st['jump']['support']:
      R['status']='route-failed-wrong-landing';R['routeFailure']={'expected':st['jump']['support'],'actual':u['support'],'state':s};break
     st['jump']=None;st['goal']+=1
    else:
     # Keep ordinary movement held through the jump, like a player. The
     # previous pulse loop inserted input gaps between every browser read.
     if (st['jump']['x']-u['x'])*st['jump']['direction']<7 or u['move']<=5:page.keyboard.up(st['jump']['key'])
     record('jump-sample',state={'round':s['round'],'active':u});page.wait_for_timeout(35)
    continue
   if not u['ground']:page.wait_for_timeout(80);continue
   if u['cls']!='archer' and u['support'] in ['bridge-west','bridge-mid','bridge-east','lower-lookout'] and u['canDrop']:
    page.locator('#drop').click();record('lower-policy-drop',state=s);page.wait_for_timeout(100);continue
   # The lower companions respond to the actual mandatory blocker, not a kill-all objective.
   if u['cls']!='archer' and s['boss'] and not s['boss']['dead'] and abs(u['x']-s['boss']['x'])<850 and abs(u['y']-s['boss']['y'])<400:
    shoot_or_defend(page,'lower-warden-response');continue
   if abs(u['x']-goal['x'])<22:
    if goal.get('fire') and goal['fire'] not in st['fired']:
     st['fired'].append(goal['fire']);snap(page,goal['fire']+'-before');shoot_or_defend(page,goal['fire']);continue
    if goal.get('drop'):
     if not u['canDrop']:
      record('drop-not-ready',state=s)
      expected='bridge-east' if goal['drop']=='lower-lookout' else 'lower-lookout'
      if u['support']!=expected:
       R['status']='route-failed-wrong-drop-support';R['routeFailure']={'expected':expected,'actual':u['support'],'state':s};break
      if not u.get('drop'):
       R['status']='route-failed-drop-unavailable';R['routeFailure']={'expected':expected,'state':s};break
      page.wait_for_timeout(200);continue
     if goal['drop']=='lower-road' and not mobile_done:
      assert page.evaluate('()=>{HonroApp.flushBattleSave();return HonroApp.persist()}'),'checkpoint save failed';saved=page.evaluate('()=>JSON.parse(localStorage.getItem("honro-first-act-profile-1"))');(OUT/'natural-lookout-save.json.gz').write_bytes(gzip.compress(json.dumps(saved).encode()));mobile_drop(browser,saved);mobile_done=True;page.bring_to_front();page.wait_for_timeout(100)
      if page.evaluate('HonroApp.modal.classList.contains("open")'):page.keyboard.press('Escape')
     page.locator('#drop').click();record('drop',target=goal['drop'],state=s);st['dropping']=goal['drop'];continue
    if goal.get('jump'):
     if u['move']<abs(goal['jump']-u['x'])+120:shoot_or_defend(page,'movement-budget');continue
     checkpoint(page,'pre-jump-'+goal['landing']+'-r'+str(s['round']))
     direction=1 if goal['jump']>u['x'] else -1;key='ArrowRight' if direction>0 else 'ArrowLeft';page.keyboard.down(key);page.keyboard.press('Control');record('jump',target=goal['jump'],expected=goal['landing'],state=s,after=page.evaluate(STATE));st['jump']={'x':goal['jump'],'at':time.monotonic(),'key':key,'direction':direction,'support':goal['landing']};continue
    st['goal']=min(st['goal']+1,len(plan)-1);goal=plan[st['goal']]
   if u['move']<35:shoot_or_defend(page,'movement-budget');continue
   dx=goal['x']-u['x'];pulse(page,'ArrowRight' if dx>0 else 'ArrowLeft',min(100,max(18,abs(dx)/500*1000)))
   after=page.evaluate(STATE);st['still']=st['still']+1 if abs(after['active']['x']-u['x'])<.3 else 0
   if st['still']>25:
    record('route-blocked',goal=goal,state=after);shoot_or_defend(page,'route-blocked');st['still']=0
  else:R['status']='incomplete-wall-clock-limit'
  checkpoint(page,'final');R['final']=snap(page,'final');R['policyState']=policy;R['partialKnockoutsAreNotFailure']=True;browser.close()
except Exception:R['status']='execution-error';R['error']=traceback.format_exc()
finally:
 R['elapsedSeconds']=time.monotonic()-START;(OUT/'result.json').write_text(json.dumps(R,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in R.items() if k not in ['samples','inputs','milestones']},ensure_ascii=False),flush=True)
# An incomplete diagnostic remains explicit. No target win/round/survivor threshold is changed to force success.
if R['status']=='execution-error' or R['errors']:raise SystemExit(1)
