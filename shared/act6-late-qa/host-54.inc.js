// Injected into the existing R5-style qa51 lexical closure only. The
// deployed App source and 1–50 gate are not changed by this helper.
const late54=(()=>{
 const token=Symbol('owned late chapter'),profileKey=app=>app.normalProfile,
 prior=Object.freeze({id:53,exit:['mage'],parkedOnExit:['archer','knight','occultist'],terminalFlags:{'act6.innerStakeAReady':true}});
 const candidates=Object.freeze({54:stage54Adapter(G),55:stage55Adapter(G),56:stage56Adapter(G),57:stage57Adapter(G)});
 const broker=createLateSuccessorBroker(G,{enabled:true,token,origin:descriptor.origin,manifest:descriptor.lateRows,owners:candidates,
  scope:runtime,profileKey,compile:(map,library)=>G.HonroMaps.compile(map,{library}),
  enterNative:(app,id,ticket)=>app.launch(id,false,null,ticket),mount:mountLate});
 function mountLate(app,{id,packet,compiled,party,ticket}){
  const predecessor=active.get(app),profile=app.profile;
  if(![54,55,56,57].includes(id)||predecessor?.b.honroStage!==id-1||app.engine!==predecessor.engine||!app.done||predecessor.b.phase!=='won')return false;
  const p=structuredClone(profile),m=packet.map,units=party.units,d=party.story;
  const b=C.createBattle(1,structuredClone(p),'scripted',{party:id===57?['archer','knight','occultist']:id===55?['knight','archer','occultist']:['mage'],distance:900});
  Object.assign(b,{stage:id,stageId:id,honroStage:id,mode:'act6-isolated',honroCanonical:true,honroMapOrigin:'act6-qa',honroCustom:false,honroAuthoredId:m.id,
   seed:id===54?543904:19388,rng:id===54?543904:19388,honroBackdrop:m.backdrop,width:m.width,height:m.height,terrain:party.terrain??compiled.terrain,honroWorldTerrain:compiled.worldTerrain,honroTerrainDomainVersion:1,
   honroTerrainBounds:m.terrainBounds,honroPlayBounds:m.playBounds,honroSurfaceZones:compiled.materials,
   honroLandmarks:compiled.landmarks,honroElements:compiled.elements,honroEnvironment:structuredClone(m.environment),
   waters:[],drafts:[],decor:[],zones:[],landmarks:[],wind:0,physics:C.makePhysics(),units,active:units[0].id,phase:'aim',queue:units.map(u=>u.id),side:0,items:[],events:[],round:1,teamEnds:[0,0],rewardGranted:false,
   honroActiveLimit:id===54?1:4,enemyLimit:id===54?0:4,honroObjectives:party.objectives??[],honroMarkers:[],honroEvents:[],honroAuthoredEvents:[],honroState:{flags:structuredClone(party.entryFlags??{}),collected:[],hold:0,lastRound:1,rescued:false,combatLog:[]}});
  if(id===57)b.honroCounters={initialEnemies:b.units.filter(u=>u.side===1&&!u.honroAct5Reserve).length,allyActions:0,spawned:0};
  delete b.honroGrowth;delete b.volley;
  app.stopBattle();
  const old={profile:app.profile,stage:app.stage,stageId:app.stageId,training:app.training,selectedByUnit:app.selectedByUnit,done:app.done};
  const s={old,b,packet,previous:predecessor.terminal,terminal:null,lateTicket:ticket};
  app.close();active.set(app,s);
  Object.assign(app,{profile:p,stageId:id,training:false,selectedByUnit:{},stage:{...H.stages[0],id,act:6,actStage:id-50,name:d.name,goal:id===54?'안내점을 따라 처마를 건너 진목을 묶으십시오.':id===55?'빈 종터 방어선을 지키십시오.':id===56?'첫 진목 놓기':'세 자리의 연결을 유지하십시오.',story:[],outro:[],objective:d.objective,w:m.width,h:m.height,active:[55,57].includes(id)?4:1}});
  try{
   app.mount(b,{freshReport:true,reportScope:'custom'});
   if(app.engine!==s.engine||!app.scene||!app.root.querySelector('#battlecanvas'))throw Error('Stage54 normal App mount failed');
   const ui=appUI(app);if(!ui)throw Error('Stage54 normal scene controls absent');
   const button=document.createElement('button');button.type='button';button.dataset.act6QaLookout='';styleAction(button);
   button.textContent=id===54?'안내점에서 건너기':id===55?'종터 현장 행동':id===56?'첫 진목 놓기':'종터 보호 받침 살피기';button.addEventListener('click',event=>{if(event.isTrusted)action(app,event);});
   s.button=button;ui.append(button);
   if(id===57){
    const split=document.createElement('button');split.type='button';split.dataset.act6QaWard='';styleAction(split);split.textContent='석각도 함께 수리';split.hidden=true;
    split.addEventListener('click',event=>{
      const e=app.engine;if(!event.isTrusted||split.hidden||active.get(app)!==s||e!==s.engine||app.done||app.dialogue||app.modal.classList.contains('open'))return;
      const a=relay(app,e,'interact','splitRepair');if(a?.ok){split.hidden=true;app.notify('보호 받침과 석각의 결속을 나누어 이었습니다.');app.updateHUD(true);}
    });
    s.altButton=split;ui.append(split);
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
 function bind(app,e,s){
  if(!broker.attach(token,app,e,s.lateTicket))throw Error('Stage54 native attached owner refused');
  e.checkEnd=()=>app.checkMission(e);
  s.engine=e;return true;
 }
 const relay=(app,e,name,...args)=>broker.relay(token,app,e,name,args);
 return Object.freeze({launch:(app,id,ticket)=>broker.launch(token,app,id,ticket),arm,arm55,arm56,arm57,bind,
  goal:(app,e)=>broker.project(token,app,e),finish:(app,e)=>broker.finish(token,app,e),relay});
})();
