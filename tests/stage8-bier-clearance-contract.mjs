/** Negative controls for the hero-only audit, never gameplay collision edits. */
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {heroClearance} from './stage8-bier-clearance-helper.mjs';
const g=await runtime({legacyMaps:false}),{b,e}=battlefield(g,8,{entry:false}),u=e.heroesAlive()[0];
Object.assign(u,{x:500,y:1000,r:22,h:92,vy:0,vx:0,fixed:false,airborne:false,jumping:false});
const box=(id,x,y,w,h)=>({id,x,y,w,h,hp:99999,maxHp:99999,mat:'rock',broken:false,oneWay:false});
const floor=box('floor',0,1000,1000,200);b.units=[u];b.terrain=[floor];
assert.deepEqual(heroClearance(g,e,u).blocked,[]);
for(const t of[box('head-roof',475,880,50,36),box('thin-shoulder-wall',518,940,3,44),box('torso-slab',475,950,50,5)]){
 b.terrain=[floor,t];const q=heroClearance(g,e,u);assert(q.raw.some(v=>v.id===t.id));assert(q.blocked.some(v=>v.id===t.id),'Full-width head/torso collision cannot be foot contact '+t.id);
}
b.terrain=[floor,box('toe-step',518,991,20,9)];let q=heroClearance(g,e,u);assert(q.raw.length>0);assert.equal(q.blocked.length,0);assert(q.contacts.some(v=>v.id==='toe-step'&&v.kind==='supported-exposed-contour'));
b.terrain=[box('ledge',510,1000,100,40)];Object.assign(u,{y:1000.27,vy:1});q=heroClearance(g,e,u);assert(q.raw.length>0);assert.equal(q.blocked.length,0);assert(q.contacts.every(v=>v.kind==='descending-foot-transition'));
Object.assign(u,{y:1050,vy:1});assert(heroClearance(g,e,u).blocked.length>0,'Deeply embedded falling body is never a foot transition');
console.log('PASS hero audit controls: clear floor, head roof, thin shoulder wall, torso slab, sole step, descending sole, deep embedding');
