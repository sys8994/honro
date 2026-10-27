"""Actual Chromium authored-map fixtures; no campaign completion claim."""
import json,pathlib,sys
from playwright.sync_api import sync_playwright
ROOT=pathlib.Path(__file__).resolve().parents[2]
label=sys.argv[1];out=ROOT/'_local/reports/act4-preview'/label;out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8772/HONRO.html');page.wait_for_function('!!window.HonroApp')
 page.evaluate('async()=>{await HonroCampaignLoader.ensureStage(30);await HonroCampaignLoader.ensureStage(21);await HonroCampaignLoader.ensureStage(13);HonroApp.frame=()=>{};HonroApp.profile.settings.sound=false;HonroApp.profile.settings.music=false;}')
 page.add_script_tag(url='http://127.0.0.1:8772/tools/act4/terrain-preview.js')
 rows=[]
 for n,x,y,z,w,h,name in [(31,3500,1750,.24,1440,900,'31-wide'),(35,3500,1700,.24,1440,900,'35-wide'),(36,3500,1750,.24,1440,900,'36-wide'),(31,4200,1710,.56,1440,900,'31-bank'),(35,3100,1700,.56,1440,900,'35-cover'),(36,2450,1760,.56,1440,900,'36-house'),(35,3300,1750,.34,390,844,'35-mobile')]:
  page.set_viewport_size({'width':w,'height':h})
  result=page.evaluate('''v=>{const a=HonroApp,before=JSON.stringify(a.customMap?.returnProfile||a.profile);HonroAct4TerrainPreview.launch(v.n);a.turnNotice=null;a.scene.time=2;const b=a.engine.b,s=a.scene;Object.assign(s,{manual:true,x:v.x,y:v.y,scale:v.z,storyTween:null,cinematic:null,goalFocus:null,storyFrame:null,editorView:true,skillPreview:true});s.render(a.engine,0,'',.6,false,0);return{n:v.n,camera:[s.x,s.y,s.scale],ownerPreserved:JSON.stringify(a.customMap.returnProfile)===before,worldDomain:HonroTerrainDomain.active(b),units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,side:u.side})),source:document.querySelector('script[src*="game."]')?.src};}''',{'n':n,'x':x,'y':y,'z':z})
  page.wait_for_timeout(700)
  page.evaluate('HonroApp.scene.render(HonroApp.engine,0,"",.6,false,0)')
  page.locator('#battlecanvas').screenshot(path=str(out/(name+'.png')));rows.append(result);print(label,name,result['worldDomain'],flush=True)
 assert not errors,errors
 assert all(r['ownerPreserved'] and r['worldDomain'] for r in rows)
 (out/'captures.json').write_text(json.dumps({'scope':__doc__,'rows':rows,'pageErrors':errors},ensure_ascii=False,indent=2))
 browser.close()
