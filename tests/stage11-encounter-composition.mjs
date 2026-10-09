// Revision-2 state/physics fixtures. Not normal campaign-completion evidence.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
const make=()=>{const profile=C.defaults();profile.recruited=['archer','mage','knight','occultist'];for(const cls of profile.recruited)profile.heroes[cls].xp=C.xpAtLevel(10);const q=battlefield(g,11,{profile});g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct2.attach(q.app,q.e);assert.equal(q.b.honroStage11EncounterRevision,2);return q;};
const point=(q,id,x)=>({x,y:C.topAt(q.b.terrain.find(t=>t.id===id),x)});
const boundary=q=>{q.app.actorBoundary=q.e.active.id;q.b.honroState.actorTurnSerial=(q.b.honroState.actorTurnSerial||0)+1;g.HonroMission.tick(q.app,0);q.app.actorBoundary=null;};
{
 const q=make(),before=q.b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp}));
 for(let frame=0;frame<960;frame++)q.e.stepUnits(C.STEP);
 for(const old of before){const u=q.e.unit(old.id);assert(Math.hypot(u.x-old.x,u.y-old.y)<.08,old.id+' has no unsolicited settling drift/fall');assert.equal(u.hp,old.hp,old.id+' has no spawn collision damage');if(!g.HonroWorld.archetypes[u.honroVariant]?.flying)assert(C.validTerrainContactPose(q.b.terrain,u));}
 rows.push({check:'dense body settling',seconds:8,actors:before.length,changedHP:0,scope:'Real stepUnits settling without AI or player actions; not two combat turns'});console.log('PASS dense roster: eight seconds of real settling, no overlap ejection, fall or HP change');
}
{
 const q=make(),u=q.e.active;Object.assign(u,point(q,'rv-ritual-buttress',6250));q.e.refreshActivation();
 const local=q.e.alive(1).filter(v=>['ritual-court-guard','saddle-crossfire'].includes(v.honroRavinePlace)),awake=local.filter(v=>v.awake);
 assert.equal(local.length,14);assert(awake.length>0&&awake.length<14,'The whole place is not one activation group');
 assert(local.filter(v=>v.honroRavineCell==='ritual-command').every(v=>!v.awake));assert(local.filter(v=>v.honroRavineCell==='ritual-upper-right').every(v=>!v.awake));
 const captain=local.find(v=>v.honroRavineCell==='ritual-command');q.e.hurt(captain,1,u.id);q.e.refreshActivation();assert(local.filter(v=>v.honroRavineCell==='ritual-command').every(v=>v.awake),'An attacked command pair reacts immediately');
 q.b.phase='transition';q.b.side=0;q.e.switchTeam();assert.equal(q.b.side,1);assert(q.b.queue.length<=4&&q.b.queue.includes(q.b.active),'Real enemy queue includes the active enemy and keeps the four-action cap');assert(q.e.alive(1).filter(v=>!v.acted).length<=4);
 rows.push({check:'separate attention cells',placeSize:14,awakeOnWestApproach:awake.map(v=>v.id),attackedCommandResponds:true,enemyQueueCap:4});console.log('PASS central front/support/command wake separately; real enemy queue remains capped');
}
{
 const q=make(),a=g.HonroAct2.memory(q.b),ev=q.b.honroEvents.find(v=>v.id==='ravine-response-ritual-west-pursuit');a.done['knot-west']=a.done['clear-west']=a.done['knot-east']=true;
 for(const other of q.b.honroEvents)if(other!==ev)q.b.honroState.flags['event:'+other.id]=true;
 Object.assign(q.e.active,point(q,'rv-ritual-buttress',6236));const n=q.b.units.length;g.HonroMission.tick(q.app,0);assert.equal(q.b.units.length,n,'Warning comes before the boundary');boundary(q);
 const born=q.b.units.filter(v=>v.honroSpawnSource===ev.id),entry=q.b.honroState.ravineComposition.entries[ev.id];assert.equal(born.length,2);assert.equal(entry.choice,1,'Occupied primary entrance uses its authored same-direction alternate');assert(born.every(v=>Math.abs(v.x-q.e.active.x)>280));
 const snapshot=JSON.stringify(q.b.units);boundary(q);assert.equal(JSON.stringify(q.b.units),snapshot,'Committed alternate never duplicates on another boundary');
 rows.push({check:'safe alternate response',blockedHeroX:6236,entry,born:born.map(v=>({id:v.id,x:v.x,y:v.y})),warning:q.app.notices.find(t=>t===ev.warning)});console.log('PASS previously blocking support position receives a warned alternate entry on the next boundary');
}
{
 const q=make(),a=g.HonroAct2.memory(q.b);a.done['knot-west']=a.done['clear-west']=a.done['knot-east']=true;for(const ev of q.b.honroEvents)q.b.honroState.flags['event:'+ev.id]=true;
 const m=q.b.honroMarkers.find(m=>m.id==='hold-knots');Object.assign(q.e.active,{x:m.x,y:m.y});q.app.actorBoundary=q.e.active.id;q.b.honroState.actorTurnSerial=1;g.HonroMission.tick(q.app,0);assert.equal(a.holds['hold-knots'].spawned,0,'First warning is not an immediate ambush');
 boundary(q);assert.equal(a.holds['hold-knots'].spawned,3);q.b.round++;boundary(q);assert.equal(a.holds['hold-knots'].spawned,6);
 const n=q.b.units.length;for(let i=0;i<6;i++){q.b.round++;boundary(q);}assert.equal(q.b.units.length,n);assert.equal(Object.keys(q.b.honroState.ravineComposition.echoWarnings).length,2);
 rows.push({check:'finite warned defense',warnings:2,echoes:6,immediateFirstSpawn:false});console.log('PASS defense gives an action to prepare, then exactly two compact three-echo groups');
}
{
 const q=make(),a=g.HonroAct2.memory(q.b),m=q.b.honroMarkers.find(m=>m.id==='resident'),host=q.e.unit(m.target),spirit=q.e.unit(m.spiritId),sodan=q.e.heroesAlive().find(u=>u.cls==='occultist');
 for(const step of g.HonroAct2.steps(q.b)){if(step.id==='resident')break;a.done[step.id]=true;}for(const ev of q.b.honroEvents)q.b.honroState.flags['event:'+ev.id]=true;
 Object.assign(sodan,point(q,'rv-lower-refuge-rock',9680));q.b.active=sodan.id;spirit.hp=Math.floor(spirit.maxHp*.4);const hp=host.hp,start={x:host.x,y:host.y};assert(g.HonroAct2.use(q.app,m));
 q.b.phase='flight';g.HonroMission.tick(q.app,.1);assert.equal(host.x,start.x,'Civilian does not walk into a firing/impact window');q.b.phase='aim';q.b.side=0;
 for(let frame=0;frame<480;frame++){q.e.stepUnits(C.STEP);g.HonroMission.tick(q.app,C.STEP);}
 const state=q.b.honroState.ravineComposition.shelter;assert.equal(state.status,'done');assert(host.fixed&&!host.honroAlly&&host.honroProtected);assert(Math.abs(host.x-q.b.honroStage11Shelter.x)<3);assert.equal(host.hp,hp);assert(C.validTerrainContactPose(q.b.terrain,host));assert.equal(g.HonroAct2.failure(q.b),null);
 const at=JSON.stringify({x:host.x,y:host.y,hp:host.hp,state});for(let i=0;i<60;i++)g.HonroMission.tick(q.app,C.STEP);assert.equal(JSON.stringify({x:host.x,y:host.y,hp:host.hp,state}),at,'Shelter motion finishes once');
 rows.push({check:'resident retreats on actual support',start,end:{x:host.x,y:host.y},hp,selectableAlly:false,protectionsPreserved:true});console.log('PASS Sodan extraction sends the living resident behind the nearby bundles through real one-time walking');
}
await mkdir('_local/reports/stage11-encounter-composition',{recursive:true});await writeFile('_local/reports/stage11-encounter-composition/runtime.json',JSON.stringify({rows,scope:'Controlled state and real physics fixtures, not a fresh normal-play clear.'},null,2)+'\n');
