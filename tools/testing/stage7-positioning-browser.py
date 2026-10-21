"""Stage 7 production-browser combat using normal engine actions and finite resources.
Serve the repository over HTTP before running; optional URL and label arguments.
"""
import json,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
out=ROOT/'_local/reports/stage7-positioning/combat';out.mkdir(exist_ok=True,parents=True)
url=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:8842/HONRO.html'
label=sys.argv[2] if len(sys.argv)>2 else 'local'
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=__import__('shutil').which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 p=b.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(url);p.wait_for_function('window.HonroApp && window.HonroAuthoredFarArt',timeout=90000)
 rows=[]
 profile=json.loads(Path(sys.argv[4] if len(sys.argv)>4 else 'game/docs/stage-review/stage07-roots/evidence/entry-profile.json').read_text())['profile']
 p.evaluate('(profile)=>{HonroApp.profile=profile}',profile)
 for sid in ([int(n) for n in sys.argv[3].split(",")] if len(sys.argv)>3 else [7]):
  p.evaluate('''async sid=>{await HonroCampaignLoader.ensureStage(sid);let a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;a.debugMode=false;for(let n=1;n<sid;n++)a.profile.cleared[n]=true;a.launch(sid);}''',sid)
  p.wait_for_function('(sid)=>HonroApp.engine?.b.honroStage===sid',arg=sid)
  # Close through the game story action so its DOM and staging are released.
  for _ in range(20):
   if not p.evaluate('!!HonroApp.dialogue'):break
   p.locator('[data-action="dialogue-skip"]').click()
  assert not p.evaluate('!!HonroApp.dialogue')
  p.evaluate('''()=>{let a=HonroApp;HonroStory.tick(a,performance.now()+3000);a.dialogue=null;a.turnNotice=null;a.close();let s=a.scene,b=a.engine.b,u=b.units.find(u=>u.team==='player'||u.side===0);Object.assign(s,{manual:true,storyTween:null,goalFocus:null,x:u.x+600,y:u.y-230,scale:.65});s.render(a.engine,0,'',.6,false,0);}''')
  p.wait_for_function('(sid)=>HonroAuthoredFarArt.ready(sid)',arg=sid)

  result=p.evaluate((ROOT/'tools/testing/stage7-positioning-controller.js').read_text());result['runtimeSourceSha']=__import__('subprocess').check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip();print(json.dumps(result['end']));images=result.pop('images',{});[(out/(name+'.png')).write_bytes(__import__('base64').b64decode(data.split(',')[1])) for name,data in images.items()];(out/'combat.json').write_text(json.dumps(result,indent=2,ensure_ascii=False))
  p.evaluate("""()=>{let a=HonroApp,s=a.scene,u=a.engine.b.units.find(u=>u.side===0);Object.assign(s,{x:u.x,y:u.y-180,scale:.65,manual:true,storyTween:null,cinematic:null});s.render(a.engine,0,'',.6,false,0);}""")
  p.locator('#battlecanvas').screenshot(path=str(out/'stage07-exit.png'))
  p.set_viewport_size({'width':390,'height':844})
  p.evaluate("""()=>{let a=HonroApp,s=a.scene,u=a.engine.b.units.find(u=>u.side===0);s.render(a.engine,0,'',.6,false,0);Object.assign(s,{x:u.x,y:u.y-150,scale:.65,manual:true,storyTween:null,cinematic:null});s.render(a.engine,0,'',.6,false,0);}""")
  p.locator('#battlecanvas').screenshot(path=str(out/'stage07-mobile-player.png'))
  p.set_viewport_size({'width':1440,'height':900})
  outcome=p.evaluate('''()=>{let a=HonroApp;if(!['won','lost'].includes(a.engine.b.phase))return{phase:a.engine.b.phase,done:false,scope:'Nonterminal run; outcome not invoked'};a.outcome();for(let i=0;i<12&&a.dialogue;i++)HonroStory.finish(a);return{phase:a.engine.b.phase,done:a.done,cleared:a.profile.cleared[7],lastStage:a.profile.lastStage,hero:a.profile.heroes.archer,continueText:document.querySelector('[data-action="result-continue"]')?.textContent};}''')
  (out/'outcome.json').write_text(json.dumps(outcome,indent=2,ensure_ascii=False));print(outcome['phase'],outcome['done'],outcome.get('cleared'),outcome.get('continueText'))
  p.screenshot(path=str(out/'stage07-result.png'))
 print(errors);b.close()
