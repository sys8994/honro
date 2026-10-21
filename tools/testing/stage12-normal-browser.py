"""Actual native-play saves viewed via production browser Continue, then real outcome/Stage13 UI.
These are frozen genuine saved battles, not a browser replay of the entire11 rounds.
No actor pose, HP, resource or objective corrections are made.
"""
import json,sys,shutil,subprocess,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
out=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/stage12-normal-browser');out.mkdir(exist_ok=True,parents=True)
url=sys.argv[2] if len(sys.argv)>2 else 'http://127.0.0.1:8854/HONRO.html'
normal=Path(sys.argv[3] if len(sys.argv)>3 else '/tmp/stage12-normal');exit_name=sys.argv[4] if len(sys.argv)>4 else 'lower';assert exit_name in ['lower','upper']
inputs=[('entry',normal/'initial.json',10000,2340,.6),('sign-action',normal/'sign-action.json',6520,4660,.65),('gate-open',normal/'gate-open.json',7150,5200,.55),(exit_name+'-victory',normal/'terminal.json',8910 if exit_name=='upper' else 8350,4180 if exit_name=='upper' else 5800,.65)]
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=browser.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(url);p.wait_for_function('window.HonroApp',timeout=90000)
 p.evaluate('async()=>{await HonroCampaignLoader.ensureStage(12);HonroApp.frame=()=>{};}');rows=[]
 for label,path,x,y,zoom in inputs:
  record=json.loads(Path(path).read_text());b=record.get('b')or record['initial']['battle'];profile=record.get('profile')or record['initial']['profile'];profile['honroBattle']=b
  row=p.evaluate('''v=>{const a=HonroApp;a.dialogue=null;a.profile=v.profile;a.profile.settings.music=false;a.profile.settings.sound=false;a.continue();const b=a.engine.b,fields=u=>[u.id,u.x,u.y,u.hp,u.focus,u.moveLeft,!!u.dead];if(JSON.stringify(b.units.map(fields))!==JSON.stringify(v.profile.honroBattle.units.map(fields)))throw Error('Continue changed physical battle state');return{round:b.round,phase:b.phase,done:b.honroState.act2.done};}''',{'profile':profile})
  p.wait_for_function('HonroAuthoredFarArt.ready(12)',timeout=90000)
  p.evaluate('''v=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);a.updateHUD(true);a.close();const s=a.scene;Object.assign(s,{manual:true,x:v.x,y:v.y,scale:v.zoom,storyTween:null,cinematic:null,goalFocus:null});s.render(a.engine,0,'',.6,false,0);}''',{'x':x,'y':y,'zoom':zoom})
  p.locator('#battlecanvas').screenshot(path=str(out/(label+'.png')));row.update({'label':label,'input':str(path),'inputSha256':hashlib.sha256(Path(path).read_bytes()).hexdigest()});rows.append(row)
 # The final loaded save is a genuine win. Finish authored dialogue and use UI.
 p.evaluate('''()=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);a.outcome();while(a.dialogue)HonroStory.finish(a);if(!a.profile.cleared[12])throw Error('Outcome did not clear12');}''');p.screenshot(path=str(out/'result.png'));p.locator('[data-action="result-continue"]').click();p.wait_for_function('HonroApp.screen==="rest"',timeout=90000)
 for _ in range(100):
  if not p.evaluate('!!HonroApp.dialogue'):break
  p.locator('[data-action="dialogue-next"]').click()
 p.screenshot(path=str(out/'rest-before13.png'));p.locator('[data-action="journey-enter"][data-id="13"]').click();p.wait_for_function('HonroApp.engine?.b.honroStage===13',timeout=90000)
 p.evaluate('async()=>{await HonroCampaignLoader.ensureStage(13);while(HonroApp.dialogue)HonroStory.finish(HonroApp);}')
 p.wait_for_function('HonroAuthoredFarArt.ready(13)',timeout=90000)
 p.evaluate("()=>{const a=HonroApp,u=a.engine.heroesAlive()[0];a.close();Object.assign(a.scene,{x:u.x+500,y:u.y-220,scale:.6,manual:true,storyTween:null,cinematic:null,goalFocus:null});a.scene.render(a.engine,0,'',.6,false,0);}")
 p.screenshot(path=str(out/'stage13-entry.png'));result={'scope':__doc__,'sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'renderSourceSha256':hashlib.sha256((ROOT/'shared/runtime/stage12-quarry-art.js').read_bytes()).hexdigest(),'rows':rows,'nextStage':13,'errors':errors};(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));assert not errors;print('PASS exact actual-save browser Continue, outcome/rest/Stage13; errors0');browser.close()
