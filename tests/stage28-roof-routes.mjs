/** Real finite Engine movement on authored geometry; isolated enemy-free fixture. */
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {drive} from './tactical-finite-driver.mjs';
import {court28Ground} from '../tools/map-forge/stage28-record-court.mjs';
const g=await runtime({legacyMaps:false}),A=g.HonroAct3,rows=[];
const access={ 'west-clerks-wing':[{x:780,y:2515}], 'raised-open-record-hall':[{x:3310,y:2220},{x:3410,y:2050}], 'east-record-annex':[{x:4800,y:2340},{x:4800,y:2240}], 'water-yard-shed':[{x:6150,y:2420}] };
const roofs=[['west-clerks-wing',1030,2343],['raised-open-record-hall',3760,1905],['east-record-annex',4750,2118],['water-yard-shed',6340,2258]];
for(const cls of ['knight','occultist','archer','mage']){
 const q=battlefield(g,28),{e,b,app}=q;app.actorBoundary={};b.units=b.units.filter(u=>u.side===0);e.checkEnd=()=>false;A.attach(app,e);
 for(const [who,id] of [['knight','fire-screen'],['archer','water-release']]){const hero=e.heroesAlive().find(u=>u.cls===who),m=A.marker(b,id);assert(drive(g,q,hero,[{x:m.x,y:m.y}],{jump:true,strictPose:false}).passed);e.select(hero.id);assert(A.use(app,m));}
 const u=e.heroesAlive().find(u=>u.cls===cls);
 for(const [id,x,y] of roofs){
  const roof=b.terrain.find(t=>t.id.includes(id+'-roof'));assert(roof?.oneWay,id+' uses existing platform collision');
  const r=drive(g,q,u,[{x:x-130,y:court28Ground(x-130)},{x,y:court28Ground(x)}, ...access[id], {x:access[id].at(-1).x,y,support:roof.id}, {x,y,support:roof.id}, {x:x+130,y,support:roof.id,drop:true},{x:x+130,y:court28Ground(x+130)}],{jump:true,automaticDrop:true,strictPose:true,label:id});
  assert(r.passed,JSON.stringify(r.failure));assert(r.counts.jumps>0);assert(r.events.some(e=>e.op==='drop'));assert(r.movementCost>0);rows.push({cls,roof:id,...r});
  if(cls==='archer'&&id==='raised-open-record-hall'){
   const up=drive(g,q,u,[...access[id],{x:3410,y,support:roof.id},{x,y,support:roof.id}],{jump:true,strictPose:true});assert(up.passed,JSON.stringify(up.failure));
   await mkdir('review/stage28/roof',{recursive:true});await writeFile('review/stage28/roof/roof-fixture.json',JSON.stringify({scope:'Enemy-free geometry fixture after finite input; not normal combat',b}));
   const down=drive(g,q,u,[{x,y,drop:true},{x,y:court28Ground(x)}],{jump:true,automaticDrop:true,strictPose:true});assert(down.passed);
  }
 }
}
await mkdir('review/stage28/roof',{recursive:true});await writeFile('review/stage28/roof/routes.json',JSON.stringify({passed:true,scope:'All four bodies, real finite move/jump/drop on authored roof collision; enemy-free geometry fixture, no skill or pose override',rows},null,2));
console.log('PASS 16 roof routes: ground access, jump through from below, ridge landing/walk and downward drop, finite ordinary resources');
