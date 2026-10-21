"""Focused production-browser evidence, frozen debug battles; not combat completion.
Serve the repository over HTTP before running; optional URL and label arguments.
"""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
out=Path(sys.argv[4] if len(sys.argv)>4 else '/tmp/stage6-review2');out.mkdir(exist_ok=True,parents=True)
url=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8842/HONRO.html'
label=sys.argv[2] if len(sys.argv)>2 else 'local'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=__import__('shutil').which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 p=b.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(url);p.wait_for_function('window.HonroApp && window.HonroAuthoredFarArt',timeout=90000)
 rows=[]
 for sid in ([int(n) for n in sys.argv[3].split(",")] if len(sys.argv)>3 else [6]):
  p.evaluate('''async sid=>{await HonroCampaignLoader.ensureStage(sid);let a=HonroApp;a.frame=()=>{};a.isOpen=()=>true;a.profile.settings.music=false;a.profile.settings.sound=false;a.debugMode=true;for(let n=1;n<sid;n++)a.profile.cleared[n]=true;a.launch(sid);}''',sid)
  p.wait_for_function('(sid)=>HonroApp.engine?.b.honroStage===sid',arg=sid)
  # Close through the game story action so its DOM and staging are released.
  for _ in range(20):
   if not p.evaluate('!!HonroApp.dialogue'):break
   p.locator('[data-action="dialogue-skip"]').click()
  assert not p.evaluate('!!HonroApp.dialogue')
  p.evaluate('''()=>{let a=HonroApp;HonroStory.tick(a,performance.now()+3000);a.dialogue=null;a.turnNotice=null;a.close();let s=a.scene,b=a.engine.b,u=b.units.find(u=>u.team==='player'||u.side===0);Object.assign(s,{manual:true,storyTween:null,goalFocus:null,x:u.x+600,y:u.y-230,scale:.65});s.render(a.engine,0,'',.6,false,0);}''')
  p.wait_for_function('(sid)=>HonroAuthoredFarArt.ready(sid)',arg=sid)
  p.set_viewport_size({'width':1440,'height':900})
  for view,x,y,zoom,width,height in [('normal-west',1700,2170,.65,1440,900),('normal-rescue',3500,2800,.65,1440,900),('zoom-deck',2010,1980,1.05,1440,900),('maxout',3300,2350,0,1440,900),('mobile-rescue',4100,2770,.65,390,844),('mobile-east',4800,2530,.5,390,844),('landscape-east',5000,2480,.35,844,390)]:
   p.set_viewport_size({'width':width,'height':height})
   p.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
   row=p.evaluate("""v=>{const a=HonroApp,s=a.scene,b=a.engine.b;Object.assign(s,{x:v.x,y:v.y,scale:v.zoom||HonroBounds.zoomLimits(s.size().w).min,manual:true,storyTween:null,cinematic:null});s.render(a.engine,0,'',.6,false,0);return{stage:b.honroStage,view:v.view,camera:{x:s.x,y:s.y,scale:s.scale}};}""",{'view':view,'x':x,'y':y,'zoom':zoom})
   p.locator('#battlecanvas').screenshot(path=str(out/f'stage{sid:02}-{view}.png'));rows.append(row)
 (out/'capture.json').write_text(json.dumps({'sha':__import__('subprocess').check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'workingTree':__import__('subprocess').check_output(['git','status','--porcelain'],cwd=ROOT,text=True),'scope':'Local production browser, frozen scene; actual minimum gameplay zoom and portrait/landscape views. Normal combat captured separately.','rows':rows,'errors':errors},indent=2));print(rows);b.close()
