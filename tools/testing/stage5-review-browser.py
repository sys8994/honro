"""Bounded real Chromium App input, earned entry fixture; no battle pose/HP edits."""
import json,shutil,subprocess,os
from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[2];out=R/'_local/reports/stage5-review/browser-input';out.mkdir(parents=True,exist_ok=True)
source=(R/'tests/stage5-review-input.mjs').read_text();methods=source[source.index('const terminal='):source.index('async function save')].replace('app.frame(now)','productionFrame(now)')
setup="""()=>{const app=HonroApp,e=app.engine,b=e.b,C=HONRO_CORE,g=globalThis,plain=x=>JSON.parse(JSON.stringify(x)),assert=(v,m)=>{if(!v)throw Error(m)};let frame=0,now=performance.now(),opStart=Date.now();const actions=[],inputs=[],hits=[],fires=[],births=[],seen=new Set(b.units.map(u=>u.id)),routeIndex={archer:0,mage:0};const s=HONRO_PROJECT.stages[4],productionFrame=app.frame.bind(app);app.frame=()=>{};app.prev=now;app.acc=0;Object.defineProperty(performance,'now',{value:()=>now,configurable:true});
const hurt=e.hurt.bind(e);e.hurt=(u,...args)=>{const hp=u.hp,r=hurt(u,...args);if(u.hp<hp)hits.push({frame,round:b.round,target:u.id,owner:args[1],loss:hp-u.hp});return r;};
"""+methods+"""
window.reviewWait=n=>{for(let i=0;i<n;i++)tick();};window.reviewInput=cmd=>{opStart=Date.now();settle();if(cmd.op==='route')route(cmd.stopX);if(cmd.op==='walk')walk(cmd.x);if(cmd.op==='jump')jumpTo(cmd.x,cmd.input??1);if(cmd.op==='shoot')assert(shoot(e.unit(cmd.target),cmd.skill),'No legal shot');if(cmd.op==='defend'){app.defend();settle();}return{round:b.round,phase:b.phase,active:b.active,heroes:e.heroesAlive().map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus})),actions:plain(actions),hits:plain(hits),frame};};} """
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=browser.new_page(viewport={'width':1440,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8842/HONRO.html');page.wait_for_function('window.HonroApp && window.HonroCampaignLoader',timeout=90000)
 fixture=R/'_local/reports/stage5-review/browser-entry-fixture/trace.json'
 if not fixture.exists():
  env=dict(os.environ,HONRO_STAGE5_REVIEW_OUT=str(fixture.parent));subprocess.run(['node','tests/stage5-review-input.mjs'],input='{"op":"quit"}\n',text=True,cwd=R,env=env,stdout=subprocess.DEVNULL,check=True)
 profile=json.loads(fixture.read_text())['profile']
 page.evaluate('''async p=>{await HonroCampaignLoader.ensureStage(5);const a=HonroApp;a.profile=p;a.debugMode=false;a.profile.settings.music=false;a.profile.settings.sound=false;a.launch(5);for(let i=0;i<20&&a.dialogue;i++)HonroStory.finish(a);a.turnNotice=null;a.close();}''',profile)
 page.wait_for_function('HonroAuthoredFarArt.ready(5)',timeout=90000);page.evaluate(setup)
 rows=[]
 for size,cmds in [({'width':1440,'height':900},[{'op':'route','stopX':950},{'op':'shoot','target':'s5-upper-crow','skill':'A14'},{'op':'route','stopX':1130},{'op':'shoot','target':'s5-entry-boar','skill':'M06'}]),({'width':390,'height':844},[{'op':'route','stopX':1420},{'op':'shoot','target':'s5-upper-archer','skill':'A14'},{'op':'route','stopX':1540},{'op':'shoot','target':'s5-entry-boar','skill':'M03'}])]:
  page.set_viewport_size(size)
  for cmd in cmds:
   row=page.evaluate('c=>reviewInput(c)',cmd);rows.append({'viewport':size,'command':cmd,'state':row});print(cmd,row['round'],[(u['id'],round(u['x']),u['hp']) for u in row['heroes']],flush=True)
  page.evaluate('reviewWait(120)')
  page.evaluate('''()=>{const a=HonroApp,s=a.scene,u=a.engine.active;Object.assign(s,{x:u.x,y:u.y-180,scale:.65,manual:true,cinematic:null,storyTween:null});s.render(a.engine,0,a.selected,.6,false,0);a.updateHUD(true);}''');page.screenshot(path=str(out/f"actual-input-{size['width']}.png"))
 (out/'evidence.json').write_text(json.dumps({'scope':'Real Chromium DOM/Canvas/production App.frame. Current stage1–4 earned entry fixture, desktop then same battle on portrait mobile; movement/jump/charge/fire through App controls. No battle position/HP/resource edits. Bounded four allied actions / two enemy phases, not browser full completion. Clock and frame scheduling are controlled.','rows':rows,'errors':errors},ensure_ascii=False,indent=2));assert not errors,errors;browser.close()
