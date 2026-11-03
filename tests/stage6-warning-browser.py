"""Prepared pending-event UI inspection, not natural gameplay acceptance."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
out=ROOT/'_local/reports/stage6-preview/warning-browser';out.mkdir(parents=True,exist_ok=True)
profile=json.loads((ROOT/'game/docs/stage-review/stage06-bridge/evidence/entry-profile.json').read_text())['profile'];results=[];errors=[]
with serve_game() as base,sync_playwright() as p:
 browser=launch(p)
 for label,viewport in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
  page=browser.new_page(viewport=viewport);page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp');page.evaluate('p=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(p))',profile);page.reload();page.wait_for_function('window.HonroApp')
  data=page.evaluate('''async()=>{await HONRO_APP_READY;await HonroCampaignLoader.ensureStage(6);const a=HonroApp;a.frame=()=>{};a.launch(6,false);while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;const banner=document.getElementById('turn-banner');if(banner)banner.hidden=true;HonroObjectives.refresh(a);const before=document.getElementById('objective-text').textContent,b=a.engine.b;(b.honroState.pendingEvents??=[]).push('pursuit');delete b.honroState.flags['event:pursuit'];HonroObjectives.refresh(a);Object.assign(a.scene,{manual:true,storyTween:null,goalFocus:null,x:3775,y:2600,scale:innerWidth<620?.32:.48});a.scene.render(a.engine,0,a.selected,.3,false,0);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))));const n=document.getElementById('stage6-pursuit-warning'),o=document.getElementById('objective-text'),r=n?.getBoundingClientRect(),q=o.getBoundingClientRect();return {before,after:o.textContent,notice:n?.textContent,shown:HonroStage6Pursuit.shown(a),warning:r&&{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom},objective:{x:q.x,y:q.y,width:q.width,height:q.height,right:q.right,bottom:q.bottom},clipped:n&&(n.scrollWidth>n.clientWidth+1||n.scrollHeight>n.clientHeight+1),targets:a.scene.missionTargets.filter(t=>t.id==='stage6-pursuit-estimate')};}''')
  page.screenshot(path=str(out/(label+'.png')));data['viewport']=viewport;data['layout']=label;results.append(data);assert data['before']==data['after'] and data['notice'] and data['shown'] and not data['clipped'] and len(data['targets'])==1;w=data['warning'];o=data['objective'];assert w['x']>=0 and w['y']>=0 and w['right']<=viewport['width'] and w['bottom']<=viewport['height'];assert w['bottom']<=o['y'] or o['bottom']<=w['y'] or w['right']<=o['x'] or o['right']<=w['x']
  for direction,camera_x in [('right',1000),('left',6000)]:
   text=page.evaluate('''x=>{const a=HonroApp;a.scene.x=x;HonroObjectives.refresh(a);a.scene.render(a.engine,0,a.selected,.3,false,0);return document.getElementById('stage6-pursuit-warning').textContent}''',camera_x);assert ('→' if direction=='right' else '←') in text;page.screenshot(path=str(out/(label+'-'+direction+'.png')))
  page.close()
 browser.close()
(out/'capture.json').write_text(json.dumps({'scope':'prepared pending state, real browser HUD; no gameplay completion','results':results,'errors':errors},ensure_ascii=False,indent=2));assert not errors
