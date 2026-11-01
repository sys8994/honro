"""Actual UI restart opening audit. Existing stats/terrain; no balance edits.
Declared preserved campaign profile. Revised42-enemy diagnostic, not cohort acceptance.
"""
import json,lzma,os,time,traceback,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[3];out=Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=True)
raw=lzma.decompress((root/'tools/act4-rc/fixtures/stage40-checkpoints/sailing-observation-local-storage.json.xz').read_bytes());assert hashlib.sha256(raw).hexdigest()=='2c8e5d95e1e956059da5ae0b74a02641beed0bccf0932568194b108fec3a8141'
source=out/'source.json';source.write_bytes(raw);result={'passed':False,'scope':'normal UI migration/restart from preserved Stage40 campaign profile;42-enemy diagnostic','releaseApproved':False,'sourceCommit':os.environ.get('GITHUB_SHA'),'events':[],'errors':[]}
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True);p=browser.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:result['errors'].append(str(e)))
 def state():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active;return{round:b.round,active:u?.id,phase:b.phase,side:b.side,can:a.canInput(),dialogue:!!a.dialogue,x:u?.x,y:u?.y,facing:u?.facing,angle:u?.angle,move:u?.moveLeft,grounded:u&&e.grounded(u),support:u&&e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id,canDrop:e.canDrop(),tide:b.honroAct4PreviewState?.tide,finale:b.honroFinalDefenseRevision,major:b.units.filter(v=>v.side===1&&v.boss).length,minis:b.units.filter(v=>v.side===1&&v.honroMidboss).length,bossState:b.units.find(v=>v.honroAct4FinaleBoss)?.honroPilotCombat,shots:b.shots,shotSerial:b.shot,health:b.units.filter(v=>v.side===0&&!v.summoned&&!v.honroAct4Resident).map(v=>({id:v.id,hp:v.hp,maxHp:v.maxHp,x:v.x,y:v.y,dead:v.dead,acted:v.acted})),residents:b.units.filter(v=>v.honroAct4Resident).map(v=>({id:v.id,hp:v.hp,dead:v.dead})),foes:b.units.filter(v=>v.side===1&&!v.dead).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,maxHp:v.maxHp,support:v.honroEncounterSupport})),proof:HonroAct4TerrainPreview.proofValid(b)}}''')
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
 def plan(onlyFacing=False):return p.evaluate('''onlyFacing=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,C=HONRO_CORE,sc=a.scene,rect=sc.canvas.getBoundingClientRect(),lo=sc.world(0,0),hi=sc.world(rect.width,rect.height);const allies=b.units.filter(v=>v.side===0&&!v.dead&&v.id!==u.id);const visible=b.units.filter(v=>v.side===1&&!v.dead&&v.x>=Math.min(lo.x,hi.x)&&v.x<=Math.max(lo.x,hi.x)&&v.y>=Math.min(lo.y,hi.y)&&v.y-v.h<=Math.max(lo.y,hi.y));const support=e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id,local=visible.filter(v=>e.contactSurface(v.x,v.y-4,v.y+5)?.t?.id===support&&Math.abs(v.y-u.y)<650);const preferred=local.length?local:visible;let best=null;const intersects=(a,z,u)=>{const bounds=[u.x-u.r-18,u.x+u.r+18,u.y-u.h-18,u.y+18];let lo=0,hi=1;for(const [v,d,min,max] of [[a.x,z.x-a.x,bounds[0],bounds[1]],[a.y,z.y-a.y,bounds[2],bounds[3]]]){if(Math.abs(d)<1e-9){if(v<min||v>max)return false;continue}let t0=(min-v)/d,t1=(max-v)/d;if(t0>t1)[t0,t1]=[t1,t0];lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(lo>hi)return false}return true};for(const t of preferred.filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<=1500).sort((x,y)=>Math.hypot(x.x-u.x,x.y-u.y)-Math.hypot(y.x-u.x,y.y-u.y))){if(Math.hypot(t.x-u.x,t.y-u.y)>1500)continue;for(let idx=0;idx<u.loadout.length;idx++){const id=u.loadout[idx],s=C.SKILLS[id];if(!s||s.passive||['O13','S08','S06'].includes(id)||!e.skillAllowed(s,u)||e.cooldownLeft(u,id)>0||!e.canAfford(s,u,.65)||s.mode==='charge'||id==='S00'&&Math.hypot(t.x-u.x,t.y-u.y)>160)continue;for(const z of e.shotSeeds(u,s,t)){if(onlyFacing&&(z.angle>90?-1:1)!==u.facing)continue;const h=e.predict(u,s,z.angle,z.power,t,false),safe=C.shotViable(e,u,s,t,z.angle,z.power);if(!safe.ok||safe.risk>=.5)continue;const points=e.predict(u,s,z.angle,z.power,t,true).points||[];if(allies.some(v=>points.slice(1).some((q,i)=>intersects(points[i],q,v))))continue;const r=e.effective(s,u).radius||0,dist=Math.hypot(h.x-t.x,h.y-(t.y-t.h*.52));const score=(h.unit===t.id?300:r>0&&dist<r?200:0)+(safe.enemyDamage||0)+(t.hp<e.effective(s,u).damage?150:0);if(score>150&&(!best||score>best.score))best={id,idx,angle:z.angle,power:z.power,target:t.id,score};}}}return {best,visible:visible.map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp})),observed:b.units.filter(v=>v.side===1&&v.x>=Math.min(lo.x,hi.x)&&v.x<=Math.max(lo.x,hi.x)&&v.y>=Math.min(lo.y,hi.y)&&v.y-v.h<=Math.max(lo.y,hi.y)).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead}))}}''',onlyFacing)
 try:
  p.goto(os.environ['HONRO_CAPTURE_URL'],wait_until='domcontentloaded');p.wait_for_function('window.HonroApp')
  p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str(source.resolve()))
  p.wait_for_function('HonroApp.profile?.lastStage===40',timeout=120000)
  p.reload();p.wait_for_function('window.HonroApp')
  p.locator('.title-actions [data-action="continue"]').first.click()
  p.wait_for_function('HonroApp.engine?.b?.honroStage===40&&HonroApp.engine.b.round===1',timeout=120000)
  ready();initial=record('entry');assert initial['proof'] and len(initial['foes'])==42 and initial['major']==1 and initial['minis']==2 and initial['finale']==2 and len(initial['health'])==4
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
    foes=s['foes'];support=s.get('support','');x=s['x']
    # Preserve actual supported route; no live coordinate or state changes.
    if support=='approved40-coast-west':
     if abs(x-2660)<40 and s['canDrop']:
      p.keyboard.press('Alt');p.wait_for_timeout(1600);ready();record('descend-dock-stair');view();pl=plan();continue
     blockers=[v for v in foes if v.get('support')=='approved40-coast-west' and v['x']>=x-120 and abs(v['y']-s['y'])<700]
     goal=min(2660,min(v['x'] for v in blockers)-(130 if s['active']=='knight' else 300)) if blockers else 2660
    elif support=='approved40-dock-stair':goal=1800
    elif support=='approved40-dock':
     dockfoes=[v for v in foes if v.get('support')=='approved40-dock']
     if dockfoes:goal=1200 if any(v['x']<900 for v in dockfoes) else 1700
     elif abs(x-1600)<40 and s['canDrop']:
      p.keyboard.press('Alt');p.wait_for_timeout(1600);ready();record('descend-departure');view();pl=plan();continue
     else:goal=1600
    elif support in ['approved40-departure-stair','approved40-departure-ramp']:
     goal=1850 if s.get('tide',{}).get('phase')=='high' else 1970
    else:
     targets=pl['visible'] or foes
     if not targets:break
     goal=min(targets,key=lambda v:abs(v['x']-x)+abs(v['y']-s['y']))['x']
    if abs(goal-x)<35:break
    t={'id':'supported-route'};direction='ArrowRight' if goal>x else 'ArrowLeft'
    before=s;hold(direction,min(450,max(25,abs(goal-s['x'])/420*1000)));ready();after=state();record('move',{'target':t['id'],'direction':direction})
    if after['active']!=before['active']:break
    if abs(after['x']-before['x'])<15 and after['move']>120:
     p.keyboard.press('Control');hold(direction,300);ready();record('jump-route')
    view();pl=plan()
   choice=pl['best'];s=state()
   guard=p.evaluate("()=>{const e=HonroApp.engine,u=e.active,s=HONRO_CORE.SKILLS.S08;return u.id==='knight'&&u.loadout.includes('S08')&&!e.cooldownLeft(u,'S08')&&e.canAfford(s,u,.2)&&u.hp<u.maxHp*.75&&e.b.units.some(v=>v.side===1&&!v.dead&&Math.hypot(v.x-u.x,v.y-u.y)<550)?u.loadout.indexOf('S08'):-1}")
   if guard>=0:
    p.keyboard.press('Digit'+str(guard+1));p.keyboard.down('Space');p.wait_for_timeout(180);p.keyboard.up('Space');p.wait_for_timeout(1800);ready();record('frontline-guard');continue
   if choice:
    desired=-1 if choice['angle']>90 else 1
    if s['facing']!=desired:hold('ArrowLeft' if desired<0 else 'ArrowRight',80);ready();view();choice=plan(True)['best']
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
  if os.environ.get('HONRO40_FINISH')=='1':
   from escort_inputs import finish_escort
   result['scope']='fresh combat from normal UI restart through full escort and original-context post-victory reload; preserved campaign entry profile'
   result['escortResult']=finish_escort(p,out)
   assert not result['errors']
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
