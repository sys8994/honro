"""Actual browser Game screenshots; diagnostic camera poses, isolated storage."""
import sys,json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
out=ROOT/'_local/reports/stage21-eupseong';out.mkdir(parents=True,exist_ok=True)
label=sys.argv[1] if len(sys.argv)>1 else 'after'
views=[('combat-follow',1440,960,2000,2370,.64),('crown-feet',1440,960,2110,2240,.75),('mobile-follow',844,390,2080,2560,.45),('portrait-follow',390,844,2080,2560,.5)]
errors=[];poses=[]
with sync_playwright() as p:
 b=launch(p);base=story_base_url()
 for name,w,h,x,y,z in views:
  page=b.new_page(viewport={'width':w,'height':h});page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp')
  pose=page.evaluate('''([x,y,z])=>{const a=HonroApp,st=HONRO_PROJECT.stages[20];a.profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(st)};a.launchMap(HONRO_PROJECT,'stage-21',{story:false});a.frame=()=>{};a.dialogue=null;a.turnNotice=null;const e=a.engine,u=e.active;Object.assign(u,{x,y,vx:0,vy:0,jumping:false});for(let i=0;i<120;i++)e.integrateBody(u,1/120,true);Object.assign(a.scene,{x,y,scale:z,manual:false,storyTween:null,goalFocus:null,cinematic:null,focusId:null});for(let i=0;i<120;i++)a.scene.render(e,1/60,'',.6,false,0);a.updateHUD(true);return {actor:{x:u.x,y:u.y,id:u.id,grounded:e.grounded(u)},camera:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale,manual:a.scene.manual}};}''',[x,y,z]);assert pose['actor']['grounded'],pose;poses.append({'view':name,**pose});print(name,pose);page.wait_for_timeout(200);page.screenshot(path=str(out/(label+'-'+name+'.png')));page.close()
 b.close()
assert not errors,errors
(out/(label+'-browser.json')).write_text(json.dumps({'kind':'Actual Chromium; isolated storage; diagnostic actor placement then real body settling and automatic follow; not normal-play completion','views':views,'poses':poses,'errors':errors},indent=2))
print('PASS browser screenshots',label)
