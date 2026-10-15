"""Isolated browser contexts. Diagnostic positions, not a normal campaign completion."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
out=ROOT/'_local/reports/stage5-lake';results=[];errors=[]
with sync_playwright() as p:
 b=launch(p);page=b.new_page(viewport={'width':1440,'height':960});page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(story_base_url()+'/HONRO_WORKSHOP.html');page.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene');page.evaluate('HonroWorkshopAPI.selectStage("stage-5")');page.click('[data-tab="play"]');page.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine');play=page.frames[1]
 for opened in [False,True]:
  r=play.evaluate('''open=>{const a=HonroApp;a.frame=()=>{};a.launchMap(HONRO_PROJECT,'stage-5',{story:false});a.frame=()=>{};a.dialogue=null;const e=a.engine,b=e.b; b.units=b.units.filter(u=>u.side===0||u.honroObjectiveTarget);const u=e.active,t=b.units.find(u=>u.id==='cliff-cleat');Object.assign(u,b.honroMapAnchors.shotGap);HonroStage5WaterGeometry.setOpen(b,open);e.checkEnd=()=>false;const hp=t.hp,ok=e.fire('A01',28,.8);let wet=false;for(let i=0;i<2000&&b.projectiles.length;i++){for(const p of [...b.projectiles]){e.stepProjectile(p,HONRO_CORE.STEP);wet ||= !!p.waterfallTouched;}}Object.assign(a.scene,{x:3200,y:2480,scale:.28,manual:true,storyTween:null,goalFocus:null,cinematic:null});a.scene.render(e,0,'',.6,false,0);return{open,ok,wet,damage:hp-t.hp,width:b.width,revision:b.honroStage5LakeRevision,party:b.units.filter(u=>u.side===0).map(u=>u.cls)}}''',opened)
  assert r['ok'] and r['width']==5300 and r['revision']==1
  assert r['damage']>0 if opened else r['damage']==0 and r['wet']
  results.append(r);page.screenshot(path=str(out/('playtest-open.png' if opened else 'playtest-closed.png')))
 page.click('#stopPlay');assert page.locator('#runtimeFrame').count()==0
 b.close()
assert not errors,errors
(out/'browser-playtest.json').write_text(json.dumps({'scope':'Actual Workshop iframe, isolated shot fixtures, no personal storage','results':results,'pageErrors':errors,'stopDisposesFrame':True},indent=2))
print('PASS actual Workshop iframe closed/open projectile physics and Stop')
