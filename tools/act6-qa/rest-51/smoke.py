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
from normal52_witness import stage52

a, b, out = [Path(x).resolve() for x in sys.argv[1:]]
out.mkdir(parents=True, exist_ok=True)
sha=lambda x:hashlib.sha256(x).hexdigest()
def data(root,p): return json.loads((root/p).read_bytes())
stock=data(a,'web/manifest.json')
pilot=data(b,'web/manifest.json')
assert stock['project']==pilot['project'],'stock normal campaign manifest changed'
assert len(stock['common'])==len(pilot['common'])
for off,on in zip(stock['common'],pilot['common']):
    if off!=on:
        assert 'ordered-common-' in off and 'ordered-common-' in on
        assert 'normal51Provider.' in (b/on).read_text()
assert not [r for r in stock['files'] if 'stage51-campaign-provider' in r['path']]
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
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*_): pass

a_srv=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=a))
b_srv=ThreadingHTTPServer(('127.0.0.1',18861),partial(Quiet,directory=b))
for server in [a_srv,b_srv]:
    threading.Thread(target=server.serve_forever,daemon=True).start()
def tap(page,selector,mobile):
    box=page.locator(selector).bounding_box(timeout=5000)
    assert box and box['width']>0 and box['height']>0,selector
    x,y=box['x']+box['width']/2,box['y']+box['height']/2
    hit=page.evaluate("""([x,y,sel])=>{const node=document.querySelector(sel),target=document.elementFromPoint(x,y),ancestor=node?.parentElement;return {owned:!!target?.closest(sel),targetTag:target?.tagName,targetId:target?.id,targetClass:target?.className,ancestor:ancestor?.className,elementPointer:node&&getComputedStyle(node).pointerEvents,ancestorOverflow:ancestor&&getComputedStyle(ancestor).overflow};}""",[x,y,selector])
    assert hit['owned'],(f'not the visible owner: {selector}',box,hit)
    (page.touchscreen.tap if mobile else page.mouse.click)(x,y)


CASE_DIR=Path(__file__).parent
START='.title-actions button.primary[data-action="rest"]'
REST='.rest-actions .rest-next'
GATE=REST+'[aria-label="스테이지 진입 · 무명사 외부"]'
KEY='honro-first-act-profile-1'
pending=(CASE_DIR/'pending-profile.json').read_bytes()
settled=(CASE_DIR/'settled-witness.json').read_bytes()
assert sha(pending)=='c29a802bc081664775449b7c0cf5224a328d1eec189bcdeec5b0933a823a9a80'
assert sha(settled)=='1c3d280e95fb9c7c3878a5911e12d00f36006750d3b32559433c71054865dfd7'
assert json.loads(pending)['honroActEnding']=={'stage':50,'index':0}
assert json.loads(pending)['cleared']=={'50':{'visits':1,'rounds':17}}
witness=json.loads(settled)
assert witness['actual'] and witness['round']==17 and witness['profile']['seen']['act-ending-v1:50'] is True
assert witness['profile']['cleared']=={'50':{'visits':1,'rounds':17}}
assert len(witness['cards'])==5
evidence={'scope':'Mounted exact restored stock outcome; Standard Continue and real mouse/touch input. Genuine Stage50 win originated in native detached engine, not the browser. Synthetic prior completion flags for 1–49, not a replay of 1–49. ON Stage51 is isolated preview only; no normal campaign registration or Stage51 save.',
          'actualNativeStage50WinnerSHA256':'f6b2f245e3b9068209aa08794114b46e89289d2cf39f66e71eb667c5e95c61e2',
          'pendingSHA256':sha(pending),'settledSHA256':sha(settled),'closures':{'ordinaryStages':50,'project':stock['project'],'packet51':PACKETS[51]},'trials':{}}

def fixture(kind):
    p=json.loads(pending) if kind=='fresh-pending' else json.loads(settled)['profile']
    assert '50' in p['cleared'] and not p['honroBattle']
    # Only this campaign-history precondition and explicitly historical shape
    # differences below are synthesized. Stage50 winner data remains authentic.
    for n in range(1,50): p['cleared'][str(n)]=True
    p['lastStage']=50
    changes=['cleared.1..49=true','lastStage=50']
    if kind=='legacy-format':
        del p['seen']['act-ending-v1:50']
        p['cleared']['50']=True
        changes+=['seen.act-ending-v1:50 absent','cleared.50 boolean legacy representation']
    return json.dumps(p,ensure_ascii=False,separators=(',',':')),changes

def wall(page, timeout=20000):
    return lambda expression: page.wait_for_function(expression,timeout=timeout)

def snap(page,state,name):
    state[name]=page.evaluate("""key=>{const app=HonroApp,p=app.profile,b=app.engine?.b;return {screen:app.screen,stage:b?.honroStage??null,normal:app.normalProfile===p,ready:!app.profileStore.locked,
      registered:HONRO_CONTENT.stages.length,projectCount:HONRO_PROJECT.stages.length,clear50:p.cleared[50],seen:p.seen['act-ending-v1:50']??null,pending:p.honroActEnding??null,lastError:app.lastError??null,
      storeSHA:!!app.profileStore.original().ok,startingRoles:b?.units.filter(u=>u.side===0&&!u.summoned).map(u=>[u.id,u.cls,u.x,u.y,u.level,u.loadout])??null};}""",KEY)
    assert not state[name]['lastError'] and state[name]['ready'] and state[name]['storeSHA']
    assert state[name]['registered']==state[name]['projectCount']==50,state[name]
    return state[name]

def trial(browser,label,w,h,mobile,arm,kind):
    origin=f'http://127.0.0.1:{a_srv.server_port if arm=="OFF" else b_srv.server_port}'
    key=f'{label}-{arm}-{kind}'
    raw,changes=fixture(kind)
    state=evidence['trials'][key]={'fixtureSHA256':sha(raw.encode()),'synthesized':changes,'packets':[],'errors':[],'ending':[],'restDialogue':[]}
    ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,device_scale_factor=1)
    ctx.add_init_script('(() => { if (location.origin==='+json.dumps(origin)+' && location.pathname==="/HONRO.html" && localStorage.getItem('+json.dumps(KEY)+')===null) localStorage.setItem('+json.dumps(KEY)+','+json.dumps(raw)+'); })()')
    page=ctx.new_page()
    page.on('pageerror',lambda err:state['errors'].append(str(err)))
    page.on('console',lambda msg:state['errors'].append(msg.type+': '+msg.text) if msg.type=='error' and ('starter/body mismatch' in msg.text or 'QA chapter' in msg.text) else None)
    page.on('request',lambda req:state['packets'].append(urlsplit(req.url).path) if req.url.startswith(origin+'/') and 'act6-qa-chapter-' in req.url else None)
    try:
        page.goto(origin+'/HONRO.html',wait_until='domcontentloaded',timeout=45000)
        wall(page,45000)("globalThis.HonroApp?.screen==='title'&&!!globalThis.HONRO_READY")
        page.evaluate("async()=>await globalThis.HONRO_READY")
        assert snap(page,state,'title')['normal']
        assert page.evaluate("()=>!HonroApp.profileStore.locked && HonroApp.isOpen({id:51,requires:[0]})===false")
        assert page.locator('[data-act6-qa-entry]').count()==0
        assert not state['packets']
        assert page.locator(START).text_content()=='여정 이어가기'
        tap(page,START,mobile)
        if kind=='fresh-pending':
            for cut in ('1','2','3','4','title'):
                selector=f'#act-ending[data-stage="50"][data-mode="completion"][data-cut="{cut}"]'
                page.locator(selector).wait_for(state='visible',timeout=10000)
                state['ending'].append({'cut':cut,'copy':page.locator(selector+' p').text_content()})
                if cut=='title' and arm=='ON': page.screenshot(path=out/f'{key}-stock-ending-title.png')
                page.wait_for_timeout(400)
                tap(page,selector,mobile)
        wall(page)("HonroApp.screen==='rest'")
        # Any stock mandatory rest conversation is advanced using its own
        # actual visible Next affordance. Never clear narrative flags in JS.
        for _ in range(40):
            if not page.evaluate("!!HonroApp.dialogue"): break
            selector='[data-action="dialogue-next"]'
            state['restDialogue'].append(page.evaluate("()=>[HonroApp.dialogue?.id,HonroApp.dialogue?.index]"))
            page.wait_for_timeout(260)
            tap(page,selector,mobile)
        wall(page)("HonroApp.screen==='rest'&& !HonroApp.dialogue")
        rest=snap(page,state,'rest')
        assert rest['normal'] and rest['stage'] is None and rest['pending'] is None and not state['packets']
        assert rest['seen']==(True if kind=='fresh-pending' else None)
        # Legacy booleans may be preserved or canonicalized by the stock migration.
        cv=rest['clear50']
        assert cv is True or cv['visits']==1
        if kind=='fresh-pending': assert cv=={'visits':1,'rounds':17}
        if arm=='OFF':
            assert page.locator(GATE).count()==0 and page.locator(REST).is_disabled()
        else:
            assert page.locator(GATE).count()==1 and page.locator(GATE).is_enabled(),state
            page.screenshot(path=out/f'{key}-ordinary-rest.png')
            original=page.evaluate("key=>localStorage.getItem(key)",KEY)
            assert page.evaluate("HonroApp.launch(51,false)===false")
            page.locator(GATE).evaluate("el=>el.click()")
            assert not state['packets'] and page.evaluate("HonroApp.screen==='rest'")
            tap(page,GATE,mobile)
            wall(page)("HonroApp.engine?.b?.honroStage===51 && !!HonroApp.scene && document.querySelector('#battlecanvas')?.width>0")
            s=snap(page,state,'stage51')
            assert s['screen']=='battle' and s['stage']==51 and s['normal'] and len(s['startingRoles'])==4
            assert page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b;return e instanceof HONRO_CORE.Engine&&b.mode==='campaign'&&b.honroAuthoredId==='stage-51'&&e.stage.id===51&&b.honroCustom===false&&b.phase==='aim'&&b.units.filter(u=>u.side===0).every(u=>e.grounded(u)&&JSON.stringify(u.loadout)===JSON.stringify(a.normalProfile.loadouts[u.cls]));}"""),s
            assert page.evaluate("key=>localStorage.getItem(key)",KEY)==original
            assert state['packets']==['/'+path],state
            page.screenshot(path=out/f'{key}-native-51.png')
            if kind=='fresh-pending':
                tape=json.loads((CASE_DIR/'INPUT-51.json').read_text())
                source=(CASE_DIR/'browser-tape.js').read_text()
                page.clock.install()
                page.clock.pause_at(page.evaluate('Date.now()+600'))
                page.evaluate('(t)=>{globalThis.__normal51Replay=('+source+')(t);}',tape)
                row=page.evaluate('()=>__normal51Replay.next()')
                while not row['done']:
                    ask=row['value'];assert ask['id']=='overlook'
                    sel='[data-act6-qa-lookout]'
                    before=page.locator(sel).text_content()
                    tap(page,sel,mobile)
                    accepted=page.locator(sel).is_disabled() or page.locator(sel).text_content()!=before
                    row=page.evaluate('(ok)=>__normal51Replay.next(ok)',accepted)
                state['campaign51Terminal']=row['value']
                page.evaluate('delete globalThis.__normal51Replay')
                page.clock.run_for(96)
                assert page.evaluate("HonroApp.done && HonroApp.engine.b.phase==='won'")
                q=json.loads(page.locator('[data-act6-normal51-receipt]').get_attribute('data-act6-normal51-receipt'))
                term=row['value']['final']
                witnessed=[[u['id'],u['cls'],u['hp'],u['maxHp'],u['focus'],u['maxFocus'],u['shield'],u['level'],u['loadout'],u['ranks'],u.get('equipmentState')] for u in q['actors']]
                assert sorted(witnessed)==sorted(term['units']),q
                assert q['stage']==51 and q['flags']=={'act6.threeSitesSighted':True} and not q['settlement'],q
                assert len(q['events'])==1 and q['events'][0]['key']=='act6-local-objective:overlook' and q['events'][0]['round']==term['round'],q
                assert page.evaluate("""()=>{const e=HonroApp.engine,b=e.b,t=e.unit('crest-champion');
                    return t.dead&&t.hp<=0&&b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAlly).every(u=>u.hp>0&&e.grounded(u)&&u.x>=b.width*.9)&&b.honroGrowth.limit.total===0&&b.honroGrowth.limit.combat===0;}""")
                state['campaign51Receipt']=q
                assert page.evaluate("HonroApp.launch(52,false)===false")
                assert page.evaluate("key=>localStorage.getItem(key)",KEY)==original
                page.screenshot(path=out/f'{key}-native-51-terminal.png')
                stage52(page,state,mobile,original,tap,out,key,'/'+PACKETS[52][0])
        assert not state['errors'],state
        state['status']='PASS'
    finally:
        ctx.close()

try:
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(chromium_sandbox=True)
        for label,w,h,mobile in [('PC',1440,900,False),('M',390,844,True)]:
            for arm,kind in [('OFF','fresh-pending'),('ON','fresh-pending'),('ON','legacy-format')]:
                trial(browser,label,w,h,mobile,arm,kind)
        browser.close()
    evidence['status']='PASS_50_STOCK_ENDING_REST_THEN_NATIVE_NORMAL_51_AND_52'
finally:
    (out/'BROWSER.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
    for server in [a_srv,b_srv]:
        server.shutdown()
        server.server_close()
