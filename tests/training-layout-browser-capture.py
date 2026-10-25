"""Three distinct focused art views and a separate final composite, built browser scene."""
import hashlib,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
OUT=ROOT/'_local/reports/training-ui';OUT.mkdir(parents=True,exist_ok=True)
views=[]
with sync_playwright() as pw,serve_game() as base:
 browser=launch(pw);p=browser.new_page(viewport={'width':1440,'height':900});p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('HonroApp.startTraining()');p.wait_for_selector('.training-dialog');p.evaluate('HonroApp.close()');p.wait_for_timeout(600);assert p.evaluate('!HonroApp.lastError');p.evaluate('HonroApp.frame=()=>{};HonroApp.profile.settings.music=false;HonroApp.profile.settings.sound=false;HonroApp.updateAudio();HonroTooltips.hide()');p.mouse.move(1000,500)
 def capture(name,x,y,zoom,width=1440,height=900):
  p.set_viewport_size({'width':width,'height':height});p.evaluate('v=>{const a=HonroApp;Object.assign(a.scene,{x:v[0],y:v[1],scale:v[2],manual:true});a.scene.render(a.engine,0,"",.6,false,0);HonroTooltips.hide()}',[x,y,zoom]);p.wait_for_timeout(100);p.evaluate('v=>{Object.assign(HonroApp.scene,{x:v[0],y:v[1],scale:v[2],manual:true});HonroApp.scene.render(HonroApp.engine,0,"",.6,false,0)}',[x,y,zoom]);p.screenshot(path=str(OUT/(name+'.png')));views.append({'file':name+'.png','camera':p.evaluate('()=>({x:HonroApp.scene.x,y:HonroApp.scene.y,scale:HonroApp.scene.scale})'),'viewport':[width,height]})
 capture('review1-structure',3000,1210,.23)
 capture('review2-ledges',1930,1230,.75)
 capture('review2-shelter',3020,1280,.8)
 capture('review2-water',4380,1390,.8)
 capture('review2-mixed',5510,1210,.75)
 capture('review3-mobile-shelter',3030,1300,.62,390,844)
 capture('review3-mobile-water',4380,1390,.5,844,390)
 p.evaluate('()=>{const e=HonroApp.engine,u=e.active;Object.assign(u,{x:1910,y:1060,vx:0,vy:0});e.drop();for(let i=0;i<55;i++)e.integrateBody(u,HONRO_CORE.STEP)}')
 capture('review3-mobile-drop',1910,1210,.68,390,844)
 p.evaluate('()=>{const e=HonroApp.engine;for(let i=0;i<500;i++)e.integrateBody(e.active,HONRO_CORE.STEP)}');capture('final-composite',3000,1210,.23)
 assert p.evaluate('!HonroApp.lastError');browser.close()
source={f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['shared/runtime/world.js','shared/runtime/act1-spatial-art.js','game/src/fonts.css','game/src/game-interface.css']}
(OUT/'visual-review.json').write_text(json.dumps({'source':source,'views':views,'review':[
 {'focus':'overall structure','finding':'Connected ground, clear preparation lane, sheltered lower lane and upper through-route. The heavy slab and floating planks in the first draft were revised with common material faces and grounded open trestles.'},
 {'focus':'detail and readability','finding':'Real roof/ceiling, cover rock, platform rim and shallow banks are distinguishable. Human/beast/spirit/air/armored silhouettes remain distinct; clustered foes do not form a row.'},
 {'focus':'camera, mobile and state','finding':'Portrait shelter and actual falling pose keep the current hero readable. Landscape water view retains visible banks and targets with the compact HUD. Backdrop remains continuous across camera movement.'},
 {'focus':'final composite','finding':'Final integrated source reviewed separately after changes. No floating rooted scenery, new raster terrain or custom renderer. Normal play still uses pan/zoom; overview is a structural review camera.'}
 ],'limits':['Controlled cameras and explicit drop pose; not normal combat completion.','Original three Library screenshots unavailable after supported transfer retry.']},ensure_ascii=False,indent=2))
print('PASS three focused art views and separate final composite captured')
