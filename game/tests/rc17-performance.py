from pathlib import Path
import json, shutil, statistics
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'game/reports'; OUT.mkdir(parents=True,exist_ok=True)
rows=[]; errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-precise-memory-info'])
    for sid in (1,2,3):
        page=browser.new_page(viewport={'width':1365,'height':768}); page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content((ROOT/'HONRO.html').read_text(encoding='utf-8'),wait_until='load',timeout=120000)
        page.evaluate("""()=>{const a=HonroApp;a.profile.seen['map-story-v5-0']=true;a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=[...a.profile.recruited];a.profile.honroBattle=null;for(let i=1;i<=10;i++)a.profile.cleared[i]={};}""")
        launch=page.evaluate("""sid=>{const a=HonroApp,t0=performance.now();a.close();a.profile.honroBattle=null;a.launch(sid);const ms=performance.now()-t0;if(a.dialogue)HonroStory.finish(a);a.turnNotice=null;return{ms,terrain:a.engine.b.terrain.length,landmarks:a.engine.b.honroLandmarks.length,zones:(a.engine.b.honroSurfaceZones||[]).length,heap:performance.memory?.usedJSHeapSize||0};}""",sid)
        page.evaluate("""()=>{const a=HonroApp;window.__perf={n:0,total:0,max:0,samples:[]};const orig=a.scene.render.bind(a.scene);a.scene.render=function(...args){const t=performance.now(),r=orig(...args),dt=performance.now()-t,q=window.__perf;q.n++;q.total+=dt;q.max=Math.max(q.max,dt);q.samples.push(dt);return r;};}""")
        before=page.evaluate("()=>performance.memory?.usedJSHeapSize||0")
        page.wait_for_timeout(1000)
        d=page.evaluate("()=>({q:window.__perf,heap:performance.memory?.usedJSHeapSize||0,lastError:HonroApp.lastError||null})")
        n=d['q']['n']; samples=d['q']['samples']; avg=d['q']['total']/max(1,n)
        row={'stage':sid,'launchMs':round(launch['ms'],1),'rendersPerSec':n,'renderAvgMs':round(avg,2),'renderMaxMs':round(d['q']['max'],2),'heapBefore':before,'heapAfter':d['heap'],'heapDelta':d['heap']-before,'lastError':d['lastError'],'terrain':launch['terrain'],'landmarks':launch['landmarks'],'zones':launch['zones']}
        assert launch['ms'] < 700, row
        assert n >= 12, row
        assert d['heap']-before < 30_000_000, row
        assert not d['lastError'], row
        rows.append(row); print('PASS',row,flush=True); page.close()
    browser.close()
assert not errors, errors
(OUT/'rc17-performance.json').write_text(json.dumps({'rows':rows,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
print('RC17 PERFORMANCE PASS',len(rows))
