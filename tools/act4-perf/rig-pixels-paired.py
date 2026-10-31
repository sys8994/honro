"""Exact Canvas pixel hashes for all authored rig clips, old vs candidate."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(__file__).resolve().parents[2]/'_local/act4-perf';out.mkdir(parents=True,exist_ok=True);results={}
with sync_playwright() as w:
 for tag,base in [('before','http://127.0.0.1:8774'),('after','http://127.0.0.1:8776')]:
  b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page();p.add_init_script("window.qaPathCount=0;const QPath=window.Path2D;window.Path2D=new Proxy(QPath,{construct(t,a,n){qaPathCount++;return Reflect.construct(t,a,n)}});");p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp && window.HonroVectorRig && window.HONRO_PARTY');results[tag]=p.evaluate('''async()=>{let rows=[],start=qaPathCount,c=document.createElement('canvas');c.width=300;c.height=300;let g=c.getContext('2d');for(const [id,a] of Object.entries(HONRO_PARTY)){let r=HonroVectorRig.createCanvasRenderer(a);for(const name of Object.keys(a.animation.animations))for(const t of [0,.25,.5,.75,1])for(const facing of [-1,1]){g.clearRect(0,0,300,300);r.draw(g,{x:150,y:270,height:220,animation:name,time:t,normalized:true,detail:2,facing});let bytes=g.getImageData(0,0,300,300).data;let digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');rows.push({id,name,t,facing,digest})}}return {rows,paths:qaPathCount-start}}''');print(tag,'cases',len(results[tag]['rows']),'paths',results[tag]['paths'],flush=True);b.close()
 assert results['before']['rows']==results['after']['rows'],'rig pixels differ';print('all exact pixel hashes equal',flush=True);(out/'rig-pixels.json').write_text(json.dumps(results,indent=2))
