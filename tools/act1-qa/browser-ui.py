"""Normal UI stage1 route/shot or stage9 objective-first evidence. Read-only runtime planning, no live writes.
Fresh profile unless an explicitly declared entry JSON is provided. Tool assisted,
not human clear-rate/fun evidence. Screenshots and failures are always retained.
"""
import os,json,time,sys,traceback,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools/act4-ci'))
from precise_aim import aim_with_joystick
out=Path(os.environ.get('HONRO_QA_OUT','_local/reports/act1-gameplay-ui'));out.mkdir(parents=True,exist_ok=True)
reactive=os.environ.get('HONRO_REACTIVE_POLICY')=='1';stage=int(os.environ.get('HONRO_STAGE','1'));result={'passed':False,'stage':stage,'scope':__doc__,'source':os.environ.get('GITHUB_SHA'),'errors':[]};events=[]
def aim_terminal(aim, current):
 """A terminal battle interrupts aiming, never converts a missed aim into success."""
 if current['phase'] in ['won','lost']:return True
 assert aim['passed'],'Aim precision failed'
 return False
def save():
 (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));(out/'events.json').write_text(json.dumps(events,ensure_ascii=False))
try:
 w=sync_playwright().start()
 browser=w.chromium.launch(headless=True);p=browser.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:result['errors'].append(str(e)))
 p.goto(os.environ.get('HONRO_QA_URL','http://127.0.0.1:8870/HONRO.html'),wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=60000)
 if os.environ.get('HONRO_ENTRY_PROFILE'):
  entry=json.loads(Path(os.environ['HONRO_ENTRY_PROFILE']).read_text());profile=entry.get('profile',entry);result['entryFixture']=os.environ['HONRO_ENTRY_PROFILE'];p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',profile);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp')
 else:result['entryFixture']='fresh browser storage / normal new journey'
 p.locator('.title-actions button.primary:visible').click()
 deadline=time.monotonic()+180
 while time.monotonic()<deadline:
  if p.evaluate(f'HonroApp.engine?.b?.honroStage==={stage} && HonroApp.canInput()'):break
  nxt=p.locator('[data-action="dialogue-next"]:visible');enter=p.locator(f'[data-action="journey-enter"][data-id="{stage}"]:visible')
  if nxt.count() and nxt.first.is_enabled():nxt.first.click()
  elif p.evaluate('!!HonroApp.dialogue'):p.keyboard.press('Enter')
  elif enter.count():enter.first.click()
  p.wait_for_timeout(350)
 p.wait_for_function(f'HonroApp.engine?.b?.honroStage==={stage} && HonroApp.canInput()',timeout=1000)
 def state():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active;return{round:b.round,side:b.side,phase:b.phase,active:u?.id,cls:u?.cls,x:u?.x,y:u?.y,angle:u?.angle,facing:u?.facing,moveLeft:u?.moveLeft,jumpCost:u&&e.jumpCost(u),grounded:u&&e.grounded(u),can:a.canInput(),dialogue:!!a.dialogue,shots:b.shots,shotId:b.shot,drop:u&&e.canDrop(),camera:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale},health:b.units.filter(v=>v.side===0&&!v.summoned).map(v=>({id:v.id,hp:v.hp,maxHp:v.maxHp,dead:v.dead,x:v.x,y:v.y})),enemies:b.units.filter(v=>v.side===1).map(v=>({id:v.id,hp:v.hp,dead:v.dead,x:v.x,y:v.y,kind:v.honroVariant})),seed:b.seed,rng:b.rng}}''')
 def record(op,**extra):
  row={'op':op,'state':state(),'time':time.time(),**extra};events.append(row);save();print(json.dumps(row,ensure_ascii=False),flush=True)
 def ready():
  for _ in range(150):
   s=state()
   if s['phase'] in ['won','lost']:return False
   if s['dialogue']:
    nxt=p.locator('[data-action="dialogue-next"]:visible')
    if nxt.count() and nxt.first.is_enabled():nxt.first.click()
    else:p.keyboard.press('Enter')
   elif s['can'] and s['side']==0 and s['grounded']:return True
   p.wait_for_timeout(350)
  return False
 p.wait_for_timeout(1600);record('initial');p.screenshot(path=str(out/'initial-normal.png'))
 p.locator('#battlecanvas').hover();p.mouse.wheel(0,4000);p.wait_for_timeout(900);p.screenshot(path=str(out/'initial-monsters-overview.png'));record('initial-overview')
 for _ in range(14):
  if state()['camera']['scale']>=.6:break
  p.mouse.wheel(0,-120);p.wait_for_timeout(100)
 planner=(ROOT/'tools/act4-ci/normal-shot-plan.js').read_text();goals=[690,930,1500,2000,2300,2700,3100,3430,3760,4100,4650,4900,5210];goal=0
 if stage==1:
  for action in range(35):
   if not ready():break
   initial=state();still=0;jumped_entry=False
   for pulse in range(180):
    s=state()
    if not s['can'] or s['active']!=initial['active'] or s['phase'] in ['won','lost'] or s['moveLeft']<6:break
    while goal<len(goals)-1 and s['x']>goals[goal]-14:goal+=1
    if goal==len(goals)-1 and abs(s['x']-goals[goal])<14:break
    if goal==1 and s['x']<760 and s['grounded'] and not jumped_entry and s['moveLeft']>s['jumpCost']+200:p.keyboard.press('Control');jumped_entry=True;record('entry-jump')
    if still>=3 and s['grounded'] and s['moveLeft']>s['jumpCost']+100:p.keyboard.press('Control');still=0;record('obstacle-jump')
    key='ArrowRight' if goals[goal]>s['x'] else 'ArrowLeft';p.keyboard.down(key);p.wait_for_timeout(100);p.keyboard.up(key)
    after=state();still=still+1 if abs(after['x']-s['x'])<1 else 0
    if still>12:record('movement-blocked',goal=goals[goal]);break
   if not ready():break
   record('moved',goal=goals[goal]);p.screenshot(path=str(out/f'round-{state()["round"]}-route.png'))
   plan=p.evaluate(planner,False);choice=plan['best'];record('plan',plan=plan)
   if choice and state()['facing']!=(-1 if choice['angle']>90 else 1):
    key='ArrowLeft' if choice['angle']>90 else 'ArrowRight';p.keyboard.down(key);p.wait_for_timeout(70);p.keyboard.up(key);p.wait_for_timeout(200);choice=p.evaluate(planner,True)['best']
   if choice:
    p.keyboard.press('Digit'+str(choice['idx']+1));p.wait_for_timeout(150);aim=aim_with_joystick(p,choice['angle'],state);record('aim',aim=aim,choice=choice);assert aim['passed'],'Aim precision failed'
    before=state();safe=p.evaluate('''q=>{const e=HonroApp.engine,u=e.active,t=e.unit(q.target),s=HONRO_CORE.SKILLS[q.id];return [-.1,0,.1].every(d=>{const v=HONRO_CORE.shotViable(e,u,s,t,u.angle+d,1);return v.ok&&v.risk<.5&&v.enemyDamage>0})}''',choice)
    assert safe,'Actual angle target no longer safe';p.keyboard.down('Space')
    try:p.wait_for_function('HonroApp.charging && HonroApp.chargePower(performance.now())>=1',timeout=8000,polling=16)
    finally:p.keyboard.up('Space')
    p.wait_for_timeout(100);actual=p.evaluate('id=>HonroApp.engine.b.lastShots?.[id]',before['active']);record('fire',choice=choice,actual=actual);assert actual and actual['skill']==choice['id'] and abs(actual['power']-1)<1e-9
   else:p.keyboard.press('f');record('defend-no-safe-shot')
   p.wait_for_timeout(300)
 elif stage in [5,10]:
  commands=json.loads((ROOT/f'tools/act1-qa/stage{stage}-ui-commands.json').read_text())['commands']
  memory={};reactive_plan=(ROOT/'tools/act1-qa/browser-reactive-plan.js').read_text() if reactive else None
  if reactive:result['controllerPolicy']='reactive-authored-objectives-detached-v2';result['policyRegistration']='tools/act1-qa/browser-reactive-registration.json'
  for index in range(240 if reactive else len(commands)):
   if not ready():break
   if reactive and (stage==10 or index>=45):
    planned=p.evaluate(reactive_plan,{'stage':stage,'memory':memory});command=planned['command'];memory=planned['memory'];assert command,'Reactive planner provided no input'
   else:
    if index>=len(commands):break
    command=commands[index]
    if reactive and command['op']=='shoot':
     planned=p.evaluate(reactive_plan,{'stage':stage,'memory':memory,'preferred':command});command=planned['command'];memory=planned['memory']
   if command['op'] in ['quit','state','plan']:continue
   before=state();op=command['op'];assert not command.get('hero') or command['hero']==before['cls'],'Recorded actor boundary diverged';record('replay-command',index=index,command=command)
   if op in ['walk','jump','climb']:
    if op=='jump':p.keyboard.press('Control');p.wait_for_timeout(50)
    still=0
    for pulse in range(220):
     st=state()
     if not st['can'] or st['active']!=before['active'] or st['moveLeft']<3:break
     dx=command['x']-st['x']
     if op=='climb':
      support=p.evaluate('()=>{const e=HonroApp.engine,u=e.active;return e.contactSurface(u.x,u.y-3,u.y+4)?.t.id}')
      if abs(dx)<12 and st['grounded'] and support==command['support']:break
      if abs(dx)<45 and st['grounded'] and st['y']-command['y']>35:p.keyboard.press('Control');p.wait_for_timeout(50)
     elif abs(dx)<8 and (op=='walk' or st['grounded']):break
     if abs(dx)>=5:
      key='ArrowRight' if dx>0 else 'ArrowLeft';p.keyboard.down(key);p.wait_for_timeout(20 if abs(dx)<25 else max(20,int(80*command.get('input',1))));p.keyboard.up(key)
     p.wait_for_timeout(30)
     after=state();still=still+1 if abs(after['x']-st['x'])<.5 and after['grounded'] else 0
     if still>10:break
    record('replay-moved',index=index,command=command)
   elif op=='defend':p.keyboard.press('f');record('defend')
   elif op=='interact':
    mid=command.get('id','receiver-5');eligible=p.evaluate("id=>HonroInteractions.nearest(HonroApp)?.id===id",mid);assert eligible,'Normal interaction not reachable';p.keyboard.press('e');record('interact',marker=mid)
   elif op=='detonate':p.keyboard.press('Space');record('detonate')
   elif op=='shoot':
    shot_planner="""q=>{const e=HonroApp.engine,u=e.active,C=HONRO_CORE,t=e.unit(q.target),s=C.SKILLS[q.skill];if(!u.loadout.includes(q.skill)||e.cooldownLeft(u,q.skill)>0)return null;const base={id:q.skill,target:q.target,idx:u.loadout.indexOf(q.skill)};if(q.skill==='S08')return e.canAfford(s,u,.3)?{...base,angle:u.angle,power:.3}:null;if(!t||t.dead)return null;if(s.martial&&s.branch==='sword'){let angle=Math.atan2(u.y-u.h*.58-(t.y-t.h*.5),t.x-u.x)*180/Math.PI;if(angle< -90)angle+=360;for(const power of [1,.7,.2])if(e.canAfford(s,u,power)&&C.meleeContains(e,u,t,C.meleeRange(u,s,power),-angle*Math.PI/180,C.meleeSpan(u,s,power)))return {...base,angle,power};return null;}let best=null;for(const a of [...e.shotSeeds(u,s,t),...(q.stage===5?[-25,0,15,30,45,60,75].flatMap(angle=>[.25,.5,.75,1].map(power=>({angle:t.x>=u.x?angle:180-angle,power}))):[])]){if(!e.canAfford(s,u,a.power))continue;const v=C.shotViable(e,u,s,t,a.angle,a.power),p=e.predict(u,s,a.angle,a.power,undefined,false);if(q.stage===10?v.ok&&v.risk<1&&v.enemyDamage>0:t.honroObjectiveTarget?p.unit===t.id||p.terrain===t.id:v.ok&&v.risk<.5&&v.enemyDamage>0){const score=v.net||v.enemyDamage||1;if(q.stage===5)return {...a,...base,score};if(!best||score>best.score)best={...a,...base,score};}}return best;}"""
    choice=command.get('choice') or p.evaluate(shot_planner,{**command,"stage":stage})
    # Bounded ordinary-key approach/retreat, not a new target or injected hit.
    # Route endpoints vary by frames; max-range and point-blank shots need space.
    for correction in range(0 if reactive else 3):
     if choice:break
     target=p.evaluate("id=>{const u=HonroApp.engine.unit(id);return u?{x:u.x,dead:u.dead}:null}",command['target']);st=state()
     if not target or target['dead'] or not st['can'] or st['moveLeft']<8:break
     dx=target['x']-st['x'];direction=(1 if dx>=0 else -1)*(1 if abs(dx)>120 else -1)
     key='ArrowRight' if direction>0 else 'ArrowLeft';p.keyboard.down(key)
     try:p.wait_for_timeout(120)
     finally:p.keyboard.up(key)
     p.wait_for_timeout(180);record('bounded-shot-reposition',index=index,attempt=correction+1,target=command['target'],before=st,after=state())
     if state()['active']!=st['active']:break
     choice=p.evaluate(shot_planner,{**command,"stage":stage})
    assert choice,'No safe current runtime shot for declared command'
    if state()['facing']!=(-1 if choice['angle']>90 else 1):
     key='ArrowLeft' if choice['angle']>90 else 'ArrowRight';p.keyboard.down(key);p.wait_for_timeout(25);p.keyboard.up(key);p.wait_for_timeout(100)
    p.keyboard.press('Digit'+str(choice['idx']+1));p.wait_for_timeout(100);aim=aim_with_joystick(p,choice['angle'],state);record('aim',aim=aim,choice=choice)
    if aim_terminal(aim,state()):
     record('terminal-during-aim',choice=choice,reason='Actual authored objective/death settled during pointer gesture; no successful aim or shot receipt claimed');break
    p.keyboard.down('Space')
    try:p.wait_for_function('(power)=>["won","lost"].includes(HonroApp.engine.b.phase) || (HonroApp.charging && HonroApp.chargePower(performance.now())>=power)',arg=choice['power'],timeout=8000,polling=16)
    finally:p.keyboard.up('Space')
    if state()['phase'] in ['won','lost']:
     record('terminal-during-charge',choice=choice,reason='Actual authored objective/death settled before release; no shot receipt claimed');break
    p.wait_for_timeout(100);actual=p.evaluate('id=>HonroApp.engine.b.lastShots?.[id]',before['active']);record('fire',choice=choice,actual=actual);assert actual and actual['skill']==choice['id'] and state()['shotId']>before['shotId'],'Normal charge did not launch a new selected skill'
   else:raise AssertionError('Unsupported replay input '+op)
   if op not in ['walk','jump','climb']:p.screenshot(path=str(out/f'command-{index}-{op}.png'))
   p.wait_for_timeout(150)
 elif stage==9:
  for action in range(30):
   if not ready():break
   initial=state();marker=p.evaluate("()=>HonroApp.engine.b.honroMarkers.filter(m=>m.action==='receiver'&&!m.collected).sort((a,z)=>a.x-z.x)[0]||null")
   if not marker:break
   for pulse in range(220):
    st=state()
    if not st['can'] or st['active']!=initial['active']:break
    eligible=p.evaluate("id=>HonroInteractions.eligibility(HonroApp,HonroApp.engine.b.honroMarkers.find(m=>m.id===id)).ok",marker['id'])
    if eligible:break
    if st['moveLeft']<5:break
    key='ArrowRight' if marker['x']>st['x'] else 'ArrowLeft';p.keyboard.down(key);p.wait_for_timeout(100);p.keyboard.up(key)
   if not ready():break
   eligible=p.evaluate("id=>HonroInteractions.eligibility(HonroApp,HonroApp.engine.b.honroMarkers.find(m=>m.id===id)).ok",marker['id'])
   if eligible:p.keyboard.press('e');record('receiver-interact',marker=marker['id'])
   else:p.keyboard.press('f');record('defend-after-move',marker=marker['id'])
   p.screenshot(path=str(out/f'objective-action-{action}.png'));p.wait_for_timeout(300)
 else:raise AssertionError('Other stages require validated route controller')
 result['final']=state();result['passed']=result['final']['phase']=='won' and not result['errors'];result['roundTargetAssessment']='Recorded separately; UI clear is not whole gameplay/fun approval';p.screenshot(path=str(out/'terminal.png'));result['stored']=json.loads(p.evaluate('localStorage.getItem("honro-first-act-profile-1")'))
except Exception:
 result['passed']=False
 result['exception']=traceback.format_exc()
 try:result['last']=state();p.screenshot(path=str(out/'failure.png'))
 except Exception:pass
finally:
 save()
 try:browser.close();w.stop()
 except Exception:pass
if not result['passed']:raise SystemExit(1)
