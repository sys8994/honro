"""Independent actual App flow from preserved QA profile, normal inputs only.
No current user storage; official terrain-migration entry before test, never retry failure.
Attack uses actual equipped-skill UI, joystick aim and Space charge/release; all physics,
turns, dialogue, missions and persistence run in the production App frame loop.
Not natural campaign chapters1-39 or human difficulty acceptance.
"""
import json,lzma,os,time,traceback,hashlib,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(root/'tools/act4-ci'))
from precise_aim import aim_with_joystick
out=Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=True)
assert os.environ.get('HONRO40_QA_ENTRY_APPROVED')=='1','Preserved QA profile entry must be explicitly scoped'
raw=lzma.decompress((root/'tools/act4-rc/fixtures/stage40-checkpoints/sailing-observation-local-storage.json.xz').read_bytes())
assert hashlib.sha256(raw).hexdigest()=='2c8e5d95e1e956059da5ae0b74a02641beed0bccf0932568194b108fec3a8141'
source=out/'source.json';source.write_bytes(raw)
result={'passed':False,'scope':__doc__,'sourceProfileSha256':hashlib.sha256(raw).hexdigest(),'placementSourceCommit':os.environ.get('HONRO40_PLACEMENT_SOURCE'),'checkout':os.environ.get('GITHUB_SHA'),'events':[],'errors':[]}
waypoints=[(1400,1527,'coast-west','', ['coast-west'],1500),(3300,2376,'coast-west','',['coast-west'],None),(5100,1807,'coast-east','',[],None),(5750,1400,'coast-east','',[],None),(5670,1270,'upper-east','jump',[],None),(4700,1126,'upper-east','',['upper-east'],None),(5750,1329,'upper-east','',[],None),(5730,1406,'coast-east','drop',[],None),(3660,2384,'coast-east','',['coast-east'],None),(3690,2465,'spur','drop',[],None),(4700,3120,'arrival-stair','',['arrival-stair'],None),(3840,2610,'arrival-stair','',[],None),(3740,2490,'spur','jump',[],None),(3640,2389,'coast-east','jump',[],None),(2660,2244,'coast-west','',[],None),(2660,2297,'dock-stair','drop',[],None),(2000,2680,'dock-stair','',['dock-stair'],None),(1800,2826,'dock','',[],None),(600,2716,'dock','',['dock'],None),(1600,2807,'dock','',[],None),(1600,2935,'departure-stair','drop',[],None),(2150,3575,'departure-stair','',[],None),(2175,3600,'departure-ramp','',['departure-stair','departure-ramp'],None)]
STATE='''()=>{const a=HonroApp,e=a.engine,b=e?.b;if(!b)return{screen:a.screen,dialogue:!!a.dialogue};const u=e.active,q=b.honroAct4PreviewState;return{stage:b.honroStage,round:b.round,phase:b.phase,side:b.side,active:b.active,can:a.canInput(),dialogue:!!a.dialogue,dialogueId:a.dialogue?.id,x:u?.x,y:u?.y,move:u?.moveLeft,moveLeft:u?.moveLeft,facing:u?.facing,angle:u?.angle,shots:b.shot,health:b.units.filter(v=>v.side===0).map(v=>[v.id,v.hp,!!v.dead]),enemyUnits:b.units.filter(v=>v.side===1).map(v=>[v.id,v.hp,!!v.dead]),enemyHpSum:b.units.filter(v=>v.side===1).reduce((a,v)=>a+Math.max(0,v.hp),0),grounded:u&&e.grounded(u),support:u&&e.contactSurface(u.x,u.y-8,u.y+12)?.t.id,shot:b.shot,heroes:b.units.filter(v=>v.side===0&&!v.summoned&&!v.honroAct4Resident).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,maxHp:v.maxHp,dead:v.dead,acted:v.acted,loadout:v.loadout})),residents:b.units.filter(v=>v.honroAct4Resident).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead})),foes:b.units.filter(v=>v.side===1&&v.hp>0&&!v.dead).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,support:v.honroEncounterSupport})),events:q?.events,receipts:q?.receipts,escort:q?.returnEscort,complete:q?.complete,failure:q?.failure,proof:HonroAct4TerrainPreview.proofValid(b),quietReady:HonroAct4TerrainPreview.quietReady(b),storedRound:a.profile.honroBattle?.round,sceneIsActual:!!a.scene&&a.scene.canvas===document.querySelector('#battlecanvas')}}'''
PLAN='''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,C=HONRO_CORE;if(!a.canInput())return null;const targets=b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0&&Math.hypot(v.x-u.x,v.y-u.y)<1550).sort((x,y)=>Math.hypot(x.x-u.x,x.y-u.y)-Math.hypot(y.x-u.x,y.y-u.y));let best=null;for(const t of targets.slice(0,4))for(const id of u.loadout){const s=C.SKILLS[id];if(!s||s.passive||s.damage<=0||['O13','S08','S06'].includes(id)||!e.skillAllowed(s,u)||e.cooldownLeft(u,id)>0||e.manaCost(s,u)>u.focus)continue;for(const aim of e.shotSeeds(u,s,t)){const v=C.shotViable(e,u,s,t,aim.angle,aim.power);if(v.ok&&v.risk<.5&&v.enemyDamage>0&&(!best||v.net>best.score))best={id,idx:u.loadout.indexOf(id),angle:aim.angle,power:aim.power,target:t.id,score:v.net,actor:u.id,round:b.round};}}return best;}'''
DODGE='''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,C=HONRO_CORE;if(!a.canInput()||!e.grounded(u))return null;const alerts=b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0&&v.honroPilotCombat?.phase==='telegraph'&&v.honroPilotCombat.target?.seen===true).map(v=>({id:v.id,...v.honroPilotCombat.target})).filter(t=>Math.hypot(u.x-t.x,u.y-u.h*.5-t.y)<220);if(!alerts.length)return null;const support=e.contactSurface(u.x,u.y-8,u.y+12)?.t;if(!support)return{alerts,blocked:'no support'};const choices=[];for(const dx of [-300,-240,-180,180,240,300]){const x=u.x+dx;if(x<support.x+20||x>support.x+support.w-20)continue;let previous=u.y,ok=true,y=u.y;for(let i=1;i<=6;i++){const px=u.x+dx*i/6;y=C.topAt(support,px,previous);if(!Number.isFinite(y)||Math.abs(y-previous)>Math.abs(dx/6)*1.35+2){ok=false;break;}previous=y;}if(ok&&alerts.every(t=>Math.hypot(x-t.x,y-u.h*.5-t.y)>220))choices.push({x,y,support:support.id,cost:Math.abs(dx)});}choices.sort((a,b)=>a.cost-b.cost);return{alerts,goal:choices[0]||null,blocked:choices.length?null:'no safe same-support walk'}}'''
with sync_playwright() as w:
 browser=w.chromium.launch(headless=True)
 context=browser.new_context(viewport={'width':1440,'height':900});p=context.new_page();p.on('pageerror',lambda e:result['errors'].append(str(e)))
 def state():return p.evaluate(STATE)
 def record(label,extra=None):
  s=state();result['events'].append({'step':label,'state':s,'extra':extra});(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(label,s.get('round'),s.get('active'),len(s.get('foes',[])),flush=True);return s
 def ready():
  for _ in range(160):
   s=state()
   if s.get('dialogue'):
    button=p.locator('[data-action="dialogue-next"]').first
    p.wait_for_timeout(850)
    if button.count() and button.is_enabled():button.click()
    else:p.keyboard.press('Enter')
    continue
   if s.get('phase') in ['won','lost']:return False
   if s.get('can') and s.get('side')==0 and s.get('grounded'):return True
   p.wait_for_timeout(250)
  raise TimeoutError('App input/dialogue blocked; no bypass attempted')
 def hold(key,ms):
  p.keyboard.down(key)
  try:p.wait_for_timeout(ms)
  finally:p.keyboard.up(key)
  p.wait_for_timeout(100)
 def snapshot(label):
  stored=p.evaluate("localStorage.getItem('honro-first-act-profile-1')")
  if stored:(out/(label+'-storage.json.xz')).write_bytes(lzma.compress(stored.encode()))
  p.screenshot(path=str(out/(label+'.jpg')),type='jpeg',quality=86)
 try:
  p.goto(os.environ['HONRO_CAPTURE_URL'],wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=120000)
  result['emptyContextStorage']=p.evaluate("Object.keys(localStorage)")
  p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click();p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click();p.locator('#file-import').set_input_files(str(source.resolve()))
  p.wait_for_function('HonroApp.profile?.honroMapRestart===40',timeout=120000)
  live=p.evaluate('''()=>({heroes:HonroApp.profile.heroes,proof:HonroApp.profile.honroAct4,runId:HonroApp.profile.equipment.runId,lastStage:HonroApp.profile.lastStage,restart:HonroApp.profile.honroMapRestart,battle:HonroApp.profile.honroBattle})''')
  original=json.loads(raw);assert live['heroes']==original['heroes']
  for key in ['safeSeven','rescued']:assert live['proof'][key]==original['honroAct4'][key]
  assert live['runId']==original['equipment']['runId'] and live['restart']==40 and live['battle'] is None
  result['migration']={'lastStage':live['lastStage'],'restart':live['restart'],'battleClearedByProduct':live['battle'] is None,'growthUnchanged':True,'priorProofUnchanged':True,'runIdUnchanged':True}
  result['entryRoute']='Observed official terrain migration: new-terrain entry button, no battle reset'
  p.get_by_text('새 지형에서 다시 걷기',exact=True).click()
  p.wait_for_function('HonroApp.engine?.b?.honroStage===40&&HonroApp.engine.b.round===1',timeout=120000);ready()
  initial=record('fresh-entry');assert initial['proof'] and len(initial['foes'])==42 and initial['sceneIsActual'],initial
  result['sourceCheckpoint40']={k:json.loads(raw)['honroBattle'].get('honroAct4PreviewState',{}).get(k) for k in ['events','receipts','returnEscort','complete']};result['initial']=initial;initial_by_id={u['id']:u for u in initial['foes']};route={u['id']:0 for u in initial['heroes']};snapshot('initial');started=time.monotonic();last_round=0;progress_watch={};turn_starts={}
  for n in range(1200):
   if time.monotonic()-started>2200:raise TimeoutError('normal App combat observation budget')
   if not ready():raise AssertionError('App ended before confirmed enemy clear: '+str(state()))
   s=state()
   if not s['foes']:break
   assert s['round']<=120 and not s['failure'] and all(v['hp']>0 and not v['dead'] for v in s['residents']),s
   if s['round']!=last_round:last_round=s['round'];record('round');snapshot('round-'+str(last_round))
   usable=[u for u in s['heroes'] if u['hp']>0 and not u['dead'] and not u['acted']]
   if usable:
    choice=min(usable,key=lambda u:(route[u['id']],u['x']))
    if choice['id']!=s['active']:p.locator('[data-action="select-hero"][data-id="'+choice['id']+'"]').click();p.wait_for_timeout(120);ready();s=state()
   current=next(u for u in s['heroes'] if u['id']==s['active'])
   turn_start=turn_starts.setdefault((s['round'],s['active']),{'move':s['move'],'x':s['x'],'y':s['y']})
   dodge=p.evaluate(DODGE)
   if dodge:
    record('observed-warning',dodge)
    goal=dodge.get('goal')
    if goal:
     for _ in range(12):
      before=state()
      if before['active']!=current['id'] or not before['can'] or before['move']<30 or abs(before['x']-goal['x'])<20:break
      hold('ArrowRight' if goal['x']>before['x'] else 'ArrowLeft',120)
     ready();s=record('warning-ui-move',dodge)
    else:
     p.keyboard.press('f');record('warning-blocked-normal-defense');p.wait_for_timeout(300);continue
   # Wounded heroes first rejoin the route, never stay indefinitely defending.
   wounded=current['hp']/current['maxHp']<.5
   moved=max(0,turn_start['move']-s['move'])
   if wounded and (moved>=220 or s['move']<110):
    p.keyboard.press('f');record('normal-defend-after-movement',{'movementUsed':moved});p.wait_for_timeout(300);continue
   plan=p.evaluate(PLAN)
   if plan:
    desired=-1 if plan['angle']>90 else 1
    if s['facing']!=desired:
     hold('ArrowLeft' if desired<0 else 'ArrowRight',60);ready();record('face-for-aim')
     continue
    p.keyboard.press('Digit'+str(plan['idx']+1));p.wait_for_timeout(100)
    if p.evaluate('HonroApp.selected')!=plan['id']:record('skill-selection-not-accepted',plan);continue
    aimed=aim_with_joystick(p,plan['angle'],state)
    record('pointer-aim',{'plan':plan,'passed':aimed['passed'],'actual':aimed.get('actual'),'contextChanges':aimed.get('contextChanges'),'released':aimed.get('released')})
    if not aimed['passed']:continue
    before=state();p.keyboard.down('Space')
    try:
     p.wait_for_timeout(100)
     if p.evaluate('HonroApp.charging'):
      p.wait_for_function('target=>!HonroApp.charging||HonroApp.chargePower(performance.now())>=target',arg=max(.13,plan['power']-.01),timeout=8000,polling=16)
    finally:p.keyboard.up('Space')
    p.wait_for_timeout(150)
    actual=p.evaluate('(id)=>HonroApp.engine.b.lastShots?.[id]',before['active'])
    record('space-charge-release',{'plan':plan,'actual':actual,'beforeShot':before['shot']})
    p.wait_for_timeout(250);continue
   index=route[s['active']]
   if index>=len(waypoints):record('route-ended-with-living-enemies');raise AssertionError('route policy left enemies; no forced clear')
   x,y,support,op,gates,max_x=waypoints[index];support='approved40-'+support
   # Re-enter the documented east U connection after knockback/ordinary drops.
   # Never chase a different floor by x alone, and never force a rejected drop.
   route_recovery=False
   if support=='approved40-upper-east' and s['support'] in ['approved40-coast-west','approved40-coast-east']:
    x,y,op=(5750,1400,'') if s['x']<5700 else (5670,1270,'jump')
    route_recovery=True
   elif support=='approved40-coast-east' and s['support']=='approved40-upper-east':
    x,y,op=5820,1384,'';route_recovery=True
   if route_recovery:record('support-reapproach',{'index':index,'actualSupport':s['support'],'expectedSupport':support,'goal':[x,y],'operation':op})
   # Observation-only watchdog. Meaningful distance, HP, route or story progress
   # resets the budget. No game time, turn or actor state is changed.
   key=(s['active'],index,s['support'],route_recovery)
   distance=abs(s['x']-x)+abs(s['y']-y)
   health=tuple(round(u['hp'],1) for u in s['heroes'])
   signature=(s['enemyHpSum'],health,str(s.get('events')),str(s.get('escort')))
   watch=progress_watch.get(key)
   if not watch or watch['signature']!=signature or distance<watch['distance']-12:
    progress_watch[key]={'signature':signature,'distance':distance,'inputs':0}
   else:
    watch['inputs']+=1
    if watch['inputs']>=30:
     record('controller-stall',{'index':index,'actualSupport':s['support'],'expectedSupport':support,'goal':[x,y],'distance':distance})
     raise TimeoutError('controller: no route/health/story progress in 30 repeated inputs')
   at=abs(s['x']-x)<45 and abs(s['y']-y)<55 and s['support']==support
   pending=[u for u in s['foes'] if initial_by_id[u['id']]['support'] in ['approved40-'+g for g in gates] and (max_x is None or initial_by_id[u['id']]['x']<max_x)]
   if at and not pending and not route_recovery:record('waypoint',{'index':index,'actual':[s['x'],s['y']],'support':s['support']});route[s['active']]+=1;continue
   if at and pending and not route_recovery:t=min(pending,key=lambda u:abs(u['x']-s['x'])+abs(u['y']-s['y']));x,y=t['x'],t['y'];op='';record('clear-gate',{'index':index,'target':t['id']})
   if s['move']<110:p.keyboard.press('f');record('wait');p.wait_for_timeout(300);continue
   if op=='drop' and s['support']!=support and abs(s['x']-x)<50:p.keyboard.press('AltLeft');record('drop',{'index':index});p.wait_for_timeout(450);continue
   if op=='jump' and s['support']!=support:p.keyboard.press('Control');record('jump',{'index':index})
   before=s;key='ArrowRight' if x>s['x'] else 'ArrowLeft';hold(key,min(380,max(65,abs(x-s['x'])/500*1000)));ready();s=record('walk',{'index':index,'key':key,'from':[before['x'],before['y']]})
   if s['active']==before['active'] and abs(s['x']-before['x'])<8 and s['move']>140:p.keyboard.press('Control');hold(key,260);record('jump-recovery',{'index':index})
  final=record('combat-loop-end');assert not final['foes'],'input budget ended with living enemies; not a game clear';record('all-enemies-cleared');snapshot('combat-end')
  result['pilotHistory']=p.evaluate('''()=>HonroApp.engine.b.units.filter(u=>u.honroPilotCombat).map(u=>({id:u.id,hp:u.hp,dead:!!u.dead,combat:u.honroPilotCombat}))''')
  result['combat']={'round':final['round'],'heroes':final['heroes'],'residents':final['residents'],'route':route}
  # Existing real App escort inputs; no direct state completion.
  from escort_inputs import finish_escort
  result['escort']=finish_escort(p,out);assert not result['errors'];result['passed']=True
 except Exception as e:
  result['failure']=str(e);result['traceback']=traceback.format_exc()
  try:record('failure');snapshot('failure')
  except Exception:pass
  raise
 finally:
  (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));context.close();browser.close()

