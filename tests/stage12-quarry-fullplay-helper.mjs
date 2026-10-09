/** Observers only. Wrapping production calls never changes their arguments or
 * results. Every live actor write must originate inside a production call. */
export function auditQuarryEngine(b,e,stamp,{previous=null}={}){
 const log=previous||{externalWrites:[],recoveries:[],movement:[]},seen=new WeakSet();let depth=0;
 const guard=()=>{for(const u of b.units){if(seen.has(u))continue;seen.add(u);for(const key of ['x','y','hp','focus','moveLeft']){let value=u[key];Object.defineProperty(u,key,{enumerable:true,configurable:true,get(){return value;},set(next){if(!depth&&next!==value){log.externalWrites.push({...stamp(),id:u.id,key,from:value,to:next});throw Error('External live actor write '+u.id+'.'+key);}value=next;}});}}};
 const names=new Set(['tick','move','jump','walk','integrateBody','fire','hurt','impact','finishAction','enemyAction','wait','select','recover','blast','stepProjectile']);
 for(const key of names){if(key==='constructor'||typeof e[key]!=='function')continue;const call=e[key].bind(e);e[key]=(...args)=>{const u=['walk','jump'].includes(key)?args[0]:null,before=u?.moveLeft;depth++;try{const result=call(...args);if(key==='recover')log.recoveries.push({...stamp(),id:args[0]?.id});if(u?.side===0&&before>u.moveLeft)log.movement.push({...stamp(),id:u.id,cls:u.cls,op:key,cost:before-u.moveLeft,x:u.x,y:u.y});return result;}finally{depth--;}};}
 guard();return{log,guard,production(fn){depth++;try{return fn();}finally{depth--;}}};
}

/** Optional input-policy destination, not an actor placement. The caller must
 * reach it with the ordinary navigator and spend the live movement budget. */
export function quarryHoldStation(C,b,u){
 const sites={archer:['sq-lower-ground',6392],mage:['sq-inner-joint',6110],knight:['sq-lower-ground',6810],occultist:['sq-back-road',7140]};
 const [support,x]=sites[u.cls],terrain=b.terrain.find(t=>t.id===support),y=C.topAt(terrain,x),marker=b.honroMarkers.find(m=>m.id==='hold-road');
 if(!Number.isFinite(y)||Math.hypot(x-marker.x,y-marker.y)>=680||!C.validTerrainContactPose(b.terrain,{...u,x,y}))throw Error('Invalid authored hold station for '+u.cls);
 return{id:'hold-station-'+u.cls,x,y,support};
}

/** A companion follows a living scout's observed attack, not an unseen enemy
 * position. Actual visibility and O08 cost/effect remain production rules. */
export function quarryScoutSupport(u,scout,actions,enemies,round,visibleFoes){
 if(!scout||scout.dead||scout.id===u.id||visibleFoes.length)return null;
 const observed=[...actions].reverse().find(a=>a.op==='fire'&&a.hero===scout.cls&&a.round>=round-1);
 const target=observed&&enemies.find(v=>v.id===observed.target&&!v.dead);
 if(!target?.spiritHidden||target.manifested||target.revealSpiritToParty)return null;
 return{id:'scout-support-'+scout.id,x:scout.x,y:scout.y,scout:scout.id,observedShot:observed.shot,observedRound:observed.round};
}

/** The western formation starts after the ordinary C guards are cleared.
 * A still-hidden C spirit remains a legal local target for its actual viewer. */
export function quarryWesternEligible(goal,enemies){
 return goal?.id==='sign'&&enemies.some(u=>u.honroQuarryCell==='D')&&!enemies.some(u=>u.honroQuarryCell==='C'&&(!u.spiritHidden||u.manifested||u.revealSpiritToParty));
}
export function quarryWesternPoint(C,b,u,x){
 const support='sq-west-quarry',terrain=b.terrain.find(t=>t.id===support),y=C.topAt(terrain,x);
 if(!Number.isFinite(y)||!C.validTerrainContactPose(b.terrain,{...u,x,y}))return null;
 return{id:'western-front-'+u.cls,x,y,support};
}
export const quarryWesternOffsets=Object.freeze({archer:520,mage:720,occultist:870});
