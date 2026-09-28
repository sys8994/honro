import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tests'))
from browser_support import browser_path
from pathlib import Path
import json, shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'_local/game-reports/rc15-ui'; OUT.mkdir(parents=True,exist_ok=True)
checks=[]; errors=[]
def ck(ok,name,detail=None):
    if not ok: raise AssertionError(f'{name}: {detail}')
    checks.append({'name':name,'detail':detail}); print('PASS',name,detail or '',flush=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=browser_path(),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':900}); page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content((ROOT/'HONRO.html').read_text(encoding='utf-8'),wait_until='load',timeout=120000)
    page.evaluate("()=>{HonroApp.profile.seen['map-story-v5-0']=true;HonroApp.profile.recruited=['archer','mage','knight','occultist'];HonroApp.profile.party=[...HonroApp.profile.recruited];}")
    rows=[]
    for sid in (1,2):
        d=page.evaluate("""sid=>{const a=HonroApp;a.close();a.profile.honroBattle=null;for(let i=1;i<sid;i++)a.profile.cleared[i]={};a.launch(sid);if(a.dialogue)HonroStory.finish(a);a.turnNotice=null;a.updateHUD(true);const b=a.engine.b,cv=document.getElementById('battlecanvas'),rect=cv.getBoundingClientRect();a.done=true;a.scene.storyTween=null;a.scene.goalFocus=null;a.scene.cinematic=null;a.scene.manual=true;a.scene.x=b.width/2;a.scene.y=b.height/2;a.scene.scale=Math.max(.12,Math.min((rect.width*.91)/b.width,(rect.height*.84)/b.height));a.scene.render(a.engine,0,a.selected,.6,false,.02);return{sid,w:b.width,h:b.height,rev:b.honroRevision,stats:b.honroDetailStats,zones:(b.honroSurfaceZones||[]).map(z=>({kind:z.kind,n:z.points.length})),landmarks:b.honroLandmarks.length};}""",sid)
        ck(d['rev']==15,f'Stage {sid} loads RC15',d)
        ck(d['stats']['groundTop']>=(50 if sid==1 else 65),f'Stage {sid} high-density ground visible to runtime',d['stats'])
        ck(any(z['kind']=='shallow-water' for z in d['zones']),f'Stage {sid} shallow water layer present',d['zones'])
        page.screenshot(path=str(OUT/f'stage-{sid}-overview.png'))
        # closer gameplay crop
        page.evaluate("""sid=>{const a=HonroApp,b=a.engine.b,anchor=sid===1?b.honroMapAnchors.cart:b.honroMapAnchors.leftBasin;a.scene.x=anchor.x+450;a.scene.y=anchor.y-250;a.scene.scale=.52;a.scene.render(a.engine,0,a.selected,.6,false,.02);}""",sid)
        page.screenshot(path=str(OUT/f'stage-{sid}-detail.png'))
        rows.append(d)
    ck(not errors,'No browser runtime exceptions',errors)
    (ROOT/'_local/game-reports/rc15-browser.json').write_text(json.dumps({'checks':checks,'maps':rows,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
    browser.close()
print('RC15 BROWSER PASSED',len(checks))
