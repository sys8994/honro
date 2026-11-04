"""One complete Stage23 browser battle, using only normal UI input.

Starts from an unchanged synthetic R1/shot0 save. Earlier chapters were a legal
reward-ledger fixture, not played. This is neither optimal play nor human fun approval.
"""
import hashlib
import json
import os
import time
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT=Path('_local/reports/stage23-full-browser'); OUT.mkdir(parents=True,exist_ok=True)
SOURCE=Path('_local/stage23-final/stage23-candidate-native/entry-checkpoint.json')
SOURCE_HASH='c20e7ae036c0c757d41e31656d3a110fefd2b4c15b54156f5bb4875222e08688'
PRODUCT='b1b1ce63dfa08b111725f3b907088b70f280f17c'
HTML_HASH='199a47f9180ecc106c26fcb174e99f84154ddae2f35bded2f2b41e01bdcc974b'
URL='http://127.0.0.1:8765/HONRO.html'
PLAN=Path('tools/stage23-qa/full-browser-planner.js').read_text()
R={'passed':False,'controllerCommit':os.environ.get('GITHUB_SHA'),'productCommit':PRODUCT,
   'scope':'One actual Chromium UI battle from unchanged synthetic Stage23 R1/shot0 through outcome and settlement. Stages1–22 were a reward-ledger fixture, not played. This controller is not identical to native play and is not optimal human play, subjective fun approval or a20-turn exception.',
   'sourceRun':41850399757,'sourceSha256':SOURCE_HASH,'rounds':[],'actions':[],
   'dialogues':[],'errors':[],'enemyPhases':[],'screenshots':[],'planningChecks':0}
START=time.monotonic(); mobile=False; page=None; last_dialogue=None; last_enemy=None

STATE=r'''()=>{const a=HonroApp,e=a.engine,b=e?.b,u=e?.active,n=b?.units.find(t=>t.id==='act3-carrier'),d=a.dialogue;
const unit=t=>({id:t.id,cls:t.cls,side:t.side,x:t.x,y:t.y,hp:t.hp,maxHp:t.maxHp,shield:t.shield,focus:t.focus,move:t.moveLeft,angle:t.angle,facing:t.facing,dead:!!t.dead,acted:t.acted,awake:t.awake,walkSpeed:t.walkSpeed,ground:e.grounded(t)});
const rect=id=>{const el=document.getElementById(id);if(!el||el.hidden)return null;const q=el.getBoundingClientRect(),s=getComputedStyle(el);return q.width&&q.height&&s.display!=='none'&&s.visibility!=='hidden'?{left:q.left,right:q.right,top:q.top,bottom:q.bottom,text:el.innerText?.slice(0,350)}:null;};
const cv=a.scene?.canvas.getBoundingClientRect(),labels=(a.scene?.missionDrawn||[]).map(q=>({...q,left:q.left+(cv?.left||0),right:q.right+(cv?.left||0),top:q.top+(cv?.top||0),bottom:q.bottom+(cv?.top||0)}));
return {stage:b?.honroStage,round:b?.round,phase:b?.phase,side:b?.side,can:a.canInput(),screen:a.screen,modal:a.modalKind,dialogue:d?{row:d.lines?.[d.index]?.[2]?.rowId,index:d.index,speaker:d.lines?.[d.index]?.[0],text:d.lines?.[d.index]?.[1]}:null,
goal:b?HonroAct23V4.current(b)?.id:null,done:b?.honroState?.act23v4?.done,reviewed:b?.honroState?.act23v4?.reviewed23,
active:u?unit(u):null,npc:n?{...unit(n),walk:n.honroV4Distance}:null,units:b?.units.map(unit),shots:b?.shot,lastShots:b?.lastShots,selected:a.selected,charging:a.charging,power:a.power,
revision:b?.honroCampaignMapRevision,difficulty:b?.difficulty,pacing:b?.honroReviewed23PacingRevision??null,labels,equipment:rect('equipment-pending-battle'),minimap:rect('minimap'),bottom:rect('battle-bottom'),objective:rect('objective-text'),documentWidth:document.documentElement.scrollWidth,viewport:innerWidth};}'''

def state():
    return page.evaluate(STATE)

def persist():
    (OUT/'result.json').write_text(json.dumps(R,ensure_ascii=False,indent=2))

def record(op,**data):
    row={'op':op,'wallSeconds':round(time.monotonic()-START,3),**data}
    R['actions'].append(row)
    with (OUT/'actions.jsonl').open('a') as f:f.write(json.dumps(row,ensure_ascii=False)+'\n')
    return row

def snap(label):
    s=state();name=label+'.png';page.screenshot(path=str(OUT/name));R['screenshots'].append({'file':name,'round':s.get('round'),'phase':s.get('phase'),'goal':s.get('goal')});return s

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
                if len(R['dialogues']) in [1,5,9,14,15]:snap('dialogue-'+str(len(R['dialogues'])))
            page.wait_for_timeout(180)
            page.locator('[data-action="dialogue-next"]').last.click()
            continue
        if s.get('side')==1 and last_enemy!=s['round']:
            R['enemyPhases'].append({'round':s['round'],'npc':s['npc'],'units':s['units']});last_enemy=s['round']
            if s['round'] in [3,8,13,19,25]:snap('enemy-r'+str(s['round']))
        if terminal(s):return False
        if s['can'] and s['active'] and s['active']['ground']:return True
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

def plan(target=None,context_only=False):
    result=page.evaluate(PLAN,{'targetId':target,'contextOnly':context_only})
    assert result['liveBeforeSha256']==result['liveAfterSha256']
    R['planningChecks']+=1
    return result

def interact():
    s=state();q=page.locator('[data-context-interact="'+str(s['goal'])+'"]')
    if q.count() and q.is_visible() and q.is_enabled():
        q.click();record('interact',round=s['round'],actor=s['active']['id'],goal=s['goal']);return True
    return False

def road_advance(target_x,range_px=35):
    first=state();actor=first['active']['id'];stuck=0;jumps=0;drops=0
    for _ in range(180):
        s=state();u=s['active']
        if not s['can'] or terminal(s) or u['id']!=actor or u['move']<=8 or abs(target_x-u['x'])<=range_px:break
        ctx=plan(context_only=True)
        if u['y']<ctx['roadY']-160 and ctx['canDrop'] and page.locator('#drop').is_enabled():
            page.locator('#drop').click();drops+=1
        direction=1 if target_x>u['x'] else -1
        remaining=max(0,abs(target_x-u['x'])-range_px)
        ms=min(220,max(25,remaining/max(1,u['walkSpeed'])*1000))
        move(direction,ms);after=state()
        if abs(after['active']['x']-u['x'])<.5:stuck+=1
        else:stuck=0
        if stuck>=2 and after['active']['ground']:
            if ctx['nearBodies']:break
            if page.locator('#jump').is_enabled():page.locator('#jump').click();jumps+=1;stuck=0
            else:break
    last=state();record('move',round=first['round'],actor=actor,targetX=target_x,range=range_px,fromPose=first['active'],toPose=last['active'],jumps=jumps,drops=drops,input='touch' if mobile else 'keyboard')

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
    if s['active']['facing']!=(-1 if p['angle']>90 else 1):return False
    button=page.locator('[data-action="combat-skill"][data-skill="'+p['skill']+'"]')
    if not button.count() or not button.is_enabled():return False
    button.click();observed_angle=aim(p['angle'])
    if observed_angle is None:return False
    before=state()
    if not before['can'] or not before['active']['ground']:return False
    ms=max(20,p['chargeDuration']*p['power']*1000)
    if mobile:touch('#fire',0,0,ms)
    else:hold('Space',ms)
    page.wait_for_timeout(60);immediate=state();accepted=immediate['shots']>before['shots']
    row=record('fire',round=before['round'],goal=before['goal'],actor=before['active']['id'],predicted=p,observedAim=observed_angle,actual=immediate.get('lastShots',{}).get(before['active']['id']),accepted=accepted,before=before,immediate=immediate,liveBeforeSha256=planning['liveBeforeSha256'],liveAfterSha256=planning['liveAfterSha256'],input='touch' if mobile else 'keyboard')
    if accepted:
        if before['round'] in [2,8,13,19,25] and not any(x['file']=='shot-r'+str(before['round'])+'.png' for x in R['screenshots']):snap('shot-r'+str(before['round']))
        ready();row['afterResolution']=state();persist()
    return accepted

def escort_walk():
    s=state();road_advance(min(9150,s['npc']['x']+190))
    for _ in range(120):
        s=state();u=s['active'];ctx=plan(context_only=True)
        if not s['can'] or terminal(s) or s['npc']['move']<=2 or u['move']<=10 or ctx['blocked'] or (ctx['goal'] or {}).get('kind')!='escort':break
        if abs(u['y']-ctx['roadY'])>60 or abs(u['y']-s['npc']['y'])>210:break
        if u['x']-s['npc']['x']<180:move(1,160)
        else:page.wait_for_timeout(160)

def summarize():
    fires=[a for a in R['actions'] if a['op']=='fire' and a['accepted']];defs=[a for a in R['actions'] if a['op']=='defend']
    counts={}
    for a in fires:counts[a['predicted']['target']]=counts.get(a['predicted']['target'],0)+1
    return {'acceptedShots':len(fires),'defends':len(defs),'blockedDefends':sum(bool(a['context']['blocked']) for a in defs),'repeatedTargets':counts,'inputCounts':{k:sum(a.get('input')==k for a in fires) for k in ['keyboard','touch']},'observedDialogueRows':[x.get('row') for x in R['dialogues']],'timing':'Wall time includes browser, UI and planner overhead; not a human completion time.'}

try:
    assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()==SOURCE_HASH
    source=json.loads(SOURCE.read_text());saved=source['profile'];b=saved['honroBattle']
    assert source['provenance']['sourceTarget']==PRODUCT and source['provenance']['resume'] is None
    assert source['provenance']['entryFixture'].startswith('Pre-entry first-clear/recruit reward-ledger fixture through22;')
    assert b['round']==1 and b['phase']=='aim' and b['shot']==0 and b['active']=='p-archer' and source['actions']==[]
    assert b['honroStage']==23 and b['difficulty']=='story' and sum(u['side']==1 for u in b['units'])==40
    assert not b.get('honroReviewed23PacingRevision')
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
            R['loaded']=snap('loaded-r1');assert R['loaded']['round']==1 and R['loaded']['shots']==0
            last_round=0
            for action_index in range(260):
                if not ready():break
                s=state()
                if s['round']>60:raise AssertionError('Round60 observation bound reached without victory')
                if time.monotonic()-START>3900:raise TimeoutError('Browser observation exceeded65 minutes')
                if s['round']!=last_round:
                    last_round=s['round'];mobile=last_round in [8,9,19,20]
                    page.set_viewport_size({'width':844,'height':390} if mobile else {'width':1440,'height':900});page.wait_for_timeout(180)
                    s=state();check_hud(s);R['rounds'].append(s);print('ROUND',json.dumps({'round':s['round'],'goal':s['goal'],'npc':s['npc'],'aliveEnemies':sum(u['side']==1 and u['hp']>0 and not u['dead'] for u in s['units']),'mobile':mobile}),flush=True)
                    if s['round'] in [1,4,8,13,19,25,30,40,50]:snap('round-'+str(s['round']))
                    persist()
                if interact():continue
                ctx=plan()
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
                s=state();ctx=plan(context_only=True)
                page.locator('[data-action="defend"]').click();row=record('defend',round=s['round'],actor=s['active']['id'],goal=s['goal'],before=s,context=ctx,input='touch-button' if mobile else 'button');ready();row['afterResolution']=state();persist()
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
    R['wallSeconds']=time.monotonic()-START;persist();print('RESULT',json.dumps({k:v for k,v in R.items() if k not in ['actions','rounds','enemyPhases','reward','loaded','outcome','failureState']},ensure_ascii=False),flush=True)
if not R['passed']:raise SystemExit(1)
