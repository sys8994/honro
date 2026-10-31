// Demonstrate why yielding over the live graph plus a dirty boolean is not an atomic snapshot.
import assert from 'node:assert/strict';
let resume;const gate=new Promise(r=>resume=r);
const state={dirty:true,boatX:100,passengerX:110};
async function naive(){const dirtyBefore=state.dirty,boatX=state.boatX;await gate;return{dirtyBefore,dirtyAfter:state.dirty,boatX,passengerX:state.passengerX};}
const pending=naive();state.boatX=200;state.passengerX=210;state.dirty=true;resume();const result=await pending;
assert.deepEqual(result,{dirtyBefore:true,dirtyAfter:true,boatX:100,passengerX:210});
assert.notEqual(result.passengerX-result.boatX,10);
console.log('PASS demonstrates dirty-boolean undetected mixed-state snapshot; this is not a production save');
