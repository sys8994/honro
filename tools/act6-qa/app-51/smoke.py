import base64
import gzip
import hashlib
import json
import re
import sys
import threading
from time import monotonic,sleep
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

a, b, out = [Path(x).resolve() for x in sys.argv[1:]]
out.mkdir(parents=True, exist_ok=True)
sha=lambda x:hashlib.sha256(x).hexdigest()
def data(root,p): return json.loads((root/p).read_bytes())
stock=data(a,'web/manifest.json')
pilot=data(b,'web/manifest.json')
assert stock['project']==pilot['project'],'stock normal campaign manifest changed'
assert stock['common']==pilot['common'],'stock Common/ordered campaign changed'
# Embedded Game uses the same generated Game shell; the emitted code is
# inert there. Only that one shell reference may differ in Workshop wrapper.
old,bnew=(a/stock['workshopEntry']).read_text(),(b/pilot['workshopEntry']).read_text()
assert old.count(stock['playtest'])==1 and old.replace(stock['playtest'],pilot['playtest'])==bnew,'Workshop differs beyond exact embedded shell alias'
assert (a/stock['project']).read_bytes()==(b/pilot['project']).read_bytes()
registry=data(b,pilot['project'])
assert [x['metadata']['stageId'] for x in registry['catalog']]==list(range(1,51))
for name in set([registry[k] for k in ['base','shared','editorExtras']]+registry['stages']+registry['stageLibraries']):
    assert (a/name).read_bytes()==(b/name).read_bytes(),name
PACKETS={
    51:('web/data/act6-qa-chapter-51.c8620ccf54745095.json','c8620ccf547450952f3cbbae6e49c2f8dbddab2af69622d3f4221ab99f7046ba',147478),
    52:('web/data/act6-qa-chapter-52.3e35d12c62d32164.json','3e35d12c62d32164643d48a58a772161912cb889f438049bd480d78ed4ac96e9',146799),
    53:('web/data/act6-qa-chapter-53.fef8e9a389a1d86d.json','fef8e9a389a1d86df963b38606b5fd0b21d6f4a09218a5da04b98a866fa2d713',123405),
}
PACKETS[54]=('web/data/act6-qa-chapter-54.b5922a3d8aa7bd41.json','b5922a3d8aa7bd413f52171ca945e7096585d336c28780f6ccaba3fefb54f5b8',644858)
PACKETS[55]=('web/data/act6-qa-chapter-55.3ae91543525a0909.json', '3ae91543525a09093da52ee1dd2bff8ab8324a7e7858996c363afdd10e066b8f', 36440)
path,expected,_=PACKETS[51]
signed={x[0] for x in PACKETS.values()}
assert {x['path'] for x in pilot['files'] if 'act6-qa-chapter-' in x['path']}==signed
assert not {x['path'] for x in stock['files']} & signed
for fname,digest,size in PACKETS.values():
    packet=[x for x in pilot['files'] if x['path']==fname]
    assert len(packet)==1 and packet[0]['sha256']==digest and packet[0]['bytes']==size and sha((b/fname).read_bytes())==digest
native_driver=Path(__file__).with_name('native-replay.js').read_text()
native55=Path(__file__).with_name('native-replay-55.js').read_text()
core54raw=Path(__file__).with_name('trace-core.mjs').read_bytes()
assert sha(core54raw)=='b8a1593b56d394ccb948cdd546ac5d70d1317d321ed159f5791ce998cc5aae6f'
core54=core54raw.decode().replace('export ','')
tape54raw=gzip.decompress(base64.b64decode(Path(__file__).with_name('54-tape.gzip.b64').read_bytes(),validate=True))
assert sha(tape54raw)=='758807946db640328dc01b7390d07397b5fa20c6f95ebe784faf9b6e387cad10'
tape54=json.loads(tape54raw)

assert re.search(r'web/entries/game\.[a-z0-9]+\.js',pilot['gameEntry'])

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*_): pass

a_srv=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=a))
b_srv=ThreadingHTTPServer(('127.0.0.1',18861),partial(Quiet,directory=b))
for server in [a_srv,b_srv]:
    threading.Thread(target=server.serve_forever,daemon=True).start()
evidence={'scope':'ordinary App in fresh anonymous browser, OFF stock vs unpublished opt-in pilot; no real Stage50 victory/save and no campaign completion proof; Stage53 provisional stock opponents',
          'beforeProject':stock['project'],'packets':PACKETS,'devices':{},'fullNativeReplay':{},
          'fullReplayScope':'native Engine yields legal commands and trusted actual button clicks; time is paused and advanced deliberately; this is not manual keyboard/controller play or normal campaign'}
def checkpoint(page, state, name):
    state[name]=page.evaluate("""()=>{const app=HonroApp,e=app.engine,b=e?.b;return {stage:b?.honroStage,round:b?.round,side:b?.side,phase:b?.phase,screen:app.screen,lastError:app.lastError??null,awardIds:b?.awardIds??[],stored:localStorage.getItem('honro-first-act-profile-1'), actors:b?.units.filter(u=>u.side===0&&!u.summoned).map(u=>[u.id,u.cls,u.hp,u.maxHp,u.focus,u.maxFocus,u.shield,u.level,u.loadout,u.tune,u.ranks,u.h,u.r,u.equipmentState,u.dead])}}""")
    assert not state[name]['lastError'],state[name]
    return state[name]

def poll(page, text, seconds=18):
    expire=monotonic()+seconds
    while monotonic()<expire:
        if page.evaluate(text): return
        sleep(.05)
    raise AssertionError(f'Timed out checking real App: {text}')

def tap(page,selector,mobile):
    box=page.locator(selector).bounding_box(timeout=5000)
    assert box and box['width']>0 and box['height']>0,selector
    x,y=box['x']+box['width']/2,box['y']+box['height']/2
    hit=page.evaluate("""([x,y,sel])=>{const node=document.querySelector(sel),target=document.elementFromPoint(x,y),ancestor=node?.parentElement;return {owned:!!target?.closest(sel),targetTag:target?.tagName,targetId:target?.id,targetClass:target?.className,ancestor:ancestor?.className,elementPointer:node&&getComputedStyle(node).pointerEvents,ancestorOverflow:ancestor&&getComputedStyle(ancestor).overflow};}""",[x,y,selector])
    assert hit['owned'],(f'not the visible owner: {selector}',box,hit)
    (page.touchscreen.tap if mobile else page.mouse.click)(x,y)

def camera_frame(page):
    return page.evaluate('''()=>{const {engine:e,scene:s}=HonroApp,b=e.b,u=e.active,c=s.canvas.getBoundingClientRect();
       const f=[2450,2600].map(x=>HONRO_CORE.topAt(b.terrain.find(v=>v.id==='upper-threshold-footing'),x));
       const p=(x,y)=>[c.width/2+(x-s.x)*s.scale,c.height/2+(y-s.y)*s.scale];
       return {camera:[s.x,s.y,s.scale],width:c.width,height:c.height,manual:s.manual,
         pose:[u.id,u.x,u.y,u.h,u.r,e.grounded(u),e.contactSurface(u.x,u.y-4,u.y+4)?.t.id,u.hp,u.focus,u.loadout,b.shot,b.round,b.phase],
         head:p(u.x,u.y-u.h),feet:p(u.x,u.y),target:[p(2450,f[0]),p(2600,f[1])]};}''')

def real_camera_override(page,context,mobile):
    box=page.locator('#battlecanvas').bounding_box()
    assert box
    offsets=[(.25,.52),(.16,.62),(.50,.51),(.70,.49)]
    coords=[[box['x']+box['width']*a,box['y']+box['height']*b] for a,b in offsets]
    available=[xy for xy in coords if page.evaluate("([x,y])=>document.elementFromPoint(x,y)?.id==='battlecanvas'",xy)]
    assert available,box
    x,y=available[0]
    before=camera_frame(page)
    if mobile:
        finger=context.new_cdp_session(page)
        finger.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
        finger.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+48,'y':y+8}]})
        finger.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        finger.detach()
    else:
        page.mouse.move(x,y)
        page.mouse.wheel(0,-80)
    page.clock.run_for(48)
    result=camera_frame(page)
    assert result['manual'] and result['camera']!=before['camera'] and result['pose']==before['pose'],(before,result)
    page.clock.run_for(128)
    stable=camera_frame(page)
    assert stable['camera']==result['camera'] and stable['pose']==before['pose'],(result,stable)
    return {'before':before,'after':result,'held':stable,'input':'trusted touch pan' if mobile else 'trusted wheel'}

def full_run(browser,label,w,h,mobile,port,camera53=True,camera_only=False,tactic="shunt"):
    origin=f'http://127.0.0.1:{port}'; state=evidence['fullNativeReplay'][label]={'events':[],'requests':[],'pageErrors':[]}
    ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,device_scale_factor=1)
    page=ctx.new_page()
    page.on('pageerror',lambda error:state['pageErrors'].append(str(error)))
    page.on('request',lambda req:state['requests'].append(urlsplit(req.url).path) if req.url.startswith(origin+'/') and 'act6-qa-chapter-' in req.url else None)
    try:
        page.clock.install()
        page.goto(origin+'/HONRO.html'+('' if camera53 else '?act6Camera53=off'),wait_until='domcontentloaded',timeout=45000)
        page.wait_for_function("globalThis.HonroApp?.screen==='title' && !!globalThis.HONRO_READY",timeout=45000)
        page.evaluate("async()=>await globalThis.HONRO_READY")
        storage=page.evaluate("()=>({storage:localStorage.getItem('honro-first-act-profile-1'), profile:JSON.stringify(HonroApp.normalProfile)})")
        assert not state['requests'] and page.evaluate("()=>HonroApp.launch(52,false)===false")
        tap(page,'[data-act6-qa-entry]',mobile)
        page.wait_for_function("globalThis.HonroApp?.engine?.b?.honroStage===51 && !!document.querySelector('#battlecanvas')",timeout=20000)
        page.clock.pause_at(page.evaluate('Date.now()+1000'))
        assert checkpoint(page,state,'51-entry')['phase']=='aim'
        for id in [51,52]:
            page.evaluate('(stage)=>{globalThis.__honroQaReplay=('+native_driver+')(stage)}',id)
            result=page.evaluate('()=>globalThis.__honroQaReplay.next()')
            while not result['done']:
                mark=result['value']
                assert mark['kind']=='interact'
                rule='[data-act6-qa-lookout]'
                before=page.locator(rule).text_content(timeout=3000)
                tap(page,rule,mobile)
                # Click produces a synchronous original App owner transition; the
                # replay driver reads only the visible button status to decide.
                accepted=page.evaluate("""([rule,before])=>{const n=document.querySelector(rule);return n.disabled||n.textContent!==before}""",[rule,before])
                state['events'].append({'stage':id,'mark':mark['mark'],'role':mark['actor'],'accepted':accepted})
                result=page.evaluate('(accept)=>globalThis.__honroQaReplay.next(accept)',accepted)
            r=result['value']
            state[f'{id}-physical']=r
            assert (r['phase'],r['round'],r['heroActionStarts'],r['heroInputFires'],len(r['remainingFoes']))==({51:('won',8,30,6,3),52:('won',6,22,6,2)}[id]),(label,id,r)
            page.evaluate('()=>{delete globalThis.__honroQaReplay;}')
            # Report/transition UI must come from App.frame, not from invoking
            # synthetic outcome or writing native state from the harness.
            page.clock.run_for(96)
            assert page.evaluate("HonroApp.done && HonroApp.engine.b.phase==='won'")
            end=checkpoint(page,state,f'{id}-witness-won')
            if id==52:end52=end
            assert end['phase']=='won' and end['awardIds']==[]
            page.screenshot(path=out/f'{label}-native-{id}-terminal.png',animations='disabled',timeout=10000)
            if id==51:
                assert state['requests']==['/'+PACKETS[51][0]]
                assert page.evaluate("()=>HonroApp.launch(52,false)===false")
                tap(page,'[data-act6-qa-next="52"]',mobile)
                poll(page,"()=>HonroApp?.engine?.b?.honroStage===52")
                before=checkpoint(page,state,'52-before-input')
                assert before['actors']==end['actors'],'ordinary App mount reset carried body'
                assert before['phase']=='aim'
            else:
                assert state['requests']==['/'+PACKETS[x][0] for x in [51,52]]
                assert page.evaluate("()=>HonroApp.launch(53,false)===false")
                tap(page,'[data-act6-qa-next="53"]',mobile)
                poll(page,"()=>HonroApp?.engine?.b?.honroStage===53")
                before=checkpoint(page,state,'53-before-input')
                assert before['actors']==[q for q in end['actors'] if q[1]=='mage']
                assert before['phase']=='aim'
        # Actual App stock HUD and visible native gate both require real taps.
        assert page.locator('[data-action="combat-skill"][data-skill="M09"]').count()==0
        if camera_only:
            page.clock.run_for(450) # camera-only disposable arena
            state['53-before-gate-camera']=camera_frame(page)
        tap(page,'[data-act6-qa-lookout]',mobile)
        poll(page,"()=>HonroApp.engine.active.x===2640")
        tap(page,'[data-action="combat-skill"][data-skill="M09"]',mobile)
        assert page.evaluate("()=>HonroApp.selected==='M09'")
        if camera_only:
            state['53-camera-timeline']={}
            for before,after in [(0,0),(0,96),(96,240),(240,600)]:
                if after>before: page.clock.run_for(after-before)
                frame=camera_frame(page)
                state['53-camera-timeline'][str(after)]=frame
                assert frame['pose'][0]=='p-mage' and frame['pose'][1]==2640 and frame['pose'][5] and frame['pose'][6]=='upper-threshold-footing',frame
                assert frame['pose']==state['53-camera-timeline']['0']['pose'],frame
                if camera53 and after:
                    assert all(36<=q[0]<=frame['width']-36 and 105<=q[1]<=frame['height']-136 for q in [frame['head'],frame['feet'],*frame['target']]),frame
                page.screenshot(path=out/f'{label}-53-camera-{after:03}.png',animations='disabled',timeout=10000)
            if camera53:
                state['53-real-camera-override']=real_camera_override(page,ctx,mobile)
                page.screenshot(path=out/f'{label}-53-camera-manual.png',animations='disabled',timeout=10000)
            assert len(state['pageErrors'])==0,state
            assert page.evaluate("()=>({storage:localStorage.getItem('honro-first-act-profile-1'), profile:JSON.stringify(HonroApp.normalProfile)})")==storage
            return
        # Native progression runs in a fresh context with original R2 timing.
        # No camera-only clock run, pointer movement, or canvas read before M09.
        record=page.evaluate("""()=>{const app=HonroApp,e=app.engine,u=e.active,b=e.b,C=HONRO_CORE;
          if(!e.grounded(u)||b.shot!==0||app.selected!=='M09')throw Error('gate or contextual HUD did not bind');
          const dt=1/120; e.move(-1,dt);
          if(u.facing>=0)throw Error('ordinary movement failed to turn for target aim');
          app.adjustAngle(u,86-app.displayAngle(u));
          const sk=C.SKILLS.M09,p=e.predict(u,sk,u.angle,.42,undefined,true);
          if(p.terrain!=='upper-threshold-footing'||p.x<2450||p.x>2600)throw Error('native target prediction moved');
          if(!app.beginCharge())throw Error('ordinary charge input rejected');
          // Drive only the held-input clock for the existing App charge curve.
          let lo=0,hi=10;
          for(let i=0;i<26;i++){const m=(lo+hi)/2; if(e.chargePower(u,sk,m)<.42)lo=m;else hi=m;}
          app.chargeAt=performance.now()-hi*1000;
          app.releaseCharge();
          if(b.shot!==1)throw Error('ordinary release charge did not emit exactly one shot');
          let ticks=0;
          for(;ticks<4800&&(b.phase!=='aim'||u.acted||!b.stakes.some(s=>s.shot===1));ticks++)e.tick(dt);
          const stake=b.stakes.find(s=>s.shot===1&&s.owner===u.id&&s.skill==='M09'&&s.x>=2450&&s.x<=2600);
          if(!stake||b.phase!=='aim')throw Error('no M09 impact/settlement');
          return {phase:b.phase,ground:e.grounded(u),id:u.id,hp:u.hp,focus:u.focus,shield:u.shield,stake:stake.x,warning:e.unit('draft-upper-side-guard')?.enemyEffectCast};}""")
        assert record['phase']=='aim' and record['ground'] and record['id']=='p-mage' and record['warning']['skill']=='HSH02',record
        state['53-after-cast']=record
        branch_button='[data-act6-qa-pillar]'
        page.clock.run_for(48)
        cue=page.locator('[data-act6-qa-pillar-cue]')
        assert cue.is_visible() and '매듭귀' in cue.text_content(),record
        page.screenshot(path=out/f'{label}-53-warning.png',animations='disabled',timeout=10000)
        def walk(x,sign):
            return page.evaluate("""([x,sign])=>{const e=HonroApp.engine,u=e.active,b=e.b,dt=1/120;
              for(let i=0;i<720&&sign*(x-u.x)>0&&b.phase!=='won';i++){e.move(sign,dt);e.tick(dt);}
              return {x:u.x,ground:e.grounded(u),phase:b.phase};}""",[x,sign])
        if tactic=='shunt':
            foot=walk(2507,-1);assert foot['ground'] and 2460<=foot['x']<=2515,foot
            snapshot="""()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,z=document.querySelector('[data-act6-qa-pillar]');return {round:b.round,phase:b.phase,side:b.side,x:u?.x,y:u?.y,cls:u?.cls,acted:u?.acted,grounded:e.grounded(u),canAct:e.canAct(),disabled:z.disabled,hidden:z.hidden,dialogue:!!a.dialogue,modal:a.modal?.classList.contains('open')??false};}"""
            state['53-shunt-physical-foot']=foot
            state['53-shunt-before-render']=page.evaluate(snapshot)
            page.evaluate("()=>{const a=HonroApp,e=a.engine;e.checkEnd();a.updateHUD(true);}")
            state['53-shunt-after-render']=page.evaluate(snapshot)
            assert page.locator(branch_button).is_enabled(),state['53-shunt-after-render']
            page.evaluate('(s)=>document.querySelector(s).click()',branch_button)
            assert cue.is_visible(),'untrusted shunt'
            tap(page,branch_button,mobile)
            assert not cue.is_visible()
        elif tactic=='shoot':
            # Keep actual current chosen actor and charge path; aiming adjusts
            # the ordinary App aim, only held-input time is driven deterministically.
            tap(page,'[data-action="combat-skill"][data-skill="M01"]',mobile)
            attack=page.evaluate("""()=>{const app=HonroApp,e=app.engine,u=e.active,b=e.b,t=e.unit('draft-upper-side-guard'),sk=HONRO_CORE.SKILLS.M01;
              if(u.facing<0){e.move(1,1/120);if(u.facing<0)throw Error('M01 facing');}
              const angle=19,P=.84,old=t.hp;
              const pred=e.predict(u,sk,angle,P,t,true);
              if(pred.unit!==t.id)throw Error('M01 native target prediction '+pred.unit);
              app.adjustAngle(u,angle-app.displayAngle(u));
              if(!app.beginCharge())throw Error('M01 charge not accepted');
              let lo=0,hi=10;for(let i=0;i<26;i++){const m=(lo+hi)/2;if(e.chargePower(u,sk,m)<P)lo=m;else hi=m;}
              app.chargeAt=performance.now()-hi*1000;app.releaseCharge();
              if(b.shot!==2)throw Error('M01 not fired');
              const dt=1/120;for(let i=0;i<3600&&(b.phase!=='aim'||u.acted);i++)e.tick(dt);
              return {damage:old-t.hp,down:e.grounded(u),phase:b.phase};}""")
            assert attack['damage']>0 and attack['down'] and attack['phase']=='aim',attack
            state['53-m01']=attack
        else:
            assert tactic=='ignored' and page.locator(branch_button).is_disabled()
        projected=walk(2725,1)
        state['53-foot-before-goal-clock']=projected
        foot=page.evaluate("""()=>{const a=HonroApp,e=a.engine,u=e.active,b=e.b;for(let n=0;n<31&&b.phase==='aim';n++)e.tick(1/120);return {x:u.x,ground:e.grounded(u),phase:b.phase};}""")
        page.clock.run_for(96)
        state['53-final']=checkpoint(page,state,'53-final')
        assert foot['ground'],foot
        if tactic=='ignored':
            assert foot['x']>=2700 and foot['phase']=='aim' and cue.is_visible(),foot
        else:
            assert foot['phase']=='won' and page.evaluate("HonroApp.done"),foot
        assert page.locator('[data-act6-qa-next="54"]').count()==0
        assert state['requests']==['/'+PACKETS[x][0] for x in [51,52,53]]
        assert page.evaluate("()=>HonroApp.launch(54,false)===false")
        assert page.evaluate("()=>({storage:localStorage.getItem('honro-first-act-profile-1'), profile:JSON.stringify(HonroApp.normalProfile)})")==storage
        assert len(state['pageErrors'])==0,state
        page.screenshot(path=out/f'{label}-53-{tactic}-final.png',animations='disabled',timeout=10000)

    finally:
        ctx.close()

try:
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(chromium_sandbox=True)
        for label,w,h,mobile in [('PC',1440,900,False),('M',390,844,True)]:
            for arm,port in [('OFF',a_srv.server_port),('ON',b_srv.server_port)]:
                key=f'{label}-{arm}'
                origin=f'http://127.0.0.1:{port}'
                state=evidence['devices'][key]={'requests':[],'pageErrors':[],'loopbackFailures':[]}
                context=browser.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,device_scale_factor=1)
                page=context.new_page()
                page.on('pageerror',lambda error:state['pageErrors'].append(str(error)))
                page.on('request',lambda req:state['requests'].append(urlsplit(req.url).path) if req.url.startswith(origin+'/') else None)
                page.on('requestfailed',lambda req:state['loopbackFailures'].append(urlsplit(req.url).path) if req.url.startswith(origin+'/') else None)
                page.on('response',lambda response:state['loopbackFailures'].append(str(response.status)+' '+urlsplit(response.url).path) if response.status>=400 and response.url.startswith(origin+'/') else None)
                try:
                    page.goto(origin+'/HONRO.html',wait_until='domcontentloaded',timeout=45000)
                    page.wait_for_function("globalThis.HonroApp?.screen==='title' && !!globalThis.HONRO_READY",timeout=45000)
                    page.evaluate("async()=>await globalThis.HONRO_READY")
                    title=page.get_by_role('button',name='길을 열다',exact=True)
                    title.wait_for(state='visible')
                    item=page.locator('[data-act6-qa-entry]')
                    page.screenshot(path=out/f'{key}-title.png')
                    assert page.evaluate("HONRO_CONTENT.stages.length===50 && HONRO_PROJECT.stages.length===50 && !HONRO_EMBEDDED")
                    assert not any('act6-qa-chapter-' in x for x in state['requests'])
                    if arm=='OFF':
                        assert item.count()==0
                        title.click()
                        page.wait_for_function("globalThis.HonroApp.screen!=='title'")
                        assert page.evaluate("(HonroApp.engine?.b.honroStage??1)<=50")
                        assert not any('act6-qa-chapter-' in x for x in state['requests'])
                    else:
                        assert item.count()==1
                        read_cut="()=>({storage:localStorage.getItem('honro-first-act-profile-1'), profile:JSON.stringify(HonroApp.normalProfile)})"
                        before=page.evaluate(read_cut)
                        assert page.evaluate("()=>HonroApp.launch(51,false)===false && HonroApp.isOpen({id:51,requires:[]})===false")
                        item.evaluate("(button)=>button.click()")
                        assert page.evaluate("HonroApp.screen==='title'&&HonroApp.engine===null")
                        assert not any('act6-qa-chapter-' in x for x in state['requests'])
                        item.click()
                        page.wait_for_function("globalThis.HonroApp?.engine?.b?.honroStage===51",timeout=20000)
                        page.wait_for_function("globalThis.HonroApp?.scene && !globalThis.HonroApp.lastError && document.querySelector('#battlecanvas')?.width>0",timeout=8000)
                        state['mounted']=page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b;return {nativeEngine:e instanceof HONRO_CORE.Engine,screen:a.screen,authored:b.honroAuthoredId,mode:b.mode,origin:b.honroMapOrigin,stage:b.honroStage,custom:b.honroCustom,stageCount:HONRO_CONTENT.stages.length,landmarks:b.honroLandmarks.length,actors:b.units.map(x=>x.id),phase:b.phase,startX:e.active.x};}""")
                        s=state['mounted']
                        assert s['nativeEngine'] and s['screen']=='battle' and s['authored']=='qa-act6-r4-01' and s['mode']=='act6-isolated' and s['origin']=='act6-qa'
                        assert s['stage']==51 and s['custom'] is False and s['stageCount']==50 and s['landmarks']==10 and len(s['actors'])==8
                        assert s['phase']=='aim' and s['startX']==225
                        page.screenshot(path=out/f'{key}-native-entry.png')
                        page.locator('[data-act6-qa-lookout]').click()
                        assert page.evaluate("HonroApp.engine.b.phase==='aim'&&!HonroApp.engine.b.events.includes('act6.threeSitesSighted')")
                        if mobile:
                            box=page.locator('#joystick').bounding_box()
                            x,y=box['x']+box['width']/2,box['y']+box['height']/2
                            touch=context.new_cdp_session(page)
                            touch.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
                            touch.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x+box['width']*.48,'y':y}]})
                            page.wait_for_function("HonroApp.engine.active.x>255",timeout=5000)
                            touch.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
                        else:
                            page.keyboard.down('ArrowRight')
                            page.wait_for_function("HonroApp.engine.active.x>255",timeout=5000)
                            page.keyboard.up('ArrowRight')
                        state['afterMove']=page.evaluate("""()=>({x:HonroApp.engine.active.x,y:HonroApp.engine.active.y,grounded:HonroApp.engine.grounded(HonroApp.engine.active),lastError:HonroApp.lastError??null})""")
                        assert state['afterMove']['grounded'] and not state['afterMove']['lastError']
                        page.screenshot(path=out/f'{key}-native-moved.png')
                        assert page.evaluate(read_cut)==before,'ordinary profile mutated'
                        assert [x for x in state['requests'] if 'act6-qa-chapter-' in x]==['/'+path]
                        for _ in range(5):
                            if page.evaluate("HonroApp.engine.b.side===1 || HonroApp.engine.b.round>=2"): break
                            defend=page.locator('[data-action="defend"]').first
                            defend.click(timeout=10000)
                        poll(page,"()=>HonroApp.engine.b.side===1 || HonroApp.engine.b.round>=2",8)
                        checkpoint(page,state,'realDefendThenEnemy')
                        if page.evaluate("HonroApp.engine.b.round===1"):
                            poll(page,"()=>HonroApp.engine.b.round>=2 || !!HonroApp.lastError",20)
                        checkpoint(page,state,'realEnemyLifecycle')

                    assert not state['pageErrors'],state
                    assert not [x for x in state['loopbackFailures'] if 'act6-qa-chapter' in x],state
                finally:
                    context.close()
        for label,w,h,mobile in [('PC',1440,900,False),('M',390,844,True)]:
            full_run(browser,label+'-A',w,h,mobile,b_srv.server_port,camera53=False,camera_only=True)
            full_run(browser,label+'-B',w,h,mobile,b_srv.server_port,camera_only=True)
            a=evidence['fullNativeReplay'][label+'-A']['53-camera-timeline']
            b=evidence['fullNativeReplay'][label+'-B']['53-camera-timeline']
            assert all(a[t]['pose']==b[t]['pose'] for t in ('0','96','240','600')),(a,b)
            assert max(abs(x-y) for x,y in zip(a['0']['camera'],b['0']['camera']))<12 and a['96']['camera']!=b['96']['camera'],(a,b)
        for label,w,h,mobile in [('PC',1440,900,False),('M',390,844,True)]:
            for tactic in ['shunt','shoot','ignored']:
                full_run(browser,label+'-'+tactic,w,h,mobile,b_srv.server_port,tactic=tactic)
        browser.close()
    evidence['status']='PASS_PC_MOBILE_51_53_WITH_TACTICAL_SHUNT_SHOT_NEGATIVE_CAMERA_AB_NO_54'
finally:
    (out/'BROWSER.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
    for server in [a_srv,b_srv]:
        server.shutdown()
        server.server_close()
