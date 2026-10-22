"""Chromium CDP touch synthesis -> trusted browser PointerEvents -> production HUD/loop.
This is browser emulation, not a physical touchscreen/device test.
"""
import json, math, os, subprocess
FOCUS=os.environ.get("HONRO_JOYSTICK_FOCUS", "")
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch, serve_game
OUT=ROOT/os.environ.get('HONRO_JOYSTICK_OUT','_local/reports/joystick-intent');OUT.mkdir(parents=True,exist_ok=True)
checks=[]; traces=[]; errors=[]
def check(name,ok,data=None):
    if not ok:
        (OUT/'partial-trace.json').write_text(json.dumps({'failed':name,'data':data,'states':traces,'events':page.evaluate('inputEvents')},ensure_ascii=False,indent=2))
    assert ok,(name,data)
    checks.append({'name':name,'data':data});print('PASS',name,flush=True)
with sync_playwright() as pw,serve_game() as base:
    browser=launch(pw);page=browser.new_page(viewport={'width':390,'height':844},has_touch=True,device_scale_factor=2)
    page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp')
    page.evaluate("()=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;a.updateAudio();a.launch(1,true,'A01')}")
    page.wait_for_function('HonroApp.engine')
    page.evaluate('''()=>{
      window.inputEvents=[];for(const name of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])document.addEventListener(name,e=>inputEvents.push({type:name,id:e.pointerId,pointerType:e.pointerType,x:e.clientX,y:e.clientY,trusted:e.isTrusted,target:e.target.id}),true);
      window.setupInput=()=>{const a=HonroApp;a.launch(1,true,'A01');a.dialogue=null;a.turnNotice=null;a.updateHUD(true);a.scene.manual=true;window.moveCalls=[];const e=a.engine,move=e.move.bind(e);e.move=(...v)=>{moveCalls.push(v);return move(...v)};a.scene.renderOriginal=a.scene.render;a.scene.render=()=>{};};
      window.advanceInput=(frames=8)=>{const a=HonroApp;for(let i=0;i<frames;i++)Object.getPrototypeOf(a).frame.call(a,a.prev+1000/60)};
      window.snapshotInput=()=>{const a=HonroApp,u=a.engine.active;return{x:u.x,y:u.y,budget:u.moveLeft,angle:u.angle,facing:u.facing,vx:u.vx,vy:u.vy,intent:a.stick.intent,axes:{...a.stick},pointer:a.stickPointer?.id,fire:a.firePointer,charging:a.charging,moveCalls:moveCalls.length,label:document.querySelector('.stick-mode').textContent,knob:document.querySelector('#stick-knob').style.transform}};
      window.paintInput=()=>{const a=HonroApp;a.updateHUD(true);a.scene.renderOriginal.call(a.scene,a.engine,1/60,a.selected,a.power,a.charging,1/60,false)};
    }''')
    cdp=page.context.new_cdp_session(page);touches={}
    def touch(kind,i,x=None,y=None):
        if kind in ['touchStart','touchMove']:touches[i]={'id':i,'x':x,'y':y,'radiusX':2,'radiusY':2,'force':1}
        elif kind=='touchEnd':ended=touches.pop(i)
        elif kind=='touchCancel':touches.clear()
        # For touchEnd CDP names the ending contacts, not the remaining ones.
        points=[ended] if kind=='touchEnd' else list(touches.values())
        cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':points})
        # Chromium aligns/coalesces touchmove to its next rendering opportunity.
        page.wait_for_timeout(24)
    def reset():
        if touches:touch('touchCancel',0)
        page.evaluate('setupInput()');r=page.locator('#joystick').bounding_box()
        # Start away from the pad centre to verify pointerdown-relative deltas.
        return (r['x']+r['width']/2+3,r['y']+r['height']/2+2,min(r['width'],r['height'])*.41)
    def state(tag,advance=8):
        if advance:page.evaluate('(n)=>advanceInput(n)',advance)
        s=page.evaluate('snapshotInput()');traces.append({'tag':tag,**s});return s
    def delta(origin,dx,dy,i=1):touch('touchMove',i,origin[0]+dx*origin[2],origin[1]-dy*origin[2])
    def start(o):touch('touchStart',1,o[0],o[1])
    def unchanged(a,b):return all(abs(a[k]-b[k])<1e-7 for k in ['x','y','budget'])
    # Focus review 1: both vertical cones, boundaries, initial jitter and move+aim.
    for w,h in ([] if FOCUS else [(320,740),(360,800),(390,844),(844,390)]):
        page.set_viewport_size({'width':w,'height':h})
        for sy in [-1,1]:
            for sx in [-1,1]:
                for angle in [19,20,21,45]:
                    o=reset();start(o);a=state(f'{w}:{sx}:{sy}:{angle}:down')
                    delta(o,.03,.03);tiny=state('tiny-jitter');check(f'{w} tiny jitter waits',tiny['intent']=='undecided' and unchanged(a,tiny) and tiny['moveCalls']==0,tiny)
                    rad=math.radians(angle);delta(o,sx*math.sin(rad),sy*math.cos(rad));s=state('first-effective')
                    expected='aimOnly' if angle<=20 else 'moveAim'
                    check(f'{w} {sx}/{sy} {angle} cone and budget',s['intent']==expected and (unchanged(a,s) and s['moveCalls']==0 if angle<=20 else abs(s['x']-a['x'])>.1 and s['budget']<a['budget']),s)
                    delta(o,0,0);centre=state('centre');delta(o,-sx,0);again=state('redrag')
                    check(f'{w} {angle} centre keeps intent',again['intent']==expected and (abs(again['x']-centre['x'])>.1 and again['budget']<centre['budget']),again)
                    touch('touchEnd',1)
        o=reset();start(o);a=state('threshold-down');delta(o,0,7.5/o[2]);s=state('7.5px');check(f'{w} below 8 CSS px waits',s['intent']=='undecided' and unchanged(a,s),s)
        delta(o,0,8.1/o[2]);s=state('8.1px');check(f'{w} above 8 CSS px chooses aim',s['intent']=='aimOnly' and unchanged(a,s),{'range':o[2],'threshold':max(8,o[2]*.18),**s});touch('touchEnd',1)
        o=reset();start(o);delta(o,0,1);delta(o,-.2,1);state('mobile-aim-only');page.evaluate('paintInput()');page.screenshot(path=str(OUT/f'mobile-{w}-aim-only.png'));touch('touchEnd',1)
    # P0 regression: same owning finger leaves/re-enters both vertical sectors.
    # At 19/20/21 degrees test both horizontal signs and both vertical axes.
    page.set_viewport_size({'width':390,'height':844})
    sector_evidence=[]
    def capture_sector(name):
        page.evaluate('paintInput()')
        page.screenshot(path=str(OUT/(name+'.jpg')),type='jpeg',quality=70,scale='css')
    for sy in [-1,1]:
        for sx in [-1,1]:
            o=reset();start(o);delta(o,0,sy);initial=state('sector-initial')
            if sy==1 and sx==1:capture_sector('01-vertical-start')
            for angle in [19,20,21,20,19,21,90,19]:
                before=state('sector-before',0);rad=math.radians(angle)
                delta(o,sx*math.sin(rad),sy*math.cos(rad));immediate=state('sector-event',0)
                check(f'sector {sx}/{sy} {angle} immediate axes',immediate['intent']=='aimOnly' and immediate['pointer']==initial['pointer'] and (immediate['axes']['x']==0 if angle<=20 else immediate['axes']['x']*sx>.01),immediate)
                after=state('sector-drag',3)
                check(f'sector {sx}/{sy} {angle} physics',unchanged(before,after) and after['moveCalls']==before['moveCalls'] if angle<=20 else (after['x']-before['x'])*sx>.1 and after['budget']<before['budget'] and after['moveCalls']>before['moveCalls'],after)
                if angle in [19,20,21]:
                    check(f'sector {sx}/{sy} {angle} keeps aim',abs(after['angle']-before['angle'])>.01,after)
                sector_evidence.append({'sx':sx,'sy':sy,'angle':angle,'before':before,'immediate':immediate,'after':after})
                if sy==1 and sx==1 and angle==90:capture_sector('02-outside-horizontal-movement')
            if sy==1 and sx==1:capture_sector('03-reentered-aim-only')
            touch('touchEnd',1);released=state('sector-up',0)
            check('sector release clears initial intent',released.get('pointer') is None and released['axes']['x']==0 and released['axes']['y']==0,released)
            # A horizontal start retains lateral movement even inside the cone.
            o=reset();start(o);delta(o,sx,0);initial=state('horizontal-start')
            for angle in [21,20,19,0,19]:
                before=state('horizontal-before',0);rad=math.radians(angle)
                delta(o,sx*math.sin(rad),sy*math.cos(rad));after=state('horizontal-to-vertical')
                check(f'horizontal {sx}/{sy} -> {angle} never locks',after['intent']=='moveAim' and after['pointer']==initial['pointer'] and (unchanged(before,after) if angle==0 else (after['x']-before['x'])*sx>.1 and after['budget']<before['budget']),after)
            if sy==1 and sx==1:capture_sector('04-horizontal-start-inside-sector')
            touch('touchEnd',1)
    # Focus review 2: deliberate facing threshold/hysteresis and same elevation before frame advancement.
    page.set_viewport_size({'width':390,'height':844})
    for sy in ([] if FOCUS else [-1,1]):
        o=reset();page.evaluate('HonroApp.engine.active.angle=35');start(o);delta(o,0,sy);a=state('face-vertical')
        for dx,expected in [(-.59,1),(-.61,-1),(-.59,-1),(-.36,-1),(-.34,-1),(.59,-1),(.61,1),(.59,1),(-.61,-1)]:
            before=state('face-before',0);delta(o,dx,0);s=state('face-after',0)
            check(f'face {sy} {dx}: deliberate turn without movement or pitch jump',s['facing']==expected and unchanged(a,s) and s['moveCalls']==0 and abs(math.sin(math.radians(before['angle']))-math.sin(math.radians(s['angle'])))<1e-7,s)
        delta(o,0,0);delta(o,1,0);s=state('locked-even-horizontal');check('large turn releases movement gate and keeps raw visual',s['budget']<a['budget'] and s['axes']['visualX']>.99 and s['axes']['x']>0 and s['knob']!='translate(0px, 0px)',s)
        touch('touchEnd',1);start(o);delta(o,-1,0);s=state('new-pointer-new-intent');check('release and opposite direction gets moveAim',s['intent']=='moveAim' and s['budget']<a['budget'],s);touch('touchEnd',1)
    # A diagonal-start gesture retains both aim and small lateral movement.
    o=reset();start(o);delta(o,.707,.707);a=state('diagonal-before-fine-aim')
    delta(o,.15,.98);s=state('diagonal-fine-aim')
    check('45 degree start allows fine movement while aiming up',s['intent']=='moveAim' and s['x']>a['x'] and s['budget']<a['budget'] and s['angle']>a['angle'],s)
    delta(o,0,1);a=state('diagonal-now-vertical');s=state('diagonal-vertical-held')
    check('45 degree start can aim vertically with zero lateral command',s['intent']=='moveAim' and s['axes']['x']==0 and unchanged(a,s) and s['angle']>a['angle'],s)
    touch('touchEnd',1)
    # Physics must continue during the input lock.
    o=reset();start(o);delta(o,0,1);a=state('impulse-before');page.evaluate('Object.assign(HonroApp.engine.active,{y:1100,vy:0,vx:120})');s=state('impulse-after',12)
    check('aim lock leaves falling and knockback live',s['y']>1100 and s['x']!=a['x'] and s['budget']==a['budget'] and s['intent']=='aimOnly',s);touch('touchEnd',1)
    # Focus review 3: pointer-local release/cancel, capture, global interruption and PC.
    for action in ([] if FOCUS else ['cancel','lost','blur','pause','hero','turn','engine-turn']):
        o=reset();start(o);delta(o,0,1);state(action+'-before')
        if action=='cancel':touch('touchCancel',1)
        elif action=='lost':page.evaluate("document.querySelector('#joystick').releasePointerCapture(HonroApp.stickPointer.id)");delta(o,.01,.99)
        elif action=='blur':page.evaluate("window.dispatchEvent(new Event('blur'))")
        elif action=='pause':page.evaluate('HonroApp.pause()')
        elif action=='hero':
            # The authored training map has one hero: add a second ordinary hero
            # only for this lifecycle fixture, then use the production UI action.
            page.evaluate("()=>{const a=HonroApp,u=structuredClone(a.engine.active);Object.assign(u,{id:'input-fixture-mage',cls:'mage',name:'담허',x:u.x+100,loadout:['M01'],ranks:{M01:1}});a.engine.b.units.push(u);a.updateHUD(true)}")
            page.locator('[data-action=select-hero][data-id=input-fixture-mage]').click()
        elif action=='turn':page.evaluate('HonroApp.defend()')
        elif action=='engine-turn':page.evaluate('HonroApp.engine.finishAction()')
        s=state(action+'-after');check(action+' clears intent and gameplay axes',s.get('pointer') is None and s['axes']['x']==0 and s['axes']['y']==0,s)
        if touches:touch('touchCancel',1)
        if action=='pause':page.evaluate('HonroApp.close()')
        o=reset();start(o);delta(o,1,0);s=state(action+'-fresh');check(action+' accepts fresh pointer',s['intent']=='moveAim' and s['moveCalls']>0,s);touch('touchEnd',1)
    # A second joystick touch cannot steal the owning pointer; unrelated releases do not clear it.
    o=reset();start(o);delta(o,0,1);a=state('multitouch-base');touch('touchStart',9,o[0]+4,o[1]);touch('touchEnd',9);s=state('multitouch-second-stick');check('second stick touch preserves owner',s['pointer']==a['pointer'] and s['intent']=='aimOnly',s)
    fire=page.locator('#fire').bounding_box();touch('touchStart',2,fire['x']+fire['width']/2,fire['y']+fire['height']/2);s=state('multi-fire-down');check('second touch charges while aim pointer stays locked',s['charging'] and s['pointer']==a['pointer'],s)
    # Cancel just the stick using its real pointer id: the fire capture must survive.
    page.evaluate("document.querySelector('#joystick').dispatchEvent(new PointerEvent('pointercancel',{pointerId:HonroApp.stickPointer.id,pointerType:'touch',bubbles:true}))")
    s=state('multi-stick-cancel',0);check('stick cancel preserves fire pointer',s['charging'] and s['fire'] is not None and s.get('pointer') is None,s)
    touch('touchEnd',1);touch('touchEnd',2);s=state('multi-fire-release',0);check('fire release still fires after stick cancel',not s['charging'] and page.evaluate('HonroApp.engine.b.shots')>0,s)
    o=reset();start(o);delta(o,0,1);a=state('multi-jump-before');jump=page.locator('#jump').bounding_box();touch('touchStart',3,jump['x']+jump['width']/2,jump['y']+jump['height']/2);s=state('multi-jump-down');check('jump uses its normal cost and keeps stick owner',s['pointer']==a['pointer'] and s['intent']=='aimOnly' and s['y']<a['y'] and s['budget']==a['budget']-page.evaluate('HonroApp.engine.jumpCost(HonroApp.engine.active)'),s);touch('touchEnd',3);s=state('multi-jump-release');check('jump release preserves stick',s['pointer']==a['pointer'],s);touch('touchEnd',1)
    # Real keyboard events with no touch state.
    for key in ['ArrowLeft','ArrowRight','a','d']:
        o=reset();a=state('pc-before');page.keyboard.down(key);s=state('pc-'+key);page.keyboard.up(key);check('PC '+key+' movement',s['budget']<a['budget'] and s['x']!=a['x'],s)
    for facing in [-1,1]:
        for key,sign in [('ArrowUp',1),('ArrowDown',-1)]:
            o=reset();page.evaluate('(f)=>Object.assign(HonroApp.engine.active,{facing:f,angle:f===1?35:145})',facing);a=state('pc-aim-before');page.keyboard.down(key);s=state('pc-aim-'+key);page.keyboard.up(key)
            check(f'PC {facing} {key} retains elevation rule',unchanged(a,s) and (math.sin(math.radians(s['angle']))-math.sin(math.radians(a['angle'])))*sign>0,s)
    check('browser pointer events are trusted CDP touch synthesis',any(e['trusted'] and e['pointerType']=='touch' and e['type']=='pointermove' for e in page.evaluate('inputEvents')))
    check('no browser exceptions',not errors,errors)
    (OUT/'input-trace.json').write_text(json.dumps({'environment':'Headless Chromium; CDP touch emulation; not a physical device','checks':checks,'states':traces,'pointerEvents':page.evaluate('inputEvents'),'errors':errors},ensure_ascii=False,indent=2))
    (OUT/'sector-results.json').write_text(json.dumps({
        'executionSha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
        'browser':browser.version,'environment':'Chromium CDP touch -> trusted PointerEvents; deterministic production frames; physical device untested',
        'checkCount':len(checks),'checks':checks,'sectorTransitions':sector_evidence,
        'trustedTouchPointerMoves':sum(e['trusted'] and e['pointerType']=='touch' and e['type']=='pointermove' for e in page.evaluate('inputEvents')),
        'errors':errors},ensure_ascii=False,indent=2))
    browser.close()
print(f'{len(checks)} checks; evidence: {OUT}')
