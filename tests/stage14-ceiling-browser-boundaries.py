"""Built production Continue and one prepared jump scenario. Not user R9 or combat completion."""
import json,hashlib,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import launch
from story_browser_server import story_base_url
out=Path('_local/reports/act2-ceiling-20261023/final');out.mkdir(parents=True,exist_ok=True);base=story_base_url();rows=[];errors=[]
with sync_playwright() as pw:
 browser=launch(pw);ctx=browser.new_context(viewport={'width':1200,'height':800});p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(base+'/HONRO.html');p.wait_for_function('!!globalThis.HonroApp',timeout=120000)
 p.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(14);const a=HonroApp;a.frame=()=>{};a.profile=HONRO_TOOLS.fresh();a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=[...a.profile.recruited];a.profile.cleared=Object.fromEntries(Array.from({length:13},(_,i)=>[i+1,{visits:1,rounds:0}]));for(const c of a.profile.recruited)a.profile.heroes[c].xp=HonroProgression.xpAt(13);a.normalProfile=a.profile;a.launch(14);while(a.dialogue)HonroStory.finish(a);a.close();HonroStory.tick(a,performance.now()+10000);a.updateHUD(true);}''')
 p.wait_for_function('HonroAuthoredFarArt.ready(14)',timeout=90000)
 expected=p.evaluate('''()=>{HonroApp.stopBattle();return JSON.stringify(HonroApp.profile.honroBattle);}''')
 p.reload();p.wait_for_function('!!globalThis.HonroApp',timeout=120000);p.evaluate('HonroApp.frame=()=>{}');p.locator('[data-action="continue"]').click();p.wait_for_function('HonroApp.engine?.b.honroCampaignMapRevision===1',timeout=120000)
 actual=p.evaluate('JSON.stringify(HonroApp.engine.b)');assert json.loads(actual)==json.loads(expected),'Whole-battle export/actual reload/Continue'
 rows.append({'case':'actual reload and Continue','wholeBattleExact':True,'round':json.loads(actual)['round']})
 p.wait_for_function('HonroAuthoredFarArt.ready(14)',timeout=90000)
 def shot(name):
  p.evaluate('HonroApp.scene.render(HonroApp.engine,0,HonroApp.selected,.6,false,0)');f=out/(name+'.jpg');p.screenshot(path=str(f),type='jpeg',quality=85);assert f.stat().st_size<1000000;return {'path':str(f),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
 rows[-1]['capture']=shot('continue')
 # One initial supported pose, whole living roster retained. No later body,
 # resource, terrain or objective writes. Real Engine jump/ticks follow.
 initial=p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,u=b.units.find(u=>u.id==='p-knight');Object.assign(u,{x:4160,y:6750,vx:0,vy:0,airborne:false,jumping:false});b.active=u.id;b.side=0;b.phase='aim';a.selected=u.loadout[0];a.updateHUD(true);Object.assign(a.scene,{x:4290,y:6530,scale:.8,manual:true,storyTween:null,goalFocus:null,focusId:null,speakerId:null,storyFrame:null});return{x:u.x,y:u.y,hp:u.hp,move:u.moveLeft,valid:HONRO_CORE.validTerrainContactPose(b.terrain,u)};}''');assert initial['valid'];before=shot('platform-before-jump')
 result=p.evaluate('''()=>{const e=HonroApp.engine,u=e.active;if(!e.jump(u))throw Error('jump rejected');let minY=u.y,n=0;for(;n<500;n++){e.tick(HONRO_CORE.STEP);minY=Math.min(minY,u.y);if(n>5&&!u.jumping&&e.grounded(u))break;}return{x:u.x,y:u.y,hp:u.hp,move:u.moveLeft,minY,ticks:n,support:e.contactSurface(u.x,u.y-1,u.y+1)?.t.id};}''')
 assert result['support']=='v14-family-roof-step' and result['hp']==initial['hp'] and initial['move']-result['move']==75
 rows.append({'case':'prepared full-roster family-yard jump with real Engine ticks','initial':initial,'result':result,'before':before,'after':shot('platform-after-jump')})
 browser.close()
assert not errors,errors
(out/'browser-boundaries.json').write_text(json.dumps({'source':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'scope':__doc__,'rows':rows,'errors':errors},ensure_ascii=False,indent=2))
print('PASS production reload Continue whole-battle exact and full-roster real jump landing')
