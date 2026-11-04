"""Bounded public Stage23 combat observation from earned synthetic R8/R19 saves.

This is not a whole browser playthrough, a Stage31 review, human fun approval,
or a candidate build. All actions use ordinary UI. Planning uses a detached copy.
"""
import hashlib
import json
import os
import time
import traceback
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

OUT = Path('_local/reports/stage23-public-combat')
NATIVE = Path('_local/reports/stage23-public-combat-native')
OUT.mkdir(parents=True, exist_ok=True)
URL = 'https://sys8994.github.io/honro/HONRO.html'
PUBLIC_HASH = '48508e7cbf43ad5985092a8fb62840fe9a9dabc7d5c7ac9ff49cf161809ee41a'
RUNTIME_HASH = '71e3b81904fe845b4cbc190e1e0be9be714421c75a146725075665e42b07773c'
CONTROLLER_HASH = '3c6bca2831652de4324da654c08b4eff4fa360442167d3834e82654905a4a1c3'
PROFILE_HASH = 'd33ef246b3d5bd29819c91d88af109b49c9662e9a9c9b179561e44c6e4bca6c8'
R = {'passed': False, 'sourceCommit': os.environ.get('GITHUB_SHA'),
     'scope': 'Current published Stage23 only. Actual keyboard/touch combat for at most two rounds per earned native checkpoint. Synthetic reward ledger through22, not a user save, whole browser playthrough, human timing or subjective fun approval.',
     'nativeEntryRun': 41799550364, 'nativeEntryArtifact': 13308030054,
     'views': [], 'errors': []}

STATE = '''()=>{const a=HonroApp,e=a.engine,b=e?.b,u=e?.active,n=b?.units.find(v=>v.id==='act3-carrier');
const rect=sel=>{const el=document.querySelector(sel);if(!el||el.hidden)return null;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display==='none'||s.visibility==='hidden'||!r.width||!r.height?null:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,text:el.innerText?.slice(0,350)};};
return {stage:b?.honroStage,round:b?.round,phase:b?.phase,side:b?.side,can:a.canInput(),dialogue:!!a.dialogue,modal:a.modalKind,revision:b?.honroCampaignMapRevision,pacing:b?.honroReviewed23PacingRevision??null,difficulty:b?.difficulty,
goal:b?HonroAct23V4.current(b)?.id:null,blocked:b?HonroAct23V4Chapter23Facts.blocked(b):null,selected:a.selected,power:a.power,charging:a.charging,
active:u?{id:u.id,x:u.x,y:u.y,hp:u.hp,shield:u.shield,move:u.moveLeft,angle:u.angle,facing:u.facing,ground:e.grounded(u)}:null,
npc:n?{x:n.x,y:n.y,hp:n.hp,move:n.moveLeft,walk:n.honroV4Distance}:null,shots:b?.shot,lastShots:b?.lastShots,
units:b?.units.map(v=>({id:v.id,side:v.side,x:v.x,y:v.y,hp:v.hp,shield:v.shield,dead:!!v.dead,acted:v.acted,awake:v.awake})),
camera:a.scene?{x:a.scene.x,y:a.scene.y,scale:a.scene.scale}:null,documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,
hud:{objective:rect('#objective-text'),turn:rect('#turn-text'),hp:rect('#hp-label'),mp:rect('#mp-label'),move:rect('#move-label'),skills:rect('#combat-skills'),joystick:rect('#joystick'),fire:rect('#fire'),pending:rect('#equipment-pending-battle'),minimap:rect('#minimap-dock'),bottom:rect('#battle-bottom')},
bodyPoseValid:u?HONRO_CORE.validTerrainContactPose(b.terrain,u):null};}'''

# The original live battle is only serialized and checked here. Every engine
# query that could update planning caches operates on an independent copy.
PLAN = '''()=>{const C=HONRO_CORE,b=HonroApp.engine.b,before=JSON.stringify(b),pe=new C.Engine(JSON.parse(before),()=>{},true),u=pe.unit(b.active),n=pe.unit('act3-carrier');let result=null;
const foes=pe.alive(1).filter(t=>!t.honroObjectiveTarget&&t.x>=n.x-550&&t.x>u.x+20&&Math.hypot(t.x-u.x,t.y-u.y)<1500).sort((a,z)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(z.x-u.x,z.y-u.y)).slice(0,3);
const skills=u.loadout.map(id=>C.SKILLS[id]).filter(s=>s&&s.damage>0&&!s.passive&&!s.martial&&pe.cooldownLeft(u,s.id)<=0&&pe.manaCost(s,u)<=u.focus).sort((a,z)=>z.damage-a.damage);
outer:for(const t of foes)for(const s of skills){let best=null;for(const aim of pe.shotSeeds(u,s,t)){if(aim.angle<-75||aim.angle>85)continue;const v=C.shotViable(pe,u,s,t,aim.angle,aim.power);if(v.ok&&v.risk<1&&v.miss<Math.max(85,s.radius+t.r+55)&&(!best||v.net>best.net))best={...aim,net:v.net};}
if(best){result={actor:u.id,target:t.id,targetHp:t.hp,skill:s.id,angle:best.angle,power:best.power,predictedNet:best.net,chargeDuration:pe.chargeDuration(u,s),scope:'Detached first-impact planning aid, not an optimal tactic or guaranteed hit'};break outer;}}
if(JSON.stringify(b)!==before)throw Error('Detached planning changed live battle');return result;}'''


def snapshot(page, label):
    state = page.evaluate(STATE)
    page.screenshot(path=str(OUT / (label + '.png')))
    return state


def hold(page, key, milliseconds):
    page.keyboard.down(key)
    try:
        page.wait_for_timeout(milliseconds)
    finally:
        page.keyboard.up(key)


def touch(context, page, selector, dx, dy, milliseconds):
    box = page.locator(selector).bounding_box()
    assert box, selector
    x, y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
    session = context.new_cdp_session(page)
    try:
        session.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x, 'y': y}]})
        if dx or dy:
            session.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x + dx, 'y': y + dy}]})
        page.wait_for_timeout(milliseconds)
    finally:
        session.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
        session.detach()


def ready(page, row, label):
    for _ in range(600):
        state = page.evaluate(STATE)
        if state['dialogue']:
            page.locator('[data-action="dialogue-next"]').last.click()
            page.wait_for_timeout(180)
            continue
        if state['side'] == 1:
            row['enemyPhaseObserved'] = True
            if not row.get('enemyPhaseScreenshot'):
                row['enemyPhaseScreenshot'] = snapshot(page, label + '-enemy-response')
        if state['phase'] in ['won', 'lost']:
            return False
        if state['can'] and state['active'] and state['active']['ground']:
            return True
        page.wait_for_timeout(100)
    raise TimeoutError('Ordinary input did not return within60 seconds')


def load_checkpoint(browser, checkpoint_round, width, height, mobile, label):
    path = NATIVE / ('round-' + str(checkpoint_round) + '.json')
    source = json.loads(path.read_text())
    provenance = source['provenance']
    assert provenance['resume'] is None
    assert provenance['sourceTarget'] == os.environ['GITHUB_SHA'] + ' original40 checkpoint generation only'
    assert provenance['reviewedRuntimeHash'] == RUNTIME_HASH
    assert provenance['controllerHash'] == CONTROLLER_HASH
    assert provenance['profileHash'] == PROFILE_HASH
    assert provenance['entryFixture'].startswith('Pre-entry first-clear/recruit reward-ledger fixture through22;')
    saved = source['profile']
    battle = saved['honroBattle']
    assert battle['round'] == checkpoint_round and battle['honroStage'] == 23
    assert not battle.get('honroReviewed23PacingRevision')
    assert sum(u['side'] == 1 for u in battle['units']) == 40
    assert {'s23-C-5', 's23-E-2'} <= {u['id'] for u in battle['units']}
    assert source['audit']['externalWrites'] == [] and source['audit']['recoveries'] == []
    profile_path = OUT / (label + '-synthetic-profile.json')
    profile_path.write_text(json.dumps(saved, ensure_ascii=False))
    context = browser.new_context(viewport={'width': width, 'height': height}, is_mobile=mobile, has_touch=mobile, device_scale_factor=1)
    page = context.new_page()
    page.on('pageerror', lambda error: R['errors'].append(str(error)))
    response = page.goto(URL, wait_until='domcontentloaded')
    assert response and response.status == 200
    assert hashlib.sha256(response.body()).hexdigest() == PUBLIC_HASH
    page.wait_for_function('window.HonroApp', timeout=60000)
    page.locator('[data-action="settings"]').first.click()
    page.get_by_text('기록·관리', exact=False).click()
    page.get_by_text('JSON 기록 가져오기', exact=True).click()
    page.get_by_text('파일 선택', exact=True).click()
    page.locator('#file-import').set_input_files(str(profile_path.resolve()))
    page.wait_for_function('HonroApp.profile?.lastStage===23', timeout=60000)
    page.reload(wait_until='domcontentloaded')
    page.wait_for_function('window.HonroApp')
    page.locator('.title-actions [data-action="continue"]').first.click()
    page.wait_for_function('HonroApp.engine?.b.honroStage===23', timeout=60000)
    row = {'label': label, 'checkpointRound': checkpoint_round, 'checkpointSha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'enemyPhaseObserved': False, 'actions': []}
    R['views'].append(row)
    ready(page, row, label)
    row['entry'] = snapshot(page, label + '-entry')
    assert row['entry']['round'] == checkpoint_round and row['entry']['revision'] == 423
    assert row['entry']['difficulty'] == 'story' and row['entry']['pacing'] is None
    assert row['entry']['bodyPoseValid'] and row['entry']['documentWidth'] <= width
    assert page.evaluate('(t)=>JSON.stringify(HonroApp.engine.b.terrain)===JSON.stringify(t)', battle['terrain'])
    return context, page, row


def aim(context, page, mobile, requested):
    # Facing is established by a normal rightward movement gesture, never writes.
    assert page.evaluate(STATE)['active']['facing'] > 0
    for _ in range(30):
        current = page.evaluate(STATE)['active']['angle']
        delta = requested - current
        if abs(delta) <= 1.3:
            return current
        duration = min(220, max(18, abs(delta) / 62 * 1000))
        if mobile:
            touch(context, page, '#joystick', 0, -35 if delta > 0 else 35, duration)
        else:
            hold(page, 'ArrowUp' if delta > 0 else 'ArrowDown', duration)
    raise AssertionError('Ordinary aim gesture failed to reach planned angle')


def fire(context, page, mobile, plan):
    page.locator('[data-action="combat-skill"][data-skill="' + plan['skill'] + '"]').click()
    angle = aim(context, page, mobile, plan['angle'])
    before = page.evaluate(STATE)
    duration = max(35, plan['chargeDuration'] * plan['power'] * 1000)
    if mobile:
        touch(context, page, '#fire', 0, 0, duration)
    else:
        hold(page, 'Space', duration)
    page.wait_for_timeout(50)
    after = page.evaluate(STATE)
    assert after['shots'] > before['shots'], 'Normal fire input was not accepted'
    return {'plan': plan, 'observedAim': angle, 'before': before, 'immediate': after}


try:
    raw = urllib.request.urlopen(URL, timeout=60).read()
    R['publicHtmlSha256'] = hashlib.sha256(raw).hexdigest()
    assert R['publicHtmlSha256'] == PUBLIC_HASH, 'Published product changed; re-attest before continuing'
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for label, round_number, width, height, mobile in [('desktop-r8', 8, 1440, 900, False), ('touch-r19', 19, 844, 390, True)]:
            context, page, row = load_checkpoint(browser, round_number, width, height, mobile, label)
            if mobile:
                page.set_viewport_size({'width': 390, 'height': 844})
                page.wait_for_timeout(600)
                row['portrait'] = snapshot(page, label + '-portrait')
                assert row['portrait']['documentWidth'] <= 390
                page.set_viewport_size({'width': width, 'height': height})
                page.wait_for_timeout(600)
                row['landscapeRestored'] = snapshot(page, label + '-landscape-restored')
            before_move = page.evaluate(STATE)
            if mobile:
                touch(context, page, '#joystick', 35, 0, 180)
            else:
                hold(page, 'ArrowRight', 180)
            page.wait_for_timeout(150)
            row['moved'] = snapshot(page, label + '-moved')
            assert row['moved']['active']['x'] > before_move['active']['x'] + 1
            assert row['moved']['active']['move'] < before_move['active']['move']
            for turn in range(8):
                if not ready(page, row, label):
                    break
                before = page.evaluate(STATE)
                if before['round'] >= round_number + 2:
                    break
                if before['active']['facing'] < 0:
                    if mobile:
                        touch(context, page, '#joystick', 35, 0, 60)
                    else:
                        hold(page, 'ArrowRight', 60)
                plan = page.evaluate(PLAN)
                if plan:
                    shot = fire(context, page, mobile, plan)
                    shot['op'] = 'fire'
                    shot['screen'] = snapshot(page, label + '-shot-' + str(turn + 1))
                    row['actions'].append(shot)
                else:
                    page.locator('[data-action="defend"]').click()
                    row['actions'].append({'op': 'defend', 'before': before})
            ready(page, row, label)
            row['end'] = snapshot(page, label + '-end')
            assert any(a['op'] == 'fire' for a in row['actions']), 'No actual combat shot observed'
            assert row['enemyPhaseObserved'], 'No enemy response phase observed'
            assert row['end']['round'] > round_number, 'Round did not progress'
            initial_units = {u['id']: u for u in row['entry']['units']}
            row['netHpDecreaseBySide'] = {str(side): sum(max(0, initial_units[u['id']]['hp'] - u['hp']) for u in row['end']['units'] if u['id'] in initial_units and u['side'] == side) for side in [0, 1, 2]}
            row['npcDeltaX'] = row['end']['npc']['x'] - row['entry']['npc']['x']
            row['readingNote'] = 'Screenshots require direct visual review; rectangles and successful inputs do not certify readability or human fun.'
            context.close()
        browser.close()
    R['passed'] = not R['errors']
except Exception:
    R['failure'] = traceback.format_exc()
    try:
        R['failureState'] = snapshot(page, 'failure')
    except Exception:
        pass
finally:
    (OUT / 'result.json').write_text(json.dumps(R, ensure_ascii=False, indent=2))
    print(json.dumps(R, ensure_ascii=False), flush=True)
if not R['passed']:
    raise SystemExit(1)
