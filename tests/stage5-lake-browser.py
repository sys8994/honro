import sys,json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
from browser_support import launch,ROOT
from playwright.sync_api import sync_playwright
out=ROOT/'_local/reports/stage5-lake'
with sync_playwright() as p:
 b=launch(p)
 for label,w,h,x,y,z in [('desktop',1440,960,2750,2660,.27),('mobile',844,390,2900,2350,.125),('portrait',390,844,3000,2550,.09),('west',1440,960,1500,2510,.52),('cave',1440,960,4070,2450,.5)]:
  page=b.new_page(viewport={'width':w,'height':h});page.goto('http://localhost:8000/HONRO.html');page.wait_for_function('window.HonroApp')
  page.evaluate('''([x,y,z])=>{const a=HonroApp,st=HONRO_PROJECT.stages[4];a.profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(st)};a.launchMap(HONRO_PROJECT,'stage-5',{story:false});a.frame=()=>{};a.dialogue=null;a.turnNotice=null;Object.assign(a.scene,{x,y,scale:z,manual:true,storyTween:null,goalFocus:null,cinematic:null});a.scene.render(a.engine,0,'',.6,false,0);}''',[x,y,z]);page.wait_for_timeout(400)
  page.screenshot(path=str(out/(label+'.png')))
  if label in ['desktop','west']:
   previous=json.loads((ROOT/'tests/fixtures/stage5-waterfall/before-lake.json').read_text())
   page.evaluate('''([old,x,y,z])=>{const a=HonroApp,p=structuredClone(HONRO_PROJECT);p.stages[4]=old;a.launchMap(p,'stage-5',{story:false});a.frame=()=>{};a.dialogue=null;a.turnNotice=null;Object.assign(a.scene,{x,y,scale:z,manual:true,storyTween:null,goalFocus:null,cinematic:null});a.scene.render(a.engine,0,'',.6,false,0);}''',[previous,x,y,z])
   page.screenshot(path=str(out/(label+'-before.png')))
  page.close()
 b.close()
