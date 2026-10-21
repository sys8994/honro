"""Render genuine native normal-play exports in the production browser.
This is browser Continue/render evidence, not a browser combat playthrough.
"""
import json,sys,shutil,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
source=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=b.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto('http://127.0.0.1:8852/HONRO.html');p.wait_for_function('window.HonroApp && window.HonroAuthoredFarArt',timeout=90000)
 p.evaluate('async()=>{await HonroCampaignLoader.ensureStage(8);HonroApp.frame=()=>{};}')
 data=json.loads(source.read_text());profile=data['profile'];p.evaluate('profile=>{HonroApp.profile=profile;HonroApp.continue();}',profile)
 p.wait_for_function('HonroApp.engine?.b.honroStage===8');p.wait_for_function('HonroAuthoredFarArt.ready(8)')
 # Close story by its normal action. Do not tick actors or change battle state.
 p.evaluate('()=>{let a=HonroApp;for(let i=0;i<40&&a.dialogue;i++)HonroStory.finish(a);a.close();HonroStory.tick(a,performance.now()+3000);}')
 rows=[]
 for name,x,y,z in [('west',2600,3750,.65),('court',5580,4090,.6),('east',8040,2900,.6)]:
  row=p.evaluate('v=>{let a=HonroApp,s=a.scene;Object.assign(s,{x:v.x,y:v.y,scale:v.z,manual:true,storyTween:null,cinematic:null});s.render(a.engine,0,"",.6,false,0);return{round:a.engine.b.round,phase:a.engine.b.phase,bier:a.engine.b.honroState.stage8Bier,seals:HonroQuestTargets.records(a.engine.b).filter(t=>t.honroSeal).map(t=>({id:t.id,hp:t.hp,broken:t.broken}))};}',{'x':x,'y':y,'z':z})
  p.locator('#battlecanvas').screenshot(path=str(out/(name+'.png')));rows.append({'view':name,**row})
 (out/'capture.json').write_text(json.dumps({'source':str(source),'runtimeSha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'scope':__doc__,'rows':rows,'errors':errors},indent=2));b.close();print(rows)
