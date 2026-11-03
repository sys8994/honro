"""Initial placement screen only, controlled camera and legal entry profile."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
out=ROOT/'_local/reports/stage6-preflight/initial-browser';out.mkdir(parents=True,exist_ok=True)
profile=json.loads((ROOT/'game/docs/stage-review/stage06-bridge/evidence/entry-profile.json').read_text())['profile'];errors=[]
with serve_game() as base,sync_playwright() as p:
 browser=launch(p);page=browser.new_page(viewport={'width':1440,'height':900});page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp');
 page.evaluate('profile=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(profile))',profile);page.reload();page.wait_for_function('window.HonroApp')
 data=page.evaluate('''async()=>{await HONRO_APP_READY;await HonroCampaignLoader.ensureStage(6);const a=HonroApp;a.frame=()=>{};a.launch(6,false);while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;const banner=document.getElementById('turn-banner');if(banner)banner.hidden=true;return {stage:a.engine.b.honroStage,revision:a.engine.b.honroStage6PursuitRevision,units:a.engine.b.units.filter(u=>u.side===1).map(u=>({id:u.id,x:u.x,y:u.y,kind:u.honroVariant||u.honroType}))};}''')
 for label,x,y,scale in [('west',1800,2300,.48),('center',3350,2550,.48),('east',5000,2400,.48),('overview',3300,2350,.21)]:
  page.evaluate('''([x,y,scale])=>{const a=HonroApp;Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,x,y,scale});a.scene.render(a.engine,0,a.selected,.3,false,0)}''',[x,y,scale]);page.wait_for_timeout(200);page.screenshot(path=str(out/(label+'.png')))
 browser.close()
(out/'capture.json').write_text(json.dumps({'scope':'Prepared legal entry, initial actor positions, controlled camera; no gameplay completion','data':data,'errors':errors},ensure_ascii=False,indent=2));print(json.dumps({'count':len(data['units']),'revision':data['revision'],'errors':errors},ensure_ascii=False));assert not errors
