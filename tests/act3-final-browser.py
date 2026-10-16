"""Final integrated Game/Workshop/Playtest smoke. Prepared map entries, not campaign clears."""
import json,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
out=ROOT/'_local/reports/act3-final/browser';out.mkdir(parents=True,exist_ok=True)
base=story_base_url();rows=[];errors=[]
SETUP='''id=>{const a=HonroApp,s=HONRO_PROJECT.stages.find(s=>s.metadata.stageId===id);a.frame=()=>{};a.profile={...HONRO_TOOLS.fresh(),...HonroMaps.profileFor(s)};for(let n=1;n<id;n++)a.profile.cleared[n]={};a.launchMap(HONRO_PROJECT,s.id,{story:false});a.dialogue=null;a.turnNotice=null;const u=a.engine.heroesAlive()[0];Object.assign(a.scene,{x:u.x+100,y:u.y-170,scale:.65,manual:true,time:1,storyTween:null,goalFocus:null,cinematic:null});a.scene.render(a.engine,0,'',.6,false,0);a.updateHUD(true);return {stage:a.engine.b.honroStage,heroes:a.engine.heroesAlive().length,enemies:a.engine.alive(1).length,terrain:a.engine.b.terrain.length,camera:[a.scene.x,a.scene.y,a.scene.scale]}}'''
with sync_playwright() as p:
 browser=launch(p)
 for width,height in [(1440,900),(390,844)]:
  for host in ['game','workshop-playtest']:
   context=browser.new_context(viewport={'width':width,'height':height},is_mobile=width<500,has_touch=width<500)
   page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(base+('/HONRO.html' if host=='game' else '/HONRO_WORKSHOP.html'));owner=page
   if host=='workshop-playtest':
    page.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene');page.click('[data-tab="play"]');page.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');page=owner.frames[1]
   else:page.wait_for_function('window.HonroApp')
   for stage in range(21,31):
    state=page.evaluate(SETUP,stage);assert state['stage']==stage and state['heroes']>0 and state['terrain']>0,state
    name=f'{host}-{width}-stage{stage}.png';owner.screenshot(path=str(out/name));rows.append({'file':name,'viewport':[width,height],**state})
   context.close()
 browser.close()
report={'scope':__doc__,'errors':errors,'rows':rows,'htmlSha256':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['HONRO.html','HONRO_WORKSHOP.html']}}
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));assert not errors,errors
print('PASS',len(rows),'integrated Game and embedded Workshop Playtest entry captures')
