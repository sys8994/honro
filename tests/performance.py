"""Same browser, stage and camera workload for original RC21 and integrated builds."""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

source = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT/'HONRO.html'
output = ROOT/(sys.argv[2] if len(sys.argv) > 2 else 'reports/performance-game.json')
rows = []
errors = []
editor = 'WORKSHOP' in source.name
with sync_playwright() as p:
    browser = launch(p)
    for width, height, zoom in [(1365, 768, .82), (1365, 768, .20), (844, 390, .20)]:
        for sid in [1, 2]:
            page = browser.new_page(viewport={'width':width,'height':height})
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(source.as_uri(), wait_until='load')
            if editor:
                page.add_style_tag(content=f'#stageView .canvas-wrap{{position:fixed;left:0;top:0;width:{width}px;height:{height}px;z-index:99}}#stageToolbar,.canvas-help,.hud-overlay{{display:none!important}}')
                load=page.evaluate('''([sid,zoom])=>{const a=HonroWorkshopAPI,t=performance.now();a.setOverlay(false);a.selectStage('stage-'+sid);const b=a.getRuntime().engine.b;a.setCamera({x:b.width/2,y:b.height/2,zoom});return performance.now()-t;}''',[sid,zoom])
            else:
                load = page.evaluate('''([sid,zoom])=>{
              const a=HonroApp; a.profile.seen['map-story-v5-0']=true;
              for(let i=1;i<=10;i++)a.profile.cleared[i]={};
              const t=performance.now(); a.launch(sid); if(a.dialogue)HonroStory.finish(a);
              a.turnNotice=null; a.done=true;
              Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,cinematic:null,
                scale:zoom,x:a.engine.b.width/2,y:a.engine.b.height/2});
              return performance.now()-t;
                }''', [sid,zoom])
            page.wait_for_timeout(600)
            page.evaluate('''()=>{
              const a=globalThis.HonroWorkshopAPI?.getRuntime()||HonroApp; window.__p={n:0,total:0,max:0,start:performance.now(),heap:performance.memory?.usedJSHeapSize||0,cacheBefore:a.scene.renderCacheStats()};
              const render=a.scene.render.bind(a.scene);
              a.scene.render=(...args)=>{const t=performance.now();render(...args);const ms=performance.now()-t;__p.n++;__p.total+=ms;__p.max=Math.max(__p.max,ms)};
            }''')
            page.wait_for_timeout(2000)
            data=page.evaluate('''()=>({...__p,elapsed:performance.now()-__p.start,
              heapAfter:performance.memory?.usedJSHeapSize||0,cache:(globalThis.HonroWorkshopAPI?.getRuntime()||HonroApp).scene.renderCacheStats(),error:globalThis.HonroApp?.lastError||null})''')
            row={'stage':sid,'viewport':[width,height],'zoom':zoom,'loadMs':round(load,2),
                 'renderHz':round(data['n']/(data['elapsed']/1000),2),'renderAvgMs':round(data['total']/max(1,data['n']),3),
                 'renderMaxMs':round(data['max'],2),'heapDelta':data['heapAfter']-data['heap'], 'cache':data['cache'],
                 'warmCacheRebuilds':data['cache']['worldBuilds']-data['cacheBefore']['worldBuilds'],'error':data['error']}
            rows.append(row)
            print(json.dumps(row), flush=True)
            assert not data['error'], row
            assert row['renderHz']>=50 and row['renderAvgMs']<7 and row['loadMs']<750,row
            assert row['warmCacheRebuilds']==0 and row['heapDelta']<30_000_000,row
            page.close()
    browser.close()
assert not errors, errors
output.parent.mkdir(parents=True,exist_ok=True)
output.write_text(json.dumps({'source':source.name,'rows':rows,'errors':errors},indent=2),encoding='utf-8')
