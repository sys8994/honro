/** Observers only. Wrapping production calls never changes their arguments or
 * results. Every live actor write must originate inside a production call. */
export function auditQuarryEngine(b,e,stamp,{previous=null}={}){
 const log=previous||{externalWrites:[],recoveries:[],movement:[]},seen=new WeakSet();let depth=0;
 const guard=()=>{for(const u of b.units){if(seen.has(u))continue;seen.add(u);for(const key of ['x','y','hp','focus','moveLeft']){let value=u[key];Object.defineProperty(u,key,{enumerable:true,configurable:true,get(){return value;},set(next){if(!depth&&next!==value){log.externalWrites.push({...stamp(),id:u.id,key,from:value,to:next});throw Error('External live actor write '+u.id+'.'+key);}value=next;}});}}};
 const names=new Set(['tick','move','jump','walk','integrateBody','fire','hurt','impact','finishAction','enemyAction','wait','select','recover','blast','stepProjectile']);
 for(const key of names){if(key==='constructor'||typeof e[key]!=='function')continue;const call=e[key].bind(e);e[key]=(...args)=>{const u=['walk','jump'].includes(key)?args[0]:null,before=u?.moveLeft;depth++;try{const result=call(...args);if(key==='recover')log.recoveries.push({...stamp(),id:args[0]?.id});if(u?.side===0&&before>u.moveLeft)log.movement.push({...stamp(),id:u.id,cls:u.cls,op:key,cost:before-u.moveLeft,x:u.x,y:u.y});return result;}finally{depth--;}};}
 guard();return{log,guard,production(fn){depth++;try{return fn();}finally{depth--;}}};
}
