"""Controlled real App/Continue checks, not a full combat walkthrough. No image upload."""
import ast,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
OUT=ROOT/'_local/reports/evidence-pickup-p0';BASE=story_base_url();rows=[];errors=[]
m=ast.parse((ROOT/'tests/evidence-quests-browser.py').read_text());SETUP=next(ast.literal_eval(n.value)for n in m.body if isinstance(n,ast.Assign)and any(isinstance(t,ast.Name)and t.id=='SETUP'for t in n.targets))
with sync_playwright()as p:
 browser=launch(p)
 for mobile in [False,True]:
  ctx=browser.new_context(viewport={'width':390,'height':844}if mobile else{'width':1440,'height':900},is_mobile=mobile,has_touch=mobile);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto(BASE+'/HONRO.html');page.wait_for_function('window.HonroApp');page.evaluate(SETUP,22)
  result=page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,A=HonroAct3;a.checkMission=()=>false;for(const v of b.units)if(v.side===1){v.dead=true;v.hp=0;}A.memory(b).done['archive-seal']=true;const u=b.units.find(u=>u.side===0&&u.cls==='mage'),m=b.honroMarkers.find(m=>m.id==='ledger-case');for(const v of b.units)if(v.side===0&&v!==u){v.x=100;v.y=100;}Object.assign(u,{x:m.x+240,y:m.y,vx:0,vy:0,acted:false});b.active=u.id;b.phase='aim';b.side=0;a.actorBoundary=u.id;const ok=A.use(a,m);return {ok,owner:HonroEvidenceQuests.field(b).cargo['22:ledger-case']?.actor,actor:u.id,done:A.memory(b).done['ledger-case']};}''');assert result['ok']and result['done']and result['owner']==result['actor']
  # Reproduce a previously shipped missing-cargo snapshot, with everyone away.
  page.evaluate('''()=>{const a=HonroApp,b=a.engine.b;while(a.dialogue)HonroStory.finish(a);b.honroState.storyQueue=[];delete b.honroState.fieldEvidence.cargo['22:ledger-case'];delete a.profile.honroFieldCargo['22:ledger-case'];b.honroState.fieldEvidence.events['ledger-case'].cargo=[];for(const u of b.units)if(u.side===0){u.x=100;u.y=100;}window.savedGoals=JSON.stringify(b.honroState.act3);a.profile.honroBattle=structuredClone(b);a.persist();}''');goals=page.evaluate('savedGoals');page.reload();page.wait_for_function('window.HonroApp');page.locator('[data-action="continue"]').click();page.wait_for_function('HonroApp.engine?.b.honroState.fieldEvidence.cargo["22:ledger-case"]?.phase==="dropped"');assert page.evaluate('JSON.stringify(HonroApp.engine.b.honroState.act3)')==goals
  page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,m=b.honroMarkers.find(m=>m.id==='ledger-case'),u=b.units.find(u=>u.side===0&&u.cls==='mage');a.checkMission=()=>false;Object.assign(u,{x:m.x+260,y:m.y,vx:0,vy:0});HonroEvidenceQuests.observe(a);}''');assert page.evaluate('HonroEvidenceQuests.field(HonroApp.engine.b).cargo["22:ledger-case"].phase')=='carry';assert page.evaluate('JSON.stringify(HonroApp.engine.b.honroState.act3)')==goals
  # Serialize again and confirm recovery is stable without another goal/reward.
  page.evaluate('()=>{const a=HonroApp;a.profile.honroBattle=structuredClone(a.engine.b);a.persist();}');page.reload();page.wait_for_function('window.HonroApp');page.locator('[data-action="continue"]').click();page.wait_for_function('HonroApp.engine?.b.honroState.fieldEvidence.cargo["22:ledger-case"]?.phase==="carry"');assert page.evaluate('JSON.stringify(HonroApp.engine.b.honroState.act3)')==goals
  rows.append({'device':'mobile'if mobile else'desktop','actual240Pickup':True,'actualContinueMissingCargoRecoveredAt260':True,'secondContinueStable':True});ctx.close()
 browser.close()
assert not errors,errors
(OUT/'browser.json').write_text(json.dumps({'passed':True,'rows':rows,'scope':__doc__},ensure_ascii=False,indent=2));print('PASS',rows)
