"""Road-support Stage23 browser battle, using only normal UI input.

Starts from an unchanged synthetic R1/shot0 save. Earlier chapters were a legal
reward-ledger fixture, not played. This is neither optimal play nor human fun approval.
"""
import hashlib
import json
import os
import time
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

# Required provenance must describe the normal-built candidate and its own fresh entry.
# No fallback to the original-product R1 save, localStorage injection or live writes.
def required(name):
    value=os.environ.get(name)
    if not value:raise ValueError('Missing required environment variable: '+name)
    return value

def digest(value,length=64):
    assert len(value)==length and all(c in '0123456789abcdef' for c in value),value
    return value

OUT=Path(os.environ.get('HONRO23_BROWSER_OUT','_local/reports/stage23-road-support-browser')); OUT.mkdir(parents=True,exist_ok=True)
SOURCE=Path(required('HONRO23_ENTRY_CHECKPOINT'))
SOURCE_HASH=digest(required('HONRO23_ENTRY_SHA256'))
PRODUCT=digest(required('HONRO23_PRODUCT_COMMIT'),40)
HTML_HASH=digest(required('HONRO23_HTML_SHA256'))
RUNTIME_HASH=digest(required('HONRO23_RUNTIME_SHA256'))
assert RUNTIME_HASH=='c92112f31e18bb386adbe130b7f485e6bf359cd0f69655152a265520a13c6861'
SOURCE_RUN=int(required('HONRO23_SOURCE_RUN'))
URL='http://127.0.0.1:8765/HONRO.html'
PLAN_PATH=Path('tools/stage23-qa/road-support-planner.js')
PLAN=PLAN_PATH.read_text()
R={'passed':False,'controllerCommit':os.environ.get('GITHUB_SHA'),'productCommit':PRODUCT,
   'scope':'One actual Chromium UI battle from the exact candidate fresh synthetic Stage23 R1/shot0 save through outcome and settlement. Stages1–22 were a legal reward-ledger fixture, not played. Road-follow-native policy port, not identical frame/aim execution or optimal human play. Native19 is a separate single sample, not browser/fun/release approval.',
   'sourceRun':SOURCE_RUN,'sourceSha256':SOURCE_HASH,'reviewedRuntimeSha256':RUNTIME_HASH,'expectedHtmlSha256':HTML_HASH,
   'controllerSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
   'plannerSha256':hashlib.sha256(PLAN_PATH.read_bytes()).hexdigest(),
   'policy':{'referenceController':'tests/stage23-road-follow-natural.mjs','referenceSha256':'d66b2bc004056df322f7286f134c07da6fcf38423d461429abee10d2691fa8ee',
      'objectiveTargets':True,'escortFirst':True,'escortLead':190,'escortDropHeight':60,'combatDropHeight':160,
      'hop':{'maxPerHeroRound':1,'maxHorizontalInput':280,'maxEngineTicks':480,'nearHorizontal':190,'upperHeight':[80,160]},
      'muzzleAdvance':False,'s04Scoring':'production','s04ManualDive':False,'rearIgnore':550,
      'visibility':'production-visible; target coordinates may be outside the current viewport',
      'meleeDifference':'Native representativeMelee scores all alive enemies; this UI port scores only production-visible collateral, preserving the visibility restriction.',
      'estimation':'Detached production predictors may simulate isolated clones. Independent predeclared RNG0x13579bdf and damageSequence seed0x2468ace0/index0 before Engine construction; not actual future rolls or mean damage.',
      'timing':'Real UI polling/charge/aim has measured quantization and cannot reproduce native frame-exact input. Tick/distance gates may overshoot by one observed UI pulse; actual deltas are logged, never corrected. No clock/state writes.'},
   'enemyObservations':[],'rounds':[],'actions':[],'dialogues':[],'errors':[],'enemyPhases':[],'screenshots':[],'planningChecks':0,'stateChecks':0}
START=time.monotonic(); mobile=False; page=None; last_dialogue=None; last_enemy=None; hop_attempts=set(); last_enemy_observation=None

STATE=r'''()=>{const a=HonroApp,e=a.engine,b=e?.b,u=e?.active,n=b?.units.find(t=>t.id==='act3-carrier'),d=a.dialogue;
const before=JSON.stringify(b),copy=b?JSON.parse(before):null;
// V.current may initialize objective memory, so never call it on the live battle.
const current=copy?HonroAct23V4.current(copy):null;
const unit=t=>({id:t.id,cls:t.cls,side:t.side,x:t.x,y:t.y,hp:t.hp,maxHp:t.maxHp,shield:t.shield,focus:t.focus,move:t.moveLeft,angle:t.angle,facing:t.facing,dead:!!t.dead,acted:t.acted,awake:t.awake,walkSpeed:t.walkSpeed,r:t.r,h:t.h,vx:t.vx,vy:t.vy,jumping:!!t.jumping,airborne:!!t.airborne,platformDrop:t.platformDrop?{phase:t.platformDrop.phase,originY:t.platformDrop.originY}:null,ground:e.grounded(t)});
const rect=id=>{const el=document.getElementById(id)||document.querySelector('.'+id);if(!el||el.hidden)return null;const q=el.getBoundingClientRect(),s=getComputedStyle(el);return q.width&&q.height&&s.display!=='none'&&s.visibility!=='hidden'?{left:q.left,right:q.right,top:q.top,bottom:q.bottom,text:el.innerText?.slice(0,350)}:null;};
const cv=a.scene?.canvas.getBoundingClientRect(),labels=(a.scene?.missionDrawn||[]).map(q=>({...q,left:q.left+(cv?.left||0),right:q.right+(cv?.left||0),top:q.top+(cv?.top||0),bottom:q.bottom+(cv?.top||0)}));
const result={counter:e?.counter,playerSpeed:a.profile?.settings?.playerSpeed||1,stage:b?.honroStage,round:b?.round,phase:b?.phase,side:b?.side,can:a.canInput(),screen:a.screen,modal:a.modalKind,dialogue:d?{row:d.lines?.[d.index]?.[2]?.rowId,index:d.index,speaker:d.lines?.[d.index]?.[0],text:d.lines?.[d.index]?.[1]}:null,
goal:current?.id??null,goalKind:current?.kind??null,done:b?.honroState?.act23v4?.done,reviewed:b?.honroState?.act23v4?.reviewed23,
active:u?unit(u):null,npc:n?{...unit(n),walk:n.honroV4Distance}:null,units:b?.units.map(unit),shots:b?.shot,lastShots:b?.lastShots,selected:a.selected,charging:a.charging,power:a.power,
revision:b?.honroCampaignMapRevision,difficulty:b?.difficulty,pacing:b?.honroReviewed23PacingCandidate??null,labels,turnBanner:rect('turn-banner'),equipment:rect('equipment-pending-battle'),minimap:rect('minimap'),bottom:rect('battle-bottom'),objective:rect('objective-text'),documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,report:b?.honroReport??null};
if(JSON.stringify(b)!==before)throw Error('Read-only STATE observation mutated the live battle');return result;}'''

def state():
    global last_enemy_observation
    value=page.evaluate(STATE);R['stateChecks']+=1
    if value.get('side')==1:
        key=(value.get('round'),value.get('shots'),(value.get('active') or {}).get('id'),tuple((u['id'],u['hp'],u['shield']) for u in value.get('units') or []))
        if key!=last_enemy_observation:
            last_enemy_observation=key
            R['enemyObservations'].append({'wallSeconds':round(time.monotonic()-START,3),**value})
    return value

def persist():
    (OUT/'result.json').write_text(json.dumps(R,ensure_ascii=False,indent=2))

def record(op,**data):
    row={'op':op,'wallSeconds':round(time.monotonic()-START,3),**data}
    R['actions'].append(row)
    with (OUT/'actions.jsonl').open('a') as f:f.write(json.dumps(row,ensure_ascii=False)+'\n')
    return row

def snap(label):
    s=state()
    if len(R['screenshots'])>=27 and label not in ['outcome','rest','reload','failure']:
        R.setdefault('screenshotsSkipped',[]).append(label);return s
    name=label+'.png';page.screenshot(path=str(OUT/name));R['screenshots'].append({'file':name,'round':s.get('round'),'phase':s.get('phase'),'goal':s.get('goal')});return s

def snap_clear(label):
    before=state()
    # Keep the product banner intact. Merely wait for its existing expiry.
    for _ in range(35):
        s=state()
        if not s.get('turnBanner') or s.get('dialogue') or terminal(s):break
        page.wait_for_timeout(100)
    after=snap(label)
    record('screenshot-natural-banner-wait',round=before.get('round'),before=before,after=after,bannerCleared=not bool(after.get('turnBanner')))
    return after

def check_hud(s):
    assert s['documentWidth']<=s['viewport'],'Horizontal document overflow'
    assert s['minimap'] and s['bottom'] and s['objective'],'Required visible battle HUD rectangle missing'
    overlap=lambda a,b:a['left']<b['right'] and a['right']>b['left'] and a['top']<b['bottom'] and a['bottom']>b['top']
    for label in s['labels']:
        assert not s['equipment'] or not overlap(label,s['equipment']),('Equipment/goal overlap',label,s['equipment'])
        assert not s['minimap'] or not overlap(label,s['minimap']),('Minimap/goal overlap',label,s['minimap'])

def terminal(s):return s.get('phase') in ['won','lost']

def ready():
    global last_dialogue,last_enemy
    for _ in range(1500):
        s=state()
        if s['dialogue']:
            d=s['dialogue'];key=(d.get('row'),d['index'],d['text'])
            if key!=last_dialogue:
                R['dialogues'].append({'round':s['round'],**d});last_dialogue=key
                if len(R['dialogues']) in [1,5,14]:snap('dialogue-'+str(len(R['dialogues'])))
            page.wait_for_timeout(180)
            page.locator('[data-action="dialogue-next"]').last.click()
            continue
        if s.get('side')==1 and last_enemy!=s['round']:
            R['enemyPhases'].append({'round':s['round'],'npc':s['npc'],'units':s['units']});last_enemy=s['round']
            if s['round'] in [8,13,19]:snap('enemy-r'+str(s['round']))
        if terminal(s):return False
        if s['can'] and s['active'] and s['active']['ground'] and not s['active']['jumping']:return True
        if time.monotonic()-START>3900:raise TimeoutError('Browser observation exceeded65 minutes')
        page.wait_for_timeout(100)
    raise TimeoutError('Normal input did not return within150 seconds')

def hold(key,ms):
    page.keyboard.down(key)
    try:page.wait_for_timeout(ms)
    finally:page.keyboard.up(key)

def touch(selector,dx,dy,ms):
    box=page.locator(selector).bounding_box();assert box,selector
    x,y=box['x']+box['width']/2,box['y']+box['height']/2
    c=page.context.new_cdp_session(page)
    try:
        c.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
        if dx or dy:c.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+dx,'y':y+dy}]})
        page.wait_for_timeout(ms)
    finally:
        c.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});c.detach()

def move(direction,ms):
    if mobile:touch('#joystick',35*direction,0,ms)
    else:hold('ArrowRight' if direction>0 else 'ArrowLeft',ms)

def plan(target=None,context_only=False,first_search=False,hop_target=None):
    result=page.evaluate(PLAN,{'targetId':target,'contextOnly':context_only,'firstSearch':first_search,'hopTargetId':hop_target})
    assert result['liveBeforeSha256']==result['liveAfterSha256']
    R['planningChecks']+=1
    return result

def click_battle(locator):
    # A new story/guide can appear between detached planning and a UI click.
    # Never force through it: yield to ready(), which reads and confirms it.
    before=state()
    if not before['can']:return False
    try:locator.click(timeout=1000)
    except PlaywrightTimeout:
        s=state()
        changed=any(s.get(k)!=before.get(k) for k in ['shots','round','goal','selected']) or (s.get('active') or {}).get('id')!=(before.get('active') or {}).get('id')
        if changed:
            record('input-transition',round=s['round'],reason='UI state changed before click timeout; do not repeat',before=before,after=s)
            return False # Uncertain click outcome: re-observe next loop, never replay blindly.
        if s['dialogue'] or not s['can']:
            record('input-deferred',round=s['round'],reason='Story or turn changed before UI click',dialogue=s['dialogue'])
            return False
        raise
    return True

def interact():
    s=state();q=page.locator('[data-context-interact="'+str(s['goal'])+'"]')
    if q.count() and q.is_visible() and q.is_enabled():
        if click_battle(q):
            record('interact',round=s['round'],actor=s['active']['id'],goal=s['goal']);return True
    return False

def same_actor(s,first):
    return not terminal(s) and s.get('round')==first['round'] and (s.get('active') or {}).get('id')==first['active']['id']

def landing_wait(first,max_ticks=600):
    # Drop preparation can still report grounded. Wait until the drop has really
    # completed; canInput is false during the fall, so send no movement/actions.
    start=state();polls=0
    while polls<1500:
        now=state();u=now.get('active');polls+=1
        if not same_actor(now,first):return now
        if now['dialogue']:return now # ready() will acknowledge normally, then re-plan.
        if u['ground'] and not u['jumping'] and not u['airborne'] and (not u['platformDrop'] or u['platformDrop']['phase']=='land'):return now
        if now['counter']-start['counter']>=max_ticks:break
        page.wait_for_timeout(20)
    raise TimeoutError('Ordinary landing exceeded the observation bound')

def normal_drop(first,ctx,following):
    threshold=60 if following else 160;u=first['active']
    if not first['can'] or u['y']>=ctx['roadY']-threshold or not ctx['canDrop']:return False
    button=page.locator('#drop')
    if not button.is_enabled() or not click_battle(button):return False
    immediate=state();observed=bool((immediate.get('active') or {}).get('platformDrop'))
    # A completed drop before polling is also observable by downward displacement.
    observed=observed or (same_actor(immediate,first) and immediate['active']['y']>u['y']+1)
    row=record('road-normal-drop',round=first['round'],actor=u['id'],followingEscort=following,threshold=threshold,
       beforeHorizontalCheck=following,before=first,immediate=immediate,acceptedObserved=observed,input='UI drop button')
    last=landing_wait(first);row['afterLanding']=last
    row['landed']=same_actor(last,first) and last['active']['ground'] and not last['active']['jumping'] and not last['active']['airborne'] and (not last['active']['platformDrop'] or last['active']['platformDrop']['phase']=='land')
    return True

def road_advance(target_x,range_px=35,following_escort=False):
    first=state();actor=first['active']['id'];stuck=0;jumps=0;drops=0
    # Escort return is tested before the horizontal-distance stop, matching the
    # road-follow fix. Normal input only; no positions or budgets are assigned.
    if following_escort and normal_drop(first,plan(context_only=True),True):drops+=1
    for _ in range(350):
        s=state();u=s.get('active')
        if not same_actor(s,first) or not s['can'] or u['move']<=8 or abs(target_x-u['x'])<=range_px:break
        ctx=plan(context_only=True)
        if normal_drop(s,ctx,following_escort):
            drops+=1;s=state();u=s.get('active')
            if not same_actor(s,first) or not s['can']:break
        direction=1 if target_x>u['x'] else -1
        remaining=max(0,abs(target_x-u['x'])-range_px)
        ms=min(180,max(18,remaining/max(1,u['walkSpeed'])/max(1,s['playerSpeed'])*1000))
        move(direction,ms);after=state()
        if not same_actor(after,first):break
        if abs(after['active']['x']-u['x'])<.5:stuck+=1
        else:stuck=0
        if stuck>=2 and after['active']['ground']:
            ctx=plan(context_only=True)
            if ctx['nearBodies']:break
            if page.locator('#jump').is_enabled():
                if not click_battle(page.locator('#jump')):break
                jumps+=1;stuck=0
            else:break
        if after['counter']-first['counter']>=2600:break
    last=state();record('road-advance',round=first['round'],actor=actor,targetX=target_x,range=range_px,followingEscort=following_escort,
        fromPose=first['active'],toPose=last.get('active'),npcBefore=first['npc'],npcAfter=last.get('npc'),jumps=jumps,drops=drops,
        observedEngineTicks=last.get('counter',0)-first['counter'],input='touch' if mobile else 'keyboard')

def try_hop(target):
    first=state()
    if not target or not first['can']:return False
    key=(first['round'],first['active']['id'])
    if key in hop_attempts:return False
    ctx=plan(context_only=True,hop_target=target['id']);proposal=ctx['hop']
    if not proposal:return False
    hop_attempts.add(key)
    button=page.locator('#jump')
    if not button.is_enabled() or not click_battle(button):return False
    immediate=state();u=immediate.get('active') or {}
    accepted=same_actor(immediate,first) and (u.get('jumping') or u.get('vy',0)<0 or u.get('move',first['active']['move'])<first['active']['move'])
    row=record('failed-shot-hop',round=first['round'],actor=first['active']['id'],plan=proposal,before=first,immediate=immediate,
        acceptedObserved=bool(accepted),liveBeforeSha256=ctx['liveBeforeSha256'],liveAfterSha256=ctx['liveAfterSha256'],input='UI jump button then touch/keyboard')
    if not accepted:return False
    saw_air=not u.get('ground') or u.get('jumping');input_ms=0;bounded_out=False
    for _ in range(500):
        s=state();u=s.get('active')
        if not same_actor(s,first) or s['dialogue']:break
        saw_air=saw_air or not u['ground'] or u['jumping']
        if saw_air and u['ground'] and not u['jumping']:break
        ticks=s['counter']-first['counter']
        if ticks>=480:bounded_out=True;break
        remaining=(proposal['targetX']-u['x'])*proposal['direction']
        allowance=280-abs(u['x']-first['active']['x'])
        # Small ordinary pulses. Observation/RAF timing can overshoot one pulse;
        # actual displacement and engine ticks are logged, never corrected.
        if s['can'] and remaining>3 and allowance>3 and u['move']>1:
            ms=min(30,max(5,(min(remaining,allowance)-3)/max(1,u['walkSpeed'])/max(1,s['playerSpeed'])*1000))
            move(proposal['direction'],ms);input_ms+=ms
        else:page.wait_for_timeout(16)
    after=state()
    row.update(afterLanding=after,landed=same_actor(after,first) and after['active']['ground'] and not after['active']['jumping'],
        observedEngineTicks=after.get('counter',0)-first['counter'],inputMilliseconds=input_ms,boundReached=bounded_out,
        actualDx=(after.get('active') or {}).get('x',first['active']['x'])-first['active']['x'])
    persist();return True

def aim(requested):
    history=[]
    for _ in range(45):
        s=state();u=s['active'];display=u['angle'] if u['facing']>0 else 180-u['angle'];want=requested if u['facing']>0 else 180-requested
        delta=want-display;history.append({'angle':u['angle'],'facing':u['facing'],'can':s['can']})
        if abs(delta)<=1.3:return u['angle']
        if not s['can']:return None
        ms=min(220,max(18,abs(delta)/62*1000))
        if mobile:
            displacement=12 if abs(delta)<8 else 35;box=page.locator('#joystick').bounding_box();axis=min(1,displacement/(min(box['width'],box['height'])*.41));gain=max(0,(axis-.12)/.88)**1.35
            ms=min(220,max(18,abs(delta)/(62*gain)*1000));touch('#joystick',0,-displacement if delta>0 else displacement,ms)
        else:hold('ArrowUp' if delta>0 else 'ArrowDown',ms)
    R['aimFailure']={'requested':requested,'history':history};snap('aim-failure');raise AssertionError('Normal UI aim did not converge')

def fire(planning):
    p=planning['plan']
    if not p:return False
    for _ in range(3):
        s=state();desired=-1 if p['angle']>90 else 1
        if s['active']['facing']==desired:break
        move(desired,35)
        if not ready():return False
        planning=plan(p['target']);p=planning['plan']
        if not p:return False
    s=state()
    if not s['can'] or s['active']['id']!=p['actor']:return False
    if s['active']['facing']!=(-1 if p['angle']>90 else 1):return False
    button=page.locator('[data-action="combat-skill"][data-skill="'+p['skill']+'"]')
    if not button.count() or not button.is_enabled():return False
    if not click_battle(button):return False
    observed_angle=aim(p['angle'])
    if observed_angle is None:return False
    before=state()
    if not before['can'] or not before['active']['ground'] or before['active']['id']!=p['actor']:return False
    ms=max(20,p['chargeDuration']*p['power']*1000)
    if mobile:touch('#fire',0,0,ms)
    else:hold('Space',ms)
    page.wait_for_timeout(60);immediate=state();accepted=immediate['shots']>before['shots']
    row=record('fire',round=before['round'],goal=before['goal'],actor=before['active']['id'],predicted=p,observedAim=observed_angle,planningContext={k:planning[k] for k in ['goal','blocked','threat','visibleFoes','skippedRear','skippedObjective']},actual=immediate.get('lastShots',{}).get(before['active']['id']),accepted=accepted,before=before,immediate=immediate,liveBeforeSha256=planning['liveBeforeSha256'],liveAfterSha256=planning['liveAfterSha256'],input='touch' if mobile else 'keyboard')
    if accepted:
        if before['round'] in [8,13,19] and not any(x['file']=='shot-r'+str(before['round'])+'.png' for x in R['screenshots']):snap('shot-r'+str(before['round']))
        ready();row['afterResolution']=state();persist()
    return accepted

def escort_walk(before_fire=False):
    first=state();ctx=plan(context_only=True)
    if before_fire and (ctx['blocked'] or (ctx['goal'] or {}).get('kind')!='escort' or first['npc']['move']<=2 or first['active']['move']<=10 or not first['can']):return False
    road_advance(min(9150,first['npc']['x']+190),following_escort=True)
    loop_start=state()
    for _ in range(180):
        s=state();u=s.get('active')
        if not same_actor(s,first) or not s['can']:break
        ctx=plan(context_only=True)
        if s['npc']['move']<=2 or u['move']<=10 or ctx['blocked'] or (ctx['goal'] or {}).get('kind')!='escort':break
        if abs(u['y']-ctx['roadY'])>60 or abs(u['y']-s['npc']['y'])>210:break
        if s['counter']-loop_start['counter']>=1700:break
        if u['x']-s['npc']['x']<180:move(1,100)
        else:page.wait_for_timeout(100)
    last=state();record('advance-open-escort-before-fire' if before_fire else 'escort-fallback',round=first['round'],actor=first['active']['id'],before=first,after=last,
        context=plan(context_only=True) if same_actor(last,first) else None)
    return True

def summarize():
    fires=[a for a in R['actions'] if a['op']=='fire' and a['accepted']];defs=[a for a in R['actions'] if a['op']=='defend' and a.get('acceptedObserved')]
    counts={}
    for a in fires:counts[a['predicted']['target']]=counts.get(a['predicted']['target'],0)+1
    phases=[]
    for goal in ['dispatch-bundle','dock-mid','dock-exit']:
        aa=[a for a in R['actions'] if a.get('goal',(a.get('before') or {}).get('goal'))==goal]
        ff=[a for a in fires if a.get('goal')==goal];dd=[a for a in defs if a.get('goal')==goal]
        phases.append({'goal':goal,'firstRound':min((a['round'] for a in aa),default=None),'lastRound':max((a['round'] for a in aa),default=None),'shots':len(ff),'defends':len(dd),'blockedDefends':sum(bool(a['context']['blocked']) for a in dd)})
    return {'phases':phases,'acceptedShots':len(fires),'defends':len(defs),'blockedDefends':sum(bool(a['context']['blocked']) for a in defs),'repeatedTargets':counts,'inputCounts':{k:sum(a.get('input')==k for a in fires) for k in ['keyboard','touch']},'observedDialogueRows':[x.get('row') for x in R['dialogues']],'hopAttempts':sum(a['op']=='failed-shot-hop' for a in R['actions']),'roadDrops':sum(a['op']=='road-normal-drop' for a in R['actions']),'damageScope':'State-to-state HP is net and may include healing/shields; honroReport is the production aggregate. No injected hurt/fire hooks.','timing':'Wall time includes browser, UI and planner overhead; not a human completion time.'}

try:
    assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==SOURCE_HASH
    source=json.loads(SOURCE.read_text());saved=source['profile'];b=saved['honroBattle']
    assert source['provenance']['sourceTarget']==PRODUCT and source['provenance']['resume'] is None
    assert source['provenance']['reviewedRuntimeHash']==RUNTIME_HASH
    assert hashlib.sha256(Path('shared/runtime/act23-v4-ch23-reviewed.js').read_bytes()).hexdigest()==RUNTIME_HASH
    assert source['provenance']['entryFixture'].startswith('Pre-entry first-clear/recruit reward-ledger fixture through22;')
    assert b['round']==1 and b['phase']=='aim' and b['shot']==0 and b['active']=='p-archer' and source['actions']==[]
    assert b['honroStage']==23 and b['difficulty']=='story' and sum(u['side']==1 for u in b['units'])==40
    assert b.get('honroReviewed23PacingCandidate')=={'id':'escort-close-130','version':1,'roadContact':True,'variant':'escort-road-130'}
    assert source.get('events',[])==[] and not b['honroState']['act23v4'].get('carrierStarted')
    assert b['honroCampaignMapRevision']==423 and len([u for u in b['units'] if u['side']==1 and u.get('honroAct3Elite')])==10
    R['sourceNarrativeReceipts']=b['honroState']['act23v4']['reviewed23']['events']
    assert R['sourceNarrativeReceipts']=={},'Entry already contains presented chapter dialogue'
    profile_path=OUT/'synthetic-r1-profile.json';profile_path.write_text(json.dumps(saved,ensure_ascii=False))
    assert hashlib.sha256(Path('HONRO.html').read_bytes()).hexdigest()==HTML_HASH
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True)
        context=browser.new_context(viewport={'width':1440,'height':900},has_touch=True,device_scale_factor=1)
        page=context.new_page();page.on('pageerror',lambda err:R['errors'].append(str(err)))
        try:
            response=page.goto(URL,wait_until='domcontentloaded');assert response and response.status==200
            assert hashlib.sha256(response.body()).hexdigest()==HTML_HASH;R['builtHtmlSha256']=HTML_HASH
            page.wait_for_function('window.HonroApp',timeout=60000)
            page.locator('[data-action="settings"]').first.click();page.get_by_text('기록·관리',exact=False).click();page.get_by_text('JSON 기록 가져오기',exact=True).click();page.get_by_text('파일 선택',exact=True).click();page.locator('#file-import').set_input_files(str(profile_path.resolve()))
            page.wait_for_function('HonroApp.profile?.lastStage===23',timeout=60000);page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp');page.locator('.title-actions [data-action="continue"]').first.click();page.wait_for_function('HonroApp.engine?.b.honroStage===23',timeout=60000)
            R['loaded']=snap('loaded-r1');assert R['loaded']['round']==1 and R['loaded']['shots']==0 and R['loaded']['pacing']==b['honroReviewed23PacingCandidate']
            last_round=0;last_goal=None
            for action_index in range(260):
                if not ready():break
                s=state()
                if s['round']>60:raise AssertionError('Round60 observation bound reached without victory')
                if time.monotonic()-START>3900:raise TimeoutError('Browser observation exceeded65 minutes')
                if s['round']!=last_round:
                    last_round=s['round'];mobile=last_round in [8,9,19,20]
                    page.set_viewport_size({'width':844,'height':390} if mobile else {'width':1440,'height':900});page.wait_for_timeout(180)
                    s=state();check_hud(s);R['rounds'].append(s);print('ROUND',json.dumps({'round':s['round'],'goal':s['goal'],'npc':s['npc'],'aliveEnemies':sum(u['side']==1 and u['hp']>0 and not u['dead'] for u in s['units']),'mobile':mobile}),flush=True)
                    if s['round'] in [1,6,8,11,13,16,19]:snap_clear('round-'+str(s['round'])+'-clear')
                    if s['round']==8:
                        page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(180);check_hud(state());snap_clear('portrait-r8-clear')
                        page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(180);check_hud(state())
                    persist()
                if s['goal']!=last_goal:
                    if last_goal is not None:snap_clear('goal-'+str(s['goal'])+'-clear')
                    last_goal=s['goal']
                if interact():continue
                if escort_walk(before_fire=True):
                    if not ready():break
                    if interact():continue
                ctx=plan(first_search=True)
                if fire(ctx):continue
                threat=ctx['threat'];s=state()
                if threat:road_advance(threat['x'],95 if s['active']['cls']=='knight' else 170)
                elif ctx['goal'] and ctx['goal']['id']=='dispatch-bundle':road_advance(2390)
                elif ctx['goal'] and ctx['goal']['kind']=='escort':escort_walk()
                else:page.wait_for_timeout(300)
                if terminal(state()):break
                if not ready():break
                if interact():continue
                ctx=plan()
                if fire(ctx):continue
                s=state();threat=ctx['threat']
                if threat and s['active']['cls']!='knight' and 96<abs(threat['x']-s['active']['x'])<=190 and abs(threat['y']-s['active']['y'])<220 and s['active']['move']>20:
                    road_advance(threat['x'],95)
                    if not ready():break
                    if fire(plan(threat['id'])):continue
                if try_hop(threat):
                    if not ready():break
                    if fire(plan(threat['id'])):continue
                s=state();ctx=plan(context_only=True)
                if not click_battle(page.locator('[data-action="defend"]')):continue
                immediate=state();accepted=not same_actor(immediate,s) or immediate['phase']!=s['phase'] or bool((immediate.get('active') or {}).get('acted'))
                row=record('defend',round=s['round'],actor=s['active']['id'],goal=s['goal'],before=s,immediate=immediate,acceptedObserved=accepted,context=ctx,input='touch-button' if mobile else 'button');ready();row['afterResolution']=state();persist()
            ready();R['outcome']=snap('outcome');assert R['outcome']['phase']=='won','Full browser battle did not win'
            assert R['outcome']['npc']['hp']>0 and all(R['outcome']['done'].get(k) for k in ['dispatch-bundle','dock-mid','dock-exit'])
            R['summary']=summarize();R['round']=R['outcome']['round'];R['twentyTurnTargetMet']=R['round']<=20
            reward=page.evaluate('({clear:HonroApp.profile.cleared[23],heroes:HonroApp.profile.heroes,equipment:HonroApp.profile.equipment,growth:HonroApp.profile.honroGrowth})');R['reward']=reward
            budget=reward['growth']['stages']['23']['contribution'];assert budget['total']==31548 and budget['spent']+budget['forfeited']==31548 and reward['clear']['visits']==1
            page.locator('[data-action="result-continue"]').click()
            for _ in range(100):
                if page.locator('.rest-screen').count():break
                if state()['dialogue']:page.locator('[data-action="dialogue-next"]').last.click()
                page.wait_for_timeout(150)
            assert page.locator('.rest-screen').count()==1;R['rest']=snap('rest');assert page.evaluate('HonroApp.engine===null')
            page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp')
            after=page.evaluate('({clear:HonroApp.profile.cleared[23],heroes:HonroApp.profile.heroes,equipment:HonroApp.profile.equipment,growth:HonroApp.profile.honroGrowth})');assert after==reward
            snap('reload');R['settlement']={'restReached':True,'reloadExact':True,'oneClear':True,'partyXpBudget':31548,'stage24Battle':False}
            R['passed']=not R['errors']
        except Exception:
            R['failure']=traceback.format_exc();R['summary']=summarize()
            try:R['failureState']=snap('failure')
            except Exception:pass
            raise
        finally:persist();context.close();browser.close()
except Exception:
    R.setdefault('failure',traceback.format_exc())
finally:
    R['wallSeconds']=time.monotonic()-START;persist();print('RESULT',json.dumps({k:v for k,v in R.items() if k not in ['actions','rounds','enemyPhases','enemyObservations','reward','loaded','outcome','failureState']},ensure_ascii=False),flush=True)
if not R['passed']:raise SystemExit(1)
