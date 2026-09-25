from pathlib import Path
import json, shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
rows=[]
with sync_playwright() as p:
  browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-precise-memory-info'])
  for sid in (1,2,3,4):
    page=browser.new_page(viewport={'width':1365,'height':768})
    page.set_content((ROOT/'HONRO.html').read_text(),wait_until='load',timeout=120000)
    page.evaluate("""()=>{const a=HonroApp;a.profile.seen['map-story-v5-0']=true;a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=[...a.profile.recruited];for(let i=1;i<=10;i++)a.profile.cleared[i]={};}""")
    launch=page.evaluate("""sid=>{const a=HonroApp,t=performance.now();a.close();a.profile.honroBattle=null;a.launch(sid);const ms=performance.now()-t;if(a.dialogue)HonroStory.finish(a);a.turnNotice=null;a.scene.manual=true;a.scene.scale=.20;a.scene.x=a.engine.b.width/2;a.scene.y=a.engine.b.height/2;return ms;}""",sid)
    page.evaluate("""()=>{const a=HonroApp;window.__zp={n:0,total:0,max:0};const orig=a.scene.render.bind(a.scene);a.scene.render=function(...args){const t=performance.now(),r=orig(...args),dt=performance.now()-t;__zp.n++;__zp.total+=dt;__zp.max=Math.max(__zp.max,dt);return r;}}""")
    before=page.evaluate("()=>performance.memory?.usedJSHeapSize||0")
    page.wait_for_timeout(2000)
    d=page.evaluate("()=>({p:__zp,heap:performance.memory?.usedJSHeapSize||0,err:HonroApp.lastError||null})")
    row={'stage':sid,'launchMs':round(launch,1),'renders2s':d['p']['n'],'renderHz':round(d['p']['n']/2,1),'renderAvgMs':round(d['p']['total']/max(1,d['p']['n']),2),'renderMaxMs':round(d['p']['max'],2),'heapDelta':d['heap']-before,'err':d['err']}
    rows.append(row);print(row,flush=True);page.close()
  browser.close()
(ROOT/'game/reports/zoom-perf-baseline.json').write_text(json.dumps(rows,indent=2))
