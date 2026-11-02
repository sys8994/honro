/** Pure candidate engine; production preview observations belong only to live renderer input. */
import assert from 'node:assert/strict';
export function detachedPlanner(C,b){
 const before=JSON.stringify(b),copy=JSON.parse(before),engine=new C.Engine(copy,()=>{},true);
 const check=()=>assert.equal(JSON.stringify(b),before,'Candidate planning mutated live battle');check();
 return {engine,unit:id=>engine.unit(id),check};
}
