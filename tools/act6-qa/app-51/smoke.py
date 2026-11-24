import hashlib
import json
import re
import sys
import threading
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
path='web/data/act6-qa-chapter-51.5e37e2cae683ddc6.json'
expected='5e37e2cae683ddc665fa403825081b7645f3b82635303e7a4d6bbdb5bc9f314c'
assert all(x['path']!=path for x in stock['files'])
packet=[x for x in pilot['files'] if x['path']==path]
assert len(packet)==1 and packet[0]['sha256']==expected and packet[0]['bytes']==146697 and sha((b/path).read_bytes())==expected
assert re.search(r'web/entries/game\.[a-z0-9]+\.js',pilot['gameEntry'])

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*_): pass

a_srv=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=a))
b_srv=ThreadingHTTPServer(('127.0.0.1',18861),partial(Quiet,directory=b))
for server in [a_srv,b_srv]:
    threading.Thread(target=server.serve_forever,daemon=True).start()
evidence={'scope':'ordinary App in fresh anonymous browser, OFF stock vs unpublished opt-in pilot; no real Stage50 victory/save and no completion proof',
          'beforeProject':stock['project'],'packetSHA256':expected,'devices':{}}
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
                    assert not state['pageErrors'],state
                    assert not [x for x in state['loopbackFailures'] if 'act6-qa-chapter' in x],state
                finally:
                    context.close()
        browser.close()
    evidence['status']='PASS_NORMAL_APP_OFF_AND_LOOPBACK_OPT_IN_STAGE51_NATIVE_PC_M'
finally:
    (out/'BROWSER.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
    for server in [a_srv,b_srv]:
        server.shutdown()
        server.server_close()
