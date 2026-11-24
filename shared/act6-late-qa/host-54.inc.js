// Injected into the existing R5-style qa51 lexical closure only. The
// deployed App source and 1–50 gate are not changed by this helper.
const late54=(()=>{
 const token=Symbol('owned late chapter'),profileKey=app=>app.normalProfile,
 prior=Object.freeze({id:53,exit:['mage'],parkedOnExit:['archer','knight','occultist'],terminalFlags:{'act6.innerStakeAReady':true}});
 const candidates=Object.freeze({54:stage54Adapter(G),55:stage55Adapter(G)});
 const broker=createLateSuccessorBroker(G,{enabled:true,token,origin:descriptor.origin,manifest:descriptor.lateRows,owners:candidates,
  scope:runtime,profileKey,compile:(map,library)=>G.HonroMaps.compile(map,{library}),
  enterNative:(app,id,ticket)=>app.launch(id,false,null,ticket),mount:mountLate});
 function mountLate(app,{id,packet,compiled,party,ticket}){
  const predecessor=active.get(app),profile=app.profile;
  if(![54,55].includes(id)||predecessor?.b.honroStage!==id-1||app.engine!==predecessor.engine||!app.done||predecessor.b.phase!=='won')return false;
  const p=structuredClone(profile),m=packet.map,units=party.units,d=party.story;
  const b=C.createBattle(1,structuredClone(p),'scripted',{party:id===54?['mage']:['knight','archer','occultist'],distance:900});
  Object.assign(b,{stage:id,stageId:id,honroStage:id,mode:'act6-isolated',honroCanonical:true,honroMapOrigin:'act6-qa',honroCustom:false,honroAuthoredId:m.id,
   seed:id===54?543904:19388,rng:id===54?543904:19388,honroBackdrop:m.backdrop,width:m.width,height:m.height,terrain:compiled.terrain,honroWorldTerrain:compiled.worldTerrain,honroTerrainDomainVersion:1,
   honroTerrainBounds:m.terrainBounds,honroPlayBounds:m.playBounds,honroSurfaceZones:compiled.materials,
   honroLandmarks:compiled.landmarks,honroElements:compiled.elements,honroEnvironment:structuredClone(m.environment),
   waters:[],drafts:[],decor:[],zones:[],landmarks:[],wind:0,physics:C.makePhysics(),units,active:units[0].id,phase:'aim',queue:units.map(u=>u.id),side:0,items:[],events:[],round:1,teamEnds:[0,0],rewardGranted:false,
   honroActiveLimit:id===54?1:4,enemyLimit:id===54?0:4,honroObjectives:[],honroMarkers:[],honroEvents:[],honroAuthoredEvents:[],honroState:{flags:{},collected:[],hold:0,lastRound:1,rescued:false,combatLog:[]}});
  delete b.honroGrowth;delete b.volley;
  app.stopBattle();
  const old={profile:app.profile,stage:app.stage,stageId:app.stageId,training:app.training,selectedByUnit:app.selectedByUnit,done:app.done};
  const s={old,b,packet,previous:predecessor.terminal,terminal:null,lateTicket:ticket};
  app.close();active.set(app,s);
  Object.assign(app,{profile:p,stageId:id,training:false,selectedByUnit:{},stage:{...H.stages[0],id,act:6,actStage:id-50,name:d.name,goal:id===54?'안내점을 따라 처마를 건너 진목을 묶으십시오.':'빈 종터 방어선을 지키십시오.',story:[],outro:[],objective:d.objective,w:m.width,h:m.height,active:id===54?1:4}});
  try{
   app.mount(b,{freshReport:true,reportScope:'custom'});
   if(app.engine!==s.engine||!app.scene||!app.root.querySelector('#battlecanvas'))throw Error('Stage54 normal App mount failed');
   const ui=appUI(app);if(!ui)throw Error('Stage54 normal scene controls absent');
   const button=document.createElement('button');button.type='button';button.dataset.act6QaLookout='';styleAction(button);
   button.textContent=id===54?'안내점에서 건너기':'종터 현장 행동';button.addEventListener('click',event=>{if(event.isTrusted)action(app,event);});
   s.button=button;ui.append(button);
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
 function bind(app,e,s){
  if(!broker.attach(token,app,e,s.lateTicket))throw Error('Stage54 native attached owner refused');
  e.checkEnd=()=>app.checkMission(e);
  s.engine=e;return true;
 }
 const relay=(app,e,name,...args)=>broker.relay(token,app,e,name,args);
 return Object.freeze({launch:(app,id,ticket)=>broker.launch(token,app,id,ticket),arm,arm55,bind,
  goal:(app,e)=>broker.project(token,app,e),finish:(app,e)=>broker.finish(token,app,e),relay});
})();
