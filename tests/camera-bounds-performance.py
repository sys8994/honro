"""Run alone: minimum tactical zoom while panning, including tall portrait."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
rows,errors,failures=[],[],[]
out=ROOT/'_local/reports/camera-bounds';out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
    browser=launch(pw)
    for width,height in [(1440,900),(844,390),(390,844),(320,1100)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto((ROOT/'HONRO.html').as_uri());page.wait_for_function('window.HonroApp && window.HonroAct1Background?.ready()')
        for sid in [1,2,7,10]:
            page.evaluate('''sid=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.sound=false;a.profile.settings.music=false;
              a.launchMap(HONRO_PROJECT,'stage-'+sid,{story:false});a.dialogue=null;a.turnNotice=null;
              const s=a.scene,{w,h}=s.size();s.manual=true;s.zoom(.001,w/2,h/2);
              for(let i=0;i<15;i++)s.render(a.engine,0,'',.6,false,1/60);}''',sid)
            r=page.evaluate('''()=>new Promise(resolve=>{const a=HonroApp,s=a.scene,b=a.engine.b,times=[],start=performance.now(),
              terrainCount=b.terrain.length,nodes=b.terrain.reduce((n,t)=>n+(t.vertices?.length||4),0),builds=s.overscanStats.builds,worldBuilds=s.renderCacheStats().worldBuilds;
              const next=()=>{const i=times.length;s.x=b.width*(.5+.54*Math.sin(i/110*Math.PI*2));s.y=b.height*.6;
                const t=performance.now();s.render(a.engine,0,'',.6,false,1/60);times.push(performance.now()-t);
                if(times.length<110)requestAnimationFrame(next);else{const elapsed=performance.now()-start;times.sort((a,b)=>a-b);
                  resolve({avgMs:times.reduce((a,b)=>a+b)/times.length,p95Ms:times[104],fps:110000/elapsed,zoom:s.scale,
                    skirtBuilds:s.overscanStats.builds-builds,worldBuilds:s.renderCacheStats().worldBuilds-worldBuilds,paths:s.overscanStats.paths,
                    terrainCount,nodes,terrainStable:terrainCount===b.terrain.length&&nodes===b.terrain.reduce((n,t)=>n+(t.vertices?.length||4),0)});}};requestAnimationFrame(next);})''')
            r.update(stage=sid,viewport=[width,height]);rows.append(r);print(json.dumps(r),flush=True)
            if not(r['avgMs']<7 and r['p95Ms']<12 and r['fps']>45 and r['skirtBuilds']==0 and r['worldBuilds']==0 and r['terrainStable']):failures.append(r)
        page.close()
    browser.close()
(out/'performance.json').write_text(json.dumps({'rows':rows,'errors':errors,'failures':failures},indent=2),encoding='utf8')
assert not errors,errors
assert not failures,failures
print('CAMERA PERFORMANCE PASS',len(rows))
