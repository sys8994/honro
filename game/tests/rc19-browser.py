from pathlib import Path
import json, shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'game/reports/rc19-ui'; OUT.mkdir(parents=True,exist_ok=True)
checks=[]; errors=[]
def ck(ok,name,detail=None):
    if not ok: raise AssertionError(f'{name}: {detail}')
    checks.append({'name':name,'detail':detail}); print('PASS',name,detail or '',flush=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-precise-memory-info'])
    page=browser.new_page(viewport={'width':1440,'height':900}); page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content((ROOT/'HONRO.html').read_text(encoding='utf-8'),wait_until='load',timeout=120000)
    page.evaluate("()=>{HonroApp.profile.seen['map-story-v5-0']=true;HonroApp.profile.recruited=['archer','mage','knight','occultist'];HonroApp.profile.party=[...HonroApp.profile.recruited];for(let i=1;i<=10;i++)HonroApp.profile.cleared[i]={};}")
    maps=[]
    details={1:'shrine',2:'rightBasin',3:'mudflat',4:'cartChoke'}
    for sid in (1,2,3,4):
        d=page.evaluate("""sid=>{const a=HonroApp;a.close();a.profile.honroBattle=null;a.launch(sid);if(a.dialogue)HonroStory.finish(a);a.turnNotice=null;a.updateHUD(true);const b=a.engine.b,cv=document.getElementById('battlecanvas'),rect=cv.getBoundingClientRect();a.done=true;a.scene.storyTween=null;a.scene.goalFocus=null;a.scene.cinematic=null;a.scene.manual=true;a.scene.x=b.width/2;a.scene.y=b.height/2;a.scene.scale=Math.max(.12,Math.min((rect.width*.91)/b.width,(rect.height*.84)/b.height));a.scene.render(a.engine,0,a.selected,.6,false,.02);return{sid,w:b.width,h:b.height,mapRev:b.honroMapRevision,stats:b.honroDetailStats,zones:(b.honroSurfaceZones||[]).map(z=>({kind:z.kind,n:z.points.length,attached:!!z.attached})),landmarks:b.honroLandmarks.length,terrain:b.terrain.length};}""",sid)
        ck(d['mapRev']==19,f'Stage {sid} loads RC19 map compiler',d)
        ck(len({z['kind'] for z in d['zones']})>=5,f'Stage {sid} has material composition',d['zones'])
        ck(all(z['attached'] for z in d['zones']),f'Stage {sid} material layers are support-bound',d['zones'])
        page.screenshot(path=str(OUT/f'stage-{sid}-overview.png'))
        page.evaluate("""([sid,name])=>{const a=HonroApp,b=a.engine.b,anchor=b.honroMapAnchors[name]||Object.values(b.honroMapAnchors)[0];a.scene.x=anchor.x+260;a.scene.y=anchor.y-220;a.scene.scale=.52;a.scene.render(a.engine,0,a.selected,.6,false,.02);}""",[sid,details[sid]])
        page.screenshot(path=str(OUT/f'stage-{sid}-detail.png'))
        maps.append(d)
    perf=[]
    for sid in (1,2,3,4):
        p0=browser.new_page(viewport={'width':1365,'height':768}); p0.on('pageerror',lambda e:errors.append(str(e)))
        p0.set_content((ROOT/'HONRO.html').read_text(encoding='utf-8'),wait_until='load',timeout=120000)
        p0.evaluate("()=>{HonroApp.profile.seen['map-story-v5-0']=true;HonroApp.profile.recruited=['archer','mage','knight','occultist'];HonroApp.profile.party=[...HonroApp.profile.recruited];for(let i=1;i<=10;i++)HonroApp.profile.cleared[i]={};}")
        launch=p0.evaluate("""sid=>{const a=HonroApp,t0=performance.now();a.profile.honroBattle=null;a.launch(sid);const ms=performance.now()-t0;if(a.dialogue)HonroStory.finish(a);a.turnNotice=null;return{ms,heap:performance.memory?.usedJSHeapSize||0};}""",sid)
        p0.evaluate("""()=>{const a=HonroApp;window.__perf={n:0,total:0,max:0};const orig=a.scene.render.bind(a.scene);a.scene.render=function(...args){const t=performance.now(),r=orig(...args),dt=performance.now()-t,q=window.__perf;q.n++;q.total+=dt;q.max=Math.max(q.max,dt);return r;};}""")
        before=p0.evaluate("()=>performance.memory?.usedJSHeapSize||0")
        p0.wait_for_timeout(1000)
        q=p0.evaluate("()=>({q:window.__perf,heap:performance.memory?.usedJSHeapSize||0,lastError:HonroApp.lastError||null})")
        row={'stage':sid,'launchMs':round(launch['ms'],1),'rendersPerSec':q['q']['n'],'renderAvgMs':round(q['q']['total']/max(1,q['q']['n']),2),'renderMaxMs':round(q['q']['max'],2),'heapDelta':q['heap']-before,'lastError':q['lastError']}
        ck(row['launchMs']<700 and row['rendersPerSec']>=12 and row['heapDelta']<30_000_000 and not row['lastError'],f'Stage {sid} performance gate',row)
        perf.append(row); p0.close()
    ck(not errors,'No browser runtime exceptions',errors)
    (ROOT/'game/reports/rc19-browser.json').write_text(json.dumps({'checks':checks,'maps':maps,'performance':perf,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
    browser.close()
print('RC19 BROWSER PASSED',len(checks))
