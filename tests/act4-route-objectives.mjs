/** Checkpoint fixtures for the real interaction and victory predicates. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness} from './app-regression-helpers.mjs';
import {supportPoint} from '../shared/act4-finale-revision.mjs';

process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g;
g.HonroApp=h.load(h.profileThrough(36));
g.HonroScene.prototype.landmark=function(){};
g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
g.HONRO_ACT4_PILOT_COMBAT_REFERENCE=JSON.parse(await readFile('shared/data/act4/pilot-combat-reference.json','utf8'));
for(const file of ['act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-pilot-combat']){
 vm.runInContext(await readFile(`shared/runtime/${file}.js`,'utf8'),g);
}
const P=g.HonroAct4TerrainPreview;

function fixture(n){
 const app=h.load(h.profileThrough(n-1));app.launch(n);app.close();h.finish(app);g.HonroApp=app;
 const e=app.engine,b=e.b,map=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===n),q=P.previewMemory(b);
 Object.assign(b,{phase:'aim',side:0,active:'archer'});b.honroAct4Official=1;
 const heroes=P.eventAPI.party(b),place=(u,s,x)=>Object.assign(u,supportPoint(map,s,x),{vx:0,vy:0,airborne:false,jumping:false,acted:false});
 const exit=()=>heroes.forEach((u,i)=>place(u,`approved${n}-${n===37?'upper-road':'upper'}`,b.honroAct4Design.exit.x-220+45*i));
 const stop=ids=>ids.forEach(id=>{const u=e.unit(id);u.hp=0;u.dead=true;});
 return {app,e,b,q,heroes,place,exit,stop};
}

{
 const {app,e,b,q,heroes,place,exit,stop}=fixture(37);
 q.events.signal={terminal:true,started:true,presented:[]};exit();
 assert(P.interact(app,true),'old save retains its original exit contract');
 P.beginRouteObjectives(b);assert(!P.interact(app,true),'exit and signal cannot substitute for road clearance');
 place(heroes[0],'approved37-lower-diagonal',1320);
 stop(['a4-37-a-1','a4-37-a-2','a4-37-a-3','a4-37-b-1']);P.coastObserve(app,.025);
 assert.equal(q.routeObjectives.crossed.road.actor,'archer');
 place(heroes[0],'approved37-upper-road',1480);
 stop(['a4-37-e-1','a4-37-h-1','a4-37-h-2','a4-37-h-3']);P.coastObserve(app,.025);
 assert.equal(q.routeObjectives.crossed.ridge.actor,'archer');
 exit();assert(P.interact(app,true));assert(P.interact(app));assert.equal(b.phase,'won');assert(e.alive(1).length>0);
}
{
 const {app,e,b,q,heroes,place}=fixture(37);P.attachCoast(app);P.beginRouteObjectives(b);
 place(heroes[0],'approved37-lower-diagonal',1450);place(heroes[1],'approved37-lower-diagonal',1520);P.coastObserve(app,.025);
 g.performance={now:()=>2000+(app.turnNotice?.pauseUntil||0)};
 assert(app.canInput(),'input resumes after the turn notice');
 const before={can:e.canAct(),side:b.side,phase:b.phase,active:e.active?.id};app.defend();P.coastObserve(app,.025);
 assert(!q.routeObjectives.crossed.road,'defending by itself does not count as a crossing');
 place(heroes[1],'approved37-lower-diagonal',1350);P.coastObserve(app,.025);
 assert.equal(q.routeObjectives.crossed.road?.cover,'archer',JSON.stringify({before,active:e.active?.id,route:q.routeObjectives,points:heroes.map(u=>[u.id,u.x,u.y,u.shield,u.acted,e.contactSurface(u.x,u.y-4,u.y+5)?.t.id])}));
 assert(e.alive(1).some(u=>u.id==='a4-37-a-1'));
}
for(const route of ['upper','lower']){
 const {app,e,b,q,heroes,place,exit,stop}=fixture(38);P.beginRouteObjectives(b);
 exit();assert(!P.interact(app,true),'exit without reconnaissance must fail');
 place(heroes[0],route==='upper'?'approved38-upper':'approved38-rescue-ledge',route==='upper'?4540:4620);
 const scout=heroes[0],contact=e.contactSurface(scout.x,scout.y-4,scout.y+5)?.t.id;
 assert(P.interact(app),JSON.stringify({route,contact,x:scout.x,y:scout.y,phase:b.phase,active:b.active,residents:b.units.filter(v=>v.honroAct4Resident).map(v=>[v.id,v.x,v.y,v.hp])}));assert.equal(q.routeObjectives.recon.route,route);assert.equal(q.routeObjectives.recon.residents.length,4);
 exit();assert(!P.interact(app,true),'reconnaissance does not clear the pursuit route');
 stop(route==='upper'?['a4-38-d-1','a4-38-e-1']:['a4-38-pursuer-0','a4-38-pursuer-1']);P.coastObserve(app,.025);
 q.connected={stageOnly:true};assert(P.interact(app));assert.equal(b.phase,'won');
 assert.equal(q.completionProof.connection.physicalRoute,true,'installed and unused connection is never recorded as traversal');
}
{
 const {app,e,b,q,heroes,place}=fixture(39);P.beginRouteObjectives(b);
 q.exitStable={actor:'mage'};q.netOpen={actor:'occultist'};
 const resident=e.unit('a4-rescue-0'),x=resident.x;
 for(let i=0;i<5;i++){b.shot++;P.coastObserve(app,.05);}
 assert.equal(resident.x,x,'unrelated shots cannot move residents without a companion');
 place(heroes[0],'approved39-wreck-deck',3860);
 for(let i=0;i<10;i++)P.coastObserve(app,.05);
 assert(resident.x>x,'a nearby companion on the escort route enables real NPC walking');
}
console.log('PASS Stage 37–39 objective boundary fixtures, cover, both cave approaches, escort and legacy exit');
