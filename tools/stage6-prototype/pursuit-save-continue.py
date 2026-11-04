"""Narrow R7 legacy-candidate save boundary on a newly integrated served build.
Actual UI Continue, natural enemy turn, one normal defend, save and UI Continue.
No live battle/actor/camera writes; no full fight or balance/release-gate change.
"""
import gzip, hashlib, json, os, time, traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

SAVE = Path(os.environ.get('STAGE6_PURSUIT_SAVE', '_local/reports/stage6-art-preview/integrated-play/natural-pursuit-entry-save.json.gz'))
EXPECTED_SHA = '19f9cbe6c839b02fcf50b1ad952835f8498efb343c054b51835be9aca2ed61ab'
URL = os.environ.get('HONRO_REVIEW_URL', 'http://127.0.0.1:8870/HONRO.html')
OUT = Path(os.environ.get('STAGE6_PURSUIT_REVIEW_OUT', '_local/reports/stage6-pursuit-continue'))
OUT.mkdir(parents=True, exist_ok=True)
R = {'source': os.environ.get('GITHUB_SHA'), 'checkpointSource': '6af62950ed67d19cc589962f75e5819d171c8474', 'checkpointRun': 41735897152, 'checkpointArtifact': 13279038512, 'checkpointExpectedSHA256': EXPECTED_SHA, 'scope': 'One natural R7 entry checkpoint; Chromium UI compatibility boundary, not a new complete fight or mobile-device performance test.', 'errors': []}
STATE = '''()=>{const a=HonroApp,e=a.engine,b=e.b;return {round:b.round,phase:b.phase,side:b.side,can:a.canInput(),active:e.active?.id,serial:b.honroState.actorTurnSerial,revision:b.honroCampaignMapRevision,pursuitActive:HonroStage6Pursuit.active(b),eventFlag:b.honroState.flags['event:pursuit'],pending:b.honroState.pendingEvents||[],notice:document.getElementById('stage6-pursuit-warning')?.innerText||null,frontCount:b.honroEvents.find(v=>v.id==='bridge-boars').action.n,pursuitCount:b.honroEvents.find(v=>v.id==='pursuit').action.n,members:b.units.filter(v=>v.honroSpawnSource==='pursuit').map(v=>({id:v.id,target:v.honroTargetId,born:v.honroDensityBornRound,supports:v.honroPursuitSupports,hp:v.hp,lastAct:v.lastAct,x:v.x,y:v.y})),coverage:['west','east'].map(n=>HonroStage6RenderCoveragePreview.covered(b,b.terrain.find(t=>t.id==='pier-'+n))),objective:{hp:e.unit('objective').hp,x:e.unit('objective').x,y:e.unit('objective').y}};}'''

def ready(page, timeout=120):
    until = time.monotonic() + timeout
    while time.monotonic() < until:
        state = page.evaluate('()=>({engine:!!HonroApp.engine,can:HonroApp.canInput(),dialogue:!!HonroApp.dialogue,phase:HonroApp.engine?.b.phase})')
        if state['dialogue']:
            button = page.locator('[data-action="dialogue-next"]:visible')
            if button.count(): button.first.click()
            else: page.keyboard.press('Enter')
        elif state['can']: return
        elif state['phase'] in ['won', 'lost']: raise AssertionError('Unexpected terminal checkpoint: ' + state['phase'])
        page.wait_for_timeout(100)
    raise AssertionError('Natural checkpoint continuation did not reach normal input')

def check(page, label):
    page.wait_for_function('()=>{const b=HonroApp.engine.b;return ["west","east"].every(n=>HonroStage6RenderCoveragePreview.covered(b,b.terrain.find(t=>t.id==="pier-"+n)))}', timeout=30000)
    s = page.evaluate(STATE)
    assert s['eventFlag'] is True and 'pursuit' not in s['pending'] and not s['notice'], s
    assert s['revision'] == 4 and s['pursuitActive'] and s['frontCount'] == s['pursuitCount'] == 2, s
    assert sorted(v['id'] for v in s['members']) == ['event-93', 'event-94'], s
    assert all(v['target'] == 'objective' and v['born'] == 7 and v['supports'] == ['lower-road'] for v in s['members']), s
    assert all(s['coverage']), s
    R[label] = s
    page.screenshot(path=str(OUT / (label + '.png')))
    return s

try:
    packed = SAVE.read_bytes()
    R['checkpointSHA256'] = hashlib.sha256(packed).hexdigest()
    assert R['checkpointSHA256'] == EXPECTED_SHA, 'Wrong original checkpoint bytes'
    raw = gzip.decompress(packed)
    profile = json.loads(raw)
    b = profile['honroBattle']
    assert b['round'] == 7 and b['phase'] == 'transition' and b['side'] == 0, 'Not the recorded natural entry boundary'
    assert b['honroState']['flags']['event:pursuit'] is True
    R['checkpointRawSHA256'] = hashlib.sha256(raw).hexdigest()
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=['--no-sandbox'])
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()
        page.on('pageerror', lambda e: R['errors'].append(str(e)))
        page.goto(URL, wait_until='domcontentloaded')
        page.wait_for_function('window.HonroApp', timeout=60000)
        page.evaluate('(p)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))', profile)
        page.reload(wait_until='domcontentloaded')
        page.locator('.title-actions button[data-action="continue"]:visible').first.click()
        ready(page)
        page.wait_for_timeout(300)
        first = check(page, 'first-continue')
        assert first['round'] >= 8 and any(v['lastAct'] >= 7 for v in first['members']), 'The saved natural enemy turn did not run'
        page.keyboard.press('f')
        page.wait_for_function('x=>HonroApp.engine.b.honroState.actorTurnSerial>x', arg=first['serial'], timeout=30000)
        ready(page)
        acted = check(page, 'normal-defend')
        assert acted['serial'] > first['serial'], 'No genuine action after Continue'
        assert page.evaluate('()=>{HonroApp.flushBattleSave();return HonroApp.persist()}'), 'Resave failed'
        saved = page.evaluate('localStorage.getItem("honro-first-act-profile-1")')
        assert saved
        R['resavedRawSHA256'] = hashlib.sha256(saved.encode()).hexdigest()
        (OUT / 'resaved-profile.json.gz').write_bytes(gzip.compress(saved.encode()))
        page.reload(wait_until='domcontentloaded')
        page.locator('.title-actions button[data-action="continue"]:visible').first.click()
        ready(page)
        page.wait_for_timeout(300)
        second = check(page, 'second-continue')
        assert second['round'] == acted['round'] and second['serial'] >= acted['serial'], 'Resume lost ordinary action progress'
        assert not R['errors'], R['errors']
        R['status'] = 'pass'
        browser.close()
except Exception:
    R['status'] = 'failed'
    R['error'] = traceback.format_exc()
finally:
    (OUT / 'result.json').write_text(json.dumps(R, ensure_ascii=False, indent=2))
    print(json.dumps(R, ensure_ascii=False), flush=True)
if R['status'] != 'pass': raise SystemExit(1)
