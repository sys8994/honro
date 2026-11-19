import base64,hashlib,json,os,pathlib,sys,urllib.parse
from playwright.sync_api import sync_playwright
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
OBSERVE="""({expected,assets})=>{
 const a=HonroApp,e=a.engine,b=e.b,d=b.honroMap.act5,s=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===42);
 if(b.honroStage!==42||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||!HonroAct5.active(b))throw Error('Not actual Act5 campaign');
 if(b.round!==1||b.honroState.act5?.step!==0||b.phase!=='aim')throw Error('Entry phase drift');
 const heroes=b.units.filter(u=>u.side===0&&!u.summoned),foes=b.units.filter(u=>/^a5-foe-/.test(u.id)),npcs=b.units.filter(u=>u.honroAct5Escort);
 if(heroes.length!==4||foes.length!==26||npcs.length!==3||foes.filter(u=>u.honroAct5Reserve).length!==3)throw Error('Official roster mismatch');
 const compiled=HonroMaps.compile(s,HONRO_PROJECT),j=x=>JSON.stringify(x),n=t=>({id:t.id,vertices:t.vertices,oneWay:t.oneWay,mat:t.mat});
 const id='a5-device-0', rest=ts=>ts.filter(t=>t.id!==id);
 const terrain=b.terrain.map(n),world=b.honroWorldTerrain?.map(n);
 if(j(terrain)!==j(rest(compiled.terrain).map(n))||j(world)!==j(rest(compiled.worldTerrain).map(n))||
    !HonroTerrainDomain.active(b)||b.terrain.length!==4||world.length!==4||s.elements.length!==assets.length)throw Error('Official combined geography did not mount; only the exact migrated quest device is excluded');
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
 if(JSON.stringify((b.honroLandmarks||[]).map(l=>[l.asset?.id,l.layer,l.collisionIds?.length||0]))!==JSON.stringify(assets))throw Error('Canonical vector landmark membership mismatch');
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
EXPECTED_SHA='f4ef8f67dd560bffe675b3536c3ece1904b4a354d1fb555145732e2000ab4afe'
FRAME="""async ({camera, ids, source})=>{
 const a=HonroApp,e=a.engine,b=e.b,s=a.scene, project=HONRO_PROJECT.stages.find(z=>z.metadata?.stageId===42);
 const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
 const mismatch=['id','width','height','playBounds','terrainBounds','terrainDomainVersion','terrains','materials'].filter(k=>JSON.stringify(stable(project[k]))!==JSON.stringify(stable(source[k])));
 if(mismatch.length)throw Error('Loaded nonvisual geography differs: '+mismatch.join(','));
 for(const id of ids){const asset=HONRO_PROJECT.library.find(z=>z.id===id);if(!asset?.vector||asset.collision?.length||HonroVectorArt.validate(asset.vector).length)throw Error('Browser vector asset fails validation: '+id);}
 const j=x=>JSON.stringify(x),same=(a,b)=>j(a)===j(b);
 const narrow=t=>[t.id,t.vertices,t.mat,t.oneWay,t.hp,t.maxHp];
 const beforeState=()=>({turn:[b.round,b.phase,b.honroState.act5.step,b.active],units:b.units.map(u=>[u.id,u.x,u.y,u.hp,u.dead,u.moveLeft]),terrain:b.terrain.map(narrow),world:b.honroWorldTerrain.map(narrow),targets:b.honroQuestTargets.map(narrow)});
 const before=beforeState(),fields=['x','y','scale','manual','time','walkTime','storyFrame','storyTween','goalFocus','focusId','speakerId','_honroTime','weatherX'],old=Object.fromEntries(fields.map(k=>[k,s[k]]));
 const counts=Object.fromEntries(ids.map(id=>[id,0])),V=HonroVectorArt,draw=V.draw;
 const hash=async str=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str)))).map(v=>v.toString(16).padStart(2,'0')).join('');
 let result;
 try{
  Object.assign(s,{x:camera[0],y:camera[1],scale:camera[2],manual:true,time:0,walkTime:0,weatherX:0,storyFrame:null,storyTween:null,goalFocus:null,focusId:null,speakerId:null});
  HonroBounds.constrain(s,b);
  V.draw=function(ctx,asset,...rest){const ok=draw.call(this,ctx,asset,...rest);if(ok&&ids.includes(asset?.id))counts[asset.id]++;return ok};
  s.render(e,0,a.selected,a.power,false,0,true);
  const canvas=s.canvas,rect=canvas.getBoundingClientRect();
  result={actual:[s.x,s.y,s.scale],requested:camera,viewport:[rect.width,rect.height],world:HonroBounds.viewport(s,rect.width,rect.height),dpr:devicePixelRatio,clock:s._honroTime??null,far:HonroAuthoredFarArt.frames(s,rect.width,rect.height,b),
    png:canvas.toDataURL('image/png'),assetVectorDraws:counts,cache:{tiles:s._cacheStats?.domainTileBuilds??0,hits:s._cacheStats?.worldHits??0}};
 }finally{V.draw=draw;Object.assign(s,old);}
 if(!same(before,beforeState()))throw Error('Visual capture unexpectedly changed battle fields');
 result.battleDigest=await hash(j(before));return result;
}"""
CONTACTS="""({rows})=>{
 const b=HonroApp.engine.b;
 return rows.map(p=>{
  const t=b.terrain.find(x=>x.id===p.owner);
  if(!t)throw Error('Missing exact physical owner '+p.owner);
  const f=HONRO_CORE.terrainSurfaces(t,p.x).filter(v=>Math.abs(v.y-p.supportY)<=1e-6);
  return {path:p.path,x:p.x,owner:p.owner,sourceY:p.y,groundY:f.length?f[0].y:null};
 });
}"""
here=pathlib.Path(__file__).resolve().parent
base=json.loads((here/'official-qa-stage.json').read_bytes())
packet=json.loads((here/'isolated-packet.json').read_bytes())
evidence=pathlib.Path(sys.argv[1]); aurl,burl=sys.argv[2:4]
for u,p in [(aurl,8884),(burl,8885)]:
 x=urllib.parse.urlparse(u);assert x.hostname=='127.0.0.1' and x.scheme=='http' and x.port==p and x.path=='/HONRO.html'
assert not (evidence/'scene-ab.json').exists()
views=[('01-entry',[560,865,.66]),('02-main',[1500,890,.66]),('03-transfer',[2530,675,.66]),('04-rescue',[3210,660,.66]),('05-drum',[4550,330,.66]),('06-gate',[6000,565,.66]),('07-overview',[3250,880,1280/6800]),('08-drum-direct',[4653,310,1.2]),('09-measure-west-edge',[35,980,.66])]
out={'frames':{},'classification':'observational actual Game canvas in prepared ordinary entry state, not traversal or production','knownUnapproved':['west lookout geometry retained and floating risk not waived','missing late fort/gate art and portions of center/exterior materials','stock far unchanged','R6 art diagnostic, not end-to-end clear']}
def dump():(evidence/'scene-ab.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
with sync_playwright() as pw:
 b=pw.chromium.launch(headless=True,executable_path=os.environ.get('HONRO_CHROME') or None)
 for arm,url,assets in [('A',aurl,[]),('B',burl,[[e['assetId'],e['layer'],0] for e in packet['stage']['elements']])]:
  expect=json.loads((evidence/f'{arm}-source-invariants.json').read_bytes())
  assert expect['checks']==46 and expect['othersUnchanged']
  ctx=b.new_context(viewport={'width':1280,'height':800},device_scale_factor=1)
  ctx.add_init_script("Storage.prototype.setItem=function(){throw Error('QA persistent storage blocked')};")
  p=ctx.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)[:400]))
  phase='navigation'
  try:
   p.goto(url,wait_until='domcontentloaded');p.wait_for_function('!!globalThis.HonroApp && !!globalThis.HonroCampaignLoader',timeout=90000)
   phase='normal-campaign-launch'; launch=p.evaluate(SETUP)
   p.wait_for_function('HonroApp.engine?.b?.honroStage===42 && HonroApp.stage?.id===42 && HonroApp.screen==="battle"',timeout=30000)
   phase='normal-intro-input';p.bring_to_front()
   for i in range(24):
    if not p.evaluate('!!HonroApp.dialogue'):break
    p.keyboard.press('Space');p.wait_for_timeout(90)
   p.wait_for_function('HonroApp.canInput() && !HonroApp.dialogue',timeout=17000)
   phase='wait-stock-far-ready'
   p.wait_for_function('HonroAuthoredFarArt.ready(42, null, HonroApp.engine.b)',timeout=20000)
   phase='exact-46'
   p.screenshot(path=str(evidence/f'{arm}-ordinary-entry.png'))
   start=p.evaluate(OBSERVE,{'expected':expect,'assets':assets})
   contact=p.evaluate(CONTACTS,{'rows':expect['bindings']})
   assert len(contact)==46 and all(q['groundY'] is not None for q in contact)
   record=out['frames'][arm]={'launch':launch,'start':start,'contacts':contact,'views':{}}
   dump()
   for label,camera in views:
    phase=label
    f=p.evaluate(FRAME,{'camera':camera,'ids':[a[0] for a in assets],'source':base})
    bits=base64.b64decode(f.pop('png').split(',',1)[1],validate=True)
    (evidence/f'{arm}-{label}.png').write_bytes(bits)
    f['pngSHA256']=hashlib.sha256(bits).hexdigest();record['views'][label]=f
    dump()
   phase='actual-normal-D-separate'
   p.keyboard.down('KeyD')
   try:p.wait_for_function('x=>HonroApp.engine.active.x>=x+34',arg=start['spawn']['x'],polling='raf',timeout=4000)
   finally:p.keyboard.up('KeyD')
   finish=p.evaluate(OBSERVE,{'expected':expect,'assets':assets});record['D']=finish
   p.screenshot(path=str(evidence/f'{arm}-actual-D.png'))
   assert 34<=finish['spawn']['x']-start['spawn']['x']<=120
   assert finish['spawn']['ground']==start['spawn']['ground']=='MAIN_ESCORT_C_FULL' and finish['spawn']['id']==start['spawn']['id']
   assert finish['spawn']['move']<start['spawn']['move'] and finish['spawn']['hp']==start['spawn']['hp'] and finish['alive']==start['alive']
   assert not errors,errors
  except Exception as e:
   out['failure']={'arm':arm,'phase':phase,'error':str(e),'pageErrors':errors};p.screenshot(path=str(evidence/f'{arm}-first-failure.png'));raise
  finally:
   dump();ctx.close()
 arms=out['frames'];assert arms['A']['start']==arms['B']['start']
 assert arms['A']['contacts']==arms['B']['contacts']
 for label,_ in views:
  a=arms['A']['views'][label];v=arms['B']['views'][label]
  assert all(a[k]==v[k] for k in ['actual','requested','viewport','world','dpr','battleDigest','clock','far']),(label,a,v)
  assert not a['assetVectorDraws']
 for aid,*_ in assets:
  assert sum(q['assetVectorDraws'][aid] for q in arms['B']['views'].values())>0,aid
 out['verified']={'matchedSceneFrames':len(views),'runtimeContacts':46,'actualDArms':['A','B'],'production':False};dump();b.close()
