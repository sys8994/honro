"""Play the public topview chapter using only field, dialogue, guard and fire controls."""
import argparse, json, os, threading, time
from urllib.parse import unquote,urlsplit
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright
from native_entry import enter_chapter
parser=argparse.ArgumentParser()
parser.add_argument('--mobile',action='store_true')
parser.add_argument('--entry-only',action='store_true',help='Stop after opening the chapter and moving through the normal controls.')
parser.add_argument('--viewport',help='CSS viewport, e.g. 390x844')
parser.add_argument('--out',required=True,type=Path)
parser.add_argument('--base')
args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True)
root=Path(__file__).resolve().parents[2]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
server=None
if not args.base:
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
url=args.base or f'http://127.0.0.1:{server.server_port}/topview/'
mode='touch' if args.mobile else 'desktop'; log={'entry':url,'mode':mode,'actions':[],'errors':[],'checks':{}}
clock=time.monotonic()
def note(label, data=None):
    log['actions'].append({'at_s':round(time.monotonic()-clock,2),'input':label,'state':data})
    (args.out/(mode+'.json')).write_text(json.dumps(log,ensure_ascii=False,indent=2))
    print(label, str(data)[:175],flush=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.getenv('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    width,height=map(int,args.viewport.split('x')) if args.viewport else ((844,480) if args.mobile else (1180,760))
    page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1,is_mobile=args.mobile,has_touch=args.mobile)
    requests=set()
    def resource(response):
        u=urlsplit(response.url)
        if 200<=response.status<300 and u.scheme in ('http','https'):requests.add(unquote(u.path.lstrip('/')))
    page.on('response',resource)
    page.on('pageerror',lambda e:log['errors'].append(str(e)))
    def tap(loc):
        if args.mobile:loc.tap(timeout=18000)
        else:loc.click(timeout=18000)
    def point(x,y):
        if args.mobile:page.touchscreen.tap(x,y)
        else:page.mouse.click(x,y)
    def state():
        return page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e?.b,u=b?.units.find(u=>u.id==='p-archer');return {screen:a.screen,phase:b?.phase,round:b?.round,active:b?.active,who:a.dialogue?.lines?.[a.dialogue.index]?.[0],line:a.dialogue?.lines?.[a.dialogue.index]?.[1],modal:a.modal.classList.contains('open')?a.modalKind:'',done:a.done,hp:u?.hp,move:u?.moveLeft,x:u?.x,y:u?.y,route:u?.tvPath?.length||0,shot:b?.shot,events:b?.honroState?.eventLog?.map(e=>e.id)||[],cast:b?.units.length,error:a.lastError}}""")
    def readers():
        for _ in range(38):
            btn=page.locator('[data-action="dialogue-next"]:visible')
            if not btn.count():return
            note('다음',state().get('line'));tap(btn.first)
    def capture(name):page.screenshot(path=str(args.out/(mode+'-'+name+'.jpg')),quality=86)
    def armed():
        page.wait_for_function("!!globalThis.HonroApp?.canInput()&&!HonroStory.turnPaused(HonroApp)",timeout=20000)
    try:
        # Each run owns a fresh browser context. Seed the isolation control before
        # first startup and never write it again on reload or redirect.
        page.add_init_script("if(!sessionStorage.getItem('tv-test-control')){localStorage.setItem('honro-first-act-profile-1','topview-isolation-control');sessionStorage.setItem('tv-test-control','1');}")
        page.goto(url,wait_until='domcontentloaded')
        enter_chapter(page,args.mobile);readers();armed()
        note('입장',state());capture('entry')
        log['checks']['nativeAudio']=page.evaluate("()=>{const a=HonroApp.audio,m=a.music;return {unlocked:m.unlocked,track:m.track,src:m.current?.src||m.current?.audio?.src,skills:!!a.skills,context:a.context?.state}}")
        mapdata=json.loads((root/'topview/data/yeonmok.json').read_text())
        def arm_trace():
            page.evaluate("""()=>{const a=HonroApp,e=a.engine,nativeFire=e.fire,nativeImpact=e.impact;window.trajectoryEvidence={};
            e.fire=function(s,ang,p,...args){const u=this.active;if(u?.side===0){const q=this.predict(u,HONRO_CORE.SKILLS[s],ang,p),who=q.unit,drawn=a.scene.pred;trajectoryEvidence.prediction={x:q.x,y:q.y,id:typeof who==='string'?who:who?.id||null,power:p,angle:ang,skill:s};if(drawn)trajectoryEvidence.lastDisplayed={x:drawn.x,y:drawn.y,id:typeof drawn.unit==='string'?drawn.unit:drawn.unit?.id||null};}return nativeFire.call(this,s,ang,p,...args);};
             e.impact=function(p,h,...args){if(p.owner==='p-archer'&&h&&!trajectoryEvidence.impact)trajectoryEvidence.impact={x:h.x,y:h.y,id:h.unit?.id||h.terrain?.id||null};return nativeImpact.call(this,p,h,...args);};
            }""")
        if args.mobile:
            stick=page.locator('#joystick').bounding_box();jx,jy=stick['x']+stick['width']/2,stick['y']+stick['height']/2
            cdp=page.context.new_cdp_session(page)
            before=state()
            cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':jx,'y':jy}]})
            cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':jx+21,'y':jy-7}]})
            page.wait_for_timeout(330);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
            after=state();log['checks']['touchStick']={'before':before,'after':after}
            if abs(before['x']-after['x'])+abs(before['y']-after['y'])<4:raise AssertionError('터치 스틱 이동')
        else:
            before=state();page.keyboard.down('w');page.keyboard.down('d')
            page.wait_for_timeout(180);page.keyboard.up('w');page.keyboard.up('d');after=state()
            log['checks']['keyboard']={'before':before,'after':after}
            if before['move']<=after['move'] or before['x']==after['x'] or before['y']==after['y']:raise AssertionError('대각선 이동과 이동도')
        if args.entry_only:
            entry=page.evaluate("""()=>{const a=HonroApp,b=a.engine.b;return {chapter:b.honroStage,topview:b.honroTopview,terrain:b.tvTerrainRevision,foes:b.units.filter(u=>u.side===1&&!u.dead).length,actor:b.active,screen:a.screen};}""")
            if entry!={'chapter':1,'topview':1,'terrain':mapdata['meta']['revision'],'foes':12,'actor':'p-archer','screen':'battle'} or log['errors']:
                raise AssertionError((entry,log['errors']))
            note('탑뷰 1장 이동 확인',entry)
            raise SystemExit(0)
        arm_trace()
        tap(page.locator('[data-lock]'));assert page.locator('[data-lock]').get_attribute('aria-pressed')=='true'
        tgt=page.evaluate("()=>{const a=HonroApp,e=a.engine,u=e.unit('watch-1-pass-1-1');const p=e.damageAim(u),q=a.scene.screenPoint(p.x,p.y);return {x:q.x,y:q.y-26*a.scene.zoomLevel};}")
        point(tgt['x'],tgt['y'])
        r=page.locator('#fire').bounding_box();x,y=r['x']+r['width']/2,r['y']+r['height']/2
        if args.mobile:
            cdp=page.context.new_cdp_session(page);cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]});page.wait_for_timeout(1100);cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        else:
            page.mouse.move(x,y);page.mouse.down();page.wait_for_timeout(1100);page.mouse.up()
        page.wait_for_function("HonroApp.engine.b.shot>=1")
        # Native pierce/arrow handlers may consume a unit contact before impact().
        page.wait_for_function("HonroApp.engine.unit('watch-1-pass-1-1').hp<76",timeout=15000)
        evidence=page.evaluate("()=>({...trajectoryEvidence,afterHP:HonroApp.engine.unit('watch-1-pass-1-1').hp})")
        log['checks']['shot']=evidence;note('평사 실제 피격',evidence);capture('hit')
        point_of_impact=evidence['impact']
        for prediction in [evidence['prediction'],evidence['lastDisplayed']]:
            if prediction['id']!=point_of_impact['id'] or abs(prediction['x']-point_of_impact['x'])+abs(prediction['y']-point_of_impact['y'])>.05:
                raise AssertionError(('화면 예측과 실제 첫 충돌',evidence))
        def prompt_ready():
            for _ in range(220):
                s=state()
                if s['done'] or s.get('error'):return s
                if s.get('line'):readers();continue
                if page.evaluate("HonroApp.canInput()&&!HonroStory.turnPaused(HonroApp)"):return s
                page.wait_for_timeout(150)
            raise RuntimeError('다음 조작 대기 '+str(state()))
        prompt_ready()
        page.wait_for_timeout(1500);s0=state();page.reload(wait_until='domcontentloaded');enter_chapter(page,args.mobile);readers();s1=prompt_ready()
        log['checks']['reload']={'before':s0,'after':s1};note('일반 이어가기',s1)
        for key in ['round','phase','active','hp','shot','events','cast','x','y']:
            if s0[key]!=s1[key]:raise AssertionError(('이어가기',key,s0[key],s1[key]))
        lock=page.locator('[data-lock]');
        if lock.get_attribute('aria-pressed')=='true':tap(lock)
        def look_at(cx,cy):
            mini=page.locator('#minimap').bounding_box();point(mini['x']+cx/(mapdata['width']*mapdata['cell'])*mini['width'],mini['y']+cy/(mapdata['height']*mapdata['cell'])*mini['height'])
        for target in ['marker-4','marker-6','witness','ridge','marker-7']:
            q=mapdata['anchors'][target];cx=q['x']*mapdata['cell'];cy=q['y']*mapdata['cell']
            for attempt in range(18):
                s=prompt_ready()
                if s['done']:break
                distance=((s['x']-cx)**2+(s['y']-46-cy)**2)**.5
                if distance<104:break
                if s['move']<8:
                    tap(page.locator('[data-action="defend"]:visible').first);note('방어',state());continue
                look_at(cx,cy)
                # The witness is a selectable actor. Click clear ground within the arrival range.
                loc=page.evaluate('''([x,y,mouse])=>{
                    const a=HonroApp,s=a.scene;
                    for(const offset of [[0,0],[45,24],[-45,24],[0,54],[48,0],[-48,0],[0,-54]]){
                        const p=s.screenPoint(x+offset[0],y+offset[1]);
                        if(!mouse||!s.pickScreenUnit(p,3))return p;
                    }
                    throw Error('No visible ground around the chapter marker');
                }''',[cx,cy,not args.mobile])
                point(loc['x'],loc['y']);note(target+' 이동',{'screen':loc,'distance':round(distance),'state':state()})
                for step in range(85):
                    page.wait_for_timeout(170);v=state()
                    if v['done'] or v.get('line') or v.get('error') or v['move']<=1 or v['route']==0:break
                v=state()
                if v.get('error'):raise RuntimeError(v['error'])
                if v['move']<8 or v.get('line') or v['done']:continue
                if abs(s['move']-v['move'])<.05:raise RuntimeError('경로 입력 후 이동 없음 '+str(v)+' '+str(loc))
            if state()['done']:break
        readers();end=state();note('도착',end)
        if end['phase']!='won':raise AssertionError(end)
        page.wait_for_function("HonroApp.done&&!!HonroApp.profile.cleared[1]");capture('result')
        log['checks']['completion']=page.evaluate("()=>({visits:HonroApp.profile.cleared[1].visits,record:HonroApp.profile.record.at(-1),flags:HonroApp.engine.b.honroState.flags,storageIsolated:localStorage.getItem('honro-first-act-profile-1')==='topview-isolation-control',titleAction:[...document.querySelectorAll('#modal button')].map(e=>[e.dataset.action,e.textContent])})")
        note('장 정산',log['checks']['completion'])
        result=log['checks']['completion']
        if not result['storageIsolated'] or not all(result['flags'].get('event:'+name) for name in ['cart','more','witness','ridge']) or end['cast']!=18:
            raise AssertionError(('사건·증원·저장 격리',result,end))
        title=page.locator('#modal [data-action="title"]:visible')
        tap(title.first);page.wait_for_selector('.honro-title .title-actions')
        log['checks']['returnToTitle']=state()['screen']=='title';note('데모 타이틀',state())
        tap(page.locator('.honro-title .title-actions button[data-action]').first);page.wait_for_function("HonroApp.screen==='rest'");page.wait_for_function("performance.now()>=(HonroApp.journeyInputAfter||0)");tap(page.locator('[data-action=camp]:visible').first);page.wait_for_function("HonroApp.screen==='camp'")
        log['checks']['camp']={'screen':state()['screen'],'text':page.locator('#app').inner_text()[:520]};note('동행과 장비',log['checks']['camp']);capture('camp')
        if not log['checks']['returnToTitle'] or log['errors']:raise AssertionError(log['errors'])
    except Exception as e:
        log['failure']=repr(e);note('검수 중단',state() if page.evaluate('!!window.HonroApp') else page.locator('body').inner_text());capture('failure');raise
    finally:
        (args.out/(mode+'.json')).write_text(json.dumps(log,ensure_ascii=False,indent=2))
        (args.out/(mode+'-resources.json')).write_text(json.dumps(sorted(requests),ensure_ascii=False,indent=2))
        browser.close()
if server:server.shutdown()
