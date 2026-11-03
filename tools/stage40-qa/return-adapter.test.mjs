/** Explicit combat-cleared upper-coast fixture to test the native return
 * adapter, not evidence that this party arrived or cleared combat naturally. */
import assert from 'node:assert/strict';
import {createFinale} from './bootstrap.mjs';
import {completeNativeReturn} from './return-inputs.mjs';
const q=await createFinale(),{b,C,ops}=q;ops.ready();b.units=b.units.filter(v=>v.side!==1);const coast=b.terrain.find(t=>t.id==='approved40-coast-west');
for(const [id,x]of [['archer',2620],['mage',2920],['knight',3140],['occultist',3360]]){const u=b.units.find(v=>v.id===id),y=C.terrainSurfaces(coast,x)[0].y;Object.assign(u,{x,y,vx:0,vy:0,jumping:false,airborne:false,acted:false});}
const events=[];try{const result=completeNativeReturn({...q,record:x=>{events.push(x);if(events.length%20===0)console.log(JSON.stringify(x));}});console.log(JSON.stringify({result,events},null,2));assert(result.fullReturn);}catch(error){console.log(JSON.stringify({events,last:b.honroAct4PreviewState,heroes:b.units.filter(v=>v.side===0).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp}))}));throw error;}
