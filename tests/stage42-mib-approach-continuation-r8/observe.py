import argparse,json,pathlib,urllib.parse,os,traceback
from playwright.sync_api import sync_playwright
from approach import continue_approach
p=argparse.ArgumentParser();p.add_argument('url');p.add_argument('output',type=pathlib.Path);p.add_argument('source_invariants',type=pathlib.Path);a=p.parse_args()
u=urllib.parse.urlparse(a.url);assert u.hostname=='127.0.0.1' and u.scheme=='http' and u.port==8884
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
GEOMETRY_DIAGNOSTIC="""({expected})=>{
 const a=HonroApp,e=a.engine,b=e.b,s=HONRO_PROJECT.stages.find(p=>p.metadata?.stageId===42),
       domain=globalThis.HonroTerrainDomain,c=HonroMaps.compile(s,HONRO_PROJECT),same=(x,y)=>JSON.stringify(x)===JSON.stringify(y),
       narrow=t=>({id:t.id,vertices:t.vertices,oneWay:t.oneWay,mat:t.mat});
 const summarize=t=>({id:t.id,vertices:t.vertices?.length??null,oneWay:t.oneWay??null,mat:t.mat??null,collision:t.honroElementCollision??null,
      bbox:[t.x??null,t.y??null,t.w??null,t.h??null],hp:t.hp??null,maxHp:t.maxHp??null});
 const compare=(live,compiled)=>{
   const result={arrays:[Array.isArray(live),Array.isArray(compiled)],exact:same(live?.map(narrow),compiled?.map(narrow)),
      live:live?.map(summarize)??null,compiled:compiled?.map(summarize)??null,byOwner:[]};
   if(!live||!compiled)return result;
   for(const id of new Set([...live,...compiled].map(t=>t.id))){
      const x=live.find(t=>t.id===id),y=compiled.find(t=>t.id===id),ix=live.indexOf(x),iy=compiled.indexOf(y);
      if(!x||!y){result.byOwner.push({id,liveIndex:ix,compiledIndex:iy});continue;}
      const p=x.vertices??[],q=y.vertices??[];const vertexMismatches=[];
      let count=0,largestNumericDelta=0;
      for(let k=0;k<Math.max(p.length,q.length);k++)if(!same(p[k],q[k])){
        count++;const a=p[k]??null,b=q[k]??null;
        if(a&&b)largestNumericDelta=Math.max(largestNumericDelta,Math.abs(a.x-b.x),Math.abs(a.y-b.y));
        if(vertexMismatches.length<6)vertexMismatches.push({index:k,live:a,compiled:b});
      }
      result.byOwner.push({id,liveIndex:ix,compiledIndex:iy,oneWayExact:x.oneWay===y.oneWay,matExact:x.mat===y.mat,count,largestNumericDelta,vertexMismatches});
   }
   return result;
 };
 const id='a5-device-0',withoutDevice=xs=>xs?.filter(t=>t.id!==id),
       terrain=compare(b.terrain,withoutDevice(c.terrain)),world=compare(b.honroWorldTerrain,withoutDevice(c.worldTerrain));
 const originals=c.terrain.filter(t=>t.id===id),descriptors=(b.honroQuestTargets??[]).filter(t=>t.id===id),
       bodies=b.units.filter(t=>t.id===id), authored=s.objectives.filter(t=>t.targetId===id);
 const observedIDs=b.terrain.map(t=>t.id),expectedIDs=withoutDevice(expected.terrain).map(t=>t.id);
 return {phase:b.phase,round:b.round,step:b.honroState?.act5?.step??null,inputReady:a.canInput(),
   activeActor:{id:e.active?.id??null,x:e.active?.x??null,y:e.active?.y??null},
   stage:{loaded:[s.id,s.metadata?.stageId],live:[b.honroAuthoredId,b.honroStage],origin:b.honroMapOrigin,custom:b.honroCustom},
   checks:{physicalExact:terrain.exact,worldExact:world.exact,domainActive:!!domain?.active(b),
       exactlyFourPhysical:b.terrain.length===4,exactlyOneMigratedSource:originals.length===1,
       exactObjectiveIdentity:authored.length===1&&authored[0].id==='a5-destroy-0'&&authored[0].type==='destroy',
       uniqueLiveDescriptor:descriptors.length===1&&(b.honroQuestTargets??[]).length===1,
       uniqueObjectiveActor:bodies.length===1&&bodies[0].honroObjectiveTarget===true,
       noLoadedElements:s.elements.length===0,expectedIDs:same(observedIDs,expectedIDs)},
   observedIDs,expectedIDs,terrain,world,
   migratedDrum:{source:originals.map(summarize),runtimeDescriptor:descriptors.map(summarize),
     bodies:bodies.map(({id,role,fixed,honroObjectiveTarget,honroType,x,y,h,r,dead,hp,maxHp,attack,moveLeft,side})=>
       ({id,role,fixed,honroObjectiveTarget,honroType,x,y,h,r,dead,hp,maxHp,attack,moveLeft,side})),objectives:authored},
   authored:{elements:s.elements.map(t=>({id:t.id,assetId:t.assetId,layer:t.layer})),
      solids:s.terrains.map(t=>({id:t.id,points:t.points?.length,projected:t.playProjection?.points?.length??null,material:t.baseMaterial??null})),
      bounds:{play:s.playBounds??null,terrain:s.terrainBounds??null,version:s.terrainDomainVersion??null},errors:domain?.validate(s)??null},
   live:{landmarks:(b.honroLandmarks??[]).map(t=>({id:t.id,assetId:t.asset?.id??null,kind:t.kind,layer:t.layer})),
      bounds:{play:b.honroPlayBounds??null,terrain:b.honroTerrainBounds??null,version:b.honroTerrainDomainVersion??null}}};
}"""
OBSERVE="""({expected})=>{
 const a=HonroApp,e=a.engine,b=e.b,d=b.honroMap.act5,s=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===42);
 if(b.honroStage!==42||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||!HonroAct5.active(b))throw Error('Not actual Act5 campaign');
 if(b.round!==1||b.honroState.act5?.step!==0||b.phase!=='aim')throw Error('Entry phase drift');
 const heroes=b.units.filter(u=>u.side===0&&!u.summoned),foes=b.units.filter(u=>/^a5-foe-/.test(u.id)),npcs=b.units.filter(u=>u.honroAct5Escort);
 if(heroes.length!==4||foes.length!==26||npcs.length!==3||foes.filter(u=>u.honroAct5Reserve).length!==3)throw Error('Official roster mismatch');
 const compiled=HonroMaps.compile(s,HONRO_PROJECT),j=x=>JSON.stringify(x),n=t=>({id:t.id,vertices:t.vertices,oneWay:t.oneWay,mat:t.mat});
 const id='a5-device-0', rest=ts=>ts.filter(t=>t.id!==id);
 const terrain=b.terrain.map(n),world=b.honroWorldTerrain?.map(n);
 if(j(terrain)!==j(rest(compiled.terrain).map(n))||j(world)!==j(rest(compiled.worldTerrain).map(n))||
    !HonroTerrainDomain.active(b)||b.terrain.length!==4||world.length!==4||s.elements.length)throw Error('Official combined geography did not mount; only the exact migrated quest device is excluded');
 if(j(b.terrain.map(t=>t.id))!==j(rest(expected.terrain).map(t=>t.id)))throw Error('Loaded geography IDs differ');
 const source=compiled.terrain.filter(t=>t.id===id),sourceWorld=compiled.worldTerrain.filter(t=>t.id===id),
   ds=(b.honroQuestTargets??[]),us=b.units.filter(t=>t.id===id);
 if(source.length!==1||sourceWorld.length!==1||ds.length!==1||us.length!==1)throw Error('Original drum migration owner cardinality mismatch');
 const target=ds[0],body=us[0],q=expected.bindings.find(t=>t.path==='terrains.'+id),
       compare=t=>({...n(t),x:t.x,y:t.y,w:t.w,h:t.h,hp:t.hp,maxHp:t.maxHp,indestructible:t.indestructible});
 if(!target||!q||target.honroQuestTarget!==true||target.broken||target.indestructible||
    j(compare(target))!==j(compare(source[0]))||j(compare(target))!==j(compare(sourceWorld[0]))||
    target.mat!=='wood'||target.hp!==455||target.maxHp!==455||target.w!==54||target.h!==87)
    throw Error('Original drum quest descriptor art or HP mismatch');
 const o=b.honroObjectives.filter(e=>e.targetId===id);
 if(o.length!==1||o[0].id!=='a5-destroy-0'||o[0].label!=='들린 군북'||o[0].type!=='destroy'||
    (d.groups.drum??[]).filter(v=>v===id).length!==1||
    body.honroObjectiveTarget!==true||body.honroType!=='questTarget'||body.role!=='objective'||!body.fixed||body.dead||
    body.side!==1||body.attack!==0||body.h!==87||body.r!==27||body.maxMove!==0||body.moveLeft!==0||
    body.walkSpeed!==0||body.loadout.length!==0||body.hp!==455||body.maxHp!==455||
    body.x!==target.x+target.w/2||body.y!==target.y+target.h||Math.abs(body.x-q.x)>1e-7||Math.abs(body.y-q.y)>1e-7||
    e.unit(id)!==body||HonroQuestTargets.blocker(b,body)!=='')throw Error('Original drum fixed attackable target mismatch');
 const support=HonroMapEngine.surfaceY(b.terrain,body.x,q.supportY);
 if(!support||support.t.id!==q.owner||Math.abs(support.y-q.supportY)>1e-7)
    throw Error('Original drum quest target not seated on exact named upper support');
 if(j(d.links)!==j(expected.links))throw Error('Stock ladder link metadata drift');
 for(const k of ['flow','groups','required','wakeGroups','waves','exitParty','encounterVersion'])
   if(j(d[k])!==j(s.design.act5[k]))throw Error('Official runtime act5 structure drift: '+k);
 if(b.honroLandmarks?.some(l=>l.asset?.id==='act5:near:42'))throw Error('Legacy stage terrain painted in QA');
 const activeMarkers=b.honroMarkers.filter(m=>expected.markers.some(z=>z.id===m.id))
   .map(m=>({id:m.id,x:m.x,y:m.y,action:m.action}));
 if(j(activeMarkers)!==j(expected.markers.map(m=>({id:m.id,x:m.x,y:m.y,action:m.action}))))
   throw Error('Original ladder markers did not mount');

 const bind=new Map(expected.bindings.filter(q=>q.path.startsWith('units.')).map(q=>[q.id,q]));
 const boundContact=(f,bindX)=>{
   const q=HonroMapEngine.surfaceY(b.terrain,f.x,bindX);
   return q?{owner:q.t.id,y:q.y}:null;
 };
 const observed=b.units.filter(u=>u.id!==id).map(u=>{
   const q=bind.get(u.id);
   if(!q)throw Error('Unexpected active actor '+u.id);
   const now={x:u.x,y:u.y},sp={x:u.spawnX,y:u.spawnY};
   const floor=boundContact(now,now.y+q.lift),spawnFloor=boundContact(sp,sp.y+q.lift);
   const grounded=e.grounded(u);
   const all=[u.x,u.y,u.spawnX,u.spawnY];
   const physical=!!(floor&&spawnFloor&&all.every(Number.isFinite)&&u.x>=0&&u.x<=b.width&&u.y>=0&&u.y<=b.height);
   return {id:u.id,kind:u.cls,side:u.side,awake:u.awake,dead:u.dead,reserve:!!u.honroAct5Reserve,grounded,
     authored:q,actual:now,actualSpawn:sp,ground:floor,spawnGround:spawnFloor,withinPlay:physical,hp:u.hp,
     sourceXShift:now.x-q.x,sourceYShift:now.y-q.y,footResidual:floor?now.y-(floor.y-q.lift):null};
 });
 const controlled=e.active,contact=e.contactSurface(controlled.x,controlled.y-4,controlled.y+4);
 return {stage:b.honroStage,origin:b.honroMapOrigin,custom:b.honroCustom,phase:b.phase,round:b.round,step:b.honroState.act5.step,
    counts:[heroes.length,foes.length,npcs.length],alive:observed.filter(u=>!u.dead).map(u=>u.id),waveStatus:structuredClone(b.honroState.act5.waves??{}),
    preparedPositions:observed,spawn:{id:controlled.id,x:controlled.x,y:controlled.y,ground:contact?.t?.id??null,hp:controlled.hp,move:controlled.moveLeft},
    geometry:{terrain:terrain.map(t=>[t.id,t.vertices.length]),world:world.map(t=>[t.id,t.vertices.length]),domain:true},
    wakes:foes.map(u=>({id:u.id,awake:u.awake,eligible1600:HonroAct5.wakeEligible(b,u,heroes,1600)??null})),
    links:d.links,drum:{id:body.id,hp:body.hp,maxHp:body.maxHp,mat:target.mat,role:body.role,kind:body.honroType,
     geometry:compare(target),bounds:[body.x,body.y,body.r,body.h],support:{id:support.t.id,y:support.y},
     unitTargetRegistered:true,stockBlocker:'',inGeographicCollisionLists:false,firedAt:false},
    markers:b.honroMarkers.filter(m=>expected.markers.some(z=>z.id===m.id)).map(m=>({id:m.id,x:m.x,y:m.y,action:m.action})),
    actualInput:a.canInput()};
}"""
a.output.mkdir(parents=True)
expect=json.loads(a.source_invariants.read_bytes());assert expect['checks']==46 and expect['othersUnchanged']
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('HONRO_CHROME') or None)
 ctx=browser.new_context(viewport={'width':1280,'height':800});page=ctx.new_page();errors=[]
 ctx.add_init_script("Storage.prototype.setItem=function(){throw Error('QA persistent storage blocked')};")
 page.on('pageerror',lambda e:errors.append(str(e)[:400]))
 phase='navigate';res={}
 def dump():(a.output/'entry-proof.json').write_text(json.dumps(res,ensure_ascii=False,indent=2))
 def observe():return page.evaluate(OBSERVE,{'expected':expect})
 try:
  page.goto(a.url,wait_until='domcontentloaded');page.wait_for_function('!!globalThis.HonroApp && !!globalThis.HonroCampaignLoader',timeout=90000)
  phase='normal-campaign-launch';res['setup']=page.evaluate(SETUP)
  page.wait_for_function('HonroApp.engine?.b?.honroStage===42 && HonroApp.stage?.id===42 && HonroApp.screen==="battle"',timeout=30000)
  phase='normal-intro-input';page.bring_to_front()
  for n in range(24):
   if not page.evaluate('!!HonroApp.dialogue'):break
   page.keyboard.press('Space')
   page.wait_for_timeout(90)
  page.wait_for_function('HonroApp.canInput() && !HonroApp.dialogue',timeout=17000)
  page.wait_for_timeout(450)
  phase='entry-prepared-positions'
  page.screenshot(path=str(a.output/'01-official-entry.png'))
  res['geometryDiagnostic']=page.evaluate(GEOMETRY_DIAGNOSTIC,{'expected':expect});dump()
  failed=[k for k,v in res['geometryDiagnostic']['checks'].items() if not v]
  assert not failed,'Official combined geometry: '+', '.join(failed)
  before=observe();res['before']=before;dump()
  assert before['actualInput'] and before['spawn']['ground']=='MAIN_ESCORT_C_FULL' and before['spawn']['id']=='p-archer'
  bad=[q for q in before['preparedPositions'] if not q['withinPlay']
      or (q['authored']['lift']==0 and not q['reserve'] and (q['ground']['owner']!=q['authored']['owner'] or abs(q['footResidual'])>5))]
  res['unexpectedGroundRelocations']=bad;dump()
  # A reserve or flying pose is reported, but need not be grounded yet.
  assert not bad,'Official prepare moved expected standing actor to another owner or invalid foot'
  phase='normal-input-D'
  page.keyboard.down('KeyD')
  try:page.wait_for_function("""x=>HonroApp.engine.active.x>=x+34""",arg=before['spawn']['x'],polling='raf',timeout=4000)
  finally:page.keyboard.up('KeyD')
  after=observe();res['after']=after
  assert after['stage']==42 and after['spawn']['id']==before['spawn']['id'] and 34<=after['spawn']['x']-before['spawn']['x']<=120
  assert after['spawn']['ground']=='MAIN_ESCORT_C_FULL' and after['spawn']['hp']==before['spawn']['hp']
  assert after['spawn']['move']<before['spawn']['move'] and before['alive']==after['alive'] and before['waveStatus']==after['waveStatus']
  assert not errors,errors
  page.screenshot(path=str(a.output/'02-official-first-D.png'))
  phase='actual-normal-approach-shot'
  continue_approach(page,a.output,res,dump)
  assert not errors,errors
  res['passed']=True;phase='official-approach-additional-grounded-S03-only'
 except Exception as e:
  res['passed']=False;res['error']=str(e)
  try:page.screenshot(path=str(a.output/'09-first-failure.png'))
  except Exception:pass
  raise
 finally:
  res['checkpoint']=phase;res['pageErrors']=errors;dump();ctx.close();browser.close()
