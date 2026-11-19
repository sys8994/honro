"""Review-gated local-only first measurement. Prepared profile, NOT natural campaign play."""
import argparse,json,pathlib,urllib.parse,os,traceback
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('url');p.add_argument('output',type=pathlib.Path);p.add_argument('source_invariants',type=pathlib.Path);a=p.parse_args()
u=urllib.parse.urlparse(a.url);assert u.hostname in ('127.0.0.1','localhost','::1') and u.scheme=='http'
assert not a.output.exists(),'Do not overwrite evidence'
SETUP='''async()=>{
 await HONRO_APP_READY;
 await HonroCampaignLoader.ensureStage(42);
 const s=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===42);
 if(!s||s.pending)throw Error('Stage42 not loaded by actual loader');
 const a=HonroApp;a.stopBattle();a.close();
 const template=HonroMaps.profileFor(s),profile=HonroProfileStore.fresh();
 const roster=HonroStageRules.stageParty(42);
 if(JSON.stringify(roster)!==JSON.stringify(['archer','mage','knight','occultist']))throw Error('Unexpected party');
 profile.recruited=[...roster];profile.party=[...roster];
 for(const cls of roster){const xp=template.heroes[cls].xp;if(!Number.isFinite(xp))throw Error('Invalid XP');profile.heroes[cls].xp=xp;HONRO_CORE.autoTrain(profile.heroes[cls],cls);HONRO_CORE.sanitizeLoadout(profile,cls);}
 // Test-only RAM adapter on this disposable App instance, not global source or real save.
 a.persist=()=>false;a.profileStore.save=candidate=>{if(!candidate.equipment)throw Error('Missing fresh equipment shell');return true;};
 a.profile=profile;a.normalProfile=profile;
 for(const id of HONRO_CONTENT.stages[41].requires)profile.cleared[id]={visits:1,rounds:18};
 if(!a.campaignReady()||!a.isOpen(HONRO_CONTENT.stages[41])||!HonroSplitCampaign.allowLaunch(a,42,false))throw Error('Entry gates not ready');
 a.launch(42);
 return {setup:'fresh shell + stock profileFor XP; prepared predecessor clear; RAM-only saves; NOT natural play',party:roster,levels:roster.map(c=>({id:c,xp:a.profile.heroes[c].xp,level:HONRO_CORE.levelOf(a.profile.heroes[c])})),equipmentReady:!!a.profile.equipment};
}'''
OBSERVE='''()=>{
 const a=HonroApp,b=a.engine.b,d=b.honroMap.act5,s=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===42);
 if(b.honroStage!==42||b.honroCustom||b.honroMapOrigin!=='campaign'||!HonroAct5.active(b))throw Error('Not actual Act5 campaign');
 const heroes=b.units.filter(u=>u.side===0&&!u.summoned), foes=b.units.filter(u=>/^a5-foe-/.test(u.id)), npcs=b.units.filter(u=>u.honroAct5Escort);
 if(heroes.length!==4||foes.length!==26||npcs.length!==3)throw Error('Roster mismatch');
 const ground=b.terrain.find(t=>t.id==='stage42-g-engineering-ground'),world=b.honroWorldTerrain?.find(t=>t.id==='stage42-g-engineering-ground');
 if(!ground||!world||ground.vertices.length!==76||world.vertices.length!==100||b.honroPlayBounds.bottom!==4420)throw Error('Not the G domain');
 const touch=(x,y)=>{const q=HonroMapEngine.surfaceY(b.terrain,x,y);return q?{x:q.x,y:q.y}:null};
 return {label:'initial scene contact/wake observation only; no movement or full play',
 stage:b.honroStage,origin:b.honroMapOrigin,custom:b.honroCustom,phase:b.phase,round:b.round,step:b.honroState.act5?.step,dialogue:!!a.dialogue,canInput:a.canInput(),groundNodes:ground.vertices.length,worldNodes:world.vertices.length,
 counts:{heroes:heroes.length,foes:foes.length,npcs:npcs.length,reserve:foes.filter(u=>u.honroAct5Reserve).length},
 source:{units:s.units,terrains:s.terrains,anchors:s.anchors,design:{act5:{sites:d.sites,groups:d.groups,required:d.required,flow:d.flow,waves:d.waves,wakeGroups:d.wakeGroups,exitParty:d.exitParty}},markers:s.markers},
 runtime:{terrain:b.terrain,world:b.honroWorldTerrain,play:b.honroPlayBounds,domain:b.honroTerrainBounds,flow:d.flow,required:d.required,waves:d.waves,wakes:d.wakeGroups},
 contacts:b.units.map(u=>({id:u.id,x:u.x,y:u.y,spawnX:u.spawnX,spawnY:u.spawnY,dead:u.dead,awake:u.awake,group:u.group,airborne:!!u.airborne,hp:u.hp,withinPlay:u.x>=0&&u.x<=b.width&&u.y>=0&&u.y<=b.height,grounded:a.engine.grounded(u),ground:touch(u.x,u.y),spawnGround:touch(u.spawnX,u.spawnY)})),
 sites:Object.entries(d.sites).map(([key,p])=>({key,...p,support:touch(p.x,p.y),partyNear:heroes.map(u=>({id:u.id,dx:Math.abs(u.x-p.x),dy:Math.abs(u.y-p.y),airborne:!!u.airborne,reach260:Math.abs(u.x-p.x)<=260&&Math.abs(u.y-p.y)<=115&&!u.airborne}))})),
 wake:foes.map(u=>({id:u.id,group:u.group,awake:u.awake,dead:u.dead,eligible1600:HonroAct5.wakeEligible(b,u,heroes,1600)??null,eligibleOther:HonroAct5.wakeEligible(b,u,heroes,1601)??null,distances:heroes.map(h=>({id:h.id,dx:h.x-u.x,dy:h.y-u.y,d:Math.hypot(h.x-u.x,(h.y-u.y)*.72)}))})),
 markers:b.honroMarkers,objectives:b.honroObjectives,state:HonroAct5.state(b)};
}'''
a.output.mkdir(parents=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('HONRO_CHROME') or None);context=browser.new_context(viewport={'width':1280,'height':800});page=context.new_page();errors=[];phase='navigate';result={}
 context.add_init_script("Storage.prototype.setItem=function(){throw Error('QA persistent storage blocked')};")
 page.on('pageerror',lambda e:errors.append(str(e)))
 try:
  page.goto(a.url,wait_until='domcontentloaded');page.wait_for_function('!!globalThis.HonroApp && !!globalThis.HonroCampaignLoader',timeout=90000)
  phase='prepared-entry'
  setup=page.evaluate(SETUP);result['setup']=setup
  page.wait_for_function('HonroApp.engine?.b?.honroStage===42 && HonroApp.stage?.id===42 && HonroApp.screen==="battle"',timeout=30000)
  phase='mounted-observation';result['mounted']=page.evaluate(OBSERVE)
  # Close only normal introductory dialogue using the stock story API; not an objective skip.
  phase='normal-intro-transition'
  result['introTransitions']=page.evaluate("()=>{const a=HonroApp,b=a.engine.b,step=b.honroState.act5.step;let n=0;while(a.dialogue&&n<12){HonroStory.finish(a);n++;}if(b!==a.engine.b||b.round!==1||b.honroState.act5.step!==step)throw Error('Unexpected gameplay transition during intro');return {count:n,remaining:!!a.dialogue,step};}")
  page.wait_for_function('HonroApp.canInput() && !HonroApp.dialogue',timeout=15000)
  page.wait_for_timeout(700)
  phase='settled-entry-observation';result['settled']=page.evaluate(OBSERVE)
  assert result['settled']['round']==1 and result['settled']['step']==0,'Not initial approach stage'
  source=json.loads(a.source_invariants.read_text());assert source['checks']==46
  result['sourceChecks']={'checks':46,'othersUnchanged':source['othersUnchanged'],'gameplayRolesUnchanged':source['gameplayRolesUnchanged']}
  # Report actual runtime relocation, including NPC and reserve spawn, not merely desired source y.
  expected={q['id']:q for q in source['placements'] if q['kind']=='unit'}
  result['runtimeContactAssessment']=[]
  for u in result['settled']['contacts']:
   if u['id'] not in expected:continue
   q=expected[u['id']];g=u['ground'];sp=u['spawnGround'];lift={'a5-foe-8':355.46875,'a5-foe-12':209.47265625}.get(u['id'],0)
   result['runtimeContactAssessment'].append({'id':u['id'],'sourceX':q['x'],'sourceY':q['y'],'actualX':u['x'],'actualY':u['y'],'xShift':u['x']-q['x'],'poseResidual':None if not g else u['y']-(g['y']-lift),'spawnPoseResidual':None if not sp else u['spawnY']-(sp['y']-lift),'withinPlay':u['withinPlay'],'grounded':u['grounded'],'reserve':u.get('dead',False)})
  phase='entry-observed-not-combat-or-escort' 
 except Exception as e:
  result['error']=str(e);raise
 finally:
  result['checkpoint']=phase;result['pageErrors']=errors
  try:
   result['readiness']=page.evaluate('()=>({ready:!!globalThis.HonroApp,screen:globalThis.HonroApp?.screen,stage:globalThis.HonroApp?.stage?.id,battle:globalThis.HonroApp?.engine?.b?.honroStage,dialogue:!!globalThis.HonroApp?.dialogue})')
   if result['readiness'].get('battle')==42 and not result['readiness'].get('dialogue'):
    page.screenshot(path=str(a.output/'stage42-only.png'))
  except Exception as e:result['captureError']=str(e)
  (a.output/'initial.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
  context.close();browser.close()
 assert not errors,errors
 print(a.output/'initial.json')
