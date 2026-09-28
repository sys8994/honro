import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tests'))
from browser_support import browser_path
from pathlib import Path
import json, shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
rows=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=browser_path(),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-precise-memory-info'])
    for sid in (1,2,3,4):
      for scale in (.8,.45,.25,.16):
        page=browser.new_page(viewport={'width':1365,'height':768})
        page.set_content((ROOT/'HONRO.html').read_text(encoding='utf-8'),wait_until='load',timeout=120000)
        page.evaluate("""()=>{const a=HonroApp;a.profile.seen['map-story-v5-0']=true;a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=[...a.profile.recruited];a.profile.honroBattle=null;for(let i=1;i<=10;i++)a.profile.cleared[i]={};}""")
        page.evaluate("""sid=>{const a=HonroApp;a.close();a.profile.honroBattle=null;a.launch(sid);if(a.dialogue)HonroStory.finish(a);a.turnNotice=null;a.scene.manual=true;a.done=true;}""",sid)
        d=page.evaluate("""scale=>{const a=HonroApp,s=a.scene;s.scale=scale;s.x=a.engine.b.width/2;s.y=a.engine.b.height/2;
          const names=['background','outsideTerrain','landmark','terrain','surfaceZones','unit','field'];const q={};const originals={};for(const n of names){if(typeof s[n]!=='function')continue; originals[n]=s[n]; q[n]={n:0,ms:0}; s[n]=function(...args){const t=performance.now();const r=originals[n].apply(this,args);q[n].n++;q[n].ms+=performance.now()-t;return r;};}
          // warmup
          for(let i=0;i<3;i++)s.render(a.engine,0,a.selected,.6,false,0);
          for(const k in q){q[k].n=0;q[k].ms=0;}
          const before=performance.memory?.usedJSHeapSize||0,t0=performance.now();const N=20;for(let i=0;i<N;i++)s.render(a.engine,0,a.selected,.6,false,0);const total=performance.now()-t0,after=performance.memory?.usedJSHeapSize||0;
          for(const n in originals)s[n]=originals[n];return{total,per:total/N,heapDelta:after-before,parts:q,terrain:a.engine.b.terrain.length,landmarks:a.engine.b.honroLandmarks.length,zones:(a.engine.b.honroSurfaceZones||[]).length,width:a.engine.b.width,height:a.engine.b.height};}""",scale)
        d.update({'stage':sid,'scale':scale});rows.append(d);print('PROFILE',sid,scale,round(d['per'],2),{k:round(v['ms']/20,2) for k,v in d['parts'].items()})
        page.close()
    browser.close()
(ROOT/'_local/game-reports/rc20-deep-profile.json').write_text(json.dumps(rows,indent=2),encoding='utf-8')
