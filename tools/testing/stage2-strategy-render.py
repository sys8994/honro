"""Final-source render purity and flight-silhouette checks using genuine saves.
No combat replay, battle writes, positional repair or reward grant in this tool.
"""
import json,shutil,sys,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];combat=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
trace=json.loads((combat/'combat.json').read_text());entry=trace['entryProfile'];entry.pop('honroBattle',None)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto(sys.argv[3] if len(sys.argv)>3 else 'http://127.0.0.1:8872/HONRO.html');page.wait_for_function('window.HonroApp',timeout=90000);page.evaluate('async()=>{await HonroCampaignLoader.ensureStage(2);HonroApp.frame=()=>{};}')
 rows=[]
 for label,profile in [('fresh',entry),('actual-r3',next(s['profile'] for s in trace['snapshots'] if s['label']=='route-0')),('actual-win',json.loads((combat/'profile-terminal.json').read_text()))]:
  page.evaluate('''v=>{const a=HonroApp;a.profile=v;a.dialogue=null;if(v.honroBattle)a.continue();else a.launch(2);while(a.dialogue)HonroStory.finish(a);a.close();a.turnNotice=null;}''',profile)
  page.wait_for_function('HonroAuthoredFarArt.ready(2)',timeout=90000)
  row=page.evaluate('''label=>{const a=HonroApp,e=a.engine,b=e.b,s=a.scene,C=HONRO_CORE,u=e.unit('p-archer');Object.assign(s,{manual:true,storyTween:null,cinematic:null,goalFocus:null,x:label==='fresh'?1000:label==='actual-r3'?1900:3150,y:label==='fresh'?800:label==='actual-r3'?950:2820,scale:label==='actual-win'?.5:.65});s.render(e,0,'',.6,false,0);const before=JSON.stringify(b);s.render(e,0,'',.6,false,0);const cold=s.renderCacheStats();for(let i=0;i<5;i++)s.render(e,0,'',.6,false,0);const warm=s.renderCacheStats();if(JSON.stringify(b)!==before)throw Error(label+' drawing changed battle');for(const k of ['worldBuilds','domainCanvasAllocations','domainTileBuilds'])if(cold[k]!==warm[k])throw Error(label+' cache '+k);
const mask=document.createElement('canvas');mask.width=b.width;mask.height=b.height;const c=mask.getContext('2d');HonroStage2LayeredRoadArt.rear.call(s,c,b);const r=b.honroMap.flightRegion,data=c.getImageData(r.left,r.top,r.right-r.left,r.bottom-r.top).data;let opaque=0;for(let i=3;i<data.length;i+=4)if(data[i])opaque++;const probes=[c.getImageData(500,1500,1,1).data[3],c.getImageData(4200,2200,1,1).data[3]];if(opaque||!probes.every(v=>v===255))throw Error(label+' actual cliff silhouette check '+opaque+' '+probes);mask.width=1;
const birds=b.units.filter(v=>C.flyingEnemy(v)&&!v.dead&&v.hp>0);for(const v of birds)if(!C.flightClear(e,v,v))throw Error(label+' bird '+v.id);return{label,round:b.round,phase:b.phase,mapRevision:b.honroCampaignMapRevision,statePure:true,cold,warm,flightRegion:r,opaquePixels:opaque,cliffAlphaProbes:probes,birds:birds.map(v=>({id:v.id,x:v.x,y:v.y,bounds:C.flightBounds(v)})),hero:{x:u.x,y:u.y,hp:u.hp},car:{x:e.unit('objective').x,y:e.unit('objective').y,hp:e.unit('objective').hp}};}''',label)
  page.locator('#battlecanvas').screenshot(path=str(out/(label+'.png')));rows.append(row)
 result={'sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'scope':__doc__,'rows':rows,'errors':errors};assert not errors;(out/'render.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('PASS fresh/actual R3/win current-source render state/cache; complete flight region outside actual opaque cliff silhouette');browser.close()
