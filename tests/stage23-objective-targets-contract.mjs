/** Tiny policy boundary fixtures only, not gameplay proof. */
import assert from 'node:assert/strict';
import {escortRelevant} from '../tools/stage23-qa/objective-threats.mjs';
const near=(a,z,r)=>!!z&&Math.abs(a.y-z.y)<=150&&Math.hypot(a.x-z.x,(a.y-z.y)*.75)<=r;
const V={mem:b=>b.root,current:b=>b.goal,marker:(b,id)=>b.honroMarkers.find(p=>p.id===id),near};
const b={root:{carrierStarted:true},goal:{id:'dock-mid',kind:'escort'},units:[{id:'act3-carrier',x:0,y:1000}],honroMarkers:[{id:'route:dock-mid:0',x:200,y:1000},{id:'dock-exit',x:1000,y:1000}]};
const hero={x:-700,y:1000,r:25},foe={x:450,y:1000,r:25};const before=JSON.stringify(b);
assert(escortRelevant(V,b,hero,foe));assert.equal(JSON.stringify(b),before);
b.honroReviewed23PacingCandidate={id:'escort-close-130',version:1};assert(!escortRelevant(V,b,hero,foe));
foe.x=130;assert(escortRelevant(V,b,hero,foe));foe.x=131;assert(!escortRelevant(V,b,hero,foe));
foe.x=hero.x+100;assert(escortRelevant(V,b,hero,foe));
foe.x=600;b.root.carrierGoals={'dock-exit':true};assert(escortRelevant(V,b,hero,foe));
foe.x=1501;assert(!escortRelevant(V,b,hero,foe));
b.goal={id:'dispatch-bundle',kind:'interact'};assert(escortRelevant(V,b,hero,foe));
console.log(JSON.stringify({passed:true,scope:'Read-only targeting-policy radius, waypoint, close-body, final-safe and non-escort fixtures. Not actual play or a product change.'}));
