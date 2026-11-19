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
FRAME="""async ({camera, ids, source, gateCheck})=>{
 const a=HonroApp,e=a.engine,b=e.b,s=a.scene, project=HONRO_PROJECT.stages.find(z=>z.metadata?.stageId===42);
 const stable=x=>Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;
 const mismatch=['id','width','height','playBounds','terrainBounds','terrainDomainVersion','terrains','materials'].filter(k=>JSON.stringify(stable(project[k]))!==JSON.stringify(stable(source[k])));
 if(mismatch.length)throw Error('Loaded nonvisual geography differs: '+mismatch.join(','));
 for(const id of ids){const asset=HONRO_PROJECT.library.find(z=>z.id===id);if(!asset?.vector||asset.collision?.length||HonroVectorArt.validate(asset.vector).length)throw Error('Browser vector asset fails validation: '+id);}
 const j=x=>JSON.stringify(x),same=(a,b)=>j(a)===j(b);
 const narrow=t=>[t.id,t.vertices,t.mat,t.oneWay,t.hp,t.maxHp];
 const beforeState=()=>({turn:[b.round,b.phase,b.honroState.act5.step,b.active],units:b.units.map(u=>[u.id,u.x,u.y,u.hp,u.dead,u.moveLeft]),wind:b.wind,terrain:b.terrain.map(narrow),world:b.honroWorldTerrain.map(narrow),targets:b.honroQuestTargets.map(narrow)});
 const site=project.design.act5.sites.exit, foe=b.units.find(u=>u.id==='a5-foe-22');
 const support=HonroMapEngine.surfaceY(b.terrain,site.x,site.y);
 if(!foe||foe.dead||Math.abs(foe.x-6277.83)>1e-6||Math.abs(site.x-6227.05)>1e-6||site.y!==650||!support||support.t.id!=='MAIN_ESCORT_C_FULL')
   throw Error('Exact gate/foe/route identity drift');
 const before=beforeState(),fields=['x','y','scale','manual','time','walkTime','storyFrame','storyTween','goalFocus','focusId','speakerId','_honroTime','_honroClouds','weatherX'],old=Object.fromEntries(fields.map(k=>[k,{own:Object.hasOwn(s,k),value:s[k]}]));
 const counts=Object.fromEntries(ids.map(id=>[id,0])),V=HonroVectorArt,draw=V.draw;
 const gateId='qa-f4ef-extinguished-gate', actualGate=ids.includes(gateId), order=[], nativeUnit=s.unit, oldUnit=Object.hasOwn(s,'unit');
 let foePaint=null, aperture=null;
 if(actualGate&&gateCheck){
   const asset=HONRO_PROJECT.library.find(z=>z.id===gateId);const mark=b.honroLandmarks.find(l=>l.asset?.id===gateId);
   if(mark?.layer!=='structural-back'||mark.collisionIds?.length)throw Error('Gate must be collision-free structural-back');
   const cv=document.createElement('canvas');cv.width=484;cv.height=247;const cc=cv.getContext('2d');
   if(!draw.call(V,cc,asset,{x:-5865,y:-423,scale:1}))throw Error('Native gate alpha audit did not draw');
   const count=(x,y,w,h)=>{const p=cc.getImageData(x-5865,y-423,w,h).data;return p.filter((a,i)=>i%4===3&&a>0).length;};
   aperture={contract:{x:6170,y:512,width:110,height:130},paintedPixels:count(6170,512,110,130),
     leftPostPainted:count(6128,535,23,53),rightPostPainted:count(6294,535,23,53)};
   if(aperture.paintedPixels!==0||aperture.leftPostPainted<=0||aperture.rightPostPainted<=0)
      throw Error('Native gate does not preserve physical opening '+j(aperture));
 }
 const hash=async str=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str)))).map(v=>v.toString(16).padStart(2,'0')).join('');
 const td=HonroTimeOfDay, entry=td.entry(b), target=td.targetMinutes(entry,b.round), scope=[b.honroStage,b.round];
 if(!entry||entry.clock===false||entry.sky===false||scope[0]!==42||scope[1]!==1||target!==1080||!Number.isFinite(b.wind))
   throw Error('Unexpected stock round-one time/weather source');
 let result;
 try{
  Object.assign(s,{x:camera[0],y:camera[1],scale:camera[2],manual:true,time:0,walkTime:0,weatherX:0,_honroTime:undefined,_honroClouds:{x:0,v:0,at:Infinity},storyFrame:null,storyTween:null,goalFocus:null,focusId:null,speakerId:null});
  HonroBounds.constrain(s,b);
  V.draw=function(ctx,asset,...rest){const ok=draw.call(this,ctx,asset,...rest);if(ok&&ids.includes(asset?.id))counts[asset.id]++;if(ok&&asset?.id===gateId)order.push('gate');return ok};
  if(gateCheck)s.unit=function(c,u,...args){
   if(u.id!=='a5-foe-22')return nativeUnit.call(this,c,u,...args);
   order.push('soldier');
   const m=c.getTransform(),rx=Math.max(32,u.r+11);
   const x=Math.floor((u.x-rx)*m.a+m.e),y=Math.floor((u.y-u.h-8)*m.d+m.f),
    w=Math.ceil(2*rx*m.a),h=Math.ceil((u.h+11)*m.d);
   if(x<0||y<0||x+w>s.canvas.width||y+h>s.canvas.height)throw Error('Actual soldier ROI is clipped');
   const pre=s.ctx.getImageData(x,y,w,h).data;
   const result=nativeUnit.call(this,c,u,...args);
   const after=s.ctx.getImageData(x,y,w,h).data;
   let pixels=[],col=[];
   for(let k=0;k<after.length;k+=4){
    if(Math.max(...[0,1,2].map(i=>Math.abs(after[k+i]-pre[k+i])))>=8){
     pixels.push(k/4);col.push([after[k],after[k+1],after[k+2]]);
    }
   }
   foePaint={world:[u.x,u.y,u.h,u.r],bbox:[x,y,w,h],pixels,colors:col};
   return result;
  };
  const wallStart=performance.now();
  s.render(e,0,a.selected,a.power,false,0,true);
  const wallEnd=performance.now(), ts=s._honroTime, cl=s._honroClouds;
  // Stock renderer writes its unique per-battle identity and browser-local timestamp.
  // These are checked against their own phase, not compared across independent sessions.
  if(ts?.key!==b.honroStage+':'+b.session||ts.value!==target||
     !Number.isFinite(ts.at)||ts.at<wallStart||ts.at>wallEnd)
    throw Error('Actual stock paint did not use the expected per-session official clock');
  // Pinned stock cloud formula clamps (now-Infinity) to zero for this one draw.
  // A finite timestamp after rendering proves its real path consumed the initial sample.
  if(cl?.x!==0||cl.v!==0||!Number.isFinite(cl.at)||cl.at<wallStart||cl.at>wallEnd||s.weatherX!==0||s.time!==0)
    throw Error('Actual stock clouds/particles were not rendered at matched visual phase');
  const clock={stage:scope[0],round:scope[1],minutes:ts.value,label:td.clockText(b),grade:td.sample(entry.profile||'default',ts.value)};
  if(!clock.grade)throw Error('Stock timeline grade is unavailable');
  const weather={wind:b.wind,weatherX:s.weatherX,cloudX:cl.x,cloudV:cl.v,sceneTime:s.time};
  const canvas=s.canvas,rect=canvas.getBoundingClientRect();
  result={actual:[s.x,s.y,s.scale],requested:camera,viewport:[rect.width,rect.height],world:HonroBounds.viewport(s,rect.width,rect.height),dpr:devicePixelRatio,clock,weather,clockProvenance:{sessionClockKey:ts.key,wallAt:ts.at,cloudWallAt:cl.at},far:HonroAuthoredFarArt.frames(s,rect.width,rect.height,b),
    png:canvas.toDataURL('image/png'),assetVectorDraws:counts,gate:{order,aperture,site:{x:site.x,y:site.y,supportY:support.y,supportOwner:support.t.id},foePaint},cache:{tiles:s._cacheStats?.domainTileBuilds??0,hits:s._cacheStats?.worldHits??0}};
 }finally{V.draw=draw;if(oldUnit)s.unit=nativeUnit;else delete s.unit;for(const [k,p] of Object.entries(old))if(p.own)s[k]=p.value;else delete s[k];}
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
packets={k:json.loads((here/n).read_bytes()) for k,n in [('A','old-packet.json'),('B','gate-packet.json')]}
outdir=pathlib.Path(sys.argv[1]); aurl,burl=sys.argv[2:4]
for u,p in [(aurl,8884),(burl,8885)]:
 x=urllib.parse.urlparse(u);assert x.hostname=='127.0.0.1' and x.scheme=='http' and x.port==p and x.path=='/HONRO.html'
assert not (outdir/'gate-ab.json').exists()
out={'frames':{},'classification':'actual stock normal campaign entry world-camera art-only preview; not gate traversal, gameplay completion or production'}
def dump():(outdir/'gate-ab.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
views=[('gate-direct',[6075,557,1.2],True),('overview-retained',[3250,880,1280/6800],False)]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=os.environ.get('HONRO_CHROME') or None)
 actor_arrays={}
 for arm,url in [('A',aurl),('B',burl)]:
  assetrows=[[e['assetId'],e['layer'],0] for e in packets[arm]['stage']['elements']]
  expect=json.loads((outdir/f'{arm}-source-invariants.json').read_bytes())
  assert expect['checks']==46 and expect['othersUnchanged']
  ctx=browser.new_context(viewport={'width':1280,'height':800},device_scale_factor=1)
  ctx.add_init_script("Storage.prototype.setItem=function(){throw Error('QA persistent storage blocked')};")
  p=ctx.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)[:400]))
  phase='navigation'
  try:
   p.goto(url,wait_until='domcontentloaded');p.wait_for_function('!!globalThis.HonroApp && !!globalThis.HonroCampaignLoader',timeout=90000)
   phase='actual-campaign-launch'; launch=p.evaluate(SETUP)
   p.wait_for_function('HonroApp.engine?.b?.honroStage===42 && HonroApp.stage?.id===42 && HonroApp.screen==="battle"',timeout=30000)
   p.bring_to_front()
   phase='normal-intro-input'
   for i in range(24):
    if not p.evaluate('!!HonroApp.dialogue'):break
    p.keyboard.press('Space');p.wait_for_timeout(90)
   p.wait_for_function('HonroApp.canInput() && !HonroApp.dialogue',timeout=17000)
   p.wait_for_function('HonroAuthoredFarArt.ready(42, null, HonroApp.engine.b)',timeout=20000)
   phase='exact-46'
   start=p.evaluate(OBSERVE,{'expected':expect,'assets':assetrows})
   contacts=p.evaluate(CONTACTS,{'rows':expect['bindings']})
   assert len(contacts)==46 and all(q['groundY'] is not None for q in contacts)
   r=out['frames'][arm]={'launch':launch,'start':start,'contacts':contacts,'views':{}}
   dump()
   for label,camera,gateCheck in views:
    phase=label
    f=p.evaluate(FRAME,{'camera':camera,'ids':[a[0] for a in assetrows],'source':base,'gateCheck':gateCheck})
    bits=base64.b64decode(f.pop('png').split(',',1)[1],validate=True)
    (outdir/f'{arm}-{label}.png').write_bytes(bits);f['pngSHA256']=hashlib.sha256(bits).hexdigest()
    if gateCheck:
     q=f['gate']['foePaint']; assert q and len(q['pixels'])>=128,'Actual foe silhouette not painted'
     pp,colors=q.pop('pixels'),q.pop('colors');actor_arrays[arm]=dict(zip(pp,map(tuple,colors)))
     q['paintedPixelCount']=len(pp)
    r['views'][label]=f;dump()
   assert not errors,errors
  except Exception as e:
   out['failure']={'arm':arm,'phase':phase,'error':str(e),'pageErrors':errors};p.screenshot(path=str(outdir/f'{arm}-first-failure.png'));raise
  finally:dump();ctx.close()
 A,B=(out['frames'][k] for k in ('A','B'))
 assert A['start']==B['start'] and A['contacts']==B['contacts']
 for label,_,__ in views:
  a,b=(q['views'][label] for q in (A,B))
  assert all(a[k]==b[k] for k in ['actual','requested','viewport','world','dpr','clock','weather','far','battleDigest']),(label,a,b)
  assert a['assetVectorDraws'].get('qa-f4ef-extinguished-gate',0)==0 and b['assetVectorDraws'].get('qa-f4ef-extinguished-gate',0)>0
 a,b=(q['views']['gate-direct']['gate'] for q in (A,B))
 assert a['site']==b['site'] and a['foePaint']['world']==b['foePaint']['world'] and a['foePaint']['bbox']==b['foePaint']['bbox']
 assert a['order']==['soldier'] and b['order'][-1:]==['soldier'] and 'gate' in b['order'][:-1],(a['order'],b['order'])
 m,n=(actor_arrays[k] for k in ('A','B'))
 common=set(m)&set(n); union=set(m)|set(n)
 silhouette={'overlap':len(common),'union':len(union),'intersectionOverUnion':len(common)/len(union),'identicalPaintedRGBOnCommon':sum(m[k]==n[k] for k in common)}
 out['actorSilhouette']=silhouette;dump()
 assert silhouette['intersectionOverUnion']>=.80,'Foe paint contribution changed materially near gate'
 out['verified']={'sameSceneGateBehindSoldier':True,'matchedFrames':2,'runtimeContactsEachArm':46,'renderingOnly':True};dump();browser.close()
