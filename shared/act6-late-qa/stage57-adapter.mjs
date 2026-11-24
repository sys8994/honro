import {createStage57Mission} from './stage57-mission.mjs';
const roles=['archer','knight','occultist'],sha='2c38fcf9d7b9c9d171260e5ab7d015ef48a49383e012c09b8afedd3de06c7c1b',p=JSON.stringify;
const carry=['id','cls','hp','maxHp','focus','maxFocus','shield','level','loadout','tune','ranks','h','r','equipmentState','dead','attack','armor','maxMove','walkSpeed','regen'];
const intact=(a,b)=>a&&b&&carry.every(k=>p(a[k])===p(b[k]));
const route=Object.freeze({
 warnBell:['종터 보호 받침 살피기',5016],repairRelay:['보호 받침에 결속 잇기',5016],
 warnRailing:['석교 난간에 접근 후 경고',3376],openRetreat:['안전한 뒤 석교 후퇴로 확보',3376],
 moveRelayToFallback:['임시 연결점을 서쪽으로 옮기기',1992],assistKeeper:['곽진의 귀환 매듭 인수 시작',1712],
 receiveKeeperWatch:['곽진으로 서쪽 귀환 매듭 인수',2028],reuniteAtWard:['네 사람을 원래 돌단에서 모으기',5384]
});
export function stage57Adapter(G){
 const C=G.HONRO_CORE,sessions=new WeakMap();
 const mountStage=createStage57Mission({G,authorize:({engine,pack,activation})=>{const s=sessions.get(engine);return s?.pack===pack&&s?.activation===activation&&s.app.engine===engine;},
  earlierResult:(prev,b,pack)=>{const s=prev&&sessions.get(prev.e);return s?.prior===prev&&s.e.b===b&&s.pack===pack?s.upstream:null;},
  isDetachedFixture:(a,e)=>sessions.get(e)?.activation===a&&e.b.mode==='act6-isolated'&&e.b.honroMapOrigin==='act6-qa'});
 async function prepare({descriptor,packet,compiled,previous}){
  if(descriptor.id!==57||previous?.stage!==56||previous?.won!==true||!previous.flags?.['act6.firstGarmjinFailed']||!previous.flags?.['act6.temporaryPassageEscaped']||
    !intact(previous.boundary?.fullMage,previous.crew?.mage)||!packet.bridge?.base||packet.bridge.stageAuthId!==packet.authoredId||packet.bridge.pins.source07.sha256!==packet.baseInputSHA||
    packet.bridge.pins.baseNative!==descriptor.playSHA||packet.bridge.pins.baseWorld!==descriptor.worldSHA||packet.foes.length!==3||packet.slots.archer!==2408||packet.slots.knight!==3584||packet.slots.occultist!==5024||
    !roles.every(k=>intact(previous.boundary?.fullOuter?.[k],previous.crew?.[k])))throw Error('Stage57 prior/map/slot mismatch '+JSON.stringify({previous:previous?.stage,flags:previous?.flags,body:previous?.boundary?.fullMage?.id,bodyFields:carry.filter(k=>p(previous?.boundary?.fullMage?.[k])!==p(previous?.crew?.mage?.[k])),outer:roles.map(k=>intact(previous.boundary?.fullOuter?.[k],previous.crew?.[k])),pins:packet.bridge.pins,descriptor,slots:packet.slots}));
  const t=compiled.terrain;
  // Exactly the authored fixture's existing contact solver range.
  const probe=C.createBattle(1,G.HonroProfileStore.fresh(),'scripted',{party:['archer']});probe.terrain=t;
  const e=new C.Engine(probe,()=>{},false),at=x=>e.contactSurface(x,2100,3555)?.y;
  const place=(r,x)=>{const y=at(x);if(!Number.isFinite(y))return null;return {...structuredClone(r),x,y,spawnX:x,spawnY:y,vx:0,vy:0,airborne:false,jumping:false,acted:false,moveLeft:r.maxMove};};
  const heroes=roles.map(k=>place(previous.boundary.fullOuter[k],packet.slots[k]));
  const foes=packet.foes.map(({owner})=>place(owner,owner.x));
  const proxy=place(packet.proxy,5384);
  const neutral=C.createBattle(1,G.HonroProfileStore.fresh(),'skirmish',{party:['archer'],distance:900}).units.find(a=>a.side===0&&a.cls==='archer');
  const m=packet.keeper,x=m.x,y=C.topAt(t.find(x=>x.id===m.support),x),keeper={...neutral,id:m.id,name:'곽진',x,y,spawnX:x,spawnY:y,dead:false,vx:0,vy:0,airborne:false,jumping:false,acted:false,awake:true};
  if(!proxy||proxy.id!=='a6-c07-original-darmheo-body'||proxy.side!==2||!proxy.honroVisualOnly||!proxy.fixed||proxy.honroAlly!==true)return null;
  // A fixed visual body remains side 2 but is not an actor in the stock ally queue.
  proxy.honroAlly=false;
  if(proxy.y!==2976||![...heroes,...foes,proxy,keeper].every(u=>u&&e.grounded(u)&&C.validTerrainContactPose(t,u)))throw Error('Stage57 contact mismatch '+JSON.stringify([...heroes,...foes,proxy,keeper].map(u=>u&&[u.id,u.x,u.y,e.grounded(u),C.validTerrainContactPose(t,u)])));
  const authored=structuredClone(t);
  for(const [id,hp] of [['a6-c07-railing',230],['a6-c07-protective-relay',65],['a6-c07-stationary-stone-ward',24]]){
   const device=authored.find(t=>t.id===id);if(!device||device.indestructible!==false)throw Error('Stage57 reserve not breakable '+JSON.stringify(device));
   Object.assign(device,{hp,maxHp:hp,indestructible:false,device:true,broken:false});
  }
  return Object.freeze({units:[...heroes,foes[0],foes[2],proxy],heroes,foes,keeper,terrain:authored,pack:packet.bridge,entryFlags:{'act6.firstGarmjinFailed':true},
    story:{id:57,actStage:7,name:'무너지는 세 자리',objective:'act6-fallback-reunite'}});
 }
 function attach({app,engine:e,prepared,receipt}){
  if(sessions.has(e)||e.b.units.some((u,i)=>u!==prepared.units[i])||e.b.units.length!==prepared.units.length)return null;
  const pack=prepared.pack,activation=Object.freeze({enabled:true,integerStageKey:57,storyOwner:pack.storyOwner,compiledAuthId:pack.stageAuthId,authoredInputSHA:pack.pins.source07.sha256});
  const prior=Object.freeze({e}),upstream={won:true,flags:receipt.flags,actor:receipt.boundary.fullMage,profile:structuredClone(app.profile)};
  sessions.set(e,{e,app,pack,activation,prior,upstream});
  const mission=mountStage({engine:e,pack,activation,previous:prior,carriedProfile:app.profile,heroes:prepared.heroes,foes:prepared.foes,keeper:prepared.keeper});
  if(!mission){sessions.delete(e);throw Error('Stage57 actual phase mount rejected');}
  let ready=null,keeperStarted=false;const flags=e.b.honroState.flags;
  function act(){
   const state=mission.read(),past=state.emergency.events;
   if(ready||state.emergency.loss)return null;
   const saw=id=>past.some(x=>x.kind===id);
   if(!flags.bellSiteEmergencyStabilized)return saw('bell_site_under_fire')?'repairRelay':'warnBell';
   if(!flags.bridgeRetreatOpened)return saw('bridge-railing-warning')?'openRetreat':'warnRailing';
   if(!flags.relayMovedToFallback)return 'moveRelayToFallback';
   if(!state.reunion)return null;
   if(!keeperStarted)return 'assistKeeper';
   if(!state.reunion.guard)return 'receiveKeeperWatch';
   if(!state.reunion.association)return 'reuniteAtWard';
   return null;
  }
  function interact(explicit){
   const key=act(),split=key==='repairRelay'&&explicit==='splitRepair';
   if(!key||explicit&&explicit!==key&&!split)return {ok:false,reason:'현재 역할이나 위치를 확인하십시오.'};
   const ret=mission.interaction(split?'splitRepair':key,e.active,prepared.heroes[0]);if(ret===true&&key==='assistKeeper')keeperStarted=true;
   if(ret===true&&key==='receiveKeeperWatch'){
    const k=prepared.keeper;
    if(e.unit(k.id)!==k||k.id!=='local-07-gwakjin-return-keeper'||k.side!==2||!k.fixed||!k.honroVisualOnly||k.honroAlly!==true)throw Error('Stage57 visual keeper custody changed');
    k.honroAlly=false;
   }
   return {ok:ret===true||ret==='warned',label:route[key][0]};
  }
  function project(){
   const key=act(),row=route[key],complete=ready?.won===true,failed=ready?.won===false;
   const summary=failed?'귀환 통로가 무너졌습니다.':complete?'네 사람의 실체가 이어졌습니다.':row?.[0]??'같은 길을 밟고 실체 전원을 안쪽 받침으로 이동시키십시오.';
   return {complete,objectiveReady:complete,failed,summary,targets:row?[{id:key,kind:'route',x:row[1],label:row[0]}]:[],appActions:{mission:key,alt:key==='repairRelay'?'splitRepair':null}};
  }
  function terminal(){
   if(e.b.phase!=='won'||!ready?.won||!mission.settlement(ready))return null;
   return ready;
  }
  return Object.freeze({interact,project,tick:()=>{if(!ready)ready=mission.position();},terminal,parkedAtExit:()=>({})});
 }
 return Object.freeze({sourceSHA:sha,prepare,attach});
}
