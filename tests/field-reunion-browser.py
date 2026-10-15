"""Actual acquisition -> serialized profile -> Stage28 reunion scene.
Controlled noncombat fixtures; prior goals/void resolution are seeded checkpoints.
"""
import ast,json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
from story_browser_server import story_base_url
OUT=ROOT/'_local/reports/field-evidence';BASE=story_base_url();rows=[]
m=ast.parse((ROOT/'tests/evidence-quests-browser.py').read_text());SETUP=next(ast.literal_eval(n.value)for n in m.body if isinstance(n,ast.Assign)and any(isinstance(t,ast.Name)and t.id=='SETUP'for t in n.targets))
with sync_playwright()as p:
 browser=launch(p)
 for mobile in [False,True]:
  tag='mobile'if mobile else'desktop';ctx=browser.new_context(viewport={'width':390,'height':844}if mobile else{'width':1440,'height':900},is_mobile=mobile,has_touch=mobile);page=ctx.new_page();page.goto(BASE+'/HONRO.html');page.wait_for_function('window.HonroApp');proof={}
  for stage,goal,cls in [(26,'investigation-record','occultist'),(27,'family-manifest','archer')]:
   page.evaluate(SETUP,stage);page.evaluate('(p)=>HonroApp.profile.honroFieldCargo=p',proof)
   result=page.evaluate('''([goal,cls])=>{const a=HonroApp,b=a.engine.b,A=HonroAct3;a.checkMission=()=>false;for(const u of b.units)if(u.side===1){u.dead=true;u.hp=0;}for(const s of A.steps(b)){if(s.id===goal)break;A.memory(b).done[s.id]=true;}if(b.honroAct3Void)b.honroAct3Void.state='RESOLVED';const m=b.honroMarkers.find(m=>m.id===goal),u=b.units.find(u=>u.side===0&&u.cls===cls);Object.assign(u,{x:m.x-35,y:m.y,vx:0,vy:0,acted:false});b.active=u.id;b.side=0;b.phase='aim';a.actorBoundary=u.id;if(goal==='investigation-record')A.tick(a,0);else A.use(a,m);return a.profile.honroFieldCargo;}''',[goal,cls]);assert f'{stage}:{goal}'in result;proof=result
  page.evaluate(SETUP,28);page.evaluate('(p)=>HonroApp.profile.honroFieldCargo=p',proof)
  page.evaluate('''()=>{const a=HonroApp,b=a.engine.b,A=HonroAct3;a.checkMission=()=>false;for(const u of b.units)if(u.side===1){u.dead=true;u.hp=0;}for(const s of A.steps(b)){if(s.id==='party-reunion')break;A.memory(b).done[s.id]=true;}const m=b.honroMarkers.find(m=>m.id==='party-reunion');for(const [i,u]of b.units.filter(u=>u.side===0&&!u.summoned).entries())Object.assign(u,{x:m.x-100+i*50,y:m.y,vx:0,vy:0});a.actorBoundary=b.active;A.tick(a,0);a.startQueuedStory();}''')
  page.wait_for_function('Object.keys(HonroEvidenceQuests.field(HonroApp.engine.b).cargo).length===2&&Object.values(HonroEvidenceQuests.field(HonroApp.engine.b).cargo).every(q=>q.phase==="laid")');page.screenshot(path=str(OUT/f'{tag}-28-compared.png'));page.wait_for_function('Object.values(HonroEvidenceQuests.field(HonroApp.engine.b).cargo).every(q=>q.phase==="carry")')
  actual=page.evaluate('HonroEvidenceQuests.field(HonroApp.engine.b).cargo');assert set(actual)==set(proof)
  for key,q in proof.items():assert actual[key]['origin']==q['origin']and actual[key]['proof']==q['proof']and actual[key]['ownerClass']==q['ownerClass']
  rows.append({'viewport':tag,'realAcquisitions':list(proof),'serializedAcrossChapters':True,'realCueComparisonAndRepack':True});ctx.close()
 browser.close()
(OUT/'reunion-browser.json').write_text(json.dumps({'passed':True,'rows':rows,'scope':__doc__},ensure_ascii=False,indent=2));print('PASS',rows)
