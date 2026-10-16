"""Actual browser Game screenshots; diagnostic camera poses, isolated storage."""
import sys,json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
out=ROOT/'_local/reports/stage21-eupseong';out.mkdir(parents=True,exist_ok=True)
label=sys.argv[1] if len(sys.argv)>1 else 'after'
views=[('overall',1440,960,3200,2320,.21),('rescue',1440,960,1460,2550,.65),('gate',1440,960,2570,2370,.64),('street',1440,960,4100,2480,.58),('office',1440,960,5500,2280,.58),('mobile',844,390,2580,2370,.28),('portrait',390,844,2470,2320,.25)]
errors=[]
with sync_playwright() as p:
 b=launch(p);base=story_base_url()
 for name,w,h,x,y,z in views:
  page=b.new_page(viewport={'width':w,'height':h});page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp')
  page.evaluate('''([x,y,z])=>{const a=HonroApp,st=HONRO_PROJECT.stages[20];a.profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(st)};a.launchMap(HONRO_PROJECT,'stage-21',{story:false});a.frame=()=>{};a.dialogue=null;a.turnNotice=null;Object.assign(a.scene,{x,y,scale:z,manual:true,storyTween:null,goalFocus:null,cinematic:null});a.scene.render(a.engine,0,'',.6,false,0);}''',[x,y,z]);page.wait_for_timeout(200);page.screenshot(path=str(out/(label+'-'+name+'.png')));page.close()
 b.close()
assert not errors,errors
(out/(label+'-browser.json')).write_text(json.dumps({'kind':'Actual Chromium browser screenshot; isolated fresh contexts, diagnostic camera; not normal-play completion','views':views,'errors':errors},indent=2))
print('PASS browser screenshots',label)
