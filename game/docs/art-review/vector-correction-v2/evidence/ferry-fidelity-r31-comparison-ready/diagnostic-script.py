from pathlib import Path
from playwright.sync_api import sync_playwright
import json,time
ROOT=Path('/workspace/honro');out=ROOT/'game/docs/art-review/vector-correction-v2/evidence/ferry-fidelity-r31-comparison-ready';out.mkdir(exist_ok=False)
url='http://127.0.0.1:8841/_local/preview/ferry-fidelity-r31/HONRO.html';rows=[];errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for variant in ['source-diagnostic','native-48']:
  for label,width,height,x,y,scale in [('normal',1440,960,3100,1550,.65),('wide',1440,960,2100,1450,1440/6800),('mobile',390,844,3100,1400,.4)]:
   page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1);page.on('pageerror',lambda e:errors.append(str(e)));page.goto(url);page.wait_for_function('window.HonroApp',timeout=120000)
   page.evaluate('''size=>{HonroApp.frame=()=>{};const c=document.createElement('canvas');c.id='terrain-view';c.width=size[0];c.height=size[1];c.style.cssText='position:fixed;inset:0;z-index:99999';document.body.append(c);window.terrainCanvas=c;}''',[width,height])
   if variant=='source-diagnostic':
    page.evaluate('''async()=>{const im=new Image();im.src='/game/art-studies/ferry-foreground-authoring/reference.png';await im.decode();HonroStage3VectorFront.draw=(c,b)=>{if(b.honroStage!==3)return;c.save();const g=c.createLinearGradient(0,900,1000,17900);for(const [a,v]of [[0,'#665f4d'],[.18,'#53584a'],[.5,'#3f5345'],[1,'#2d483b']])g.addColorStop(a,v);c.fillStyle=g;c.fillRect(-6100,400,16500,25500);c.drawImage(im,-900,740,6000,941*6000/1672);c.restore();};}''')
   result=page.evaluate('''async v=>{const st=await HonroCampaignLoader.ensureStage(3),b=HonroMaps.createBattle(st,HONRO_PROJECT);HonroStageRules.sanitizeStageBattle(b);const e=new HONRO_CORE.Engine(b,()=>{},true),s=new HonroScene(terrainCanvas);Object.assign(s,{manual:true,time:2,skillPreview:true,x:v.x,y:v.y,scale:v.scale});window.ferryDiagnostic={s,e,b};const before=JSON.stringify([b.terrain,b.units,b.honroMarkers,b.honroEvents,b.honroObjectives]);let times=[];for(let i=0;i<3;i++){let t=performance.now();s.render(e,0,'',.6,false,0);times.push(performance.now()-t);}let tiles=[...(s._domainTiles?.tiles.values()||[])],bytes=tiles.reduce((n,t)=>n+t.canvas.width*t.canvas.height*4,0);let parseMs=null;if(!v.raster){let t=performance.now();for(const r of HONRO_FERRY_FOREGROUND.paths)new Path2D(r.d);parseMs=performance.now()-t;}return {renderMilliseconds:times,tileCount:tiles.length,tileRgbaBytes:bytes,pathParseBenchmarkMs:parseMs,pure:before===JSON.stringify([b.terrain,b.units,b.honroMarkers,b.honroEvents,b.honroObjectives])};}''',{'x':x,'y':y,'scale':scale,'raster':variant=='source-diagnostic'})
   page.wait_for_timeout(350);page.evaluate("ferryDiagnostic.s.render(ferryDiagnostic.e,0,'',.6,false,0)")
   page.evaluate('''()=>{const c=document.getElementById('terrain-view');}''')
   page.locator('#terrain-view').screenshot(path=str(out/(variant+'-'+label+'.png')));rows.append({'variant':variant,'view':label,'camera':{'x':x,'y':y,'scale':scale},'viewport':[width,height],**result});print(variant,label,result,flush=True);page.close()
 browser.close()
(out/'diagnostic.json').write_text(json.dumps({'type':'comparison-only original raster reference versus native; source-diagnostic is not deployable artwork','url':url,'errors':errors,'rows':rows},indent=2)+'\n')
assert not errors
