import {createStage56Owner,owner56 as D} from './stage56-owner.mjs';
import {stage56Display} from './stage56-presentation.mjs';
export const sourceSHA='ef0206760ca2251373ad2e2ae5622a1f3be0f21befb16f01a97cb292ca387f02';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const essentials=['id','cls','hp','maxHp','focus','maxFocus','shield','level','loadout','tune','ranks','h','r','equipmentState','equipmentIds','gearBonuses','dead','attack','armor','maxMove','walkSpeed','regen'];
const party=['archer','knight','occultist'];
export function stage56Adapter(G){
 const C=G.HONRO_CORE,once=new WeakSet(),sessions=new WeakMap();
 const mountStage=createStage56Owner({
  authorize:({engine,packet,scope})=>{const s=sessions.get(engine);return !!s&&s.shape===packet&&s.scope===scope&&s.app.engine===engine;},
  previousOutcome:(p,flag,engine,packet)=>{const s=sessions.get(engine);return !!s&&s.previous===p&&s.shape===packet&&s.issued.stage===55&&s.issued.won===true&&s.issued.flags[flag]===true;},
  // Use the pinned owner's explicitly isolated mode, never pretending this
  // preview is released campaign. All reserve/map checks still run locally.
  isDetachedFixture:({engine,packet,scope})=>{const s=sessions.get(engine);return !!s&&s.shape===packet&&s.scope===scope&&engine.b.mode==='act6-isolated'&&engine.b.honroMapOrigin==='act6-qa';}
 });
 async function prepare({descriptor,packet,compiled,previous}){
  if(descriptor.id!==56||descriptor.authoredId!==D.authoredId||descriptor.playSHA!==D.playSHA||descriptor.worldSHA!==D.worldSHA||
    previous?.stage!==55||previous.won!==true||previous?.flags?.['act6.outerThreeAnchorsReady']!==true||previous?.flags?.['act6.outerAnchorBellReady']!==true||
    packet.map.units.length||packet.foes.length!==4||packet.foes.some((q,i)=>q.id!=='draft-pressure-'+i))return null;
  const old=previous?.boundary?.fullParkedMage,row=previous?.crew?.mage;
  if(!old||old.cls!=='mage'||old.hp<=0||old.dead||old.equipmentState?.version!==1||!essentials.every(k=>same(old[k],row?.[k])))return null;
  const {x,y,support}=packet.spawn??{},base=compiled.terrain.find(q=>q.id===support);
  if(x!==928||y!==1136||support!=='A-upper-veranda'||!base||C.topAt(base,x)!==y)return null;
  const mage={...structuredClone(old),x,y,spawnX:x,spawnY:y,airborne:false,jumping:false,acted:false,vx:0,vy:0,moveLeft:old.maxMove};
  const foes=packet.foes.map(({origin,...u})=>C.makeUnit(u.cls,1,u.x,u.y,{...structuredClone(u),spawnX:u.x,spawnY:u.y,vx:0,vy:0,airborne:false,jumping:false,awake:true,acted:false}));
  const [gap]=foes;
  if(gap.cls!=='knight'||gap.role!=='leaper'||gap.h!==88||gap.r!==32||gap.fixed!==false||!gap.loadout.includes('HBM01')||
     ![mage,...foes].every(u=>C.validTerrainContactPose(compiled.terrain,u)))return null;
  const reserved=foes.pop();
  const objectives=structuredClone(packet.map.objectives),[r]=objectives;
  if(objectives.length!==1||r.id!=='draft-arrival-06'||r.type!=='reach'||r.x!==6400||r.y!==3368||r.radius!==84)return null;
  return Object.freeze({units:[mage,...foes],reserved,story:{id:56,actStage:6,name:packet.map.name,objective:'authored'},
    objectives,parked:Object.fromEntries(party.map(k=>[k,previous.crew[k]])),previous:old});
 }
 function attach({app,engine:e,prepared,receipt,packet,compiled}){
  if(once.has(prepared)||e.b.units.length!==prepared.units.length||e.b.units.some((v,i)=>v!==prepared.units[i])||e.b.units.includes(prepared.reserved)||
    !e.grounded(prepared.reserved)||prepared.reserved.id!=='draft-pressure-3'||prepared.reserved.hp!==255||e.b.honroCustom||e.b.honroAuthoredId!==D.authoredId)return null;
  once.add(prepared);
  const scope=Object.freeze({enabled:true,integerStageKey:56,storyOwner:D.storyOwner,qaWarm:true});
  const shape=Object.freeze({authoredId:D.authoredId,playSHA:D.playSHA,worldSHA:D.worldSHA,terrain:compiled.terrain,world:compiled.worldTerrain});
  const previous=Object.freeze({parkedActor:prepared.previous}),records=[];
  sessions.set(e,{app,shape,scope,previous,issued:receipt});
  const mission=mountStage({G,engine:e,packet:shape,scope,previous,observe:key=>records.push(key),reflowActor:prepared.reserved});
  if(!mission.accepted){sessions.delete(e);throw Error('Stage56 owner refused live Engine: '+mission.reason);}
  const display=()=>stage56Display(mission,e,C);
  function interact(id){
   const v=display(),key=v?.action;
   if(!key||id&&id!==key)return {ok:false,reason:'현재 행동할 지점이 아닙니다.'};
   const ok=mission.act(key);
   return {ok,label:v.goal,...(!ok?{reason:'담당 지형에 닿은 뒤 현재 목표를 확인하십시오.'}:{})};
  }
  function project(){
   const d=display(),result=mission.terminal(),complete=result?.won===true,failed=result?.won===false;
   return {complete,objectiveReady:complete,failed,summary:failed?'담허가 길을 계속할 수 없습니다.':complete?'깊은 경계 출구에 도달했습니다.':d?.goal,
    targets:!complete&&!failed&&d?.marker?[{kind:'route',id:d.action,x:d.marker.x,y:d.marker.y,label:d.goal}]:[],
    appActions:{mission:d?.action??null},scopeFrame:d?.scene};
  }
  function terminal(){
   const q=mission.terminal();
   if(!q?.won||e.b.phase!=='won')return null;
   return {...q,actors:[...q.actors,...Object.values(prepared.parked)],events:records.slice(),reflow:mission.read().events};
  }
  return Object.freeze({interact,tick:()=>mission.observePosition(),project,terminal,parkedAtExit:()=>prepared.parked});
 }
 return Object.freeze({sourceSHA,prepare,attach});
}
