"""Production browser renders fresh/unchanged normal-input native checkpoints."""
import json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import serve_game,launch
from playwright.sync_api import sync_playwright
out=ROOT/'_local/reports/stage5-positioning';out.mkdir(exist_ok=True,parents=True)
data=json.loads((out/'probes.json').read_text());profile=json.loads((ROOT/'game/docs/stage-review/stage05-diagnosis/evidence/entry-profile.json').read_text())['profile']
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw);p=browser.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp',timeout=90000)
 p.evaluate('async()=>{await HonroCampaignLoader.ensureStage(5);HonroApp.frame=()=>{};}')
 p.evaluate('''()=>{window.__stage5GeologyCalls=[];const draw=HonroGeologyArt.drawSurface;HonroGeologyArt.drawSurface=function(scene,c,t,...args){if(t.id.startsWith('stage5-'))__stage5GeologyCalls.push(t.id);return draw.call(this,scene,c,t,...args);};}''')
 rows=[]
 def load(battle=None):
  return p.evaluate('''q=>{const a=HonroApp;a.profile=structuredClone(q.profile);a.profile.settings.music=false;a.profile.settings.sound=false;a.debugMode=false;if(q.battle){a.profile.honroBattle=q.battle;a.profile.lastStage=5;a.continue();}else a.launch(5);for(let i=0;i<30&&a.dialogue;i++)HonroStory.finish(a);HonroStory.tick(a,performance.now()+3000);a.close();a.updateHUD();return{count:a.engine.alive(1).length,heroes:a.engine.heroesAlive().map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,moveLeft:u.moveLeft})),revision:a.engine.b.honroCampaignMapRevision,phase:a.engine.b.phase,geologyViews:HonroGeologyArt.prepare(a.engine.b).views.length};}''',{'profile':profile,'battle':battle})
 def capture(name,w,h,x,y,scale,battle=None):
  p.evaluate('__stage5GeologyCalls=[]');state=load(battle);assert state['geologyViews']==2,state;p.wait_for_function('HonroAuthoredFarArt.ready(5)',timeout=90000);p.set_viewport_size({'width':w,'height':h})
  camera=p.evaluate('''q=>{let a=HonroApp,s=a.scene,b=a.engine.b,before=JSON.stringify(b);s.render(a.engine,0,'',.6,false,0);Object.assign(s,{x:q.x,y:q.y,scale:q.scale,manual:true,storyTween:null,cinematic:null,goalFocus:null});s.render(a.engine,0,'',.6,false,0);if(JSON.stringify(b)!==before)throw Error('Render mutated battle state');return{x:s.x,y:s.y,scale:s.scale};}''',{'x':x,'y':y,'scale':scale})
  calls=p.evaluate('[...new Set(__stage5GeologyCalls)]')
  if name in ['review1-overview','review2-ritual-west','review2-ritual-east','review3-mobile-ritual']:
   assert set(calls)=={'stage5-west-shoulder','stage5-ritual-stone'},calls
  p.screenshot(path=str(out/(name+'.png')));rows.append({'name':name,'viewport':[w,h],'camera':camera,'state':state,'actualGeologyDraws':calls});print(name,state,flush=True)
 capture('review1-overview',1440,900,2100,2650,.38)
 capture('review2-upper',1100,760,1120,2340,.72,data['cases'][2]['end'])
 capture('review2-lower',1100,760,1120,2660,.72,data['cases'][1]['end'])
 capture('review2-ritual-west',1100,760,1590,2620,1.1,data['ritual'][0]['battle'])
 capture('review2-ritual-east',1100,760,1590,2620,1.1,data['ritual'][1]['battle'])
 capture('review3-mobile-upper',844,390,1100,2240,.5,data['cases'][2]['end'])
 capture('review3-mobile-air',844,390,1100,2030,.35,data['cases'][2]['end'])
 capture('review3-mobile-lower',844,390,1200,2710,.5,data['cases'][1]['end'])
 capture('review3-mobile-ritual',390,844,1590,2610,.6,data['ritual'][1]['battle'])
 full=json.loads((out/'fullplay.json').read_text())
 capture('final-review-cave-closed',1100,760,4220,2300,.85)
 capture('final-review-cave-open',1100,760,4220,2300,.85,full['snapshots'][3]['battle'])
 capture('final-review-won',1100,760,4220,2300,.85,full['final'])
 (out/'browser-captures.json').write_text(json.dumps({'scope':'Actual Chromium production candidate. Native ordinary-input checkpoints restored through Continue for pose comparison; fresh overview. Camera-only framing. Not a browser-continuous combat run.','rows':rows,'errors':errors},indent=2,ensure_ascii=False));browser.close()
