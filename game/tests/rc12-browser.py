import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tests'))
from browser_support import browser_path
from pathlib import Path
import shutil, json, math
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]; OUT=ROOT/'_local/game-reports/rc12-ui'; OUT.mkdir(parents=True,exist_ok=True)
checks=[]; errors=[]
def ck(ok,name,detail=None):
    if not ok: raise AssertionError(f'{name}: {detail}')
    checks.append({'name':name,'detail':detail}); print('PASS',name,detail or '',flush=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=browser_path(),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1440,'height':900}); page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content((ROOT/'HONRO.html').read_text(encoding='utf-8'),wait_until='load',timeout=120000)
    page.evaluate("()=>{HonroApp.profile.seen['map-story-v5-0']=true;HonroApp.profile.recruited=['archer','mage','knight','occultist'];HonroApp.profile.party=[...HonroApp.profile.recruited];}")
    maps=[]
    for sid in range(1,11):
        d=page.evaluate("""sid=>{const a=HonroApp;a.close();a.profile.honroBattle=null;for(let i=1;i<sid;i++)a.profile.cleared[i]={};a.launch(sid);if(a.dialogue)HonroStory.finish(a);a.turnNotice=null;a.updateHUD(true);const b=a.engine.b,mc=document.getElementById('minimap'),r=mc.getBoundingClientRect(),ctx=mc.getContext('2d'),img=ctx.getImageData(0,0,mc.width,mc.height).data,ex=document.createElement('canvas');ex.width=mc.width;ex.height=mc.height;const ec=ex.getContext('2d'),sx=ex.width/b.width,sy=ex.height/b.height;ec.fillStyle='#435e58';for(const t of b.terrain){if(t.broken||t.mat==='barrel'||t.mat==='support')continue;const pts=t.vertices?.length?t.vertices:[{x:t.x,y:t.y},{x:t.x+t.w,y:t.y+(t.slope||0)},{x:t.x+t.w,y:t.y+t.h},{x:t.x,y:t.y+t.h}];ec.beginPath();pts.forEach((p,i)=>i?ec.lineTo(p.x*sx,p.y*sy):ec.moveTo(p.x*sx,p.y*sy));ec.closePath();ec.fill();}const exp=ec.getImageData(0,0,ex.width,ex.height).data;let inter=0,uni=0,act=0,want=0;for(let i=0;i<img.length;i+=4){const A=Math.abs(img[i]-67)<3&&Math.abs(img[i+1]-94)<3&&Math.abs(img[i+2]-88)<3&&img[i+3]>200,E=Math.abs(exp[i]-67)<3&&Math.abs(exp[i+1]-94)<3&&Math.abs(exp[i+2]-88)<3&&exp[i+3]>200;if(A)act++;if(E)want++;if(A&&E)inter++;if(A||E)uni++;}return{stage:sid,w:b.width,h:b.height,mw:r.width,mh:r.height,revision:b.honroRevision,terrain:b.terrain.length,iou:uni?inter/uni:1,actualPixels:act,expectedPixels:want};}""",sid)
        rel=abs(d['mw']/d['mh']-d['w']/d['h'])/(d['w']/d['h']); ck(d['revision']==12,f'Stage {sid} loads RC12',d); ck(rel<.02,f'Stage {sid} minimap keeps exact world ratio',{'relError':rel}); ck(d['iou']>.90,f'Stage {sid} minimap terrain matches polygon geometry',{'iou':d['iou']}); maps.append(d)
        page.evaluate("""()=>{const a=HonroApp,b=a.engine.b,cv=document.getElementById('battlecanvas'),rect=cv.getBoundingClientRect();a.done=true;a.scene.storyTween=null;a.scene.goalFocus=null;a.scene.cinematic=null;a.scene.manual=true;a.scene.x=b.width/2;a.scene.y=b.height/2;a.scene.scale=Math.max(.12,Math.min((rect.width*.88)/b.width,(rect.height*.82)/b.height));a.scene.render(a.engine,0,a.selected,.6,false,.02);}""")
        page.screenshot(path=str(OUT/f'stage-{sid}.png'))
    ck(not errors,'No browser runtime exceptions',errors)
    (ROOT/'_local/game-reports/rc12-browser.json').write_text(json.dumps({'checks':checks,'maps':maps,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
    browser.close()
print('RC12 BROWSER PASSED',len(checks))
