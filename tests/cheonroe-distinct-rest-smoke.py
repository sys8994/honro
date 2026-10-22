"""Narrow production rest/journal/input smoke, using established profile helpers."""
import ast,json,subprocess
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'game/docs/cheonroe-distinct-bolts/evidence'
tree=ast.parse((ROOT/'tests/rest-hub-journey-browser.py').read_text())
helpers={n.targets[0].id:n.value.value for n in tree.body if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and isinstance(n.value,ast.Constant)}
exec(compile(ast.Module(body=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in ['setup','inside']],type_ignores=[]),'<existing rest helpers>','exec'),helpers)
rows=[];errors=[]
with sync_playwright() as pw,serve_game() as base:
    browser=launch(pw)
    for width,height in [(390,844),(1280,900)]:
        page=browser.new_page(viewport={'width':width,'height':height},has_touch=True)
        page.on('pageerror',lambda error:errors.append(str(error)))
        page.goto(base+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp')
        helpers['setup'](page)
        page.locator('[data-action="journey-book"]').click()
        assert page.locator('[data-action="journey-act"][data-id="2"]').is_disabled()
        pin=page.locator('[data-action="journey-select"][data-id="5"]');pin.scroll_into_view_if_needed();pin.click()
        assert page.locator('[data-action="journey-travel"]').inner_text()=='휴식터로 진입'
        assert helpers['inside'](page,'.journey-detail')
        page.locator('[data-action="journey-travel"]').click();page.wait_for_function('HonroApp.screen==="rest"')
        page.evaluate(helpers['FINISH']);page.wait_for_timeout(450)
        page.locator('[data-action="journey-enter"]').click();page.wait_for_function('HonroApp.screen==="battle"');page.evaluate(helpers['FINISH'])
        assert page.evaluate('HonroApp.engine.b.honroStage===5&&HonroApp.engine.b.round===1')
        page.evaluate('HonroApp.pause()');before=page.evaluate('JSON.stringify(HonroApp.engine.b)')
        page.locator('.pause-menu [data-action="rest"]').click()
        assert helpers['inside'](page,'.journey-confirm')
        assert page.evaluate('JSON.stringify(HonroApp.engine.b)')==before
        session=page.evaluate('HonroApp.engine.b.session')
        page.locator('[data-action="cancel-journey-launch"]').click()
        assert page.evaluate('HonroApp.engine.b.session')==session
        page.evaluate('HonroApp.pause()');page.locator('.pause-menu [data-action="rest"]').click()
        page.locator('[data-action="confirm-journey-launch"]').click();page.wait_for_function('HonroApp.screen==="rest"');page.evaluate(helpers['FINISH'])
        assert page.evaluate('HonroApp.engine===null&&HonroApp.profile.honroBattle===null')
        page.reload();page.wait_for_function('!!globalThis.HonroApp');page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="rest"');page.evaluate(helpers['FINISH'])
        assert page.evaluate('HonroApp.engine===null&&HonroApp.profile.honroBattle===null')
        rows.append({'viewport':[width,height],'flow':'rest → journal/select/CTA → rest → new battle → return confirmation/cancel/confirm → reload/Continue','savePreservedDuringConfirmation':True,'newBattleRound':1})
        page.close()
    version=browser.version;browser.close()
assert not errors,errors
(OUT/'rest-smoke-results.json').write_text(json.dumps({'status':'passed','runtimeCommit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'browser':version,'rows':rows,'pageErrors':errors,'scope':'Actual Chromium/public UI on cleared4 fixture; no campaign completion or Act2 fixture-switch claim.'},ensure_ascii=False,indent=2)+'\n')
print('PASS rest smoke: 390/1280 actual journal/hub/new battle/confirmation/cancel/save/reload/Continue; pageerrors0')
