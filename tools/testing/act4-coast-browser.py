"""Original App/Scene/Engine controlled chapter fixtures; not a normal campaign playthrough."""
import json,pathlib
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act4-preview/coast-first';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8772/HONRO.html');page.wait_for_function('!!window.HonroApp')
 page.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(30);await HonroCampaignLoader.ensureStage(21);await HonroCampaignLoader.ensureStage(13);HonroApp.frame=()=>{};const ss=await Promise.all(['31-35-36','32-33-34-37','38-39-40'].map(async s=>(await fetch('game/docs/act4/dialogue-seeds-'+s+'-reviewed-final.json')).json()));HONRO_ACT4_PREVIEW_SEEDS={scenes:ss.flatMap(s=>s.scenes),ui:ss.flatMap(s=>s.ui)};window.ownerBefore=JSON.stringify(HonroApp.profile);}''')
 for name in ['review-art','terrain-preview','coast-maps','coast-art','preview-events','coast-events','preview-lifecycle']:page.add_script_tag(url='http://127.0.0.1:8772/tools/act4/'+name+'.js')
 rows=[]
 for n in [32,33,34,37,38,39,40]:
  row=page.evaluate('''n=>{const r=HonroAct4TerrainPreview.launch(n),a=HonroApp,e=a.engine,b=e.b;const initial=b.units.map(u=>[u.id,u.x,u.y,u.hp]);for(let i=0;i<300;i++)e.tick(HONRO_CORE.STEP);Object.assign(a.scene,{manual:true,editorView:true,skillPreview:true,x:470,y:e.active.y-80,scale:.8,storyTween:null,cinematic:null,storyFrame:null,goalFocus:null});a.scene.render(e,0,'',.5,false,0);return {chapter:n,initial,stable:b.units.every((u,i)=>Math.abs(u.y-initial[i][2])<1&&u.hp===initial[i][3]),domain:HonroTerrainDomain.active(b),goal:a.stage.goal,ownerUnchanged:JSON.stringify(a.customMap.returnProfile)===window.ownerBefore};}''',n)
  page.wait_for_timeout(400);page.evaluate("HonroApp.scene.render(HonroApp.engine,0,'',.5,false,0)");page.locator('#battlecanvas').screenshot(path=str(OUT/f'{n}-start.png'));rows.append(row);print(n,row['stable'],row['domain'],row['ownerUnchanged'],flush=True)
 assert not errors,errors
 (OUT/'results.json').write_text(json.dumps({'scope':__doc__,'rows':rows,'errors':errors},ensure_ascii=False,indent=2));browser.close()
