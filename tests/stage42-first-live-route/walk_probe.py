"""QA-helper library. Call once with exact receipt strings retained runner-locally."""
import json
import time
from pathlib import Path
HERE=Path(__file__).parent

def controlled_move(page, key, until, timeout=8):
    assert key in {'KeyA','KeyD','ArrowLeft','ArrowRight'}
    page.keyboard.down(key)
    trace=[]
    try:
        expires=time.monotonic()+timeout
        while time.monotonic()<expires:
            state=page.evaluate('HonroQaObserveStage42()')
            trace.append(state)
            if until(state) or state['errors'] or state['dialogue'] or not state['canInput']:
                break
            page.wait_for_timeout(75)
    finally:
        page.keyboard.up(key)
    return trace

def ladder_roundtrip_when_at_foot(page):
    """Late authentic gate only; refuses report if no verified reachable input state."""
    pre=page.evaluate('HonroQaObserveStage42()')
    assert 'a5-cross-0' in pre['eligible'] and pre['grounded'] and pre['move']>=300, pre
    page.keyboard.press('KeyE')
    page.wait_for_function('()=>Math.abs(HonroQaObserveStage42().y-1339.3)<48',timeout=3000)
    upper=page.evaluate('HonroQaObserveStage42()')
    assert 'a5-cross-1' in upper['eligible'] and upper['active']==pre['active'] and upper['move']==pre['move']-150, upper
    page.keyboard.press('KeyE')
    page.wait_for_function('()=>Math.abs(HonroQaObserveStage42().y-2075.68)<48',timeout=3000)
    lower=page.evaluate('HonroQaObserveStage42()')
    assert lower['active']==pre['active'] and lower['move']==pre['move']-300 and lower['grounded'],lower
    return {'pre':pre,'upper_by_stock_E':upper,'return_by_stock_E':lower}

def initial_only(browser, base, details, gate, bundle, url, report, screenshot):
    """No fake later state: exercises only natural first movement, so no ladder or phase pass claim."""
    assert url.startswith(('http://127.0.0.1:','http://localhost:')) and url.endswith('/HONRO.html')
    ctx=browser.new_context(viewport={'width':1280,'height':800},device_scale_factor=1)
    try:
        ctx.add_init_script(script="""
        (()=>{const attempts=[];
          Object.defineProperty(window,'HonroQaStorageAttempts',{value:attempts});
          for (const op of ['setItem','removeItem','clear']) {
            Object.defineProperty(Storage.prototype,op,{configurable:false,writable:false,value:function(){
              attempts.push(op);throw Error('Local QA blocks storage write');
            }});
          }
        })();
        """)
        p=ctx.new_page()
        errors=[]
        p.on('pageerror',lambda err:errors.append(str(err)))
        p.goto(url,wait_until='domcontentloaded')
        p.wait_for_function('window.HONRO_APP_READY && window.HonroApp',timeout=90000)
        p.add_script_tag(content=bundle)
        entry=p.evaluate((HERE/'isolated-harness.js').read_text(),{'baseRaw':base,'detailRaw':details,'gateRaw':gate})
        for _ in range(32):
            if not p.evaluate('HonroQaObserveStage42().dialogue'):
                break
            p.keyboard.press('Space')
            p.wait_for_timeout(120)
        p.wait_for_function('HonroQaObserveStage42().canInput',timeout=10000)
        a=p.evaluate('HonroQaObserveStage42()')
        forward=controlled_move(p,'KeyD',lambda q:q['x']-a['x']>=80)
        b=p.evaluate('HonroQaObserveStage42()')
        assert b['x']>=a['x']+40 and abs(b['y']-2075.68)<8 and b['grounded'], b
        reverse=controlled_move(p,'KeyA',lambda q:b['x']-q['x']>=50)
        c=p.evaluate('HonroQaObserveStage42()')
        assert c['x']<=b['x']-25 and c['grounded'] and c['unchangedTerrain'] and c['storeSize']==0 and c['storageWriteAttempts']==0 and not c['errors'] and not errors, (c,errors)
        p.screenshot(path=str(screenshot))
        report.write_text(json.dumps({'entry':entry,'held_motion_start':a,'held_forward':forward,'held_reverse':reverse,'end':c,'scope':'initial natural lower approach only; rescue/escort/drum/ladder/full combat NOT run'},indent=2))
    finally:
        ctx.close()
