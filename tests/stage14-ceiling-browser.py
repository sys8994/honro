"""Actual built UI: prepared normal entry and camera-only inspection.
No actor/state corrections for a photograph. Not a combat completion run."""
import json,sys,hashlib,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import launch
from story_browser_server import story_base_url
label=sys.argv[1] if len(sys.argv)>1 else 'candidate'
out=Path('_local/reports/act2-ceiling-20261023')/label;out.mkdir(parents=True,exist_ok=True)
rows=[];errors=[];base=story_base_url()
views=[('overview',1000,1200,3800,4500,.14706),('upper-battle',1440,900,2675,1910,.62),('portrait',390,844,2675,2150,.18),('landscape',844,390,2675,1950,.32),('middle-battle',1440,900,4730,3520,.6)]
with sync_playwright() as pw:
 browser=launch(pw)
 for name,w,h,x,y,z in views:
  ctx=browser.new_context(viewport={'width':w,'height':h},has_touch=w<900);p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
  p.goto(base+'/HONRO.html');p.wait_for_function('!!globalThis.HonroApp',timeout=120000)
  p.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(14);const a=HonroApp;a.frame=()=>{};a.profile=HONRO_TOOLS.fresh();a.profile.cleared=Object.fromEntries(Array.from({length:13},(_,i)=>[i+1,{visits:1,rounds:0}]));a.profile.recruited=['archer','mage','knight','occultist'];for(const c of a.profile.recruited)a.profile.heroes[c].xp=HonroProgression.xpAt(13);a.normalProfile=a.profile;a.launch(14);while(a.dialogue)HonroStory.finish(a);a.close();HonroStory.tick(a,performance.now()+10000);a.updateHUD(true);}''')
  p.wait_for_function('HonroAuthoredFarArt.ready(14)',timeout=90000)
  info=p.evaluate('''v=>{const a=HonroApp,s=a.scene;Object.assign(s,{x:v.x,y:v.y,scale:v.z,manual:true,storyTween:null,goalFocus:null,focusId:null,speakerId:null,storyFrame:null});s.render(a.engine,0,a.selected,.6,false,0);return{camera:{x:s.x,y:s.y,scale:s.scale},battle:JSON.stringify(a.engine.b),goal:HonroAct2.current(a.engine.b).id,roof:a.engine.b.terrain.find(t=>t.id==='v14-cavern-vault')?.vertices,entry:a.engine.b.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp}))};}''',{'x':x,'y':y,'z':z})
  p.wait_for_timeout(180);p.evaluate('HonroApp.scene.render(HonroApp.engine,0,HonroApp.selected,.6,false,0)')
  file=out/(name+'.jpg');p.screenshot(path=str(file),type='jpeg',quality=85);assert file.stat().st_size<1000000
  info.pop('battle');rows.append({'name':name,'viewport':[w,h],**info,'file':str(file),'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()});print(label,name,flush=True);ctx.close()
 browser.close()
assert not errors,errors
(out/'browser.json').write_text(json.dumps({'source':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'scope':__doc__,'rows':rows,'errors':errors},ensure_ascii=False,indent=2))
