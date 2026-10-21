"""Production browser captures of genuine failed-checkpoint recovery saves.
Run node tests/stage11-fall-recovery.mjs and build first. No actor/resource writes.
Keyboard checks replay only the two jump junctions from actual reached saves;
the complete native input traces are separate and retain all enemies.
"""
import json,shutil,hashlib,subprocess,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
SAVES=ROOT/'_local/reports/stage11-lower-review/recovery'
OUT=ROOT/'_local/reports/stage11-lower-review/recovery-browser';OUT.mkdir(parents=True,exist_ok=True)
URL=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8855/HONRO.html'
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 p=browser.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(URL);p.wait_for_function('window.HonroApp',timeout=90000)
 p.evaluate('async()=>{await HonroCampaignLoader.ensureStage(11);window.originalFrame=HonroApp.frame.bind(HonroApp);HonroApp.frame=()=>{};}')
 def load(file):
  saved=json.loads((SAVES/file).read_text());saved['profile']['honroBattle']=saved['b']
  return p.evaluate('''profile=>{const a=HonroApp;a.profile=profile;a.profile.settings.music=false;a.profile.settings.sound=false;a.continue();while(a.dialogue)HonroStory.finish(a);a.close();a.keys.clear();const e=a.engine,u=e.heroesAlive().find(u=>u.cls==='mage');return{round:e.b.round,x:u.x,y:u.y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,support:e.surface(u.x,u.y-5,u.y+5)?.t?.id,alive:e.alive(1).length};}''',saved['profile'])
 def shot(label,x,y,scale,w=1440,h=900):
  p.set_viewport_size({'width':w,'height':h});p.wait_for_function('HonroAuthoredFarArt.ready(11)',timeout=90000)
  row=p.evaluate('''v=>{const a=HonroApp,b=a.engine.b,before=JSON.stringify(b),growth=JSON.stringify(a.profile.heroes);Object.assign(a.scene,{manual:true,x:v.x,y:v.y,scale:v.scale,storyTween:null,cinematic:null,goalFocus:null});a.scene.render(a.engine,0,'',.6,false,0);a.scene.render(a.engine,0,'',.6,false,0);if(before!==JSON.stringify(b)||growth!==JSON.stringify(a.profile.heroes))throw Error('render changed battle/growth');return{camera:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale},width:v.w,height:v.h,round:b.round,purity:true};}''',dict(x=x,y=y,scale=scale,w=w,h=h))
  f=OUT/(label+'.png');p.locator('#battlecanvas').screenshot(path=str(f));row.update(label=label,pngSha256=hashlib.sha256(f.read_bytes()).hexdigest());return row
 rows=[]
 for label,file,x,y,scale,w,h in [('focus1-new-root','west-jump-land.json',3650,9180,.48,1440,900),('focus2-restored-ritual','west-ritual.json',5400,7210,.5,1440,900),('focus3-mobile-contact','west-takeoff.json',3515,9315,.5,390,844),('final-recovery-overview','east-new-root.json',4000,8750,.24,1440,900)]:
  pose=load(file);row=shot(label,x,y,scale,w,h);row.update(input=file,hero=pose);rows.append(row)
 keyboard=[]
 p.set_viewport_size({'width':1440,'height':900})
 for file,goal,label in [('west-takeoff.json',3540,'keyboard-lower-jump'),('west-upper-takeoff.json',4080,'keyboard-upper-jump')]:
  before=load(file);p.evaluate('()=>{const a=HonroApp;a.prev=performance.now();a.acc=0;window.frameTime=a.prev;originalFrame(frameTime);}');p.wait_for_timeout(320)
  p.keyboard.down('Control');p.keyboard.up('Control')
  after_key=p.evaluate('()=>{const u=HonroApp.engine.active;return{vy:u.vy,moveLeft:u.moveLeft,jumping:u.jumping};}')
  assert after_key['jumping'] and abs(before['moveLeft']-after_key['moveLeft']-75)<.01,(before,after_key)
  p.keyboard.down('ArrowRight')
  for _ in range(120):
   state=p.evaluate('''()=>{originalFrame(frameTime+=1000/60);const e=HonroApp.engine,u=e.active;return{x:u.x,y:u.y,grounded:e.grounded(u)};}''')
   if state['x']>=goal:break
  p.keyboard.up('ArrowRight')
  for _ in range(150):
   state=p.evaluate('''()=>{originalFrame(frameTime+=1000/60);const e=HonroApp.engine,u=e.active;return{x:u.x,y:u.y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,grounded:e.grounded(u),support:e.surface(u.x,u.y-5,u.y+5)?.t?.id,alive:e.alive(1).length};}''')
   if state['grounded']:break
  assert state['support']=='rv-root-west-return' and state['hp']==before['hp'] and state['focus']==before['focus'] and state['alive']==before['alive'],state
  keyboard.append(dict(input=file,keys=['Control','ArrowRight'],before=before,afterKey=after_key,landing=state));rows.append(shot(label,state['x'],state['y']-120,.6))
 result=dict(scope=__doc__,url=URL,checkout=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),sourceSha256={f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest()for f in ['tools/map-forge/stage11-ravine.mjs','shared/runtime/stage11-landscape-art.js','shared/runtime/campaign-map-revision.js','shared/data/campaign.json']},rows=rows,keyboard=keyboard,errors=errors)
 (OUT/'capture.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));assert not errors;print('PASS recovery Game captures4, real keyboard jump junctions2, render/growth purity, pageerror0');browser.close()
