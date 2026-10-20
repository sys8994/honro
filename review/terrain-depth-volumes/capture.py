from pathlib import Path
from playwright.sync_api import sync_playwright
import json,sys,os
root=Path(__file__).resolve().parents[2];out=Path(__file__).resolve().parent;tag=sys.argv[1] if len(sys.argv)>1 else 'before';errors=[];rows=[]
views={3:[('wide',2100,1450,.24)],18:[('normal',1200,6200,.5)]}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);q=b.new_page(viewport={'width':1440,'height':960},device_scale_factor=1);q.on('pageerror',lambda e:errors.append(str(e)))
 q.goto(os.environ.get('HONRO_CAPTURE_URL','http://127.0.0.1:8841/HONRO.html'),timeout=30000);q.wait_for_function('window.HonroApp',timeout=120000)
 q.evaluate('''()=>{HonroApp.frame=()=>{};const c=document.createElement('canvas');c.id='terrain-view';c.width=1440;c.height=960;c.style.cssText='position:fixed;inset:0;width:1440px;height:960px;z-index:99999';document.body.append(c);window.terrainCanvas=c;}''')
 for n,poses in views.items():
  q.evaluate('''async n=>{const st=await HonroCampaignLoader.ensureStage(n),b=HonroMaps.createBattle(st,HONRO_PROJECT);HonroStageRules.sanitizeStageBattle(b);const e=new HONRO_CORE.Engine(b,()=>{},true),s=new HonroScene(terrainCanvas);Object.assign(s,{manual:true,time:2,skillPreview:true});window.terrainCurrent={b,e,s,before:JSON.stringify([b.terrain,b.units,b.honroMarkers,b.honroEvents,b.honroObjectives])};}''',n)
  for label,x,y,scale in poses:
   result=q.evaluate('''v=>{const {s,e,b}=terrainCurrent;Object.assign(s,v);s.render(e,0,'',.6,false,0);const first=s.renderCacheStats();s.render(e,0,'',.6,false,0);const second=s.renderCacheStats();s.render(e,0,'',.6,false,0);const third=s.renderCacheStats();return{...HonroVectorCampaignArt.stats(b),first,second,third,pure:terrainCurrent.before===JSON.stringify([b.terrain,b.units,b.honroMarkers,b.honroEvents,b.honroObjectives])};}''',dict(x=x,y=y,scale=scale))
   q.wait_for_timeout(120);q.evaluate("terrainCurrent.s.render(terrainCurrent.e,0,'',.6,false,0)");q.locator('#terrain-view').screenshot(path=str(out/f'{tag}-stage{n:02d}-{label}.png'));rows.append({'stage':n,'view':label,'pose':{'x':x,'y':y,'scale':scale},**result});print(tag,n,label,result.get('parts'),result['pure'],flush=True)
  q.evaluate("()=>{for(const tile of terrainCurrent.s._domainTiles?.tiles.values()||[])tile.canvas.width=1;terrainCurrent.s._domainTiles?.tiles.clear();delete window.terrainCurrent;}")
 b.close()
(out/f'{tag}-checks.json').write_text(json.dumps({'rows':rows,'errors':errors},ensure_ascii=False,indent=2)+'\n');assert not errors,errors
