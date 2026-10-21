"""Actual production browser, fresh legal-entry fixture; short engine inputs only."""
import json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tests'))
from browser_support import serve_game,launch
from playwright.sync_api import sync_playwright
out=ROOT/'_local/reports/stage05-diagnosis';out.mkdir(parents=True,exist_ok=True)
profile=json.loads((out/'entry-profile.json').read_text())['profile']
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw);page=browser.new_page(viewport={'width':844,'height':390},has_touch=True,device_scale_factor=1)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp',timeout=90000)
 page.evaluate('''async p=>{await HonroCampaignLoader.ensureStage(5);const a=HonroApp;a.__frame=a.frame.bind(a);a.frame=()=>{};a.profile=p;a.profile.settings.music=false;a.profile.settings.sound=false;a.debugMode=false;a.launch(5);for(let i=0;i<30&&a.dialogue;i++)HonroStory.finish(a);a.close();}''',profile)
 page.wait_for_function('HonroAuthoredFarArt.ready(5)',timeout=90000)
 page.evaluate('HonroStory.tick(HonroApp,performance.now()+3000)')
 state=page.evaluate('''()=>{let a=HonroApp,e=a.engine,b=e.b;return{stage:b.honroStage,round:b.round,phase:b.phase,debug:a.debugMode,heroes:e.heroesAlive(),foes:e.alive(1),terrain:b.terrain,cap:HonroEncounters.populationCap(b),camera:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale}}}''')
 rows=[]
 for name,w,h,x,y,zoom in [('turn1-landscape',844,390,1360,2470,.45),('turn1-portrait',390,844,1360,2470,.45),('turn1-start',844,390,650,2400,.6),('turn1-ritual',844,390,1650,2500,.6)]:
  page.set_viewport_size({'width':w,'height':h})
  cam=page.evaluate('''q=>{let a=HonroApp,s=a.scene;Object.assign(s,{x:q.x,y:q.y,scale:q.zoom,manual:true,storyTween:null,goalFocus:null,cinematic:null});s.render(a.engine,0,a.selected,.6,false,0);a.updateHUD();return{x:s.x,y:s.y,scale:s.scale,round:a.engine.b.round};}''',{'x':x,'y':y,'zoom':zoom})
  page.screenshot(path=str(out/(name+'.png')));rows.append({'name':name,'camera':cam,'viewport':[w,h]})
 (out/'browser-initial.json').write_text(json.dumps({'scope':'Actual Chromium production bundle; legal reward-ledger profile; fresh R1. Camera-only framing for tactical inspection; no actor/state mutations. Not user screenshot pixel match.','state':state,'views':rows,'errors':errors},indent=2,ensure_ascii=False))
 print(json.dumps({'foes':len(state['foes']),'heroes':[(u['name'],u['level'],u['maxMove']) for u in state['heroes']],'rows':rows,'errors':errors},ensure_ascii=False),flush=True)
 page.set_viewport_size({'width':844,'height':390})
 page.add_script_tag(path=str(ROOT/'tools/testing/stage5-diagnosis-controller.js'))
 if '--objective' in sys.argv:
  native=json.loads((out/'native.json').read_text())
  result=page.evaluate('q=>stage5Objective(q.profile,q.battle)',{'profile':profile,'battle':native['routeEnd']})
  page.screenshot(path=str(out/'objective-real-hit.png'));(out/'browser-objective.json').write_text(json.dumps({'result':result,'errors':errors},indent=2,ensure_ascii=False));print(json.dumps(result,ensure_ascii=False),flush=True);browser.close();sys.exit(0)
 cases=[];reflection='--reflection' in sys.argv
 for cls in (['mage'] if reflection else ['archer','mage']):
  for scenario in (['reflection-under','reflection-over'] if reflection else ['start','under','over']):
   row=page.evaluate('q=>stage5Diagnostic(q.profile,q.cls,q.scenario)',{'profile':profile,'cls':cls,'scenario':scenario})
   page.screenshot(path=str(out/(cls+'-'+scenario+'-after-enemy.png')))
   cases.append(row);(out/('browser-reflection.json' if reflection else 'browser-inputs.json')).write_text(json.dumps({'cases':cases,'errors':errors},indent=2,ensure_ascii=False))
   print(json.dumps(row if row.get('blocked') else {k:row[k] for k in ['cls','scenario','position','damage','end']},ensure_ascii=False),flush=True)
 browser.close()
