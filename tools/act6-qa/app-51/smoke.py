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
}
path,expected,_=PACKETS[51]
signed={x[0] for x in PACKETS.values()}
assert {x['path'] for x in pilot['files'] if 'act6-qa-chapter-' in x['path']}==signed
assert not {x['path'] for x in stock['files']} & signed
for fname,digest,size in PACKETS.values():
    packet=[x for x in pilot['files'] if x['path']==fname]
    assert len(packet)==1 and packet[0]['sha256']==digest and packet[0]['bytes']==size and sha((b/fname).read_bytes())==digest
native_driver=Path(__file__).with_name('native-replay.js').read_text()
assert re.search(r'web/entries/game\.[a-z0-9]+\.js',pilot['gameEntry'])

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*_): pass

a_srv=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=a))
b_srv=ThreadingHTTPServer(('127.0.0.1',18861),partial(Quiet,directory=b))
for server in [a_srv,b_srv]:
    threading.Thread(target=server.serve_forever,daemon=True).start()
evidence={'scope':'ordinary App in fresh anonymous browser, OFF stock vs unpublished opt-in pilot; no real Stage50 victory/save and no completion proof',
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

def full_run(browser,label,w,h,mobile,port):
    origin=f'http://127.0.0.1:{port}'; state=evidence['fullNativeReplay'][label]={'events':[],'requests':[],'pageErrors':[]}
    ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,device_scale_factor=1)
    page=ctx.new_page()
    page.on('pageerror',lambda error:state['pageErrors'].append(str(error)))
    page.on('request',lambda req:state['requests'].append(urlsplit(req.url).path) if req.url.startswith(origin+'/') and 'act6-qa-chapter-' in req.url else None)
    try:
        page.clock.install()
        page.goto(origin+'/HONRO.html',wait_until='domcontentloaded',timeout=45000)
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
                assert page.locator('[data-act6-qa-next]').count()==0
                assert page.evaluate("()=>HonroApp.launch(53,false)===undefined")
        assert [x['mark'] for x in state['events'] if x['accepted']]==['overlook','cliff','bridge','bell','threshold']
        assert state['requests']==['/'+PACKETS[x][0] for x in [51,52]],state['requests']
        assert not state['pageErrors'],state['pageErrors']
        assert page.evaluate("()=>({storage:localStorage.getItem('honro-first-act-profile-1'), profile:JSON.stringify(HonroApp.normalProfile)})")==storage
        state['status']='PASS_ACTUAL_APP_SIGNED_ENGINE_INPUT_REPLAY_TRUSTED_ROLE_CLICKS'
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
            full_run(browser,label,w,h,mobile,b_srv.server_port)
        browser.close()
    evidence['status']='PASS_ORDINARY_OFF_REAL_51_INPUT_AND_ACT6_51_52_BROWSER_SIGNED_REPLAY'
finally:
    (out/'BROWSER.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
    for server in [a_srv,b_srv]:
        server.shutdown()
        server.server_close()
