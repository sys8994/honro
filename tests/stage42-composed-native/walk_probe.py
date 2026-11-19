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
        ctx.add_init_script(script=r"""
        (()=>{const attempts=[];
          Object.defineProperty(window,'HonroQaStorageAttempts',{value:attempts});
          Object.defineProperty(window,'HonroQaStorageCheck',{value:{stage:'loading'}});
          const cleanStack=()=>String(new Error().stack).split('\n').slice(2,8).map(line=>{
            const m=line.match(/(https?:\/\/(?:localhost|127\.0\.0\.1):[0-9]+\/[^ :)?#]+)(:[0-9]+:[0-9]+)/);
            if(!m)return null;
            return new URL(m[1]).pathname.split('/').pop()+m[2];
          }).filter(Boolean);
          for (const op of ['setItem','removeItem','clear']) {
            Object.defineProperty(Storage.prototype,op,{configurable:false,writable:false,value:function(key){
              const storage=this===window.localStorage?'local':this===window.sessionStorage?'session':'other';
              const known=typeof key==='string'&&/^[A-Za-z0-9_.:-]{1,95}$/.test(key)&&!/secret|auth|token|credential|session|password|account|api.?key/i.test(key);
              attempts.push({op,store:storage,key:known?key:op==='clear'?null:'(redacted)',checkpoint:window.HonroQaStorageCheck.stage,source:cleanStack()});
              throw Error('Local QA blocks storage write');
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
        p.evaluate("HonroQaStorageCheck.stage='before-stage-loader'")
        entry=p.evaluate((HERE/'isolated-harness.js').read_text(),{'baseRaw':base,'detailRaw':details,'gateRaw':gate})
        p.evaluate("HonroQaStorageCheck.stage='intro-normal-input'")
        for _ in range(32):
            if not p.evaluate('HonroQaObserveStage42().dialogue'):
                break
            p.keyboard.press('Space')
            p.wait_for_timeout(120)
        p.wait_for_function('HonroQaObserveStage42().canInput',timeout=10000)
        a=p.evaluate('HonroQaObserveStage42()')
        p.evaluate("HonroQaStorageCheck.stage='held-d'")
        forward=controlled_move(p,'KeyD',lambda q:q['x']-a['x']>=80)
        b=p.evaluate('HonroQaObserveStage42()')
        assert b['x']>=a['x']+40 and abs(b['y']-2075.68)<8 and b['grounded'], b
        p.evaluate("HonroQaStorageCheck.stage='held-a'")
        reverse=controlled_move(p,'KeyA',lambda q:b['x']-q['x']>=50)
        c=p.evaluate('HonroQaObserveStage42()')
        attempts=p.evaluate('structuredClone(HonroQaStorageAttempts)')
        p.screenshot(path=str(screenshot))
        exact_no_effect=c['storeSize']==0
        action_ok=c['x']<=b['x']-25 and c['grounded'] and c['unchangedTerrain'] and not c['errors'] and not errors
        report.write_text(json.dumps({'entry':entry,'held_motion_start':a,'held_forward':forward,'after_forward':b,'held_reverse':reverse,
               'end':c,'storage':{'blocked_attempts':attempts,'store_size':c['storeSize'],'effects_zero':exact_no_effect},
               'motion_pass':bool(action_ok),'pass':bool(action_ok and exact_no_effect and not attempts),
               'scope':'initial natural lower approach only; rescue/escort/drum/ladder/full combat NOT run'},indent=2))
        assert action_ok and exact_no_effect and not attempts, (c,attempts,errors)
    finally:
        ctx.close()
