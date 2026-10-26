/** Focused projectile fixtures, not campaign play or browser evidence.
 * Move the archer once to an explicitly named, supported real map surface and
 * remove other actors to isolate terrain collision. No terrain/zone edits,
 * invented target, projectile placement, or manual projectile integration.
 * Both force states use production Engine.predict, fire, and stepProjectile.
 */
import assert from 'node:assert/strict';
import {runtimeCandidate,battlefield,plain} from './act23-v4-helpers.mjs';
const g=await runtimeCandidate(),C=g.HONRO_CORE,V=g.HonroAct23V4;
const cases=[
 {stage:15,support:'act2-floor',x:5100,angle:15,power:.5,terminal:'act2-floor',minimumShift:4},
 {stage:18,support:'act2-floor',x:5750,angle:30,power:1,terminal:'sb-inner-lower-approach',minimumShift:10}
];
const inside=(p,z)=>p.x>=z.x&&p.x<=z.x+z.w&&p.y>=z.y&&p.y<=z.y+z.h;
function fixture(spec,forceOn){const q=battlefield(g,spec.stage),{b,e}=q,u=e.heroesAlive().find(u=>u.cls==='archer'),support=b.terrain.find(t=>t.id===spec.support),field=plain(b.honroAct23V4TrajectoryForce);
 assert(V.active(b));assert.equal(field.revision,1);assert(Math.abs(field.ax)>0&&Math.abs(field.ax)<=60);assert(support&&!support.broken);
 // This explicit supported starting pose and isolated actor list are test setup.
 Object.assign(u,{x:spec.x,y:C.topAt(support,spec.x),vx:0,vy:0,acted:false});b.units=[u];b.active=u.id;b.phase='aim';b.side=0;e.checkEnd=()=>false;
 assert(C.validTerrainContactPose(b.terrain,u));assert(e.grounded(u));assert(u.loadout.includes('A01'));
 if(!forceOn)delete b.honroAct23V4TrajectoryForce;
 return{...q,u,field};
}
function fire(spec,forceOn){const q=fixture(spec,forceOn),{b,e,u,field}=q,terrainBefore=JSON.stringify(b.terrain),anomalyBefore=JSON.stringify(b.honroState.bellAnomaly),eventsBefore=JSON.stringify(q.p.honroStoryEvents),prediction=plain(e.predict(u,C.SKILLS.A01,spec.angle,spec.power)),contacts=[],observed=[];
 assert(prediction.points.length>10);assert.equal(prediction.terrain,spec.terminal);assert(!prediction.unit);
 assert(prediction.points.some(p=>inside(p,field.zone)),'Predicted shot physically enters authored force zone');
 assert.equal(b.honroBellWitness,undefined);assert(!g.HonroBellAnomaly.active(b));
 const impact=e.impact.bind(e);e.impact=function(projectile,hit){contacts.push({skill:projectile.skill,owner:projectile.owner,terrain:hit.terrain?.id,unit:hit.unit?.id,x:hit.x,y:hit.y});return impact(projectile,hit);};
 assert(e.fire('A01',spec.angle,spec.power),'Real A01 launch');assert.equal(b.projectiles.length,1);
 const arrow=b.projectiles[0];assert.equal(arrow.skill,'A01');let frames=0,entered=false,disappearedWithoutContact=false;
 while(b.projectiles.length&&frames++<2400){for(const p of [...b.projectiles])if(b.projectiles.includes(p)){observed.push({x:p.x,y:p.y});entered||=inside(p,field.zone);const before=contacts.length;e.stepProjectile(p,C.STEP);if(!b.projectiles.includes(p)&&contacts.length===before)disappearedWithoutContact=true;}}
 assert.equal(b.projectiles.length,0,'Shot reaches a finite terminal state');assert(frames>1&&frames<2400);assert(entered,'Actual arrow enters authored force zone');assert.equal(contacts.length,1,'A01 has exactly one terminal collision');assert.equal(disappearedWithoutContact,false,'Arrow removal has an actual collision, never anomalous disappearance');
 const terminal=contacts[0];assert.equal(terminal.owner,u.id);assert.equal(terminal.skill,'A01');assert.equal(terminal.terrain,prediction.terrain);assert.equal(terminal.unit,undefined);
 const error=Math.hypot(prediction.x-terminal.x,prediction.y-terminal.y);assert(error<1e-6,'Production predictor/live terminal collision agreement: '+error);
 assert.equal(JSON.stringify(b.terrain),terrainBefore,'Actual shot does not change real map terrain');assert.equal(b.honroBellWitness,undefined);assert.equal(JSON.stringify(b.honroState.bellAnomaly),anomalyBefore,'No anomaly scene/witness state');assert.equal(JSON.stringify(q.p.honroStoryEvents),eventsBefore,'No fabricated bell story receipt');assert(!q.app.speeches.length);
 return{stage:spec.stage,forceOn,support:spec.support,pose:{x:u.x,y:u.y},angle:spec.angle,power:spec.power,field,frames,entered,prediction:{x:prediction.x,y:prediction.y,terrain:prediction.terrain},terminal,error,observed};
}
for(const spec of cases){const forced=fire(spec,true),ordinary=fire(spec,false),shift=Math.hypot(forced.prediction.x-ordinary.prediction.x,forced.prediction.y-ordinary.prediction.y);assert(shift>spec.minimumShift,'Removing the force changes the production predictor terminal');assert(Math.hypot(forced.terminal.x-ordinary.terminal.x,forced.terminal.y-ordinary.terminal.y)>spec.minimumShift,'Actual terminal collision also changes');assert.equal(forced.observed[0].x,ordinary.observed[0].x);assert.equal(forced.observed[0].y,ordinary.observed[0].y);
 assert(forced.observed.some((p,i)=>ordinary.observed[i]&&Math.hypot(p.x-ordinary.observed[i].x,p.y-ordinary.observed[i].y)>.05),'Actual paths diverge after launch');
 console.log('PASS',JSON.stringify({stage:spec.stage,support:spec.support,pose:forced.pose,angle:spec.angle,power:spec.power,terminal:spec.terminal,forceShift:shift,forceOnEndpointError:forced.error,forceOffEndpointError:ordinary.error,frames:[forced.frames,ordinary.frames],witness:false,disappearance:false}));
}
console.log('PASS candidate15/18 production prediction/fire trajectory parity on unchanged real terrain; isolated supported shot fixtures only.');
