"""Fresh browser review views, camera setup only; not a normal combat clear."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
base=story_base_url();out=ROOT/'review/stage25/browser';out.mkdir(parents=True,exist_ok=True);errors=[];rows=[]
with sync_playwright() as p:
 b=launch(p)
 for host in ['HONRO','HONRO_WORKSHOP']:
  for w,h in [(1440,900),(390,844)]:
   page=b.new_page(viewport={'width':w,'height':h},is_mobile=w<500,has_touch=w<500);page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/'+host+'.html');page.wait_for_timeout(300)
   if host=='HONRO':
    page.wait_for_function('window.HonroApp');page.evaluate('''()=>{const a=HonroApp,st=HONRO_PROJECT.stages[24];a.profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(st)};for(let i=1;i<25;i++)a.profile.cleared[i]={};a.frame=()=>{};a.launchMap(HONRO_PROJECT,'stage-25',{story:false});a.dialogue=null;a.turnNotice=null;}''')
   else:page.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene');page.evaluate("HonroWorkshopAPI.selectStage('stage-25')")
   for name,x,y in [('entry',420 if w<500 else 650,5130),('shaft',2700,4660),('lookout',800,3800),('households',2300,2900),('distortion',1500,4270)]:
    state=page.evaluate('''([host,x,y])=>{const a=host==='HONRO'?HonroApp:HonroWorkshopAPI.getRuntime();Object.assign(a.scene,{x,y,scale:.65,manual:true,time:1,walkTime:0,storyTween:null,goalFocus:null,cinematic:null});a.scene.render(a.engine,0,'',.6,false,0);if(host==='HONRO')a.updateHUD(true);return {camera:[a.scene.x,a.scene.y,a.scene.scale],enemies:a.engine.b.units.filter(u=>u.side===1).length,stage:a.engine.b.honroStage,error:a.lastError||null}}''',[host,x,y]);assert state['camera']==[x,y,.65];assert state['stage']==25 and state['enemies']==7 and not state['error'];file=f'{host}-{w}-{name}.png';page.screenshot(path=str(out/file));rows.append({'file':file,'host':host,'viewport':[w,h],'camera':[x,y,.65],'state':state})
   page.close()
 b.close()
assert not errors;(out/'results.json').write_text(json.dumps({'method':'fresh Chromium; prepared stage; camera only; full roster kept; not fullplay','rows':rows,'errors':errors},indent=2));print('PASS',len(rows),'browser review views')
