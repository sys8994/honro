"""View an actual native normal-input checkpoint in final published-source UI.
No combat replay or art change. Freeze frame scheduling, production Continue,
then render at a declared inspection camera without editing gameplay state.
"""
import json,sys,shutil,subprocess,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from story_browser_server import story_base_url
stageId=int(sys.argv[2]) if len(sys.argv)>2 else 16
path=ROOT/sys.argv[1];record=json.loads(path.read_text());profile=record['profile'];expected=profile['honroBattle'];out=ROOT/f'_local/reports/stage{stageId}-current-pacing-20261022/browser';out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=browser.new_page(viewport={'width':1180,'height':757});errors=[];http=[]
 p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',lambda r:http.append({'url':r.url,'status':r.status})if r.status>=400 else None)
 p.goto(story_base_url()+'/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=90000)
 p.evaluate('async id=>{await HonroCampaignLoader.ensureStage(id);HonroApp.frame=()=>{};}',stageId);p.wait_for_timeout(80)
 p.evaluate('profile=>{const a=HonroApp;a.debugMode=false;a.profile=profile;a.normalProfile=profile;a.continue();}',profile)
 p.wait_for_function('(id)=>HonroApp.engine?.b.honroStage===id',arg=stageId,timeout=90000)
 actual=json.loads(p.evaluate('JSON.stringify(HonroApp.engine.b)'));assert actual==expected,'Production browser Continue changed whole battle'
 p.wait_for_function('(id)=>HonroAuthoredFarArt.ready(id)',arg=stageId,timeout=90000)
 info=p.evaluate('''()=>{const a=HonroApp,b=a.engine.b,goal=HonroAct2.current(b),m=b.honroMarkers.find(m=>m.id===goal?.id),s=a.scene;a.close();a.updateHUD(true);Object.assign(s,{manual:true,x:m?.x||(b.honroStage===17?8530:5650),y:(m?.y||(b.honroStage===17?4580:4250))-100,scale:.4,goalFocus:null,cinematic:null,storyTween:null});s.render(a.engine,0,'',.6,false,0);return{round:b.round,phase:b.phase,goal:goal?.id,done:HonroAct2.memory(b).done,camera:[s.x,s.y,s.scale],heroes:b.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,dead:u.dead})),enemies:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).length}}''')
 p.screenshot(path=str(out/'actual-stop.jpg'),type='jpeg',quality=85);assert(out/'actual-stop.jpg').stat().st_size<1_000_000
 assert json.loads(p.evaluate('JSON.stringify(HonroApp.engine.b)'))==actual,'Inspection render changed gameplay'
 result={'checkedCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'input':str(path.relative_to(ROOT)),'inputSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'wholeBattleContinueExact':True,'renderPure':True,'scope':__doc__,'view':info,'errors':errors,'httpFailures':http};(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');assert not errors,errors;assert not http,http;browser.close();print('PASS actual normal-input checkpoint browser Continue whole battle exact, render pure; errors0')
