"""Resume an observed normal-input save; use real browser inputs without battle edits.
Input is a portable profile or stage5-final-input checkpoint, never a posed fixture.
Run: python tests/stage5-normal-input-browser.py <save.json> [output-directory]
"""
import json, sys, hashlib, time
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch, serve_game

source = Path(sys.argv[1]).resolve()
raw = json.loads(source.read_text())
profile = raw.get('profile', raw)
if 'battle' in raw:
    profile = {**profile, 'honroBattle': raw['battle'], 'lastStage': 5}
assert profile['honroBattle']['honroStage'] == 5
assert not profile.get('settings', {}).get('debugMode')
out = ROOT / (sys.argv[2] if len(sys.argv) > 2 else '_local/reports/stage5-normal-browser')
out.mkdir(parents=True, exist_ok=True)
STATE = '''()=>{const b=HonroApp.engine.b;return {round:b.round,active:b.active,
units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,dead:!!u.dead})),state:b.honroState}}'''
rows=[]
with serve_game() as base, sync_playwright() as p:
    browser=launch(p)
    for w,h in [(1440,900),(390,844),(844,390)]:
        ctx=browser.new_context(viewport={'width':w,'height':h},has_touch=w<900,is_mobile=w<900)
        page=ctx.new_page(); errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.add_init_script('if(!sessionStorage.getItem("seeded")){localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');sessionStorage.setItem("seeded","1");}')
        def ready():
            page.wait_for_function('window.HonroApp');page.evaluate('async()=>await HONRO_APP_READY')
            page.locator('[data-action="continue"]').click()
            page.wait_for_function('HonroApp.engine && HonroApp.canInput()')
        page.goto(base+'/HONRO.html');ready();page.wait_for_timeout(1600)
        page.screenshot(path=str(out/f'entry-{w}.png'))
        before=page.evaluate(STATE); actor=before['active']
        if w<900:
            # Genuine Chromium touch events routed through the production joystick.
            box=page.locator('#joystick').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
            cdp=ctx.new_cdp_session(page)
            cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
            cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+box['width']*.35,'y':y}]})
            page.wait_for_timeout(300)
            cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        else:
            page.keyboard.down('ArrowRight');page.wait_for_timeout(300);page.keyboard.up('ArrowRight')
        after=page.evaluate(STATE)
        u0=next(u for u in before['units'] if u['id']==actor);u1=next(u for u in after['units'] if u['id']==actor)
        assert u1['x']>u0['x'] and u1['moveLeft']<u0['moveLeft'],(u0,u1)
        # End this turn via the visible defense control and let enemy AI run.
        if w<900:page.locator('[data-action="defend"]').tap()
        else:page.locator('[data-action="defend"]').click()
        page.wait_for_function('(id)=>HonroApp.canInput() && HonroApp.engine.b.active!==id',arg=actor,timeout=60000)
        page.wait_for_timeout(1600)
        page.locator('[data-action="combat-skill"]').first.click()
        shot_before=page.evaluate('()=>HonroApp.engine.b.shot')
        fire=page.locator('#fire').bounding_box();fx=fire['x']+fire['width']/2;fy=fire['y']+fire['height']/2
        if w<900:
            cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':fx,'y':fy}]})
            page.wait_for_timeout(800)
            cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        else:
            page.mouse.move(fx,fy);page.mouse.down();page.wait_for_timeout(800);page.mouse.up()
        print('FIRE',w,shot_before,page.evaluate('()=>({shot:HonroApp.engine.b.shot,charging:HonroApp.charging,input:HonroApp.canInput(),active:HonroApp.engine.b.active,phase:HonroApp.engine.b.phase,selected:HonroApp.selected,error:HonroApp.lastError,dialogue:HonroApp.dialogue?.id})'),flush=True)
        lines=[];deadline=time.monotonic()+90
        while time.monotonic()<deadline:
            if page.locator('[data-action="dialogue-next"]:visible').count():
                lines.append(page.locator('#story-line').inner_text())
                page.locator('[data-action="dialogue-next"]:visible').click()
            if page.evaluate('(shot)=>HonroApp.engine.b.shot>shot && HonroApp.canInput()',shot_before):break
            page.wait_for_timeout(300)
        else:
            page.screenshot(path=str(out/f'blocked-{w}.png'))
            raise AssertionError(page.evaluate('()=>({phase:HonroApp.engine.b.phase,dialogue:HonroApp.dialogue,modal:HonroApp.modalKind,error:HonroApp.lastError})'))
        shot_after=page.evaluate('()=>HonroApp.engine.b.shot')
        page.locator('[data-action="pause"]').click();saved=page.evaluate(STATE)
        page.wait_for_timeout(500);assert saved==page.evaluate(STATE),'pause must freeze battle'
        page.locator('[data-action="settings"]').click();page.locator('[data-action="settings-page"][data-id="records"]').click()
        with page.expect_download() as download:page.locator('[data-action="export"]').click()
        download.value.save_as(str(out/f'save-{w}.json'))
        page.reload();ready();restored=page.evaluate(STATE)
        assert saved==restored,'reload/Continue must retain actors, resources and objective state'
        page.wait_for_timeout(1600);page.screenshot(path=str(out/f'resumed-{w}.png'))
        assert not errors,errors
        rows.append({'width':w,'height':h,'touch':w<900,'shots':[shot_before,shot_after],'dialogueLines':lines,'before':before,'after':after,'saved':saved,'restored':restored,'errors':errors})
        ctx.close();print('PASS',w,h,'movement, defense, charge/fire, pause, export, reload/Continue',flush=True)
    browser.close()
(out/'summary.json').write_text(json.dumps({'input':str(source),'inputSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'scope':'Observed save continuation, real Chromium keyboard/touch and UI; not a physical phone or full browser playthrough.','rows':rows},ensure_ascii=False,indent=2)+'\n')
