"""Actual App desktop/mobile visual and controlled entrance/Continue contract checks; not combat completion."""
import ast,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
OUT=ROOT/'review/stage24';OUT.mkdir(parents=True,exist_ok=True);BASE=story_base_url();errors=[];results=[];views=[]
m=ast.parse((ROOT/'tests/evidence-quests-browser.py').read_text());SETUP=next(ast.literal_eval(n.value)for n in m.body if isinstance(n,ast.Assign)and any(isinstance(t,ast.Name)and t.id=='SETUP'for t in n.targets))
with sync_playwright()as p:
 browser=launch(p)
 for mobile in [False,True]:
  tag='mobile'if mobile else'desktop';ctx=browser.new_context(viewport={'width':390,'height':844}if mobile else{'width':1440,'height':900},is_mobile=mobile,has_touch=mobile);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  for before in [True,False]:
   page.goto(BASE+('/_local/reports/stage24/before.html'if before else'/HONRO.html'));page.wait_for_function('window.HonroApp');page.evaluate(SETUP,24)
   for name,x,y,z in [('overview',3500,2400,.18 if mobile else .21),('family-hall',2200,2370,.7),('rear-garden',3550,2580,.7),('shrine',4900,2180,.7),('two-entries',6130,2490,.43)]:
    page.evaluate('''q=>{const a=HonroApp;Object.assign(a.scene,{x:q[0],y:q[1],scale:q[2],manual:true,goalFocus:null,focusUntil:0,storyTween:null,speakerId:null,speakerUntil:0});}''',[x,y,z]);page.wait_for_timeout(160);page.screenshot(path=str(OUT/f'{"before"if before else"after"}-{tag}-{name}.png'));views.append({'device':tag,'view':name,'phase':'before'if before else'after','camera':page.evaluate('()=>({x:HonroApp.scene.x,y:HonroApp.scene.y,zoom:HonroApp.scene.scale,width:innerWidth,height:innerHeight,storyTween:HonroApp.scene.storyTween})')})
   if not before:
    row=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,A=HonroAct3,Q=HonroEvidenceQuests;const oldGoals=JSON.stringify(A.steps(b));a.checkMission=()=>false;const mem=A.memory(b);mem.done['family-crest']=mem.done['shrine-seal']=true;for(const id of ['shrine-door']){const gate=HonroQuestTargets.records(b).find(q=>q.id===id);if(gate)gate.broken=true;}for(const [mark,classes]of [['split-route-a',['archer','mage']],['split-route-b',['knight','occultist']]]){const m=b.honroMarkers.find(m=>m.id===mark);classes.forEach((cls,i)=>Object.assign(b.units.find(u=>u.side===0&&u.cls===cls),{x:m.x-40+80*i,y:m.y,vx:0,vy:0,airborne:false}));Q.observe(a);A.tick(a,0);}return {entrances:b.honroState.evidenceEntrances,done:!!mem.done['land-register'],goalsUnchanged:oldGoals===JSON.stringify(A.steps(b)),terrain:JSON.stringify(b.terrain)};}''');assert row['done']and row['goalsUnchanged'],row
    page.evaluate('''()=>{const a=HonroApp;for(let i=0;a.dialogue&&i<100;i++)HonroStory.finish(a);a.profile.honroBattle=structuredClone(a.engine.b);a.persist();}''');page.reload();page.wait_for_function('window.HonroApp');page.locator('[data-action="continue"]').click();page.wait_for_function('HonroApp.engine?.b.honroState.evidenceEntrances');assert page.evaluate('JSON.stringify(HonroApp.engine.b.terrain)')==row.pop('terrain');row['device']=tag;row['continueTerrainPreserved']=True;results.append(row)
  ctx.close()
 browser.close()
assert not errors,errors
(OUT/'browser.json').write_text(json.dumps({'passed':True,'scope':__doc__,'results':results,'errors':errors,'views':views},ensure_ascii=False,indent=2));print('PASS actual desktop/mobile visuals, two entrance latches, unchanged goals, real Continue terrain')
