/** Actual core plans and useGate, with terrain/actor/hazard/save boundaries. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const {HONRO_CORE:C}=await runtime({legacyMaps:false});let count=0,currentCase='';const trace=[];
const rect=(id,x,y,w,h,extra={})=>({id,x,y,w,h,mat:'rock',hp:99999,maxHp:99999,...extra});
function arena(){
 const profile=C.defaults();profile.heroes.mage.xp=C.xpAtLevel(30);const learn=id=>{const prereq=C.TALENT_MAP[id].prereq;if(prereq&&!profile.heroes.mage.ranks[prereq])learn(prereq);assert(C.train(profile.heroes.mage,id),id+' legal fixture investment');};for(let rank=0;rank<8;rank++)learn('M09');profile.loadouts.mage=['M01','M09','',''];const b=C.createBattle(1,profile,'practice',{party:['mage'],wind:0});
 Object.assign(b,{width:3000,height:1600,terrain:[rect('floor',0,1000,3000,600)],waters:[],drafts:[],fields:[],zones:[],round:1,phase:'aim',side:0});b.units=b.units.filter(u=>u.side===0).slice(0,1);
 const u=b.units[0];Object.assign(u,{x:400,y:1000,vx:0,vy:0,airborne:false,jumping:false,acted:false,focus:50,maxFocus:100,hp:500,maxHp:1000,moveLeft:100,maxMove:1000});b.active=u.id;
 b.nextId=22;b.stakes=[{id:20,skill:'M09',owner:u.id,side:0,x:400,y:1000,rank:8,damage:0,shot:0,expires:12},{id:21,skill:'M09',owner:u.id,side:0,x:1000,y:1000,rank:8,damage:0,shot:0,expires:12}];
 const e=new C.Engine(b),resolve=e.gateResolution.bind(e);e.gateResolution=(...args)=>{const p=resolve(...args);trace.push({case:currentCase,actor:{x:u.x,y:u.y,gateTurn:u.gateTurn},ok:p.ok,reason:p.reason,from:p.from&&{x:p.from.x,y:p.from.y,id:p.from.id},to:p.to&&{x:p.to.x,y:p.to.y,id:p.to.id},spot:p.spot&&{x:p.spot.x,y:p.spot.y,distance:p.spot.distance,slope:p.spot.slope,support:p.spot.support.id}});return p;};return {profile,b,u,e};
}
function denied(a){const before=structuredClone(a.b),plan=a.e.gateResolution();assert(!plan.ok,JSON.stringify(plan));assert.deepEqual(structuredClone(a.b),before,'readiness is read-only');assert(!a.e.useGate());before.events=[...before.events,plan.reason].slice(-30);assert.deepEqual(structuredClone(a.b),before,'failure only appends its visible reason; no resource/turn/state changes');return plan;}
function test(name,fn){currentCase=name;fn();count++;console.log('PASS',name);}
test('exact support, no planning mutation, real arrival, lock, save and reversed next turn',()=>{
 const a=arena(),before=JSON.stringify(a.b),p=a.e.gateResolution();assert(p.ok);assert.equal(p.spot.x,1000);assert.equal(p.spot.y,1000);assert.equal(JSON.stringify(a.b),before);
 assert(a.e.useGate());assert.equal(a.u.x,p.spot.x);assert(a.e.grounded(a.u));denied(a);
 const profile=C.validate({...a.profile,saved:structuredClone(a.b)}),saved=profile.saved;assert.deepEqual(structuredClone(C.validate(structuredClone(profile)).saved),structuredClone(saved),'validated export/import stays exactly stable');const e=new C.Engine(saved);assert(!e.useGate());saved.round++;assert(e.useGate());assert.equal(e.active.x,400);assert(e.grounded(e.active));
});
test('occupied anchor finds the nearest body-width clearance deterministically',()=>{
 const a=arena(),foe=C.makeUnit('archer',1,1000,1000,{id:'occupied',hp:1000,maxHp:1000});a.b.units.push(foe);const p=a.e.gateResolution(),q=a.e.gateResolution();assert(p.ok);assert.deepEqual(p,q);assert(Math.abs(p.spot.x-1000)>=foe.r+a.u.r);assert(p.spot.distance<55);assert(a.e.useGate());assert.equal(a.u.x,p.spot.x);
});
test('long low ceiling escapes beyond old 96 range without landing on its roof',()=>{
 const a=arena();a.b.terrain.push(rect('low-roof',870,1000-a.u.h-35,260,55));const p=a.e.gateResolution();assert(p.ok,JSON.stringify(p));assert(p.spot.distance>96&&p.spot.distance<=220);assert.equal(p.spot.support.id,'floor');assert(a.e.useGate());assert(a.e.grounded(a.u));
});
test('all candidate surfaces are considered, including lower one-way support',()=>{
 const a=arena();a.b.terrain.unshift(rect('one-way',850,970,300,8,{oneWay:true}));const p=a.e.gateResolution();assert(p.ok);assert.equal(p.spot.y,1000);assert.equal(p.spot.support.id,'floor');
});
test('sloping support keeps full head/width clearance and exact contact',()=>{
 const a=arena();a.b.terrain=[rect('home',0,1000,600,600),rect('slope',800,900,400,500,{slope:200})];const p=a.e.gateResolution();assert(p.ok,JSON.stringify(p));assert.equal(p.spot.x,1000);assert.equal(p.spot.y,1000);assert(a.e.useGate());assert(a.e.grounded(a.u));
});
test('full-width ceiling obstruction and no support fail without cost/turn use',()=>{
 const a=arena();a.b.terrain.push(rect('roof',650,1000-a.u.h-35,700,55));denied(a);
 const b=arena();b.b.terrain=[rect('home',0,1000,600,600)];denied(b);
});
test('a valid floor in another room cannot be reached through the separating wall',()=>{
 const a=arena();a.b.terrain=[rect('home',0,1000,600,600),rect('exit-floor',950,1000,80,600),rect('low-roof',900,1000-a.u.h-35,160,55),rect('wall',1040,500,40,1100),rect('other-room',1080,1000,400,600)];denied(a);
});
test('lethal lava/deep water and stage5 wet-cliff restriction remain unavailable',()=>{
 const a=arena();a.b.waters=[{x:750,y:999,w:500,depth:200,frozen:0,kind:'lava'}];denied(a);
 const b=arena();b.b.waters=[{x:750,y:800,w:500,depth:300,frozen:0,kind:'water'}];denied(b);
 const c=arena();c.b.honroStage=5;c.b.honroStage5LakeRevision=1;c.b.stakes[1].x=2700;assert(denied(c).reason.includes('깊은 소'));
});
test('authored destination restriction participates in both readiness and execution',()=>{
 const a=arena();a.e.gateDestinationReason=p=>p.x>990?'지정 석대 안으로 이동':undefined;const p=a.e.gateResolution();assert(p.ok&&p.spot.x<=990);assert(a.e.useGate());assert.equal(a.u.x,p.spot.x);
 const b=arena();b.e.gateDestinationReason=()=> '지정 구역 금지';assert(denied(b).reason.includes('지정 구역'));
});
test('finite expiry, old missing expiry and own-side pair isolation',()=>{
 const a=arena();a.b.stakes[1].expires=a.b.round;assert(!a.e.gateCandidate());denied(a);
 const b=arena();for(const z of b.b.stakes)delete z.expires;assert(b.e.gateResolution().ok);assert(b.e.useGate());
 const c=arena();c.b.stakes[1].side=1;assert(!c.e.gateCandidate());denied(c);
});
console.log(count,'gate resolver groups passed; search radius',C.GATE_SEARCH_RADIUS);
await mkdir('_local/reports/mage-volley-gate/gate',{recursive:true});await writeFile('_local/reports/mage-volley-gate/gate/resolver-trace.json',JSON.stringify({groups:count,radius:C.GATE_SEARCH_RADIUS,trace},null,2)+'\n');
