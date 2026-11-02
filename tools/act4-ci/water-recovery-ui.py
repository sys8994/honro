"""Recorded Stage34 pending recovery through real import/Continue inputs.

This restores a recorded localStorage profile, not a new campaign playthrough.
The server must contain the exact assembled candidate world. Live state is read
only: no actor position, HP, receipt, or completion state is injected.
"""
import hashlib
import json
import lzma
import os
import traceback
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[2]
out = Path(os.environ.get('HONRO_QA_OUT', '_local/reports/github-qa')) / 'stage34-water'
out.mkdir(parents=True, exist_ok=True)
raw = lzma.decompress((root / 'tests/fixtures/act4-stage34-water/water-pending-r2.json.xz').read_bytes())
fixture_sha = hashlib.sha256(raw).hexdigest()
assert fixture_sha == 'ce8b9b7cbe040f012262046ee578a52a28d5eb994d684570c629d11398f2991c'
source = out / 'recorded-profile.json'
source.write_bytes(raw)
result = {'scope': 'recorded pending state UI import, recovery, movement and same-context reload',
          'sourceCommit': os.environ.get('GITHUB_SHA'), 'fixtureSha256': fixture_sha,
          'releaseApproved': False, 'passed': False, 'runs': []}
state_js = """() => {
  const a=HonroApp,b=a.engine.b,q=b.honroAct4PreviewState,u=b.units.find(v=>v.id==='knight');
  return {stage:b.honroStage,round:b.round,phase:b.phase,active:b.active,
    knight:{x:u.x,y:u.y,hp:u.hp,maxHp:u.maxHp,grounded:a.engine.grounded(u),
      pending:!!u.honroAct4RecoverPending,recovering:!!u.honroAct4Recovering},
    heroes:b.units.filter(v=>v.side===0).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:!!v.dead})),
    recoveries:q.water.recoveries,receipts:q.receipts||[],complete:!!q.complete};
}"""
try:
    with sync_playwright() as w:
        browser = w.chromium.launch(headless=True)
        result['browserVersion'] = browser.version
        for name, viewport in [('desktop', {'width': 1440, 'height': 900}),
                               ('mobile', {'width': 390, 'height': 844})]:
            context = browser.new_context(viewport=viewport)
            page = context.new_page()
            item = {'name': name, 'passed': False, 'errors': [], 'inputs': []}
            result['runs'].append(item)
            page.on('pageerror', lambda error, target=item: target['errors'].append(str(error)))
            try:
                page.goto(os.environ['HONRO_QA_URL'], wait_until='domcontentloaded')
                page.wait_for_function('window.HonroApp', timeout=60000)
                page.locator('[data-action="settings"]').first.click()
                page.get_by_text('기록·관리', exact=False).click()
                page.get_by_text('JSON 기록 가져오기', exact=True).click()
                page.get_by_text('파일 선택', exact=True).click()
                page.locator('#file-import').set_input_files(str(source.resolve()))
                item['inputs'].append('settings -> record management -> import recorded profile file')
                page.wait_for_function('HonroApp.profile.honroBattle?.honroStage===34', timeout=60000)
                page.reload()
                page.wait_for_function('window.HonroApp', timeout=60000)
                page.get_by_text('이어서 걷기', exact=True).click()
                item['inputs'].append('reload -> Continue')
                page.wait_for_function('''() => {
                  const a=window.HonroApp,b=a?.engine?.b,u=b?.units.find(v=>v.id==='knight');
                  return b?.honroStage===34 && u && !u.honroAct4Recovering &&
                    !u.honroAct4RecoverPending && a.engine.grounded(u);
                }''', timeout=30000)
                recovered = page.evaluate(state_js)
                item['recovered'] = recovered
                k = recovered['knight']
                assert k['hp'] == 2283 and k['grounded'] and 2200 <= k['x'] <= 2500, recovered
                assert 3380 <= k['y'] < 3890 and len(recovered['recoveries']) == 1, recovered
                assert recovered['recoveries'][0]['hpLoss'] == 762 and not recovered['complete'], recovered
                assert recovered['phase'] == 'aim' and recovered['active'] == 'archer', recovered
                assert all(not h['dead'] and h['hp'] > 0 for h in recovered['heroes']), recovered
                # Normal minimap input brings the recovered bank into view.
                dimensions = page.evaluate('({w:HonroApp.engine.b.width,h:HonroApp.engine.b.height})')
                box = page.locator('#minimap').bounding_box()
                assert box, 'minimap must be available for an ordinary camera input'
                page.mouse.click(box['x'] + box['width'] * k['x'] / dimensions['w'],
                                 box['y'] + box['height'] * (k['y'] - 100) / dimensions['h'])
                item['inputs'].append('minimap click at recovered bank')
                page.wait_for_timeout(200)
                page.screenshot(path=str(out / f'{name}-recovered-bank.png'))
                before = next(h for h in recovered['heroes'] if h['id'] == 'archer')['x']
                page.keyboard.down('ArrowRight')
                page.wait_for_timeout(120)
                page.keyboard.up('ArrowRight')
                page.wait_for_timeout(300)
                moved = page.evaluate(state_js)
                assert next(h for h in moved['heroes'] if h['id'] == 'archer')['x'] != before, moved
                item['inputs'].append('ArrowRight hold 120ms -> release')
                item['beforeReload'] = moved
                page.reload()
                page.wait_for_function('window.HonroApp', timeout=60000)
                page.get_by_text('이어서 걷기', exact=True).click()
                page.wait_for_function('HonroApp.engine?.b?.honroStage===34', timeout=60000)
                page.wait_for_timeout(400)
                resumed = page.evaluate(state_js)
                item['afterReload'] = resumed
                item['inputs'].append('same-context reload -> Continue; no reseeding')
                assert resumed['knight'] == moved['knight'], (moved, resumed)
                assert resumed['recoveries'] == moved['recoveries'] and len(resumed['recoveries']) == 1
                assert not resumed['complete'] and not item['errors'], item
                page.screenshot(path=str(out / f'{name}-resumed.png'))
                item['passed'] = True
            except Exception:
                try:
                    page.screenshot(path=str(out / f'{name}-failure.png'))
                except Exception:
                    pass
                raise
            finally:
                context.close()
        browser.close()
    result['passed'] = True
except Exception:
    result['error'] = traceback.format_exc()
finally:
    source.unlink(missing_ok=True)  # fixture already lives in Git; avoid duplicate artifact payload
    (out / 'result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result, ensure_ascii=False), flush=True)
if not result['passed']:
    raise SystemExit(1)
