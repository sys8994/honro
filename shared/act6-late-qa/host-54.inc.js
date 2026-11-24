// Injected into the existing R5-style qa51 lexical closure only. The
// deployed App source and 1–50 gate are not changed by this helper.
const late54=(()=>{
 const token=Symbol('owned late chapter'),profileKey=app=>app.normalProfile,caps58=new WeakSet(),
 prior=Object.freeze({id:53,exit:['mage'],parkedOnExit:['archer','knight','occultist'],terminalFlags:{'act6.innerStakeAReady':true}});
 const endingAuthority=prepare60Boundary(G,descriptor);
 const active60=(app,e)=>active.get(app)?.b===e.b&&e.b.honroStage===60&&runtime(app)&&!app.profileStore?.locked;
 const candidates=Object.freeze({54:stage54Adapter(G),55:stage55Adapter(G),56:stage56Adapter(G),57:stage57Adapter(G),58:stage58Adapter(G),59:stage59Adapter(G,{verifyPrevious:cap=>caps58.has(cap),paint:true}),60:createStage60Adapter(G,{sourceSHA:descriptor.lateRows[60].ownerSHA,verifyPrevious:endingAuthority.read,
  pinGeometry:(p,c,d)=>p.id===60&&d===descriptor.lateRows[60]||p.id===60&&d.sha256===descriptor.lateRows[60].sha256,
  permitMount:active60,permitEnding:active60,bindEndingView:(app,e,proof,ui)=>ending60UI?.bind(app,e,proof,ui,active.get(app)?.packet.quiet)??(()=>{}),
  readPanelFrame:(...args)=>ending60UI?.readPanelFrame(...args),trustedUIAction:(...args)=>ending60UI?.trustedUIAction(...args)??false,
  writeEnding:(...args)=>ending60UI?.writeEnding(...args)??{ok:false,reason:"ending-qa-no-write"},report:e=>G.console?.error(e)})});
 const broker=createLateSuccessorBroker(G,{enabled:true,token,origin:descriptor.origin,manifest:descriptor.lateRows,owners:candidates,
  scope:runtime,profileKey,compile:(map,library)=>G.HonroMaps.compile(map,{library}),
  enterNative:(app,id,ticket)=>app.launch(id,false,null,ticket),mount:mountLate,bindEndingBoundary:endingAuthority.bind,onEndingTerminal:(...args)=>ending60UI?.seal(...args)});
 function mountLate(app,{id,packet,compiled,party,ticket}){
  const predecessor=active.get(app),profile=app.profile;
  if(![54,55,56,57,58,59,60].includes(id)||predecessor?.b.honroStage!==id-1||app.engine!==predecessor.engine||!app.done||predecessor.b.phase!=='won')return false;
  const p=structuredClone(profile),m=packet.map,units=party.units,d=party.story??descriptor.lateRows[id];
  const b=C.createBattle(1,structuredClone(p),id===58?'skirmish':'scripted',{party:id>=59?['mage','archer','knight','occultist']:id===57?['archer','knight','occultist']:id===55?['knight','archer','occultist']:['mage'],distance:900});
  Object.assign(b,{stage:id,stageId:id,honroStage:id,mode:'act6-isolated',honroCanonical:true,honroMapOrigin:'act6-qa',honroCustom:false,honroAuthoredId:m.id,
   seed:id===54?543904:19388,rng:id===54?543904:19388,honroBackdrop:m.backdrop,width:m.width,height:m.height,terrain:party.terrain??compiled.terrain,honroWorldTerrain:compiled.worldTerrain,honroTerrainDomainVersion:1,
   honroTerrainBounds:m.terrainBounds,honroPlayBounds:m.playBounds,honroSurfaceZones:compiled.materials,
   honroLandmarks:compiled.landmarks,honroElements:compiled.elements,honroEnvironment:structuredClone(m.environment),
   waters:[],drafts:[],decor:[],zones:[],landmarks:[],wind:0,physics:C.makePhysics(),units,active:units[0].id,phase:'aim',queue:id>=59?[]:units.map(u=>u.id),side:0,items:[],events:[],round:1,teamEnds:[0,0],rewardGranted:false,
   honroActiveLimit:[55,56,57,58,59,60].includes(id)?4:1,enemyLimit:(id===54||id===60)?0:4,honroObjectives:party.objectives??[],honroMarkers:[],honroEvents:[],honroAuthoredEvents:[],honroState:{flags:structuredClone(party.entryFlags??{}),collected:[],hold:0,lastRound:1,rescued:false,combatLog:[]}});
  if(id===57)b.honroCounters={initialEnemies:b.units.filter(u=>u.side===1&&!u.honroAct5Reserve).length,allyActions:0,spawned:0};
  delete b.honroGrowth;delete b.volley;
  app.stopBattle();
  const old={profile:app.profile,stage:app.stage,stageId:app.stageId,training:app.training,selectedByUnit:app.selectedByUnit,done:app.done};
  const s={old,b,packet,previous:predecessor.terminal,terminal:null,lateTicket:ticket};
  app.close();active.set(app,s);
  Object.assign(app,{profile:p,stageId:id,training:false,selectedByUnit:{},stage:{...H.stages[0],id,act:6,actStage:id-50,name:d.name,goal:id===54?'안내점을 따라 처마를 건너 진목을 묶으십시오.':id===55?'빈 종터 방어선을 지키십시오.':id===56?'첫 진목 놓기':id===57?'세 자리의 연결을 유지하십시오.':id===58?'성전에 든 네 사람의 손으로 첫 기둥을 바로잡으십시오.':id===59?'되돌아온 네 사람으로 마지막 방어선을 지키십시오.':'마지막 혼을 보내고 네 사람이 산문에 함께 모이십시오.',story:[],outro:[],objective:d.objective,w:m.width,h:m.height,active:[55,57,58,59,60].includes(id)?4:1}});
  try{
   app.mount(b,{freshReport:true,reportScope:'custom'});
   if(app.engine!==s.engine||!app.scene||!app.root.querySelector('#battlecanvas'))throw Error('Stage54 normal App mount failed');
   if(id===58||id===59)candidates[id].attachVisual(app,s.engine,app.scene);
   if(id===59&&descriptor.visual59?.path==='/web/graphics/act6-qa-art-59.e1b0e699a8349a0a.webp'){
    const scene=app.scene,e=app.engine,key=Object.freeze({}),image=new G.Image();
    const receipt=Object.freeze({stage:59,battle:b,scene,cleared:()=>s.terminal?.stage===59&&s.terminal?.won===true&&s.terminal?.flags?.['act6.finalThreatResolved']===true});
    const verify=(ticket,a,en,sc)=>ticket===key&&a===app&&en===e&&sc===scene&&active.get(a)===s&&s.engine===e&&e.b===b?receipt:null;
    image.src=descriptor.visual59.path;
    s.visual59=attachStage59Visual({G,app,engine:e,scene,image,permit:key,verify});
    s.matte59=attachStage59Matte({G,app,e,scene,permit:key,verify});
   }
   const ui=appUI(app);if(!ui)throw Error('Stage54 normal scene controls absent');
   const button=document.createElement('button');button.type='button';button.dataset.act6QaLookout='';styleAction(button);
   button.textContent=id===54?'안내점에서 건너기':id===55?'종터 현장 행동':id===56?'첫 진목 놓기':id===57?'종터 보호 받침 살피기':id===58?'기둥 확인':id===59?'마지막 마당 현장 행동':'마지막 혼 안내';button.addEventListener('click',event=>{if(event.isTrusted)action(app,event);});
   s.button=button;ui.append(button);
   if(id===57){
    const split=document.createElement('button');split.type='button';split.dataset.act6QaWard='';styleAction(split);split.textContent='석각도 함께 수리';split.hidden=true;
    split.addEventListener('click',event=>{
      const e=app.engine;if(!event.isTrusted||split.hidden||active.get(app)!==s||e!==s.engine||app.done||app.dialogue||app.modal.classList.contains('open'))return;
      const a=relay(app,e,'interact','splitRepair');if(a?.ok){split.hidden=true;app.notify('보호 받침과 석각의 결속을 나누어 이었습니다.');app.updateHUD(true);}
    });
    s.altButton=split;ui.append(split);
   }
   if(id===60){
    const next=document.createElement("button");next.type="button";next.dataset.act6QaWalk="";styleAction(next);next.textContent="동행 차례 넘기기";
    next.addEventListener("click",event=>{const e=app.engine;if(!event.isTrusted||event.currentTarget!==next||active.get(app)!==s||e!==s.engine||app.done||app.dialogue||app.modal.classList.contains("open"))return;
     if(relay(app,e,"interact","end-walk")===true)app.updateHUD(true);});
    s.walkButton=next;ui.append(next);
   }
   if(id===58){
    const march=document.createElement('button');march.type='button';march.dataset.act6QaReturn='';styleAction(march);march.textContent='동행 차례 넘기기';march.hidden=true;
    march.addEventListener('click',event=>{const e=app.engine;if(!event.isTrusted||march.hidden||active.get(app)!==s||e!==s.engine||app.done||app.dialogue||app.modal.classList.contains('open'))return;
     if(relay(app,e,'noncombatReturn')===true)app.updateHUD(true);
    });s.returnButton=march;ui.append(march);
   }
   return true;
  }catch(error){app.stopBattle();app.showTitle();throw error;}
 }
 function arm(app,s,t){
  const live=broker.seal(token,app,s.engine,{descriptor:prior,receipt:t,parked:t.external});
  if(!live||!broker.available(token,app,54))return false;
  const button=document.createElement('button');button.type='button';button.dataset.act6QaNext='54';styleAction(button);button.textContent='거꾸로 선 처마로';
  appUI(app)?.append(button);return broker.offer(token,app,54,button);
 }
 function arm55(app,previous){
  if(previous?.stage!==54||!broker.available(token,app,55))return false;
  const button=document.createElement('button');button.type='button';button.dataset.act6QaNext='55';styleAction(button);button.textContent='빈 종터로 돌아간다';
  appUI(app)?.append(button);return broker.offer(token,app,55,button);
 }
 function arm56(app,previous){
  if(previous?.stage!==55||!broker.available(token,app,56))return false;
  const button=document.createElement('button');button.type='button';button.dataset.act6QaNext='56';styleAction(button);button.textContent='죽은 자들의 큰길로';
  appUI(app)?.append(button);return broker.offer(token,app,56,button);
 }
 function arm57(app,previous){
  if(previous?.stage!==56||!broker.available(token,app,57))return false;
  const button=document.createElement('button');button.type='button';button.dataset.act6QaNext='57';styleAction(button);button.textContent='무너지는 세 자리로';
  appUI(app)?.append(button);return broker.offer(token,app,57,button);
 }
 function arm58(app,previous){
  if(previous?.stage!==57||!broker.available(token,app,58))return false;
  const button=document.createElement('button');button.type='button';button.dataset.act6QaNext='58';styleAction(button);button.textContent='네 사람이 문턱을 넘는다';
  appUI(app)?.append(button);return broker.offer(token,app,58,button);
 }
 function arm59(app,previous){
  if(previous?.stage!==58||!broker.available(token,app,59))return false;
  caps58.add(previous);
  const button=document.createElement('button');button.type='button';button.dataset.act6QaNext='59';styleAction(button);button.textContent='함께 사문 밖으로 나간다';
  appUI(app)?.append(button);return broker.offer(token,app,59,button);
 }
 function arm60(app,previous){
  if(previous?.stage!==59||!broker.available(token,app,60))return false;
  const button=document.createElement("button");button.type="button";button.dataset.act6QaNext="60";styleAction(button);button.textContent="마지막 혼을 보내러 간다";
  appUI(app)?.append(button);return broker.offer(token,app,60,button);
 }
 function bind(app,e,s){
  if(!broker.attach(token,app,e,s.lateTicket))throw Error('Stage54 native attached owner refused');
  e.checkEnd=()=>app.checkMission(e);
  s.engine=e;return true;
 }
 const relay=(app,e,name,...args)=>broker.relay(token,app,e,name,args);
 return Object.freeze({releaseVisual:(app,e,id)=>candidates[id].detachVisual(app,e),launch:(app,id,ticket)=>broker.launch(token,app,id,ticket),arm,arm55,arm56,arm57,arm58,arm59,arm60,bind,dispose:(app,e)=>broker.dispose(token,app,e),
  goal:(app,e)=>broker.project(token,app,e),finish:(app,e)=>broker.finish(token,app,e),relay});
})();
