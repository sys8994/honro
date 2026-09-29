"""Authored content must execute in the shipped game, with campaign saves isolated."""
import json
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch

checks=[];errors=[]
def check(name,ok,detail=None):
    assert ok,(name,detail)
    checks.append({'name':name,'detail':detail});print('PASS',name,detail or '',flush=True)

with sync_playwright() as p:
    browser=launch(p);page=browser.new_page(viewport={'width':1365,'height':768})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto((ROOT/'HONRO.html').as_uri());page.wait_for_function('window.HonroApp')
    project=page.evaluate('''()=>{const a=HonroApp;a.frame=()=>{};a.profile.record.push({place:'Sentinel',text:'Keep campaign'});a.persist();
      const p=HonroMaps.clone(HONRO_PROJECT),s=HonroMaps.emptyStage('authored','Authored acceptance',1800,1200);
      s.terrains=[{id:'floor',type:'solid',points:[{x:0,y:900},{x:1800,y:900},{x:1800,y:1400},{x:0,y:1400}],baseMaterial:'rock',breakable:false}];
      s.units=[HonroUnits.record('archer','hero',220,900),HonroUnits.record('hound','foe',1300,900)];
      p.stages=[s];p.activeStageId=s.id;
      return HonroCommands.apply(HonroMaps.normalize(p),[
        {op:'createTrigger',id:'wind-trigger',x:220,y:900,action:{type:'wind',value:7},lines:[['설오','길이 열렸다.']]},
        {op:'createObjective',id:'trigger-goal',type:'flag',flag:'event:wind-trigger'},
        {op:'createEncounter',id:'guards',unitIds:['foe'],behavior:'stationary'},
        {op:'unit.update',id:'hero',values:{levelOverride:8,rank:3}},
        {op:'asset.update',id:'rock_small',values:{breakable:true,interactionType:'inspect',collisionMode:'independent',sockets:[{id:'use',x:-180,y:0}]}},
        {op:'placeElement',id:'interactive-rock',assetId:'rock_small',x:400,y:900,snap:false},
        {op:'createObjective',id:'socket-goal',type:'interact',targetId:'interactive-rock:socket:use'}]);}''')
    original=page.evaluate('JSON.stringify(HonroApp.profile)');storage=page.evaluate('JSON.stringify(localStorage)')
    path=ROOT/'.test-output/authored-map.json';path.write_text(json.dumps(project,ensure_ascii=False),encoding='utf-8')
    page.locator('#map-import').set_input_files(str(path));page.wait_for_function('HonroApp.customMap?.stageId==="authored"')
    check('Game imports canonical JSON through file input',page.evaluate('HonroApp.engine.b.honroAuthoredId')=='authored')
    check('Level and rank both apply to real hero',page.evaluate('(()=>{const u=HonroApp.engine.unit("hero");return u.level===8&&u.ranks.A01===3})()'))
    check('Encounter behavior controls actual enemy',page.evaluate('HonroApp.engine.unit("foe").fixed'))
    page.evaluate('HonroApp.turnNotice=null;HonroApp.missionTick(.016)')
    check('Authored trigger executes immediately during aim',page.evaluate('HonroApp.engine.b.wind===7&&HonroApp.engine.b.honroState.flags["event:wind-trigger"]&&!HonroApp.engine.b.honroState.pendingEvents.includes("wind-trigger")'))
    check('Authored dialogue immediately pauses input',page.evaluate('!!HonroApp.dialogue&&!HonroApp.canInput()'))
    page.evaluate('''()=>{const a=HonroApp;if(a.dialogue)HonroStory.finish(a);a.engine.b.honroState.storyQueue=[];a.turnNotice=null;a.engine.b.phase='aim';a.engine.b.side=0;a.engine.b.active='hero';}''')
    result=page.evaluate('''()=>{const a=HonroApp,m=a.engine.b.honroMarkers.find(m=>m.id==='interactive-rock:socket:use');return {x:m.x,y:m.y,used:HonroInteractions.use(a,m),flag:a.engine.b.honroState.flags['interact:'+m.id]};}''')
    check('Transformed element socket uses actual interaction',result['used'] and result['flag'] and result['x']==220,result)
    check('Authored objectives resolve through game mission state',page.evaluate('HonroObjectives.state(HonroApp.engine.b,HonroApp.stage).complete'))
    result=page.evaluate('''()=>{const a=HonroApp,e=a.engine,s=a.scene;s.manual=true;s.render(e,0);const before=s.renderCacheStats().worldBuilds,t=e.b.terrain.find(t=>t.honroElementId==='interactive-rock');e.damageTerrain(t,t.hp+1);s.render(e,0);return{broken:t.broken,before,after:s.renderCacheStats().worldBuilds};}''')
    check('Element destruction invalidates shared world cache',result['broken'] and result['after']>result['before'],result)
    page.evaluate('HonroApp.launch()')
    check('Retry restarts the imported map',page.evaluate('HonroApp.engine.b.honroAuthoredId==="authored"&&!HonroApp.engine.b.honroState.flags["event:wind-trigger"]'))
    check('Imported play never persists into campaign storage',page.evaluate('JSON.stringify(localStorage)')==storage)
    page.evaluate('HonroApp.showTitle()')
    check('Leaving imported play restores original profile',page.evaluate('JSON.stringify(HonroApp.profile)')==original)
    check('Leaving imported play releases custom map',page.evaluate('HonroApp.customMap===null&&HonroApp.engine===null'))
    # Old Workshop v1/v2 data is upgraded once; unsupported geometry is never reduced.
    old=page.evaluate('''p=>{p.version=1;delete p.schema;for(const s of p.stages){delete s.metadata;delete s.initialState;delete s.encounters;delete s.objectives;}const n=HonroMaps.normalize(p);return {version:n.version,geometry:JSON.stringify(p.stages[0].terrains)===JSON.stringify(n.stages[0].terrains),errors:HonroMaps.validate(n).filter(x=>x.level==='err')};}''',project)
    check('Legacy Workshop normalization preserves geometry',old['version']==3 and old['geometry'] and not old['errors'],old)
    check('No authored browser exceptions',not errors,errors)
    browser.close()
(ROOT/'_local/reports/authored.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
print('AUTHORED PASS',len(checks))
