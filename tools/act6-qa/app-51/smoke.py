import base64
import gzip
import hashlib
import json
import os
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
PACKETS[56]=('web/data/act6-qa-chapter-56.73e6de40351e90fc.json','73e6de40351e90fc7014ea471cf7739b9444c3e67b5edb80d89f895dc5ae9d61',115622)
PACKETS[57]=('web/data/act6-qa-chapter-57.005b77bedf9a6034.json','005b77bedf9a6034cb92faa8fc816c5df06fc78b23b295379eab1a00d087dfe4',94181)
PACKETS[58]=('web/data/act6-qa-chapter-58.7df6e20b457fe8d3.json', '7df6e20b457fe8d34e72eae0e8a3ac6b6f2b3d853ee8424a477b1385f61e6cbd', 106810)
PACKETS[59]=('web/data/act6-qa-chapter-59.dd829cb01460592a.json','dd829cb01460592a296b5f8127825260036386a437206928e21cb928cdb8d333',171398)
run60=os.getenv('HONRO_QA_RUN_60')=='1'
if run60:
    PACKETS[60]=('web/data/act6-qa-chapter-60.1ed264e9415a2757.json','1ed264e9415a2757852c7e7274ffdf94696e5fa89ff2b258871773bf920d52e1',144825)
path,expected,_=PACKETS[51]
signed={x[0] for x in PACKETS.values()}
assert {x['path'] for x in pilot['files'] if 'act6-qa-chapter-' in x['path']}==signed
assert not {x['path'] for x in stock['files']} & signed
for fname,digest,size in PACKETS.values():
    packet=[x for x in pilot['files'] if x['path']==fname]
    assert len(packet)==1 and packet[0]['sha256']==digest and packet[0]['bytes']==size and sha((b/fname).read_bytes())==digest
native_driver=Path(__file__).with_name('native-replay.js').read_text()
native57=Path(__file__).with_name('native-replay-57.js').read_text()
native55=Path(__file__).with_name('native-replay-55.js').read_text()
native58=Path(__file__).with_name('native-replay-58.js').read_text()
tape58raw=gzip.decompress(base64.b64decode(Path(__file__).with_name('58-tape.gzip.b64').read_bytes(),validate=True))
assert sha(tape58raw)=='c699d5f706f6a34f4e198abd4d3ad6f8964b0face7ba1e03f12c43507c393e8a'
tape58=json.loads(tape58raw)
native59=Path(__file__).with_name('native-replay-59.js').read_text()
tape59raw=gzip.decompress(base64.b64decode(Path(__file__).with_name('59-tape.gzip.b64').read_bytes(),validate=True))
assert sha(tape59raw)=='67390a0fe495c4c5117a82ec548dbb3cc319fc8021d2ba73a9ad1243c2adc923'
tape59=json.loads(tape59raw)
app59Expected=json.loads(Path(__file__).with_name('59-observed-app-vitals.json').read_bytes())
assert next(row for row in app59Expected if row[1]=='knight')[2]==1318
assert tape59['expected']['actors'][1][1]==1312 # detached receipt is NOT the App outcome witness
if run60:
    native60=Path(__file__).with_name('native-replay-60.js').read_text()
    data60raw=gzip.decompress(base64.b64decode(Path(__file__).with_name('60-input.gzip.b64').read_bytes(),validate=True))
    assert sha(data60raw)=='29830317bab5bcfb3e5adb906d58530066e806a11c0e875038370e474a7ff440'
    input60=json.loads(data60raw)

core54raw=Path(__file__).with_name('trace-core.mjs').read_bytes()
assert sha(core54raw)=='b8a1593b56d394ccb948cdd546ac5d70d1317d321ed159f5791ce998cc5aae6f'
core54=core54raw.decode().replace('export ','')
tape54raw=gzip.decompress(base64.b64decode(Path(__file__).with_name('54-tape.gzip.b64').read_bytes(),validate=True))
assert sha(tape54raw)=='758807946db640328dc01b7390d07397b5fa20c6f95ebe784faf9b6e387cad10'
tape54=json.loads(tape54raw)
tape56raw=gzip.decompress(base64.b64decode(Path(__file__).with_name('56-tape.gzip.b64').read_bytes(),validate=True))
assert sha(tape56raw)=='175ef5cc0a77c2697f58f2e47dac665995f8451f891357d9dd496a9a644019c0'
tape56=json.loads(tape56raw)


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

EARLY_FAR = json.loads(Path(__file__).parents[3].joinpath('shared/act6-late-qa/EARLY-FAR.json').read_text())['rows']
for _row in EARLY_FAR.values():
    for _plate in _row['plates'].values():
        _asset=(b / _plate['path'].lstrip('/')).read_bytes()
        assert len(_asset)==_plate['bytes'] and sha(_asset)==_plate['sha'],_plate['path']

def verify_far(page, state, stage, mobile):
    if stage==60:
        expected='13785df44a84667e09db1184c5c6162f20ba4fdaedeb0bad359c315700fa8b17'
    elif stage==58:
        expected='696fd1dfe489567e8032a3f2a2a8be45539ddae488e67baf01f37f82c382e22d'
    else:
        plates=EARLY_FAR[str(stage)]['plates']
        expected=plates.get('portrait' if mobile else 'wide',plates['wide'])['sha']
    deadline=monotonic()+4
    with_draw=None
    while monotonic()<deadline:
        with_draw=page.evaluate("""()=>{const a=HonroApp,e=a.engine,s=a.scene,b=e.b;const prev=JSON.stringify([b.phase,b.round,b.units,b.terrain]);s.render(e,0,a.selected,.5,false,0,true);return {stage:b.honroStage,far:s.environmentStats?.authoredFar??[],unchanged:prev===JSON.stringify([b.phase,b.round,b.units,b.terrain])};}""")
        if with_draw['far']==[expected]: break
        sleep(.045)
    state[str(stage)+'-far-native']=with_draw
    assert with_draw and with_draw['stage']==stage and with_draw['unchanged'] and with_draw['far']==[expected],with_draw

def verify_end_camera(page, state, stage):
    if stage not in [52,53,56,57]: return
    desired=4 if stage in [52,57] else 1
    for attempt in range(16):
        page.clock.run_for(120)
        raw=page.evaluate("""()=>{const a=HonroApp,e=a.engine,s=a.scene,b=e.b,r=s.canvas.getBoundingClientRect(),prev=JSON.stringify([b.mode,b.phase,b.units,b.terrain]);s.render(e,0,a.selected,.5,false,0,true);const rows=b.units.filter(u=>u.side===0&&!u.dead&&e.grounded(u)).map(u=>({id:u.id,x:r.width*.5+(u.x-s.x)*s.scale,y:r.height*.5+(u.y-s.y)*s.scale,h:u.h*s.scale})).filter(v=>v.x>20&&v.x<r.width-20&&v.y-v.h>50&&v.y<r.height-42);return {rows,stage:b.honroStage,unchanged:prev===JSON.stringify([b.mode,b.phase,b.units,b.terrain]),w:r.width,h:r.height,scale:s.scale};}""")
        if len(raw['rows'])>=desired: break
        sleep(.02)
    state[str(stage)+'-terminal-camera']=raw
    assert raw['stage']==stage and raw['unchanged'] and len(raw['rows'])>=desired and all(u['h']>=48 for u in raw['rows']),raw

def full_run(browser,label,w,h,mobile,port):
    origin=f'http://127.0.0.1:{port}'; state=evidence['fullNativeReplay'][label]={'events':[],'requests':[],'pageErrors':[]}
    ctx=browser.new_context(viewport={'width':w,'height':h},is_mobile=mobile,has_touch=mobile,device_scale_factor=1)
    page=ctx.new_page()
    page.on('pageerror',lambda error:state['pageErrors'].append(str(error)))
    page.on('console',lambda msg:state.setdefault('endingWriterNotes',[]).append(msg.text) if msg.text.startswith('Act6 isolated ending write refused: ') else None)
    page.on('request',lambda req:state['requests'].append(urlsplit(req.url).path) if req.url.startswith(origin+'/') and 'act6-qa-chapter-' in req.url else None)
    page.on('response',lambda res:state.setdefault('59-far-responses',[]).append([urlsplit(res.url).path,res.status]) if res.url.startswith(origin+'/') and '/web/graphics/act6-qa-art-59.' in res.url else None)
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
            if id==52:end52=end
            assert end['phase']=='won' and end['awardIds']==[]
            verify_far(page,state,id,mobile)
            verify_end_camera(page,state,id)
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
        tap(page,'[data-act6-qa-lookout]',mobile)
        poll(page,"()=>HonroApp.engine.active.x===2640")
        tap(page,'[data-action="combat-skill"][data-skill="M09"]',mobile)
        assert page.evaluate("()=>HonroApp.selected==='M09'")
        page.screenshot(path=out/f'{label}-native-53-M09-aim.png',animations='disabled',timeout=10000)
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
          for(let i=0;i<375&&u.x<2735&&b.phase!=='won';i++,ticks++){e.move(1,dt);e.tick(dt);}
          return {phase:b.phase,round:b.round,ticks,ground:e.grounded(u),x:u.x,y:u.y,body:u.id,loadout:u.loadout,stake:{x:stake.x,y:stake.y,skill:stake.skill},foes:b.units.filter(v=>v.side===1&&!v.dead).length};}""")
        state['53-physical']=record
        assert record['phase']=='won' and record['round']==2 and record['ground'] and record['body']=='p-mage' and record['loadout']==['M01'] and record['foes']==2,record
        page.clock.run_for(96)
        assert page.evaluate("HonroApp.done && HonroApp.engine.b.phase==='won'")
        checkpoint(page,state,'53-witness-won')
        verify_far(page,state,53,mobile)
        verify_end_camera(page,state,53)
        page.screenshot(path=out/f'{label}-native-53-terminal.png',animations='disabled',timeout=10000)
        # Stage54 pointer ownership/clock replacement kept in this ancestry:
        # three fresh marked coordinate changes, a wrong-site rejection, and
        # one contextual charge through the actual HUD and App release.
        assert state['requests']==['/'+PACKETS[x][0] for x in [51,52,53]]
        assert page.evaluate("HonroApp.launch(54,false)===false")
        tap(page,'[data-act6-qa-next="54"]',mobile)
        poll(page,"()=>HonroApp.engine?.b?.honroStage===54 && !!HonroApp.scene")
        before=checkpoint(page,state,'54-before-input')
        assert before['actors']==state['53-witness-won']['actors'] and len(before['actors'])==1 and before['actors'][0][0]=='p-mage'
        assert before['phase']=='aim'
        assert page.locator('[data-action="combat-skill"][data-skill="M09"]').count()==0
        page.evaluate('(trace)=>{'+core54+"""
          const app=HonroApp,e=app.engine;
          globalThis.__honro54Driver=driveNative(HONRO_CORE.Engine,e,trace,{trusted:x=>x===trace,engine:()=>app.engine,stage:()=>54,
            actorId:id=>id==='p0'?'p-mage':id,tick(dt){e.tick(dt);app.missionTick(dt);}});}""",tape54)
        state['54-charts']=[]
        step=page.evaluate('()=>globalThis.__honro54Driver.next()')
        while not step['done']:
            k=step['value']
            if k['kind']=='chart':
                prev=page.evaluate("""()=>{const b=HonroApp.engine.b,u=HonroApp.engine.active;return {version:b.sceneVersion??0,x:u.x,y:u.y,stage:b.honroStage,body:u.id};}""")
                tap(page,'[data-act6-qa-lookout]',mobile)
                before_after=page.evaluate("""()=>{const b=HonroApp.engine.b,u=HonroApp.engine.active;return {version:b.sceneVersion??0,x:u.x,y:u.y,stage:b.honroStage,body:u.id};}""")
                ok=before_after['version']==prev['version']+1
                if ok:
                    landed=page.evaluate("""()=>{const app=HonroApp,e=app.engine,u=e.active;let elapsed=0;
                      while(!e.grounded(u)&&elapsed++<700){e.tick(1/120);app.missionTick(1/120);}
                      app.missionTick(1/120);
                      return {ground:e.grounded(u),focused:app.scene.focusId,manual:app.scene.manual,body:u.id,x:u.x,y:u.y,ticks:elapsed,surface:e.contactSurface(u.x,u.y-4,u.y+4)?.t.id};}""")
                    assert landed['ground'] and landed['focused']=='p-mage' and landed['manual'] is False and landed['body']=='p-mage',landed
                else:
                    assert prev==before_after,(prev,before_after)
                    landed=None
                state['54-charts'].append({'id':k['id'],'trustedUI':True,'accepted':ok,'landed':landed})
                result={'ok':ok}
            else:
                assert k['kind']=='contextual' and k['id']=='54-left-relay',k
                tap(page,'[data-action="combat-skill"][data-skill="M09"]',mobile)
                shot=page.evaluate("""([angle,power])=>{const app=HonroApp,e=app.engine,u=e.active,b=e.b;
                  if(app.selected!=='M09'||!e.grounded(u)||b.shot!==0)throw Error('normal Stage54 contextual HUD selection missing');
                  if(u.facing>=0)throw Error('certified approach did not face relay');
                  const desired=u.facing>=0?angle:180-angle;
                  app.adjustAngle(u,desired-app.displayAngle(u));
                  if(u.angle!==angle||!app.beginCharge())throw Error('stock aiming/charge refused');
                  const sk=HONRO_CORE.SKILLS.M09;let lo=0,hi=10;
                  for(let i=0;i<26;i++){const m=(lo+hi)/2;if(e.chargePower(u,sk,m)<power)lo=m;else hi=m;}
                  app.chargeAt=performance.now()-hi*1000;app.releaseCharge();
                  return {shot:b.shot,native:b.projectiles.some(p=>p.owner===u.id&&p.skill==='M09'&&p.shot===b.shot),kit:u.loadout};}""",[k['angle'],k['power']])
                assert shot['shot']==1 and shot['native'] and shot['kit']==['M01'],shot
                state['54-contextual']=shot
                result={'ok':True}
            step=page.evaluate('r=>globalThis.__honro54Driver.next(r)',result)
        assert [q['accepted'] for q in state['54-charts']]==[True,True,False,True],state['54-charts']
        state['54-physical']=step['value']
        page.evaluate('()=>{delete globalThis.__honro54Driver;}')
        page.clock.run_for(130)
        assert page.evaluate("HonroApp.done && HonroApp.engine.b.phase==='won'")
        final54=checkpoint(page,state,'54-witness-won')
        assert final54['round']==2 and final54['awardIds']==[] and final54['actors'][0][0]=='p-mage'
        assert final54['actors'][0][2]==before['actors'][0][2]==980 and [before['actors'][0][4],final54['actors'][0][4]]==[296,280]
        assert final54['actors'][0][8:]==before['actors'][0][8:]
        assert page.evaluate("()=>HonroApp.engine.grounded(HonroApp.engine.active)&&HonroApp.engine.b.stakes.some(s=>s.skill==='M09'&&s.owner==='p-mage')")
        assert page.evaluate("HonroApp.launch(55,false)===false")
        verify_far(page,state,54,mobile)
        page.screenshot(path=out/f'{label}-native-54-terminal.png',animations='disabled',timeout=10000)
        assert state['requests']==['/'+PACKETS[x][0] for x in [51,52,53,54]],state['requests']
        tap(page,'[data-act6-qa-next="55"]',mobile)
        poll(page,"()=>HonroApp?.engine?.b?.honroStage===55")
        begin55=checkpoint(page,state,'55-before-input')
        assert {p[1]:p for p in begin55['actors']}=={p[1]:p for p in end52['actors'] if p[1]!='mage'}
        assert page.evaluate("()=>HonroApp.engine.b.units.every(u=>HonroApp.engine.grounded(u))")
        page.evaluate('()=>{globalThis.__honroQa55=('+native55+')()}')
        data55=page.evaluate('()=>globalThis.__honroQa55.next()')
        state['55-trusted-actions']=[]
        while not data55['done']:
            k=data55['value']
            assert k['kind']=='interact' and k['id'] in ('reach-bell','rebind-bell','align-bell'),k
            rule='[data-act6-qa-lookout]'
            old=page.locator(rule).text_content(timeout=3000)
            tap(page,rule,mobile)
            ok=page.evaluate("([sel,old])=>document.querySelector(sel).textContent!==old || HonroApp.engine.b.phase==='won'",[rule,old])
            state['55-trusted-actions'].append({'id':k['id'],'actor':k['unit'],'accepted':ok})
            data55=page.evaluate('(ok)=>globalThis.__honroQa55.next(ok)',ok)
        phase55=data55['value']
        state['55-physical']=phase55
        assert (phase55['phase'],phase55['round'],phase55['inputs'],phase55['fires'],phase55['foes'])==('won',9,24,8,3),phase55
        assert [v['id'] for v in state['55-trusted-actions'] if v['accepted']]==['reach-bell','rebind-bell','align-bell']
        page.evaluate('()=>{delete globalThis.__honroQa55}')
        page.clock.run_for(130)
        assert page.evaluate("HonroApp.done && HonroApp.engine.b.phase==='won'")
        checkpoint(page,state,'55-witness-won')
        verify_far(page,state,55,mobile)
        page.screenshot(path=out/f'{label}-native-55-terminal.png',animations='disabled',timeout=10000)
        assert state['requests']==['/'+PACKETS[x][0] for x in [51,52,53,54,55]],state['requests']
        assert page.evaluate("HonroApp.launch(56,false)===false")
        tap(page,'[data-act6-qa-next="56"]',mobile)
        poll(page,"()=>HonroApp.engine?.b?.honroStage===56 && !!HonroApp.scene")
        begin56=checkpoint(page,state,'56-before-input')
        assert begin56['actors']==final54['actors'] and begin56['phase']=='aim'
        get56="""()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,n=document.querySelector('[data-act6-qa-lookout]');
           const field=e.forceSample({x:5200,y:3940,drag:1,wind:0,gravityScale:0}).x;
           return {id:u.id,x:u.x,y:u.y,phase:b.phase,turn:b.round,ground:e.grounded(u),field,pressure:!!e.unit('draft-pressure-3'),
             mission:n.dataset.act6Mission??null,button:n.textContent};}"""
        initial56=page.evaluate(get56)
        assert (initial56['id'],initial56['ground'],initial56['pressure'],initial56['field'])==('p-mage',True,False,0),initial56
        # Same stock mechanics/HP/turn data stay strict. Isolated 120Hz
        # receiver coordinates are not browser golden pixels: log each
        # position difference. For the seven positive authored interactions
        # only, validate the actual signed coordinate window and collider.
        # Rejected actions/other commands keep the one-body-radius limit.
        position="Math.abs(a.x-b.x)<=.008&&Math.abs(a.y-b.y)<=.008"
        assert core54.count(position)==1
        core56=core54.replace("const assertPose=(a,b)=>{","const assertPose=(a,b,row)=>{").replace(position,"affinity.samePosition(a,b,row)")
        for endpoint in ("before","after"):
            anchor=f"assertPose(r.{endpoint},pose(e))"
            assert core56.count(anchor)==1
            core56=core56.replace(anchor,f"assertPose(r.{endpoint},pose(e),r)")
        page.evaluate('(trace)=>{'+core56+"""
          const app=HonroApp,e=app.engine,checks=[];
          globalThis.__honro56Checks=checks;
          const signedWindows={
            '56-stakeA':[1872,180,'A-upper-veranda'],'56-stakeB':[3600,180,'B-02-center-lower-short-climb'],
            '56-activate':[5200,180,'E-joined-ordinary-floor'],'56-readNarrowing':[5050,150,'E-joined-ordinary-floor'],
            '56-warnShelf':[3264,48,'B-central-lower-floor',3080,3280],'56-open':[3176,180,'B-central-lower-floor'],
            '56-returnEast':[5200,180,'E-joined-ordinary-floor']
          };
          function samePosition(a,b,row){
            const dx=b.x-a.x,dy=b.y-a.y;
            const host=p=>e.contactSurface(p.x,p.y-4,p.y+5)?.t.id??null;
            const expected=a.grounded?host(a):null,actual=b.grounded?host(b):null;
            const signed=row?.op==='interact'&&row.accepted===true?signedWindows[row.args[0]]:null;
            const fit=p=>Math.abs(p.x-signed[0])<=signed[1]&&(signed.length===3||p.x>=signed[3]&&p.x<=signed[4]);
            const close=signed?(a.grounded&&b.grounded&&expected===signed[2]&&actual===signed[2]&&fit(a)&&fit(b)):Math.hypot(dx,dy)<=e.active.r;
            const valid=close&&(!a.grounded||expected!==null&&expected===actual)&&
              (!b.grounded||HONRO_CORE.validTerrainContactPose(e.b.terrain,e.active));
            if(Math.abs(dx)>.008||Math.abs(dy)>.008||!valid)checks.push({id:b.id,hold:row?.args[0],dx,dy,expected,actual,policy:signed??e.active.r,valid});
            return valid;
          }
          globalThis.__honro56Driver=driveNative(HONRO_CORE.Engine,e,trace,{trusted:x=>x===trace,engine:()=>app.engine,stage:()=>56,
            actorId:id=>id==='p0'?'p-mage':id,samePosition,tick(dt){e.tick(dt);app.missionTick(dt);}});
          app.missionTick(1/120);
        }""",tape56)
        state['56-marks']=[]
        step=page.evaluate('()=>globalThis.__honro56Driver.next()')
        while not step['done']:
            k=step['value']
            assert k['kind']=='interact' and k['id'].startswith('56-'),k
            key56=k['id'][3:]
            old=page.evaluate(get56)
            # Wrong requested intents are not exposed as UI actions at that
            # time, so the driver cannot send them to the active owner.
            valid=old['mission']==key56
            if valid:
                tap(page,'[data-act6-qa-lookout]',mobile)
                page.evaluate("()=>HonroApp.missionTick(1/120)")
            new=page.evaluate(get56)
            accepted=valid and (old['mission']!=new['mission'] or new['phase']=='won')
            state['56-marks'].append({'id':key56,'trustedUI':valid,'accepted':accepted,'before':old,'after':new})
            try:
                step=page.evaluate('(ok)=>globalThis.__honro56Driver.next({ok})',accepted)
            finally:
                state['56-physical-position-deltas']=page.evaluate('()=>globalThis.__honro56Checks')
        state['56-physical']=step['value']
        assert [a['id'] for a in state['56-marks'] if a['accepted']]==['stakeA','stakeB','activate','readNarrowing','warnShelf','open','returnEast']
        change56={a['id']:(a['before'],a['after']) for a in state['56-marks'] if a['accepted']}
        assert [change56['activate'][0]['field'],change56['activate'][1]['field'],change56['readNarrowing'][1]['field']]==[0,145,-145]
        assert not change56['readNarrowing'][0]['pressure'] and change56['readNarrowing'][1]['pressure']
        assert state['56-physical']['phase']=='won' and state['56-physical']['round']==6 and state['56-physical']['pose']['grounded']
        page.evaluate('()=>{delete globalThis.__honro56Driver;delete globalThis.__honro56Checks;}')
        page.clock.run_for(130)
        assert page.evaluate("HonroApp.done && HonroApp.engine.b.phase==='won'")
        final56=checkpoint(page,state,'56-witness-won')
        assert final56['actors'][0][0]=='p-mage' and final56['actors'][0][2]==664 and final56['actors'][0][8:]==begin56['actors'][0][8:]
        assert final56['awardIds']==[]
        assert page.evaluate("HonroApp.launch(57,false)===false")
        verify_far(page,state,56,mobile)
        verify_end_camera(page,state,56)
        page.screenshot(path=out/f'{label}-native-56-terminal.png',animations='disabled',timeout=10000)
        assert state['requests']==['/'+PACKETS[x][0] for x in [51,52,53,54,55,56]],state['requests']
        tap(page,'[data-act6-qa-next="57"]',mobile)
        poll(page,"()=>HonroApp.engine?.b?.honroStage===57&&!!HonroApp.scene")
        begin57=checkpoint(page,state,'57-before-input')
        assert {r[1]:r for r in begin57['actors']}=={r[1]:r for r in state['55-witness-won']['actors']}
        assert [r[0] for r in begin57['actors']]==['p-archer','p-knight','p-occultist']
        assert page.evaluate("()=>{const a=HonroApp,e=a.engine;return e.grounded(e.unit('a6-c07-original-darmheo-body'))&&!e.unit('p-mage')}")
        page.evaluate('()=>{globalThis.__honroQa57=('+native57+')()}')
        mark57=page.evaluate('()=>globalThis.__honroQa57.next()')
        state['57-trusted-actions']=[]
        while not mark57['done']:
            mark=mark57['value']
            rule='[data-act6-qa-ward]' if mark['kind']=='alternative' else '[data-act6-qa-lookout]'
            assert mark['kind'] in ('alternative','interact') and page.locator(rule).is_visible()
            assert page.evaluate("()=>HonroApp.engine.grounded(HonroApp.engine.active)")
            tap(page,rule,mobile)
            state['57-trusted-actions'].append(mark)
            mark57=page.evaluate('()=>globalThis.__honroQa57.next()')
        state['57-physical']=mark57['value']
        page.evaluate('()=>{delete globalThis.__honroQa57}')
        out57=state['57-physical']
        assert (out57['phase'],out57['round'])==('won',6) and len(out57['crew'])==4 and len(out57['retainedHostiles'])==3,out57
        assert [q['id'] for q in out57['actions'] if q['accepted']]==['warnBell','splitRepair','warnRailing','openRetreat','moveRelayToFallback','assistKeeper','receiveKeeperWatch','reuniteAtWard']
        assert out57['flags']['act6.local.07.bridge-v3.open'] is True and out57['flags']['act6.fallbackRelaySecured'] is True
        assert {q[1]:q[2] for q in out57['crew']}=={'archer':523,'knight':1318,'occultist':1098,'mage':664}
        assert all(q[6] for q in out57['crew'])
        assert page.evaluate("()=>{const a=HonroApp,e=a.engine,b=e.b;return ['p-archer','p-knight','p-mage','p-occultist'].every(id=>{const u=e.unit(id);return u&&e.contactSurface(u.x,u.y-4,u.y+5)?.t.id==='local-07-08-exact-receiving-slice'})&&e.unit('local-07-gwakjin-return-keeper')?.side===2&&!e.unit('a6-c07-original-darmheo-body')}")
        page.clock.run_for(130)
        assert page.evaluate("HonroApp.done && HonroApp.engine.b.phase==='won'")
        assert checkpoint(page,state,'57-witness-won')['awardIds']==[]
        assert page.evaluate("HonroApp.launch(58,false)===false")
        verify_far(page,state,57,mobile)
        verify_end_camera(page,state,57)
        page.screenshot(path=out/f'{label}-native-57-terminal.png',animations='disabled',timeout=10000)
        assert state['requests']==['/'+PACKETS[x][0] for x in [51,52,53,54,55,56,57]],state['requests']
        tap(page,'[data-act6-qa-next="58"]',mobile)
        poll(page,"()=>HonroApp?.engine?.b?.honroStage===58")
        begin58=checkpoint(page,state,'58-before-input')
        assert len(begin58['actors'])==4 and begin58['phase']=='aim'
        assert page.evaluate("()=>HonroApp.engine.b.units.every(u=>u.side===0&&HonroApp.engine.grounded(u))")
        page.evaluate('(d)=>{globalThis.__honroQa58=('+native58+')(d)}',tape58)
        data58=page.evaluate('()=>globalThis.__honroQa58.next()')
        state['58-trusted-actions']=[]
        while not data58['done']:
            k=data58['value']
            if k['kind']=='interact':
                assert k['id'] in ('column','threshold','ledger','stake'),k
                rule='[data-act6-qa-lookout]'
                before=page.evaluate("()=>JSON.stringify(HonroApp.engine.b.honroState.flags)")
                tap(page,rule,mobile)
                ok=page.evaluate("(was)=>JSON.stringify(HonroApp.engine.b.honroState.flags)!==was",before)
            else:
                assert k['kind']=='noncombatReturn',k
                rule='[data-act6-qa-return]'
                before=page.evaluate("()=>{const e=HonroApp.engine,b=e.b;return JSON.stringify([e.active?.id,b.phase,e.active?.acted,b.queue])}")
                tap(page,rule,mobile)
                ok=page.evaluate("(was)=>{const e=HonroApp.engine,b=e.b;return JSON.stringify([e.active?.id,b.phase,e.active?.acted,b.queue])!==was}",before)
            state['58-trusted-actions'].append({**k,'accepted':ok})
            data58=page.evaluate('(ok)=>globalThis.__honroQa58.next(ok)',ok)
        phase58=data58['value']
        state['58-physical']=phase58
        assert phase58['phase']=='won' and phase58['round']==13 and phase58['boss']==phase58['node']==0 and phase58['ticks']==11649,phase58
        assert len(phase58['allies'])==4 and all(v['grounded'] and v['hp']>0 for v in phase58['allies'])
        assert phase58['flags']=={'stake':True,'returned':True}
        assert [v['id'] for v in state['58-trusted-actions'] if v['kind']=='interact' and v['accepted']]==['column','threshold','ledger','stake']
        page.evaluate('()=>{delete globalThis.__honroQa58}')
        page.clock.run_for(130)
        assert page.evaluate("HonroApp.done && HonroApp.engine.b.phase==='won'")
        checkpoint(page,state,'58-witness-won')
        verify_far(page,state,58,mobile)
        page.screenshot(path=out/f'{label}-native-58-terminal.png',animations='disabled',timeout=10000)
        assert page.evaluate("HonroApp.launch(59,false)===false")
        transition='[data-act6-qa-next="59"]'
        assert state['requests']==['/'+PACKETS[x][0] for x in range(51,59)]
        state['59-trusted-actions']=[]
        page.evaluate('''() => {
          globalThis.__honro59Capture=[];
          document.addEventListener('click', e=>{
           const t=e.target.closest?.('[data-act6-qa-next="59"], [data-act6-qa-lookout][data-act6-mission]');
           if(t)globalThis.__honro59Capture.push({trusted:e.isTrusted,next:t.dataset.act6QaNext??null,objective:t.dataset.act6Mission??null});
          },{capture:true});
        }''')
        # DispatchEvent/.click() probes cannot create a setup or index a proper packet.
        page.locator(transition).evaluate('(b)=>b.click()')
        assert page.evaluate("HonroApp.engine.b.honroStage===58")
        assert state['requests']==['/'+PACKETS[x][0] for x in range(51,59)]
        tap(page,transition,mobile)
        poll(page,"()=>HonroApp?.engine?.b?.honroStage===59")
        assert page.evaluate("HonroApp.done===false && HonroApp.engine.b.phase==='aim'")
        checkpoint(page,state,'59-before-input')
        page.screenshot(path=out/f'{label}-native-59-entry.png',animations='disabled',timeout=10000)
        page.evaluate('(t)=>{globalThis.__honro59=(()=>{'+core54+';return ('+native59+')})()(t)}',tape59)
        status=page.evaluate('()=>globalThis.__honro59.next()')
        while not status['done']:
            command=status['value']
            assert command['id'] in ('markSoulPath','activateGarmjin')
            page.evaluate("()=>HonroApp.missionTick(0)")
            control=f'[data-act6-qa-lookout][data-act6-mission="{command["id"]}"]:not([disabled])'
            visible=page.locator(control).count()==1 and page.locator(control).is_visible()
            if command['wanted']:
                assert visible,(command,'expected visible 59 role command')
                before_clicks=page.evaluate("()=>__honro59Capture.length")
                tap(page,control,mobile)
                page.evaluate("()=>HonroApp.missionTick(0)")
                count=page.evaluate("()=>__honro59Capture.length")
                accepted=count==before_clicks+1 and page.evaluate("()=>__honro59Capture.at(-1).trusted===true") and page.locator(control).count()==0
                assert accepted,(command,'trusted control did not consume exact role command')
            else:
                assert not visible,(command,'early/already-spent 59 control displayed')
                accepted=False
            state['59-trusted-actions'].append({**command,'accepted':accepted})
            status=page.evaluate('(v)=>globalThis.__honro59.next(v)',accepted)
        trace59=state['59-physical']=status['value']
        assert trace59['phase']=='won' and trace59['round']==3 and trace59['trace']['ticks']==5645 and trace59['liveEnemies']==8,trace59
        assert [[r[k] for k in ('id','cls','hp','focus','shield','loadout')] for r in trace59['actors']]==app59Expected,trace59['actors']
        assert all(r['grounded'] for r in trace59['actors'])
        assert trace59['threat']['grounded'] and trace59['threat']['distance']>=260
        assert len(trace59['guard']['poses'])==3 and all(not any(g[k] for k in ('collides','damageable','targetable','awards','addUnit')) for g in trace59['guard']['poses'])
        assert [v['id'] for v in state['59-trusted-actions'] if v['accepted']]==['markSoulPath','activateGarmjin']
        clicks=state['59-browser-clicks']=page.evaluate('()=>__honro59Capture.slice()')
        assert [x['trusted'] for x in clicks]==[False,True,True,True],clicks
        page.evaluate('()=>{delete globalThis.__honro59}')
        page.clock.run_for(130)
        assert page.evaluate("HonroApp.done && HonroApp.engine.b.phase==='won'")
        checkpoint(page,state,'59-witness-won')
        # Completed-state render can wait for a legitimate stock shot/camera lease to expire.
        for attempt in range(22):
            page.clock.run_for(150)
            framed=page.evaluate("""()=>{const a=HonroApp,e=a.engine,s=a.scene,cv=s.canvas,r=cv.getBoundingClientRect(),before=JSON.stringify([e.b.phase,e.b.units,e.b.terrain,e.b.honroState]);s.render(e,0,a.selected,.5,false,0,true);const visible=e.b.units.filter(u=>u.side===0&&e.grounded(u)).map(u=>({id:u.id,x:r.width*.5+(u.x-s.x)*s.scale,y:r.height*.5+(u.y-s.y)*s.scale,h:u.h*s.scale})).filter(v=>v.x>25&&v.x<r.width-25&&v.y>60&&v.y<r.height-65);return {visible,unchanged:before===JSON.stringify([e.b.phase,e.b.units,e.b.terrain,e.b.honroState]),height:r.height,manual:s.manual,focusUntil:s.focusUntil??null,speakerUntil:s.speakerUntil??null,now:performance.now(),storyFrozen:!!(s.storyFrame||s.storyTween||s.storyFrozen),canvasEvidence:cv.dataset.act6Finale59??null};}""")
            framed['far']=any(r[1]==200 for r in state.get('59-far-responses',[]))
            if framed['far'] and len(framed['visible'])>=2: break
            sleep(.035)
        state['59-final-frame']=framed
        if not(framed['unchanged'] and framed['far'] and len(framed['visible'])>=2 and all(v['h']>=48 for v in framed['visible'])):
            page.screenshot(path=out/f'{label}-native-59-frame-rejected.png',animations='disabled',timeout=10000)
            raise AssertionError(framed)
        page.screenshot(path=out/f'{label}-native-59-terminal.png',animations='disabled',timeout=10000)
        assert [x['mark'] for x in state['events'] if x['accepted']]==['overlook','cliff','bridge','bell','threshold']
        if run60:
            assert page.evaluate("HonroApp.launch(60,false)===false")
            page.locator('[data-act6-qa-next="60"]').evaluate('(b)=>b.click()')
            assert page.evaluate("HonroApp.engine.b.honroStage===59")
            tap(page,'[data-act6-qa-next="60"]',mobile)
            poll(page,"()=>HonroApp.engine?.b?.honroStage===60")
            checkpoint(page,state,'60-before-walk')
            verify_far(page,state,60,mobile)
            assert not page.locator('#fire').is_visible()
            assert page.locator('#turn-text').inner_text()=='이동'
            assert '산문에 모이십시오' in page.locator('#objective-text').inner_text()
            assert page.locator('#joystick').is_visible() and page.locator('[data-act6-qa-walk]').is_visible()

            page.screenshot(path=out/f'{label}-native-60-playable-far.png',animations='disabled',timeout=10000)
            state['60-trusted-actions']=[]
            page.evaluate('''() => {
              globalThis.__honro60Capture=[];
              document.addEventListener('click', e=>{
               const t=e.target.closest?.('[data-act6-qa-lookout], [data-act6-qa-walk]');
               if(t)globalThis.__honro60Capture.push({trusted:e.isTrusted,walk:t.hasAttribute('data-act6-qa-walk')});
              },{capture:true});
            }''')
            page.evaluate('(t)=>{globalThis.__honro60=('+native60+')(t)}',input60)
            answer=page.evaluate('()=>__honro60.next()')
            while not answer['done']:
                move=answer['value']
                selector={'guide':'[data-act6-qa-lookout]','end-walk':'[data-act6-qa-walk]'}[move['op']]
                n=page.evaluate('()=>__honro60Capture.length')
                tap(page,selector,mobile)
                ok=page.evaluate("(n)=>__honro60Capture.length===n+1&&__honro60Capture.at(-1).trusted===true",n)
                assert ok,move
                state['60-trusted-actions'].append(move)
                answer=page.evaluate('(r)=>__honro60.next(r)',ok)
            whole=state['60-physical']=answer['value']
            assert whole['phase']=='won' and whole['round']==3 and whole['ticks']==2339 and whole['moves']==2210 and whole['shot']==0,whole
            assert [z['op'] for z in whole['seen']].count('guide')==1 and [z['op'] for z in whole['seen']].count('end-walk')==10
            assert whole['start']==app59Expected
            assert len(whole['final'])==4 and all(x['grounded'] and x['support']=='return-cutout-near-body' and abs(x['x']-6928.17679558)<=182 for x in whole['final'])
            assert [x['state'][:3] for x in whole['final']]==[x[:3] for x in whole['start']]
            assert all(x['delta']>300 and x['grounded'] for x in whole['walked'])
            page.evaluate('()=>{delete globalThis.__honro60}')
            page.clock.run_for(300)
            assert page.evaluate("HonroApp.done && HonroApp.engine.b.phase==='won'")
            page.locator('[data-stage="60"][data-mode="completion"][data-cut="last-souls"]').wait_for(state='visible',timeout=10000)
            checkpoint(page,state,'60-first-ending-visible')
            page.screenshot(path=out/f'{label}-native-60-ending-start.png',animations='disabled',timeout=10000)
            # Real visible controls; do not invoke the private ending or set state.
            ending=page.locator('.honro-ending-60[data-mode="completion"]')
            saved_script="()=>Object.keys(sessionStorage).filter(k=>k.startsWith('honro-act6-qa-ending:')).map(k=>JSON.parse(sessionStorage.getItem(k)))"
            def need_cut(cut,name,media):
                loc=ending.locator(media)
                control=ending.get_by_role('button',name=name,exact=True)
                for n in range(20):
                    if loc.count() and loc.is_visible() and control.count() and control.is_visible() and control.is_enabled() and ending.get_attribute('data-cut')==cut: break
                    if ending.get_by_role('button',name='장면 다시 불러오기',exact=True).count():
                        raise AssertionError('actual 60 native/decoded frame unavailable: '+cut)
                    page.clock.run_for(160)
                assert loc.is_visible() and control.is_visible() and control.is_enabled() and ending.get_attribute('data-cut')==cut,cut
                return control
            def hit(control):
                if mobile: control.tap()
                else: control.click()
            for cut,name,media in [('last-souls','계속','canvas'),('bridge-record','방패선의 이름을 적기','canvas'),('daybreak','계속','img'),('later-return','여정을 마치기','canvas')]:
                button=need_cut(cut,name,media)
                assert page.evaluate(saved_script)==[],cut
                assert not page.locator('#notice').is_visible() or '검수 결과' not in page.locator('#notice').inner_text(),cut
                page.screenshot(path=out/f'{label}-ending-{cut}.png',animations='disabled',timeout=10000)
                if cut=='bridge-record':
                    hit(button)
                    button=need_cut(cut,'계속','canvas')
                    assert all(ending.get_by_text(g,exact=False).count()>0 for g in ['곽진','박문돌','이만복'])
                    page.screenshot(path=out/f'{label}-ending-bridge-record-names.png',animations='disabled',timeout=10000)
                if cut=='daybreak':
                    actual=ending.locator('img').evaluate('(v)=>[v.naturalWidth,v.naturalHeight]')
                    assert actual==([941,1672] if mobile else [1672,941]),actual
                if cut=='later-return':
                    button.evaluate('(v)=>v.click()')
                    assert page.evaluate(saved_script)==[],cut
                hit(button)
            for attempt in range(40):
                page.clock.run_for(90)
                text=ending.inner_text()
                if '여정의 끝을 기록했습니다.' in text or '기록하지 못했습니다.' in text: break
                sleep(.05) # actual browser Web Locks task queue is not exclusively virtual time
            state['60-write-observation']={'text':text[-550:],'stored':len(page.evaluate(saved_script))}
            if '여정의 끝을 기록했습니다.' not in text:
                page.screenshot(path=out/f'{label}-ending-write-failure.png',animations='disabled',timeout=10000)
                raise AssertionError(state['60-write-observation'])
            qa_saved=page.evaluate(saved_script)
            assert len(qa_saved)==1 and qa_saved[0]['honroFlags']['act6.endingCompleted'] is True
            assert qa_saved[0]['honroEndingReceipt']['winner']=='p-knight'
            assert qa_saved[0]['honroEndingReceipt']['recordedGuardIds']==['local-07-gwakjin-return-keeper','local-07-return-guard-shield','local-07-return-guard-relay']
            state['60-ending']={'renderedFour':True,'finalPrivateSlotWrites':len(qa_saved),'evidence':qa_saved[0]['honroEndingReceipt']}
        assert state['requests']==['/'+PACKETS[x][0] for x in range(51,61 if run60 else 60)],state['requests']
        assert not state['pageErrors'],state['pageErrors']
        assert page.evaluate("()=>({storage:localStorage.getItem('honro-first-act-profile-1'), profile:JSON.stringify(HonroApp.normalProfile)})")==storage
        state['status']='PASS_ACTUAL_APP_SIGNED_ENGINE_INPUT_REPLAY_TRUSTED_ROLE_CLICKS'
    finally:
        ctx.close()

try:
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(chromium_sandbox=True,**({'executable_path':os.environ['HONRO_QA_CHROMIUM']} if os.environ.get('HONRO_QA_CHROMIUM') else {}))
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
    evidence['status']='PASS_ORDINARY_OFF_REAL_51_INPUT_AND_ACT6_51_TO_'+('60_PHYSICAL_ONLY' if run60 else '59')+'_BROWSER_SIGNED_REPLAY'
finally:
    (out/'BROWSER.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n')
    for server in [a_srv,b_srv]:
        server.shutdown()
        server.server_close()
