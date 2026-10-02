"""Sequential before/after rendering, including maximum zoom and waterfall mist."""
import json
import subprocess
import sys
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch

mode=sys.argv[1] if len(sys.argv)>1 else 'after'
out=ROOT/'_local/reports/environment-v3'
out.mkdir(parents=True,exist_ok=True)
source=ROOT/'HONRO.html'
if mode=='before':
    source=out/'baseline-HONRO.html'
    source.write_bytes(subprocess.check_output(['git','show','HEAD:HONRO.html'],cwd=ROOT))
rows,errors,failures=[],[],[]
with sync_playwright() as p:
    browser=launch(p)
    for width,height in [(1280,720),(844,390),(2560,1440)]:
        for sid,x,y,z in [(1,1250,1400,.66),(3,2250,2150,.66),(5,3050,2750,.66),(5,2200,2300,.16),(6,2400,2000,.66),(10,2400,2000,.16)]:
            page=browser.new_page(viewport={'width':width,'height':height})
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(source.as_uri())
            page.wait_for_function('window.HonroApp && window.HONRO_PROJECT')
            page.wait_for_function('!window.HonroAct1Background || HonroAct1Background.ready()')
            page.evaluate('HonroApp.frame=()=>{}')
            page.evaluate('''([sid,x,y,z])=>{const a=HonroApp;a.launchMap(HONRO_PROJECT,'stage-'+sid,{story:false});a.dialogue=null;a.turnNotice=null;
              Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,cinematic:null,x,y,scale:z});
              for(let i=0;i<8;i++)a.scene.render(a.engine,0,'',.6,false,1/60);}''',[sid,x,y,z])
            session=page.context.new_cdp_session(page)
            session.send('Performance.enable')
            metrics=lambda:{m['name']:m['value'] for m in session.send('Performance.getMetrics')['metrics']}
            before=metrics()
            row=page.evaluate('''()=>new Promise(resolve=>{const s=HonroApp.scene,e=HonroApp.engine,times=[],intervals=[];let last=performance.now();const start=last;
              const next=()=>{const now=performance.now();intervals.push(now-last);last=now;const t=performance.now();s.render(e,0,'',.6,false,1/60);times.push(performance.now()-t);
                if(times.length<90)requestAnimationFrame(next);else{times.sort((a,b)=>a-b);resolve({avgMs:times.reduce((a,b)=>a+b)/times.length,p95Ms:times[85],maxMs:times[89],fps:90000/(performance.now()-start),dom:document.querySelectorAll('*').length,svg:document.querySelectorAll('svg *').length,stats:s.environmentStats||null,cache:s.renderCacheStats()});}};requestAnimationFrame(next);})''')
            after=metrics()
            row.update(stage=sid,viewport=[width,height],zoom=z,
                       layoutCount=after['LayoutCount']-before['LayoutCount'],
                       styleRecalcs=after['RecalcStyleCount']-before['RecalcStyleCount'])
            rows.append(row)
            print(json.dumps({k:row[k] for k in ['stage','viewport','zoom','avgMs','p95Ms','fps','layoutCount','styleRecalcs']}),flush=True)
            if not (row['avgMs']<7 and row['fps']>45): failures.append(row)
            page.close()
    browser.close()
(out/f'performance-composition-{mode}.json').write_text(json.dumps({'rows':rows,'errors':errors,'failures':failures},indent=2),encoding='utf-8')
assert not errors,errors
assert not failures,failures
