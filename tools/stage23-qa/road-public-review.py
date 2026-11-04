"""Published Stage23 byte binding and bounded normal-input verification.

The complete19-round same-product browser battle is run41901497974.
This separate publication check verifies fresh first combat and the unchanged
earned R19 return checkpoint, not another full-stage or human playthrough.
"""
import ast
import hashlib
import json
import os
import traceback
from pathlib import Path

BASE=Path('tools/stage23-qa/road-support-browser.py')
assert hashlib.sha256(BASE.read_bytes()).hexdigest()=='4a476df156432000cc4794f4aa158dce1fc7329d319a3e0fbdf17de4e540c90b'
module=ast.parse(BASE.read_text(),str(BASE))
# Reuse the reviewed read-only observation/planner and normal-input functions.
# The first top-level try is its complete-play entry point; do not execute it.
index=next(i for i,n in enumerate(module.body) if isinstance(n,ast.Try))
helpers=ast.Module(body=module.body[:index],type_ignores=[])
exec(compile(helpers,str(BASE),'exec'),globals())

PUBLIC='https://sys8994.github.io/honro/HONRO.html?stage23='+required('HONRO23_RELEASE_PRODUCT_SHA')
FINAL=Path(required('HONRO23_FINAL_CHECKPOINT'))
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest()=='3e57dffbf845979a8e1720cfb40f34a3739110269923614a6f920ba501960594'
assert hashlib.sha256(FINAL.read_bytes()).hexdigest()=='ea3df1e6e1b1c62b53164ceba0f7b7ae12b8aa61b313adf44ec8fc56c022f36c'
R.update({'passed':False,'scope':'Actual published byte-identical product: fresh first normal-input shot, exact earned native R19 exit/settlement/reload, portrait touch/rotation and HUD. Complete same-product browser battle is separate run41901497974. Not a second full browser battle, full portrait play, tactical play or human timing.','releaseProductCommit':os.environ['HONRO23_RELEASE_PRODUCT_SHA'],'publicUrl':PUBLIC,'views':[],'reusedHelperSha256':hashlib.sha256(BASE.read_bytes()).hexdigest()})

def open_saved(browser,path,label,width,height,is_mobile):
    global page,context,mobile,last_dialogue,last_enemy,last_enemy_observation
    mobile=is_mobile;last_dialogue=None;last_enemy=None;last_enemy_observation=None
    source=json.loads(path.read_text());saved=source['profile'];battle=saved['honroBattle']
    assert source['provenance']['sourceTarget']==PRODUCT and source['provenance']['resume'] is None
    assert source['provenance']['entryFixture'].startswith('Pre-entry first-clear/recruit reward-ledger fixture through22;')
    assert source['provenance']['reviewedRuntimeHash']==RUNTIME_HASH
    assert battle['honroStage']==23 and battle['difficulty']=='story' and battle['honroCampaignMapRevision']==423
    assert battle['honroReviewed23PacingCandidate']=={'id':'escort-close-130','version':1,'roadContact':True,'variant':'escort-road-130'}
    profile=OUT/(label+'-synthetic-profile.json');profile.write_text(json.dumps(saved,ensure_ascii=False))
    context=browser.new_context(viewport={'width':width,'height':height},is_mobile=is_mobile,has_touch=True,device_scale_factor=1)
    page=context.new_page();page.on('pageerror',lambda error:R['errors'].append(str(error)))
    response=page.goto(PUBLIC,wait_until='domcontentloaded');assert response and response.status==200
    assert hashlib.sha256(response.body()).hexdigest()==HTML_HASH
    page.wait_for_function('window.HonroApp',timeout=60000)
    page.locator('[data-action="settings"]').first.click();page.get_by_text('기록·관리',exact=False).click();page.get_by_text('JSON 기록 가져오기',exact=True).click();page.get_by_text('파일 선택',exact=True).click();page.locator('#file-import').set_input_files(str(profile.resolve()))
    page.wait_for_function('HonroApp.profile?.lastStage===23',timeout=60000)
    page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp');page.locator('.title-actions [data-action="continue"]').first.click();page.wait_for_function('HonroApp.engine?.b.honroStage===23',timeout=60000)
    loaded=state();assert loaded['round']==battle['round'] and loaded['shots']==battle['shot'] and loaded['pacing']==battle['honroReviewed23PacingCandidate']
    assert page.evaluate('(t)=>JSON.stringify(HonroApp.engine.b.terrain)===JSON.stringify(t)',battle['terrain'])
    assert page.evaluate('(h)=>Object.keys(h).every(k=>JSON.stringify(HonroApp.profile.heroes[k].ranks)===JSON.stringify(h[k].ranks)&&HonroApp.profile.heroes[k].xp===h[k].xp)',saved['heroes'])
    ready();check_hud(state());row={'label':label,'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'entry':snap_clear(label+'-entry')};R['views'].append(row)
    return row

def one_turn():
    if not ready():return False
    if interact():return True
    if escort_walk(before_fire=True):
        if not ready():return False
        if interact():return True
    ctx=plan(first_search=True)
    if fire(ctx):return True
    s=state();threat=ctx['threat']
    if threat:road_advance(threat['x'],95 if s['active']['cls']=='knight' else 170)
    elif ctx['goal'] and ctx['goal']['id']=='dispatch-bundle':road_advance(2390)
    elif ctx['goal'] and ctx['goal']['kind']=='escort':escort_walk()
    if not ready():return False
    if interact():return True
    ctx=plan()
    if fire(ctx):return True
    s=state();threat=ctx['threat']
    if threat and s['active']['cls']!='knight' and 96<abs(threat['x']-s['active']['x'])<=190 and abs(threat['y']-s['active']['y'])<220 and s['active']['move']>20:
        road_advance(threat['x'],95)
        if not ready():return False
        if fire(plan(threat['id'])):return True
    if try_hop(threat):
        if not ready():return False
        if fire(plan(threat['id'])):return True
    before=state()
    if click_battle(page.locator('[data-action="defend"]')):
        record('public-defend',round=before['round'],before=before);ready()
    return True

try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True)
        row=open_saved(browser,SOURCE,'desktop-fresh',1440,900,False)
        for _ in range(20):
            assert state()['round']<=4,'Bounded publication first-shot check exceededR4'
            one_turn()
            if any(a['op']=='fire' and a['accepted'] for a in R['actions']):break
        assert any(a['op']=='fire' and a['accepted'] for a in R['actions'])
        row['firstShot']=snap_clear('desktop-first-shot');check_hud(row['firstShot']);row['firstShotAccepted']=True
        context.close()

        row=open_saved(browser,FINAL,'landscape-r19',844,390,True)
        for _ in range(12):
            if terminal(state()):break
            assert state()['round']<=21,'Bounded publication exit check exceededR21'
            one_turn()
        ready();row['outcome']=snap('public-outcome');assert row['outcome']['phase']=='won'
        assert row['outcome']['npc']['hp']>0 and all(row['outcome']['done'].get(k) for k in ['dispatch-bundle','dock-mid','dock-exit'])
        reward=page.evaluate('({clear:HonroApp.profile.cleared[23],heroes:HonroApp.profile.heroes,equipment:HonroApp.profile.equipment,growth:HonroApp.profile.honroGrowth})')
        assert reward['clear']['visits']==1 and reward['growth']['stages']['23']['contribution']['total']==31548
        page.locator('[data-action="result-continue"]').click()
        for _ in range(100):
            if page.locator('.rest-screen').count():break
            if state()['dialogue']:page.locator('[data-action="dialogue-next"]').last.click()
            page.wait_for_timeout(150)
        assert page.locator('.rest-screen').count()==1 and page.evaluate('HonroApp.engine===null')
        row['rest']=snap('public-rest');page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp')
        assert page.evaluate('({clear:HonroApp.profile.cleared[23],heroes:HonroApp.profile.heroes,equipment:HonroApp.profile.equipment,growth:HonroApp.profile.honroGrowth})')==reward
        snap('public-reload');row['settlementReloadExact']=True;row['reward']=reward;context.close()

        row=open_saved(browser,SOURCE,'portrait-fresh',390,844,True)
        before=state();touch('#joystick',0,-28,250);after=state();assert after['active']['angle']!=before['active']['angle']
        row['touchAim']=snap_clear('portrait-touch-aim');before=state();move(1,150);after=state();assert after['active']['x']>before['active']['x']
        row['touchMove']=snap_clear('portrait-touch-move');check_hud(row['touchMove'])
        page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(180);row['rotation']=snap_clear('portrait-to-landscape');check_hud(row['rotation'])
        row['touchAndRotationPassed']=True;context.close();browser.close()
    R['passed']=not R['errors']
except Exception:
    R['failure']=traceback.format_exc()
    try:R['failureState']=snap('failure')
    except Exception:pass
finally:
    R['wallSeconds']=time.monotonic()-START;persist();print(json.dumps({k:v for k,v in R.items() if k not in ['actions','enemyObservations','rounds','views']},ensure_ascii=False),flush=True)
if not R['passed']:raise SystemExit(1)
