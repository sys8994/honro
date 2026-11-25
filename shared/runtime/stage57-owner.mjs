import {bindOwnedBridge} from './stage57-bridge.mjs';
const used=new WeakSet();
const classes=['archer','knight','occultist','mage'];
const fallback='act6.fallbackRelaySecured';
const keeperId='local-07-gwakjin-return-keeper',oldBody='a6-c07-original-darmheo-body';
const site=Object.freeze({id:'local-return-anchor-07',x:2028,host:'local-lower-07-west',r:52});
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const alive=a=>a&&a.hp>0&&!a.dead;
const roleSet=(rows,list)=>rows.length===list.length&&new Set(rows.map(u=>u.id)).size===list.length&&list.every(role=>rows.some(u=>u.cls===role&&alive(u)));
const exits=Object.freeze({archer:2672,mage:2792,knight:2890,occultist:3000});
const releaseDenial=reason=>Object.freeze({accepted:false,reason});
export function createStage57Owner({G,authorize,earlierResult,isDetachedFixture=()=>false,verifyResume=()=>false}){
 if(!G?.HONRO_CORE||typeof authorize!=='function'||typeof earlierResult!=='function')throw TypeError('known native host required');
 const C=G.HONRO_CORE;
 function mount({engine:e,pack,activation,previous,roster,keeper,requestedAim,carriedProfile,receipt,checkpoint=null}={}){
  const b=e?.b,fixture=isDetachedFixture(activation,e)===true;
  if(!activation?.enabled)return releaseDenial('off');
  if(!(e instanceof C.Engine)||used.has(e)||activation.integerStageKey!==57||!authorize({engine:e,pack,activation}))return releaseDenial('unadmitted stage owner');
  if(!fixture&&!(b.mode==='campaign'&&b.stage===57&&b.honroStage===57&&b.honroCustom===false&&b.honroCanonical===true&&b.honroMapOrigin==='campaign'&&b.honroAuthoredId==='stage-57'&&activation.embedded===false&&activation.training===false&&activation.debug===false&&activation.custom===false))return releaseDenial('not exact canonical owner');
  const resumed=checkpoint!==null,afterFold=resumed&&checkpoint.boundary==='after-fold';
  if(resumed&&!(verifyResume({checkpoint,engine:e,pack,activation,previous,carriedProfile})===true&&checkpoint.version===1&&checkpoint.stage===57&&['before-fold','after-fold'].includes(checkpoint.boundary)))return releaseDenial('resume authority or checkpoint stage mismatch');
  const source=earlierResult(previous,b,pack);
  if(!source||source.won!==true||source.flags?.['act6.temporaryPassageEscaped']!==true||!source.actor||!eq(source.profile,carriedProfile))return releaseDenial('wrong 56 source or permanent profile');
  const m=structuredClone(source.actor),profileBaseline=JSON.stringify(source.profile);
  const physicalKeeper=resumed?e.unit(keeperId):keeper;
  const players=()=>b.units.filter(x=>x.side===0&&!x.summoned&&x!==physicalKeeper);
  const three=players().filter(x=>x.cls!=='mage'),body=e.unit(oldBody),present=e.unit(m.id);
  if(!roleSet(three,classes.slice(0,3))||typeof m.id!=='string'||!m.id||m.cls!=='mage'||m.equipmentState?.version!==1||!alive(m))return releaseDenial('parked original identity or detached outer bodies invalid');
  if(!afterFold&&(!alive(body)||!body.honroVisualOnly||body.side!==2||!e.grounded(body)||body.x!==5384||body.y!==2976||present))return releaseDenial('intact original body required');
  if(afterFold&&(body||!alive(present)||present.cls!=='mage'||present.side!==0||!e.grounded(present)||present.summoned||checkpoint.association?.id!==m.id||!b.honroState.flags[pack.required.marker]))return releaseDenial('actual restored original body required');
  if(!resumed&&(!keeper||keeper.id!==keeperId||keeper.side!==0||!alive(keeper)||!e.grounded(keeper)||!C.validTerrainContactPose(b.terrain,keeper)||b.units.includes(keeper)||b.units.some(x=>x.id===keeperId)))return releaseDenial('known real keeper spawn missing');
  if(resumed&&(!physicalKeeper||physicalKeeper.side!==2||!physicalKeeper.fixed||!e.grounded(physicalKeeper)||checkpoint.guard?.ref!==keeperId||!b.honroState.flags[fallback]||
     b.side!==0||b.phase!=='aim'||b.projectiles.length||!e.canAct()||!players().every(a=>alive(a)&&e.grounded(a))))return releaseDenial('unsafe live restore boundary');
  if(!roster||!eq(three.map(x=>x.id),roster))return releaseDenial('mismatched actual outer body ids');
  const bridge=bindOwnedBridge({G,engine:e,pack,activation});
  if(!bridge.accepted)return releaseDenial(bridge.reason);
  if(afterFold){const check=bridge.onEvent({type:'act6.07.reunion-completed'});if(!check.accepted||check.applied)return releaseDenial('restored fold is not the exact once-applied geometry');}
  const mounted=new Set(three);let entered=resumed?structuredClone(checkpoint.entered):null,guard=resumed?structuredClone(checkpoint.guard):null,association=afterFold?structuredClone(checkpoint.association):null,ending=null,committed=false;
  if(afterFold)mounted.add(present);
  const watchPose=a=>Object.freeze({id:a.id,x:a.x,y:a.y,ground:e.grounded(a),support:e.contactSurface(a.x,a.y-4,a.y+5)?.t.id??null});
  const preserve=()=>JSON.stringify(carriedProfile)===profileBaseline;
  const native=()=>preserve()&&b.phase==='aim'&&b.side===0&&!b.projectiles.length&&e.canAct();
  const fallbackLive=()=>b.honroState.flags[fallback]===true&&three.every(alive);
  const propSafe=()=>e.unit(oldBody)===body&&alive(body)&&!b.terrain.find(t=>t.id===pack.required.wardId)?.broken&&e.grounded(body);
  function startKeeper(){
   if(entered||guard||!native()||!fallbackLive()||!propSafe())return false;
   entered=watchPose(keeper);
   b.units.push(keeper);return true; // existing authored reserved NPC, no stats assigned
  }
  function claimKeeper(actor,returnPlayer){
   if(!entered||guard||!native()||!fallbackLive()||actor!==keeper||e.active!==keeper||keeper.x-entered.x<160||Math.abs(keeper.x-site.x)>=site.r||watchPose(keeper).support!==site.host||!e.grounded(keeper)||!mounted.has(returnPlayer))return false;
   const end=watchPose(keeper);
   if(!e.select(returnPlayer.id))return false;
   Object.assign(keeper,{side:2,honroAlly:true,honroVisualOnly:true,fixed:true,acted:true,awake:false});
   guard=Object.freeze({anchor:site,ref:keeper.id,spawn:entered,end,afterSide:2,syntheticCombatRole:false});return true;
  }
  function reunite(actor){
   if(association||!guard||!native()||!mounted.has(actor)||e.active!==actor||!fallbackLive()||!propSafe()||!three.every(a=>e.grounded(a)&&Math.hypot(a.x-body.x,a.y-body.y)<pack.required.reunionRadius)||b.units.some(x=>x.id===m.id))return false;
   const foldedTerrain=[...b.terrain,...pack.additions.terrain];
   if(three.some(a=>!C.validTerrainContactPose(foldedTerrain,a)))return false;
   const orig=structuredClone(m),slot=b.units.indexOf(body);
   Object.assign(orig,{x:body.x,y:body.y,spawnX:body.x,spawnY:body.y,vx:0,vy:0,airborne:false,jumping:false,acted:false});
   if(orig.side!==0||orig.summoned||!e.grounded(orig)||!C.validTerrainContactPose(foldedTerrain,orig))return false;
   b.units.splice(slot,1,orig);
   const opened=bridge.onEvent({type:'act6.07.reunion-completed'});
   if(!opened.accepted||!opened.applied){b.units.splice(slot,1,body);return false;}
   mounted.add(orig);
   association=Object.freeze({id:orig.id,world:[orig.x,orig.y],guard,colliders:opened.ids.slice(),seamReady:true});
   return true;
  }
  function nativePosition(){
   if(!association||ending||!preserve()||['lost','won'].includes(b.phase))return null;
   const four=players(),offset={x:3200,y:-758};
   if(!roleSet(four,classes)||four.some(a=>!mounted.has(a)||!e.grounded(a)||watchPose(a).support!=='local-07-08-exact-receiving-slice'||Math.abs((a.x-offset.x)-exits[a.cls])>30))return null;
   const poses=four.map(a=>Object.freeze({id:a.id,role:a.cls,hp:a.hp,focus:a.focus,shield:a.shield,loadout:a.loadout.slice(),equipmentState:structuredClone(a.equipmentState),receiving:[a.x-offset.x,a.y-offset.y]}));
   ending=Object.freeze({id:57,stage:57,won:true,settlement:false,actors:Object.freeze(four.map(a=>structuredClone(a))),body:poses,flags:Object.freeze({'act6.fallbackRelaySecured':true,'act6.fourCorporealJoined':true}),guard,association,scene:'act6-07-folded-bridge'});
   return ending;
  }
  function exportCheckpoint(){
   if(!native()||!guard||ending||!players().every(a=>alive(a)&&e.grounded(a)))return null;
   return structuredClone({version:1,stage:57,boundary:association?'after-fold':'before-fold',entered,guard,association,actor:m.id});
  }
  used.add(e);
  return Object.freeze({accepted:true,startKeeper,claimKeeper,reunite,nativePosition,exportCheckpoint,settlement(r){if(committed||!ending||!preserve()||r!==ending||b.phase!=='won')return null;committed=true;return ending.flags;},read:()=>({guard,association,ending,profilePreserved:preserve()})});
 }
 return mount;
}
