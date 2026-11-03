/** Explicit dock-edge starting-pose fixture; thereafter only production App
 * drop, movement and frames. Not fresh stage entry/combat/acceptance evidence. */
import assert from 'node:assert/strict';
import {createFinale} from './bootstrap.mjs';
const actions=[],{g,C,app,e,b,ops}=await createFinale({record:a=>actions.push(a)});assert(ops.ready(),'fixture App not input-ready');assert(ops.select('mage'),'ordinary mage selection failed');const u=e.active;
// Only this declared fixture setup sets pose. Enemies and residents remain real.
Object.assign(u,{x:2200,y:2893,vx:0,vy:0,jumping:false,airborne:false,acted:false});
assert.equal(e.contactSurface(u.x,u.y-8,u.y+10)?.t.id,'approved40-dock');assert(e.grounded(u));assert(ops.drop(),'ordinary App drop unavailable');
let frames=0;for(;frames<700&&u===e.active&&u.moveLeft>0;frames++){
 if(app.canInput()&&u.x<2460)ops.move(1,C.STEP);ops.frame();
 const support=e.contactSurface(u.x,u.y-8,u.y+10)?.t.id;if(support==='a4-return-deck'&&e.grounded(u)&&u.x>=2420)break;
}
const support=e.contactSurface(u.x,u.y-8,u.y+10)?.t.id;assert.equal(support,'a4-return-deck');assert(e.grounded(u));assert(u.x>=2420&&u.hp>0);assert.equal(b.round,1);assert.equal(b.units.filter(v=>v.side===1&&!v.dead).length,42);console.log(JSON.stringify({scope:'Declared starting-pose fixture then actual App inputs; no kills/teleport during route',frames,x:u.x,y:u.y,support,remainingMove:u.moveLeft,hp:u.hp,actions},null,2));
