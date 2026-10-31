"""Stage 39 fresh 20-turn UI run. Exact entry fixture; no battle mutation.
Actual keyboard/mouse input only. Headless Chromium, not physical-device proof.
"""
import sys,json,threading,functools,hashlib,time,os
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'tests'));from browser_support import launch
out=root/os.environ.get('HONRO39_OUTPUT','_local/reports/stage39-fullplay-20-v2');out.mkdir(parents=True,exist_ok=False);resume=os.environ.get('HONRO39_STORAGE')
raw=(root/'_local/inputs/stage39-presentation/stage39.json').read_bytes();assert hashlib.sha256(raw).hexdigest()=='0bb8dd43bf33af941c88800c4e7e13bbf2c7d3dd924444c035c997daad8f5dcb';project=json.loads(raw)
fixture=(root/'art/act4-sharpness-followups/stage39-fullplay/entry-fixture-v2/profile.json').read_bytes();assert hashlib.sha256(fixture).hexdigest()=='fdb46cdffa936d57a73eb50c086d98ae7bba697f54eb25beb5819596a7aec123'
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)));threading.Thread(target=srv.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{srv.server_port}';result={'scope':'Fresh official 38-cleared entry fixture v2. UI navigation and combat are real; no claim of prior play. Headless Chromium.','candidateSha256':hashlib.sha256(raw).hexdigest(),'fixtureSha256':hashlib.sha256(fixture).hexdigest(),'errors':[],'httpErrors':[]}
with sync_playwright() as pw:
 browser=launch(pw);w=int(os.environ.get('HONRO39_WIDTH','1440'));h=int(os.environ.get('HONRO39_HEIGHT','900'));dpr=float(os.environ.get('HONRO39_DPR','1'));ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=dpr);page=ctx.new_page();page.on('pageerror',lambda e:result['errors'].append(str(e)));page.on('response',lambda r:result['httpErrors'].append({'status':r.status,'url':r.url}) if r.status>=400 else None)
 page.goto(base+'/HONRO.html');value=fixture.decode()
 if resume:
  prior=json.loads((root/resume).read_text());value=next(v['value'] for o in prior['origins'] for v in o['localStorage'] if v['name']=='honro-first-act-profile-1');result['resumeStorageSha256']=hashlib.sha256((root/resume).read_bytes()).hexdigest()
 page.evaluate("v=>localStorage.setItem('honro-first-act-profile-1',v)",value);page.reload();page.wait_for_function('window.HonroApp&&window.HONRO_PROJECT&&window.HONRO_AUTHORED_FAR',timeout=60000)
 page.evaluate("""async project=>{await HonroCampaignLoader.ensureStage(39);const all=HONRO_PROJECT;all.stages=all.stages.filter(s=>s.metadata.stageId!==39).concat(project.stages);const ids=new Set(project.library.map(x=>x.id));all.library=all.library.filter(x=>!ids.has(x.id)).concat(project.library);HONRO_AUTHORED_FAR.images.act4Estuary='/_local/inputs/stage32-sharp/act4-estuary.webp'}""",project)
 result['entry']=page.evaluate("""()=>{const p=HonroApp.profile,C=HONRO_CORE;HonroEquipment.validate(p.equipment);return{mapNode:p.mapNode,lastStage:p.lastStage,pending:p.honroJourney?.pendingDirect,next:HonroJourneyContent.next(p)?.stageId,heroes:p.recruited.map(id=>({id,level:C.levelOf(p.heroes[id]),earned:C.pointsEarned(p.heroes[id]),spent:C.pointsSpent(p.heroes[id],id),loadout:p.loadouts[id],equipment:p.equipment.equippedByClass[id]}))}}""")
 assert all(h['level']==25 and h['earned']==51 and h['spent']==51 for h in result['entry']['heroes'])
 if not resume:assert result['entry']['next']==39 and result['entry']['pending']==39
 page.get_by_text('이어서 걷기' if resume else '여정 이어가기',exact=True).click();page.wait_for_function('HonroApp.engine?.b?.honroStage===39',timeout=60000);page.wait_for_timeout(1000)
 page.evaluate("""()=>{let was=false,start=0;window.__tideQA=[];function tick(now){const n=document.getElementById('act4-banter'),v=!!n&&!n.hidden&&n.getClientRects().length>0&&n.textContent.includes('물이 올라옵니다');if(v&&!was){let r=n.getBoundingClientRect(),s=getComputedStyle(n);start=now;window.__tideQA.push({kind:'start',time:now,text:n.textContent,rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom},font:s.fontSize});}if(!v&&was)window.__tideQA.push({kind:'end',time:now,duration:(now-start)/1000});was=v;requestAnimationFrame(tick)}requestAnimationFrame(tick)}""")
 check=page.evaluate("""()=>({official:HonroApp.engine.b.honroAct4Official,custom:HonroApp.engine.b.honroCustom,reference:HONRO_ACT4_PILOT_COMBAT_REFERENCE?.version,mid:HonroApp.engine.b.units.filter(u=>u.honroPilotMidboss).map(u=>({id:u.id,equipped:HonroAct4PilotCombat.equipped(HonroApp.engine.b,u)}))})""");assert check['official']==1 and not check['custom'] and check['reference']==2 and len(check['mid'])==1 and check['mid'][0]['equipped'];result['pilot']=check
 page.add_script_tag(path=str(root/'tools/qa-stage39-observer/observer-v2.js'))
 policy=os.environ.get('HONRO39_POLICY','progress-first');assert policy in ('progress-first','threat-first')
 result['policy']=policy;result['policySha256']=hashlib.sha256(Path(__file__).read_bytes()).hexdigest();result['observerSha256']=hashlib.sha256((root/'tools/qa-stage39-observer/observer-v2.js').read_bytes()).hexdigest();result['manifestSha256']=hashlib.sha256((root/'web/manifest.json').read_bytes()).hexdigest()
 result['initialRng']=page.evaluate('HonroApp.engine.b.rng');page.evaluate("meta=>{window.__qa39=HonroQAObserver.install(HonroApp.engine,meta)}",{'policy':policy,'fixtureSha256':result['fixtureSha256'],'candidateSha256':result['candidateSha256'],'manifestSha256':result['manifestSha256'],'policySha256':result['policySha256']})
 events=(out/'events.jsonl').open('a',encoding='utf8');warnings=set();tide_attempted=False;turns=0;stopReason=None
 def state():
  return page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,q=b.honroAct4PreviewState||{};return{round:b.round,side:b.side,phase:b.phase,shot:b.shot,active:u?.id,cls:u?.cls,x:u?.x,y:u?.y,angle:u?.angle,facing:u?.facing,moveLeft:u?.moveLeft,grounded:u&&e.grounded(u),drop:u&&e.canDrop(),dropState:u?.platformDrop?.phase,jumping:u?.jumping,retreat:!!u?.retreat,support:u&&e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id,can:a.canInput(),dialogue:!!a.dialogue,dialogueText:document.querySelector('#story-line')?.innerText,heroes:b.units.filter(v=>v.side===0&&!v.summoned).map(v=>({id:v.id,hp:v.hp,maxHp:v.maxHp,dead:v.dead,x:v.x,y:v.y,acted:v.acted})),residents:b.units.filter(v=>v.honroAct4Resident).map(v=>({id:v.id,hp:v.hp,dead:v.dead,x:v.x,y:v.y})),foes:b.units.filter(v=>v.side===1&&!v.dead).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp})),pilot:b.units.filter(v=>v.honroPilotMidboss).map(v=>({id:v.id,hp:v.hp,combat:v.honroPilotCombat})),water:q.water,tide:q.tide,artillery:q.artillery,observed:q.observed,netOpen:q.netOpen,exitStable:q.exitStable,rescued:q.rescued,failure:q.failure,complete:q.complete,screen:a.screen}}""")
 def record(kind,**extra):
  z={'kind':kind,'time':time.time(),'state':state(),**extra};events.write(json.dumps(z,ensure_ascii=False)+'\n');events.flush();print(json.dumps(z,ensure_ascii=False),flush=True);return z['state']
 def held(k,ms):
  page.keyboard.down(k)
  try:page.wait_for_timeout(int(ms))
  finally:page.keyboard.up(k)
 def settle():
  page.wait_for_timeout(350)
  for _ in range(45):
   s=state()
   if s['grounded'] and not s.get('dropState') and not s.get('jumping'):return True
   if s['dialogue'] or s['phase'] in ('won','lost') or s.get('failure'):return False
   page.wait_for_timeout(250)
  return False
 def tide_camera(s):
  global_unused=None
  # Use the normal wheel and minimap, never write observation or camera state.
  page.mouse.move(w*.5,h*.5);page.mouse.wheel(0,1700);page.wait_for_timeout(500)
  dims=page.evaluate("""height=>{let r=document.getElementById('minimap').getBoundingClientRect(),b=HonroApp.engine.b;return{x:r.left+r.width*3200/b.width,y:r.top+r.height*(height<500?3000:2450)/b.height}}""",h)
  page.mouse.click(dims['x'],dims['y']);page.wait_for_timeout(150)
  if not state()['dialogue']:
   try:
    page.wait_for_function("(()=>{const n=document.getElementById('act4-banter');return n&&!n.hidden&&n.textContent.includes('물이 올라옵니다')})()",timeout=6000,polling=100)
    start=time.monotonic();record('tide-bark-visible');page.screenshot(path=str(out/'tide-bark.png'))
    result['tideBarkLayout']=page.evaluate("""()=>{const n=document.getElementById('act4-banter'),r=n.getBoundingClientRect(),s=getComputedStyle(n);return{rect:{left:r.left,right:r.right,top:r.top,bottom:r.bottom},font:s.fontSize,obstacles:['#minimap-dock','#equipment-pending-battle','.battle-head','.battle-bottom'].map(q=>{let e=document.querySelector(q),b=e?.getBoundingClientRect();return{selector:q,visible:!!e&&!e.hidden&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden',rect:b&&{left:b.left,right:b.right,top:b.top,bottom:b.bottom}}})}}""")
    while time.monotonic()-start<12 and page.evaluate("(()=>{const n=document.getElementById('act4-banter');return !!n&&!n.hidden&&n.textContent.includes('물이 올라옵니다')})()"):page.wait_for_timeout(100)
    result['tideBarkVisibleSeconds']=time.monotonic()-start;record('tide-bark-ended',seconds=result['tideBarkVisibleSeconds'])
   except Exception as ex:result['tideBarkCaptureError']=str(ex)
  record('tide-camera-ui');page.screenshot(path=str(out/'tide-ui.png'))
 def ready():
  for _ in range(240):
   s=state()
   for w in s.get('pilot',[]):
    t=(w.get('combat') or {}).get('target') or {};key=('pilot',w['id'],t.get('round'))
    if t.get('seen') and key not in warnings:
     warnings.add(key);record('pilot-warning',warning=w);page.screenshot(path=str(out/f'pilot-warning-{len(warnings)}.png'))
   if s['phase'] in ('won','lost') or s.get('failure') or s.get('complete') or s['round']>20:return False
   if s['dialogue']:
    record('dialogue');page.screenshot(path=str(out/f'dialogue-{len(warnings)}-{int(time.time())}.png'));page.wait_for_timeout(1500);page.keyboard.press('Enter');page.wait_for_timeout(200)
   elif s['can'] and s['side']==0 and s['phase']=='aim' and s['grounded'] and not s.get('dropState') and not s.get('jumping'):return True
   else:page.wait_for_timeout(500)
  record('wait-timeout');return False
 # Read-only predicted direct attacks; actor movement, aiming and firing stay UI-driven.
 def plan():
  return page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,C=HONRO_CORE,protectedUnits=b.units.filter(v=>v!==u&&!v.dead&&v.hp>0&&(v.side===0||v.honroAct4Resident)),targets=b.units.filter(v=>v.side===1&&!v.dead&&v.id!=='a4-wreck'&&Math.abs(v.x-u.x)<850&&Math.abs(v.y-u.y)<500).sort((a,b)=>Math.abs(a.x-u.x)-Math.abs(b.x-u.x));let best=null;for(const t of targets.slice(0,3))for(let idx=0;idx<u.loadout.length;idx++){let id=u.loadout[idx],sk=C.SKILLS[id];if(!sk||sk.passive||!e.skillAllowed(sk,u)||e.cooldownLeft(u,id)>0||sk.mode==='charge'||['O13','S08'].includes(id))continue;for(const z of [...e.shotSeeds(u,sk,t),...[-30,0,15,30,50,70].flatMap(angle=>[.35,.55,.8,1].map(power=>({angle:t.x>=u.x?angle:180-angle,power})))] ){if(!e.canAfford(sk,u,z.power))continue;const v=C.shotViable(e,u,sk,t,z.angle,z.power),h=v.hit,r=e.effective(sk,u).radius||0;if(!v.ok||v.risk>0||!v.enemyDamage||h.unit!==t.id||protectedUnits.some(p=>Math.hypot(p.x-h.x,p.y-p.h*.5-h.y)<Math.max(120,r+90)))continue;if(protectedUnits.some(p=>(h.points||[]).some(q=>Math.abs(q.x-p.x)<p.r+12&&q.y>p.y-p.h-12&&q.y<p.y+12)))continue;let score=v.enemyDamage+(v.enemyDamage>=t.hp?500:0);if(!best||score>best.score)best={id,idx,target:t.id,angle:z.angle,power:z.power,score};}}return best}""")
 record('entry');page.screenshot(path=str(out/'entry.png'));stalls={};jumped={}
 for turn in range(1000):
  if not ready():
   s=record('stop');stopReason='won' if s['phase']=='won' else 'lost' if s['phase']=='lost' or s.get('failure') else '20-turn-limit' if s['round']>20 else 'wait-timeout';break
  if os.environ.get('HONRO39_STOP_AFTER_TIDE')=='1' and page.evaluate("(window.__tideQA||[]).some(x=>x.kind==='end')"):
   held('ArrowRight',180);page.wait_for_timeout(350);record('post-tide-ui-movement');stopReason='tide-observed';break
  s=record('turn-start',index=turn);ctx.storage_state(path=str(out/'browser-storage-live.json'))
  if not tide_attempted and s['round']>=2 and (s.get('tide') or {}).get('phase')=='rising':
   tide_camera(s);tide_attempted=not state()['dialogue'];continue
  if s.get('retreat'):
   page.keyboard.press('f');page.wait_for_timeout(500);record('finish-retreat');continue
  active=next((h for h in s['heroes'] if h['id']==s['active']),None)
  if active and active['hp']<active['maxHp']*.25:
   page.keyboard.press('f');page.wait_for_timeout(500);record('defend-low-health');continue
  if s.get('rescued') and all(h['dead'] or h['x']>4600 for h in s['heroes']):
   page.keyboard.press('e');page.wait_for_timeout(2400);record('exit-interact');page.screenshot(path=str(out/'exit.png'));continue
  target={'x':4050,'y':2317.5} if not s.get('netOpen') else {'x':4545,'y':2362.5} if not s.get('exitStable') else {'x':4680,'y':2360}
  radius=(340 if s['cls']=='occultist' else 180) if not s.get('netOpen') else (360 if s['cls']=='mage' else 180)
  if (not s.get('netOpen') or not s.get('exitStable')) and ((s['x']-target['x'])**2+(s['y']-target['y'])**2)**.5<radius-20:
   page.keyboard.press('e');page.wait_for_timeout(2300);record('objective-interact',target=target);page.screenshot(path=str(out/f'objective-{turn}.png'));continue
  support=s.get('support') or '';x=s['x'];route=False
  # Route geometry: west middle -> stone stair/gallery -> upper, then drop
  # through the open upper support around x3300 onto the wreck deck.
  if not (policy=='threat-first' and not s.get('rescued') and plan()) and x<4700 and (s.get('moveLeft') or 0)>120:
   if support=='approved39-west-middle' and x<300:
    held('ArrowRight',min(100,max(35,(315-x)*.9)));page.wait_for_timeout(150);after=record('advance-middle');route=True
   elif support=='approved39-west-middle' and x>330:
    held('ArrowLeft',min(150,max(45,(x-320)*.9)));page.wait_for_timeout(150);after=record('align-stair');route=True
   elif support=='approved39-west-middle' and 300<=x<=330:
    page.keyboard.press('Control');page.wait_for_timeout(100);page.keyboard.down('ArrowRight')
    try:page.wait_for_function('HonroApp.engine.active.x>=545',polling='raf',timeout=1200)
    finally:page.keyboard.up('ArrowRight')
    record('jump-in-flight');settle();after=record('jump-to-upper');route=True;jumped[s['active']]=jumped.get(s['active'],0)+1
    if after['support']=='approved39-west-middle':record('jump-missed-stop');stopReason='upper-jump-missed';break
   elif support=='approved39-west-deck' and 1800<=x<=2100:
    page.keyboard.down('ArrowRight');page.keyboard.press('Control');page.wait_for_timeout(180);record('deck-jump-in-flight');page.keyboard.up('ArrowRight');settle();after=record('deck-jump-to-wreck');route=True;jumped[s['active']]=jumped.get(s['active'],0)+1
   elif support=='approved39-upper' and 3150<=x<=3450 and s['drop']:
    page.keyboard.press('Alt');page.wait_for_timeout(700);settle();after=record('upper-drop');route=True
   else:
    held('ArrowRight',550);settle();after=record('advance-support');route=True
   if route:
    if after['active']!=s['active'] or after['round']!=s['round']:continue
    delta=after['x']-s['x'];aligning=support=='approved39-west-middle' and x>330
    progress=(abs(after['x']-320)<abs(x-320)-5) if aligning else delta>=15
    stalls[s['active']]=0 if progress else stalls.get(s['active'],0)+1
    if stalls[s['active']]>=3:
     record('route-stall',history=stalls[s['active']]);stopReason='route-stall';break
    continue
  # Progress first; only attack a local threat when movement is exhausted.
  choice=plan() if not s.get('rescued') else None
  if choice:
   if (choice['angle']>90)!=(s['facing']<0):held('ArrowLeft' if choice['angle']>90 else 'ArrowRight',70);page.wait_for_timeout(150);choice=plan()
   if choice:
    page.keyboard.press('Digit'+str(choice['idx']+1));page.wait_for_timeout(100)
    for _ in range(20):
     st=state();d=choice['angle']-st['angle']
     if abs(d)<1 or not st['can']:break
     held('ArrowUp' if d*st['facing']>0 else 'ArrowDown',min(200,max(20,abs(d)*1000/62)));page.wait_for_timeout(60)
    duration=page.evaluate("()=>HonroApp.engine.chargeDuration(HonroApp.engine.active,HONRO_CORE.SKILLS[HonroApp.selected])");page.keyboard.down('Space');page.wait_for_timeout(max(80,round(duration*choice['power']*1000)));actual=page.evaluate("()=>({angle:HonroApp.engine.active.angle,power:HonroApp.power})");page.keyboard.up('Space');record('fired',choice=choice,actual=actual);page.wait_for_timeout(2500);continue
  page.keyboard.press('f');page.wait_for_timeout(500);record('defend-or-end')
 else:stopReason='controller-iteration-limit'
 final=state();result['final']=final;result['stopReason']=stopReason;observer=page.evaluate("()=>({meta:__qa39.meta,rows:__qa39.rows,failures:__qa39.failures,finalRng:HonroApp.engine.b.rng})");(out/'observer.json').write_text(json.dumps(observer,ensure_ascii=False,separators=(',',':')));result['observerRows']=len(observer['rows']);result['observerBytes']=(out/'observer.json').stat().st_size;result['observerFailures']=observer['failures'];page.screenshot(path=str(out/'terminal.png'))
 result['naturalTideFrames']=page.evaluate('window.__tideQA||[]')
 if stopReason=='won':
  for _ in range(30):
   if not page.evaluate('()=>!!HonroApp.dialogue'):break
   page.wait_for_timeout(1200);page.keyboard.press('Enter')
  page.wait_for_timeout(2000);page.screenshot(path=str(out/'clear-ui.png'));ctx.storage_state(path=str(out/'victory-storage.json'));(out/'victory-profile.json').write_text(page.evaluate("()=>JSON.stringify(HonroApp.profile,null,2)")+'\n');result['beforeReload']=page.evaluate("()=>({done:HonroApp.done,cleared:HonroApp.profile.cleared?.[39],battle:!!HonroApp.profile.honroBattle})");page.reload();page.wait_for_function('window.HonroApp&&window.HONRO_PROJECT',timeout=60000);page.wait_for_timeout(1000);result['afterReload']=page.evaluate("()=>({screen:HonroApp.screen,cleared:HonroApp.profile.cleared?.[39],pending:HonroApp.profile.honroJourney?.pendingDirect})");page.screenshot(path=str(out/'same-context-reload.png'));page.get_by_text('여정 이어가기',exact=True).click(timeout=30000);page.wait_for_function('HonroApp.engine?.b?.honroStage===40',timeout=60000);page.wait_for_timeout(1000);result['afterContinue']=page.evaluate("()=>({screen:HonroApp.screen,stage:HonroApp.engine.b.honroStage,official:HonroApp.engine.b.honroAct4Official,proof:HonroAct4TerrainPreview.proofValid?.(HonroApp.engine.b)})");page.screenshot(path=str(out/'same-context-stage40.png'))
 ctx.storage_state(path=str(out/'browser-storage.json'));(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');events.close();ctx.close();browser.close()
srv.shutdown();srv.server_close()
