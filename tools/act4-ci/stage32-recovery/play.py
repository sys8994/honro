"""Actual UI restart opening audit. Existing stats/terrain; no balance edits.
Declared preserved campaign profile. Revised42-enemy diagnostic, not cohort acceptance.
"""
import json,lzma,os,time,traceback,hashlib,math
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[3];out=Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=True)
raw=lzma.decompress((root/'tests/fixtures/act4-rc/stage31-completed-41357624316.json.xz').read_bytes());assert hashlib.sha256(raw).hexdigest()=='72610645d10ccac66f955bd58a709288a418480032d64044765130ced47374a7'
source=out/'source.json';source.write_bytes(raw);result={'passed':False,'scope':'actual Stage31 completion -> normal pending-direct Stage32 entry; functional diagnostic, not acceptance cohort','releaseApproved':False,'sourceCommit':os.environ.get('GITHUB_SHA'),'events':[],'errors':[]}
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True);p=browser.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:result['errors'].append(str(e)))
 def state():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active;return{round:b.round,active:u?.id,phase:b.phase,side:b.side,can:a.canInput(),dialogue:!!a.dialogue,x:u?.x,y:u?.y,facing:u?.facing,angle:u?.angle,move:u?.moveLeft,grounded:u&&e.grounded(u),support:u&&e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id,canDrop:e.canDrop(),tide:b.honroAct4PreviewState?.tide,finale:b.honroFinalDefenseRevision,major:b.units.filter(v=>v.side===1&&v.boss).length,minis:b.units.filter(v=>v.side===1&&v.honroMidboss).length,bossState:b.units.find(v=>v.honroAct4FinaleBoss)?.honroPilotCombat,shots:b.shots,shotSerial:b.shot,health:b.units.filter(v=>v.side===0&&!v.summoned&&!v.honroAct4Resident).map(v=>({id:v.id,hp:v.hp,maxHp:v.maxHp,x:v.x,y:v.y,dead:v.dead,acted:v.acted})),residents:b.units.filter(v=>v.honroAct4Resident).map(v=>({id:v.id,hp:v.hp,dead:v.dead})),foes:b.units.filter(v=>v.side===1&&!v.dead).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,maxHp:v.maxHp,support:v.honroEncounterSupport})),safeSevenCount:b.honroAct4PreviewState?.safeSeven?.ids?.length||0}}''')
 def record(step,extra=None):
  s=state();result['events'].append({'step':step,'state':s,'extra':extra});(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(step,s['round'],s['active'],len(s['foes']),flush=True);return s
 def ready():
  for _ in range(120):
   s=state()
   if s['dialogue']:p.wait_for_timeout(800);p.keyboard.press('Enter');continue
   if s['phase'] in ['won','lost']:return False
   if s['can'] and s['side']==0 and s['phase']=='aim' and s['grounded']:return True
   p.wait_for_timeout(400)
  raise TimeoutError('input not ready')
 def view():
  p.mouse.move(720,400);p.mouse.wheel(0,2000);p.wait_for_timeout(350)
  box=p.locator('#minimap').bounding_box();dims=p.evaluate('({w:HonroApp.engine.b.width,h:HonroApp.engine.b.height})');u=state();p.mouse.click(box['x']+box['width']*u['x']/dims['w'],box['y']+box['height']*(u['y']-180)/dims['h']);p.wait_for_timeout(500)
 def observe_warnings():
  targets=p.evaluate("HonroApp.engine.b.units.filter(u=>u.side===1&&!u.dead&&u.honroPilotCombat?.target&&!u.honroPilotCombat.target.seen).map(u=>u.honroPilotCombat.target)")
  if not targets:return
  box=p.locator('#minimap').bounding_box();dims=p.evaluate('({w:HonroApp.engine.b.width,h:HonroApp.engine.b.height})')
  for t in targets:
   p.mouse.click(box['x']+box['width']*t['x']/dims['w'],box['y']+box['height']*t['y']/dims['h']);p.wait_for_timeout(700)
  record('observed-warning-views')
 def hold(key,ms):p.keyboard.down(key);p.wait_for_timeout(ms);p.keyboard.up(key);p.wait_for_timeout(500)
 def support_plan(onlyFacing=False):return p.evaluate("""onlyFacing=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,C=HONRO_CORE,s=C.SKILLS.O13,idx=u.loadout.indexOf('O13');if(u.id!=='occultist'||idx<0||e.cooldownLeft(u,'O13')||!e.canAfford(s,u,.3)||b.units.some(v=>v.summoned&&v.summonKind==='warden'&&!v.dead&&v.summonOwner===u.id))return null;const ally=b.units.filter(v=>v.side===0&&!v.dead&&!v.summoned&&v.hp<v.maxHp*.75&&Math.hypot(v.x-u.x,v.y-u.y)<700).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0];if(!ally)return null;const t={...ally,id:'support-plan',x:ally.x+(ally.x<u.x?70:-70),h:1,r:1};let best=null;for(const z of e.shotSeeds(u,s,t)){if(onlyFacing&&(Math.cos(z.angle*Math.PI/180)<0?-1:1)!==u.facing)continue;const h=e.predict(u,s,z.angle,z.power,t,false),distance=Math.hypot(h.x-t.x,h.y-t.y);if(distance<180&&(!best||distance<best.distance))best={id:'O13',idx,angle:z.angle,power:z.power,target:ally.id,support:true,distance};}return best;}""",onlyFacing)
 def plan(onlyFacing=False):return p.evaluate('''onlyFacing=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,C=HONRO_CORE,sc=a.scene,rect=sc.canvas.getBoundingClientRect(),lo=sc.world(0,0),hi=sc.world(rect.width,rect.height);const allies=b.units.filter(v=>v.side===0&&!v.dead&&v.id!==u.id);const visible=b.units.filter(v=>v.side===1&&!v.dead&&v.x>=Math.min(lo.x,hi.x)&&v.x<=Math.max(lo.x,hi.x)&&v.y>=Math.min(lo.y,hi.y)&&v.y-v.h<=Math.max(lo.y,hi.y));const support=e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id,local=visible.filter(v=>e.contactSurface(v.x,v.y-4,v.y+5)?.t?.id===support&&Math.abs(v.y-u.y)<650);const preferred=local.length?local:visible.filter(v=>Math.abs(v.y-u.y)<=500);let best=null;
const impactValue=(skill,hit)=>{const eff=e.effective(skill,u),r=Math.max(1,eff.radius||0);let value=0;for(const v of visible){const direct=hit.unit===v.id,d=e.damageDistance(v,hit);if(!direct&&d>=r+v.r)continue;let armor=Math.max(0,v.armor-(v.curseArmor||0));if(v.role==='guard')armor=(u.x-v.x)*v.facing>0?.4:.05;const factor=direct?1:.42+.58*(1-Math.max(0,Math.min(1,d/r))),existence=C.existenceMultiplier(C.attackForSkill(skill),v,u);value+=Math.min(v.hp+(v.shield||0),eff.damage*factor*(1-Math.min(.7,armor))*existence);}return value;};const intersects=(a,z,u)=>{const bounds=[u.x-u.r-18,u.x+u.r+18,u.y-u.h-18,u.y+18];let lo=0,hi=1;for(const [v,d,min,max] of [[a.x,z.x-a.x,bounds[0],bounds[1]],[a.y,z.y-a.y,bounds[2],bounds[3]]]){if(Math.abs(d)<1e-9){if(v<min||v>max)return false;continue}let t0=(min-v)/d,t1=(max-v)/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return false}return true};for(const t of preferred.filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<=1500).sort((x,y)=>Math.hypot(x.x-u.x,x.y-u.y)-Math.hypot(y.x-u.x,y.y-u.y))){if(Math.hypot(t.x-u.x,t.y-u.y)>1500)continue;for(let idx=0;idx<u.loadout.length;idx++){const id=u.loadout[idx],s=C.SKILLS[id];if(!s||s.passive||['O13','S08','S06'].includes(id)||!e.skillAllowed(s,u)||e.cooldownLeft(u,id)>0||!e.canAfford(s,u,.65)||s.mode==='charge'||id==='S00'&&Math.hypot(t.x-u.x,t.y-u.y)>160)continue;for(const z of e.shotSeeds(u,s,t)){if(onlyFacing&&(Math.cos(z.angle*Math.PI/180)<0?-1:1)!==u.facing)continue;const h=e.predict(u,s,z.angle,z.power,t,false),safe=C.shotViable(e,u,s,t,z.angle,z.power);if(!safe.ok||safe.risk>=.5)continue;const points=e.predict(u,s,z.angle,z.power,t,true).points||[];if(allies.some(v=>points.slice(1).some((q,i)=>intersects(points[i],q,v))))continue;const r=e.effective(s,u).radius||0,dist=Math.hypot(h.x-t.x,h.y-(t.y-t.h*.52));const score=(h.unit===t.id?300:r>0&&dist<r?200:0)+impactValue(s,safe.hit)+(t.hp<e.effective(s,u).damage*C.existenceMultiplier(C.attackForSkill(s),t,u)?150:0);if(score>150&&(!best||score>best.score))best={id,idx,angle:z.angle,power:z.power,target:t.id,score};}}}return {best,visible:visible.map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp})),observed:b.units.filter(v=>v.side===1&&v.x>=Math.min(lo.x,hi.x)&&v.x<=Math.max(lo.x,hi.x)&&v.y>=Math.min(lo.y,hi.y)&&v.y-v.h<=Math.max(lo.y,hi.y)).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead}))}}''',onlyFacing)
 try:
  p.goto(os.environ['HONRO_CAPTURE_URL'],wait_until='domcontentloaded');p.wait_for_function('window.HonroApp')
  p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str(source.resolve()))
  p.wait_for_function('HonroApp.profile?.cleared?.[31]?.visits>0',timeout=120000)
  p.reload();p.wait_for_function('window.HonroApp')
  p.locator('.title-actions button.primary').first.click()
  p.wait_for_function('HonroApp.engine?.b?.honroStage===32&&HonroApp.engine.b.round===1',timeout=120000)
  ready();initial=record('entry');assert len(initial['foes'])==12 and len(initial['health'])==4
  p.wait_for_timeout(3000);view();p.wait_for_timeout(800)
  p.screenshot(path=str(out/'initial.jpg'),type='jpeg',quality=88)
  started=time.monotonic()
  first_actor_round=set()
  for n in range(140):
   if time.monotonic()-started>2400:raise TimeoutError('opening observation budget')
   ready();s=state()
   if not s['foes']:break
   if s['round']>24 or s['phase'] in ['won','lost']:break
   if any(h['dead'] for h in s['residents']):break
   if s['round'] not in first_actor_round:
    first_actor_round.add(s['round']);front=next((h for h in s['health'] if h['id']=='knight' and not h['dead'] and not h['acted']),None)
    if front:p.locator('[data-action="select-hero"][data-id="knight"]').click();p.wait_for_timeout(250);ready();s=state()
   observe_warnings();view();pl=plan();record('plan',pl)
   for _ in range(20):
    if pl['best']:break
    s=state()
    if s['move']<120:break
    foes=pl['visible'] or s['foes'];x=s['x']
    if not foes:break
    t=min(foes,key=lambda v:abs(v['x']-x)+abs(v['y']-s['y']))
    if t['y']>s['y']+160 and abs(t['x']-x)<360 and s['canDrop']:
     p.keyboard.press('Alt');p.wait_for_timeout(1500);ready();record('supported-lower-lane');view();pl=plan();continue
    goal=t['x']-(130 if s['active']=='knight' else 220) if t['x']>x else t['x']+180
    if abs(goal-x)<35:break
    direction='ArrowRight' if goal>x else 'ArrowLeft'
    before=s;hold(direction,min(450,max(25,abs(goal-s['x'])/420*1000)));ready();after=state();record('move',{'target':t['id'],'direction':direction})
    if after['active']!=before['active']:break
    if abs(after['x']-before['x'])<15 and after['move']>120:
     p.keyboard.press('Control');hold(direction,300);ready();record('jump-route')
    view();pl=plan()
   choice=support_plan() or pl['best'];s=state()
   guard=p.evaluate("()=>{const e=HonroApp.engine,u=e.active,s=HONRO_CORE.SKILLS.S08;return u.id==='knight'&&u.loadout.includes('S08')&&!e.cooldownLeft(u,'S08')&&e.canAfford(s,u,.2)&&u.hp<u.maxHp*.75&&e.b.units.some(v=>v.side===1&&!v.dead&&Math.hypot(v.x-u.x,v.y-u.y)<550)?u.loadout.indexOf('S08'):-1}")
   if guard>=0:
    p.keyboard.press('Digit'+str(guard+1));p.keyboard.down('Space');p.wait_for_timeout(180);p.keyboard.up('Space');p.wait_for_timeout(1800);ready();record('frontline-guard');continue
   if choice:
    desired=-1 if math.cos(math.radians(choice['angle']))<0 else 1
    if s['facing']!=desired:
     supporting=choice.get('support',False);hold('ArrowLeft' if desired<0 else 'ArrowRight',80);ready();view();choice=support_plan(True) if supporting else plan(True)['best']
   if not choice:p.keyboard.press('f');p.wait_for_timeout(1600);record('defend-no-safe-shot');continue
   p.keyboard.press('Digit'+str(choice['idx']+1));p.wait_for_timeout(150)
   for _ in range(18):
    s=state();delta=choice['angle']-s['angle']
    if abs(delta)<1.7:break
    hold('ArrowUp' if delta*s['facing']>0 else 'ArrowDown',min(200,max(25,abs(delta)/62*1000)))
   s=state()
   if abs(s['angle']-choice['angle'])>2.5:record('aim-not-aligned',choice);continue
   actor=s['active'];p.keyboard.down('Space')
   try:p.wait_for_function('target=>HonroApp.charging&&HonroApp.chargePower(performance.now())>=target',arg=max(0,choice['power']-.02),timeout=8000,polling=16)
   finally:p.keyboard.up('Space')
   p.wait_for_timeout(150);actual=p.evaluate('(id)=>HonroApp.engine.b.lastShots?.[id]',actor);record('launch',{'choice':choice,'actual':actual});p.wait_for_timeout(1800);ready();record('after-shot')
  final=record('opening-end');stored=p.evaluate("localStorage.getItem('honro-first-act-profile-1')");(out/'opening-storage.json.xz').write_bytes(lzma.compress(stored.encode()));result['storedOpeningSha256']=hashlib.sha256(stored.encode()).hexdigest();p.screenshot(path=str(out/'opening-end.jpg'),type='jpeg',quality=88);result.update(final=final,referenceTargetMet=False,combatCleared=not final['foes'],passed=not final['foes'] and final['round']<=20)
  assert not result['errors'];assert result['passed'],{'combat':final,'returnNotAttempted':'combat failed or exceeded20 rounds; not an escort failure'}
  result['scope']='Actual31 completed profile, normal32 combat and reunion/exit inputs; functional diagnostic only'
  def pan_point(x,y):
   box=p.locator('#minimap').bounding_box();dims=p.evaluate('({w:HonroApp.engine.b.width,h:HonroApp.engine.b.height})');p.mouse.click(box['x']+box['width']*x/dims['w'],box['y']+box['height']*y/dims['h']);p.wait_for_timeout(1000);ready()
  cfg=p.evaluate('HonroApp.engine.b.honroAct4Design');dest=cfg['exit']['x']-120
  for id in ['archer','knight','mage','occultist']:
   for step in range(70):
    ready();s=state();hero=next(h for h in s['health'] if h['id']==id)
    assert not hero['dead'] and s['round']<=20,s
    if hero['x']>cfg['exit']['x']-230:break
    if s['active']!=id:p.locator('[data-action="select-hero"][data-id="'+id+'"]').click();p.wait_for_timeout(250)
    s=state();direction='ArrowRight' if dest>s['x'] else 'ArrowLeft';before=s
    hold(direction,min(400,max(25,abs(dest-s['x'])/420*1000)));ready();after=record('reunion-route-'+id)
    if after['active']==id and abs(after['x']-before['x'])<12 and after['move']>120:p.keyboard.press('Control');hold(direction,220);ready()
    if id=='archer' and after['x']>cfg['coords']['shelterX']-600:pan_point(cfg['coords']['shelterX']-100,cfg['coords']['speakerY']-100)
   else:raise TimeoutError('Reunion route stalled for '+id)
  for _ in range(35):
   pan_point(cfg['coords']['shelterX']-100,cfg['coords']['speakerY']-100)
   q=p.evaluate('HonroApp.engine.b.honroAct4PreviewState')
   if q.get('safeSeven') and q.get('events',{}).get('missing_four',{}).get('terminal'):break
  q=p.evaluate('HonroApp.engine.b.honroAct4PreviewState');assert len(q.get('safeSeven',{}).get('ids',[]))==7,q
  p.keyboard.press('e');p.wait_for_function("HonroApp.engine.b.phase==='won'",timeout=30000)
  result['final']=record('won');result['safeSeven']=q['safeSeven'];result['passed']=True;result['complete']=True
  p.wait_for_function('JSON.parse(localStorage.getItem("honro-first-act-profile-1")||"{}").cleared?.[32]?.visits>0',timeout=20000)
  stored=p.evaluate("localStorage.getItem('honro-first-act-profile-1')");(out/'completed-local-storage.json.xz').write_bytes(lzma.compress(stored.encode()));result['completedStoredSha256']=hashlib.sha256(stored.encode()).hexdigest();p.screenshot(path=str(out/'outcome.jpg'),type='jpeg',quality=88)
 except Exception as e:
  result['passed']=False
  result['failure']=str(e);result['traceback']=traceback.format_exc()
  try:
   raw=p.evaluate("localStorage.getItem('honro-first-act-profile-1')");(out/'failure-storage.json.xz').write_bytes(lzma.compress(raw.encode()))
   record('failure');p.screenshot(path=str(out/'failure.jpg'),type='jpeg',quality=88)
  except Exception:pass
  raise
 finally:
  (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));browser.close()
