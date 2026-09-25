import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tests'))
from browser_support import browser_path
from pathlib import Path
import json, shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'game/reports/rc20-ui'; OUT.mkdir(parents=True,exist_ok=True)
checks=[]; errors=[]
def ck(ok,name,detail=None):
    if not ok: raise AssertionError(f'{name}: {detail}')
    checks.append({'name':name,'detail':detail}); print('PASS',name,detail or '',flush=True)
with sync_playwright() as p:
    chromium=browser_path()
    browser=p.chromium.launch(executable_path=chromium,headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-precise-memory-info'])
    page=browser.new_page(viewport={'width':1440,'height':900}); page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content((ROOT/'HONRO.html').read_text(encoding='utf-8'),wait_until='load',timeout=120000)
    page.evaluate("()=>{HonroApp.profile.seen['map-story-v5-0']=true;HonroApp.profile.recruited=['archer','mage','knight','occultist'];HonroApp.profile.party=[...HonroApp.profile.recruited];for(let i=1;i<=10;i++)HonroApp.profile.cleared[i]={};}")
    maps=[]
    details={1:'shrine',2:'procession'}
    for sid in (1,2):
        d=page.evaluate("""sid=>{const a=HonroApp;a.close();a.profile.honroBattle=null;a.launch(sid);if(a.dialogue)HonroStory.finish(a);a.turnNotice=null;a.updateHUD(true);const b=a.engine.b,cv=document.getElementById('battlecanvas'),rect=cv.getBoundingClientRect();a.done=true;a.scene.storyTween=null;a.scene.goalFocus=null;a.scene.cinematic=null;a.scene.manual=true;a.scene.x=b.width/2;a.scene.y=b.height/2;a.scene.scale=Math.max(.12,Math.min((rect.width*.91)/b.width,(rect.height*.84)/b.height));a.scene.render(a.engine,0,a.selected,.6,false,.02);return{sid,w:b.width,h:b.height,rev:b.honroRevision,mapRev:b.honroMapRevision,stats:b.honroDetailStats,zones:(b.honroSurfaceZones||[]).map(z=>({kind:z.kind,n:z.points.length,attached:!!z.attached})),landmarks:b.honroLandmarks.length,terrain:b.terrain.length,branchIds:b.terrain.filter(t=>t.surfaceKind==='branch').map(t=>t.id)};}""",sid)
        ck(d['rev']==20 and d['mapRev']==20,f'Stage {sid} loads RC20',d)
        ck(d['stats']['groundTop']>=200,f'Stage {sid} high-density ground visible',d['stats'])
        ck(d['stats']['scatterCount']>=18,f'Stage {sid} deterministic scenery density',d['stats'])
        kinds={z['kind'] for z in d['zones']}
        ck('water-pool' in kinds and len(kinds)>=5,f'Stage {sid} natural material composition',sorted(kinds))
        page.screenshot(path=str(OUT/f'stage-{sid}-overview.png'))
        page.evaluate("""([sid,name])=>{const a=HonroApp,b=a.engine.b,anchor=b.honroMapAnchors[name]||Object.values(b.honroMapAnchors)[0];a.scene.x=anchor.x+180;a.scene.y=anchor.y-170;a.scene.scale=.50;a.scene.render(a.engine,0,a.selected,.6,false,.02);}""",[sid,details[sid]])
        page.screenshot(path=str(OUT/f'stage-{sid}-detail.png'))
        maps.append(d)
    # A small regression tripwire: do not reintroduce costly Canvas filters.
    source=(ROOT/'shared/runtime/renderer.js').read_text(encoding='utf-8')
    ck('.filter =' not in source and '.filter=' not in source,'No Canvas filter performance regression')
    ck(not errors,'No browser runtime exceptions',errors)
    (ROOT/'game/reports/rc20-browser.json').write_text(json.dumps({'checks':checks,'maps':maps,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
    browser.close()
print('RC20 BROWSER PASSED',len(checks))
