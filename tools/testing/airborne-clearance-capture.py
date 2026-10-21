"""Normal-resource starting battles; prepared unlocks and manual camera only, not completion."""
import hashlib,json,shutil,sys,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(sys.argv[1]);out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=b.new_page(viewport={'width':1440,'height':900});p.goto('http://127.0.0.1:8854/HONRO.html');p.wait_for_function('window.HonroApp && window.HonroAuthoredFarArt',timeout=90000);rows=[]
 for sid,x,y in [(2,3300,1120),(3,2840,2210)]:
  p.evaluate('''async sid=>{await HonroCampaignLoader.ensureStage(sid);let a=HonroApp;a.frame=()=>{};for(let n=1;n<sid;n++)a.profile.cleared[n]={visits:1,rounds:5};a.launch(sid);}''',sid)
  for _ in range(40):
   if not p.evaluate('!!HonroApp.dialogue'):break
   p.locator('[data-action="dialogue-skip"]').click()
  p.wait_for_function('sid=>HonroAuthoredFarArt.ready(sid)',arg=sid)
  row=p.evaluate('''v=>{let a=HonroApp,s=a.scene;HonroStory.tick(a,performance.now()+5000);a.close();Object.assign(s,{manual:true,x:v.x,y:v.y,scale:.9,storyTween:null,cinematic:null});s.render(a.engine,0,'',.6,false,0);return{stage:v.sid,flyers:a.engine.b.units.filter(u=>u.fixed&&['bat','crow'].includes(u.honroType)).map(u=>({id:u.id,x:u.x,y:u.y,awake:u.awake}))};}''',{'sid':sid,'x':x,'y':y});rows.append(row);p.locator('#battlecanvas').screenshot(path=str(out/f'stage{sid:02}.png'))
 (out/'capture.json').write_text(json.dumps({'sha':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'scope':__doc__,'sourceHashes':{f:hashlib.sha256(Path(f).read_bytes()).hexdigest() for f in ['shared/engine/src/enemyAI.ts','shared/engine/src/engine.ts','shared/runtime/terrain-space.js','shared/engine/src/locomotion.ts','shared/runtime/stage2-airborne.js']},'rows':rows},indent=2));b.close()
