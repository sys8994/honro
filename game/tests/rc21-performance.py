import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tests'))
from browser_support import browser_path
from pathlib import Path
import json, shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'_local/game-reports';OUT.mkdir(parents=True,exist_ok=True)
rows=[]; errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=browser_path(),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-precise-memory-info'])
    for sid in (1,2,3,4):
        page=browser.new_page(viewport={'width':1365,'height':768});page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content((ROOT/'HONRO.html').read_text(encoding='utf-8'),wait_until='load',timeout=120000)
        page.evaluate("""()=>{const a=HonroApp;a.profile.seen['map-story-v5-0']=true;a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=[...a.profile.recruited];for(let i=1;i<=10;i++)a.profile.cleared[i]={};}""")
        launch=page.evaluate("""sid=>{const a=HonroApp,t=performance.now();a.close();a.profile.honroBattle=null;a.launch(sid);const ms=performance.now()-t;if(a.dialogue)HonroStory.finish(a);a.turnNotice=null;a.scene.manual=true;a.scene.scale=.20;a.scene.x=a.engine.b.width/2;a.scene.y=a.engine.b.height/2;return ms;}""",sid)
        # Finish's release tween must not overwrite the requested overview camera.
        page.evaluate("""()=>Object.assign(HonroApp.scene,{manual:true,storyTween:null,goalFocus:null,cinematic:null,scale:.20})""")
        page.wait_for_timeout(600)
        page.evaluate("""()=>{const a=HonroApp;window.__p={n:0,total:0,max:0,start:performance.now()};const o=a.scene.render.bind(a.scene);a.scene.render=(...x)=>{const t=performance.now(),r=o(...x),d=performance.now()-t;__p.n++;__p.total+=d;__p.max=Math.max(__p.max,d);return r;};}""")
        before=page.evaluate("()=>performance.memory?.usedJSHeapSize||0")
        page.wait_for_timeout(2000)
        d=page.evaluate("()=>({p:__p,elapsed:performance.now()-__p.start,heap:performance.memory?.usedJSHeapSize||0,err:HonroApp.lastError||null,cache:HonroApp.scene.renderCacheStats()})")
        hz=d['p']['n']/(d['elapsed']/1000); avg=d['p']['total']/max(1,d['p']['n'])
        row={'stage':sid,'launchMs':round(launch,1),'renderHz':round(hz,1),'renderAvgMs':round(avg,2),'renderMaxMs':round(d['p']['max'],2),'heapDelta':d['heap']-before,'cache':d['cache'],'error':d['err']}
        assert launch < 500,row
        assert hz >= 50,row
        assert avg < 7,row
        assert d['heap']-before < 30_000_000,row
        assert not d['err'],row
        if sid==1:
            assert d['cache']['worldBuilds']>=1 and d['cache']['worldHits']>10,row
            assert d['cache']['worldBytes']<=28_000_000,row
            assert d['cache']['backgroundBytes']<=8_000_000,row
        rows.append(row);print('PASS',row,flush=True);page.close()
    # cache invalidation after breakable terrain change
    page=browser.new_page(viewport={'width':1365,'height':768});page.set_content((ROOT/'HONRO.html').read_text(encoding='utf-8'),wait_until='load')
    inv=page.evaluate("""()=>{const a=HonroApp;a.profile.seen['map-story-v5-0']=true;for(let i=1;i<=10;i++)a.profile.cleared[i]={};a.launch(1);if(a.dialogue)HonroStory.finish(a);a.scene.manual=true;a.scene.scale=.4;a.scene.x=a.engine.b.width/2;a.scene.y=a.engine.b.height/2;a.scene.render(a.engine,0,a.selected,.6,false,0);const before=a.scene.renderCacheStats().worldBuilds,t=a.engine.b.terrain.find(t=>!t.indestructible&&t.hp<9999);if(!t)return{before,missing:true};a.engine.damageTerrain(t,t.hp+1);a.scene.render(a.engine,0,a.selected,.6,false,0);return{before,after:a.scene.renderCacheStats().worldBuilds,broken:t.broken,sceneVersion:a.engine.b.sceneVersion};}""")
    assert not inv.get('missing'),inv
    assert inv['broken'] and inv['after']>inv['before'],inv
    print('PASS cache invalidation',inv,flush=True);page.close();browser.close()
assert not errors,errors
(OUT/'rc21-performance.json').write_text(json.dumps({'rows':rows,'cacheInvalidation':inv,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
print('RC21 PERFORMANCE PASS',len(rows)+1)
