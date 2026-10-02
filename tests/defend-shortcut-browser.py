"""Real F input must match the defend button and respect combat/UI input gates."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

OUT = ROOT / '_local/reports/defend-shortcut'
OUT.mkdir(parents=True, exist_ok=True)
checks, errors = [], []

def check(name, ok, detail=None):
    assert ok, (name, detail)
    checks.append({'name':name, 'detail':detail})
    print('PASS', name, flush=True)

SETUP = '''()=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();
 a.launchMap(HONRO_PROJECT,'stage-1',{story:false});a.dialogue=null;a.turnNotice=null;a.close();a.cancelInput();
 const e=a.engine,b=e.b;for(let i=0;i<120;i++)e.stepUnits(HONRO_CORE.STEP);const u=e.active;
 u.hp=Math.floor(u.maxHp*.5);u.focus=0;u.shield=0;window.defendUnit=u.id;
 const cv=document.querySelector('#battlecanvas');cv.tabIndex=0;cv.focus();
 Object.assign(a.scene,{manual:true,x:u.x+220,y:u.y-150,scale:.66});a.updateHUD(true);a.scene.render(e,0,a.selected,.6,false,0);
 return a.canInput();}'''
STATE = '''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.unit(window.defendUnit);return {hp:u.hp,focus:u.focus,shield:u.shield,
 shieldUntil:u.shieldUntil,acted:u.acted,phase:b.phase,side:b.side,active:b.active,round:b.round,shot:b.shot,projectiles:b.projectiles.length};}'''

with sync_playwright() as pw:
    browser = launch(pw)
    for shell, filename in [('Game','HONRO.html'),('Playtest','HONRO_WORKSHOP.html')]:
        owner = browser.new_page(viewport={'width':1440,'height':900})
        owner.on('pageerror', lambda e: errors.append(str(e)))
        owner.goto((ROOT/filename).as_uri())
        if shell == 'Playtest':
            owner.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene')
            owner.click('[data-tab="play"]')
            owner.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
            page = owner.frames[1]
        else:
            page = owner
            page.wait_for_function('window.HonroApp && window.HONRO_PROJECT')

        def reset():
            assert page.evaluate(SETUP), shell+' setup must allow a real action'

        reset()
        initial = page.evaluate(STATE)
        page.locator('[data-action="defend"]').click()
        button = page.evaluate(STATE)
        check(shell+': button grants defense and recovery',button['shield']>0 and button['hp']>initial['hp'] and button['focus']>initial['focus'])
        reset()
        owner.keyboard.press('f')
        check(shell+': F has the same combat outcome as clicking defend',page.evaluate(STATE)==button,page.evaluate(STATE))
        page.evaluate('HonroApp.scene.render(HonroApp.engine,0,HonroApp.selected,.6,false,0)')
        page.locator('#battlecanvas').screenshot(path=str(OUT/(shell+'-defend.png')))
        ended = page.evaluate('''()=>{const e=HonroApp.engine;for(let i=0;i<120&&e.b.phase==='review';i++)e.tick(HONRO_CORE.STEP);
          return{acted:e.unit(window.defendUnit).acted,phase:e.b.phase,canInput:HonroApp.canInput()};}''')
        check(shell+': the normal review advances and ends this character action',ended['acted'] and ended['phase']!='review',ended)

        reset()
        owner.keyboard.down('f')
        reset()  # Keep the physical key held while the next eligible action appears.
        before = page.evaluate(STATE)
        owner.keyboard.down('f')
        check(shell+': holding F cannot defend again on an eligible action',page.evaluate(STATE)==before)
        owner.keyboard.up('f')

        for target in ['input','textarea','select','contenteditable']:
            reset()
            page.evaluate('''kind=>{const el=document.createElement(kind==='contenteditable'?'div':kind);el.id='key-input-test';
              if(kind==='contenteditable')el.contentEditable='true';if(kind==='select')el.innerHTML='<option>test</option>';
              document.body.append(el);el.focus();}''',target)
            before=page.evaluate(STATE)
            owner.keyboard.press('f')
            check(shell+': F in '+target+' does not spend an action',page.evaluate(STATE)==before)
            page.evaluate('document.querySelector("#key-input-test").remove()')

        for key in ['Control+f','Alt+f','Meta+f']:
            reset()
            before=page.evaluate(STATE)
            owner.keyboard.press(key)
            check(shell+': '+key+' is not a defend command',page.evaluate(STATE)==before)

        for block in ['modal','dialogue','enemy']:
            reset()
            page.evaluate('''kind=>{const a=HonroApp;if(kind==='modal')a.pause();
              else if(kind==='dialogue')HonroStory.start(a,[['설오','잠시 기다리자.']],{title:'단축키 확인'});
              else{a.engine.b.phase='enemy';a.engine.b.side=1;}}''',block)
            before=page.evaluate(STATE)
            owner.keyboard.press('f')
            check(shell+': '+block+' blocks defense',page.evaluate(STATE)==before)

        reset()
        owner.keyboard.down('Space')
        check(shell+': charge fixture uses actual Space input',page.evaluate('HonroApp.charging'))
        owner.keyboard.press('f')
        owner.keyboard.up('Space')
        charge=page.evaluate('({charging:HonroApp.charging,keys:HonroApp.keys.size,state:('+STATE+')()})')
        check(shell+': F cancels charge without a late shot on Space release',not charge['charging'] and charge['keys']==0 and charge['state']['projectiles']==0 and charge['state']['shield']>0,charge)

        reset()
        page.evaluate('HonroApp.engine.active.retreat=true')
        before=page.evaluate(STATE)
        owner.keyboard.press('f')
        retreat=page.evaluate(STATE)
        check(shell+': retreat ends without granting defense or recovery',retreat['acted'] and all(retreat[k]==before[k] for k in ['hp','focus','shield']),retreat)
        check(shell+': button advertises the shortcut',page.locator('[data-action="defend"]').get_attribute('aria-keyshortcuts')=='F')
        owner.close()
    browser.close()

check('No browser errors',not errors,errors)
(OUT/'report.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
print('DEFEND SHORTCUT PASS',len(checks))
