/** Prepared event boundary: capacity gating, rear spawn and saved once-only state. */
import assert from'node:assert/strict';import{runtime,battlefield}from'../game/tests/helpers.mjs';import{mkdir,writeFile}from'node:fs/promises';
const g=await runtime({legacyMaps:false}),{b,e,app}=battlefield(g,6),hs=b.honroState;
hs.rescued=true;for(const ev of b.honroEvents)if(ev.id!=='pursuit')hs.flags['event:'+ev.id]=true;
app.actorBoundary=e.active.id;assert.equal(g.HonroEncounters.populationCap(b),22);
g.HonroEncounters.update(app,0,{progress:4200,height:2900,broken:0,collected:0});assert(hs.pendingEvents.includes('pursuit'));assert(!hs.flags['event:pursuit']);
// Make room explicitly; this is a state fixture, not claimed player kills.
for(const u of e.alive(1).filter(u=>u.x>2600&&u.x<3700).slice(0,3)){u.hp=0;u.dead=true;}
g.HonroEncounters.update(app,0,{progress:4200,height:2900,broken:0,collected:0});assert.equal(hs.flags['event:pursuit'],true);
const spawned=b.units.filter(u=>u.honroSpawnSource==='pursuit');assert.equal(spawned.length,4);for(const u of spawned){assert(u.x<e.unit('objective').x-150);assert(g.HONRO_CORE.validTerrainContactPose(b.terrain,u));}
const count=b.units.length;g.HonroEncounters.update(app,0,{progress:4300,height:2900,broken:0,collected:0});assert.equal(b.units.length,count);
const restored=structuredClone(b);app.engine.b=restored;g.HonroEncounters.update(app,0,{progress:4400,height:2900,broken:0,collected:0});assert.equal(restored.units.length,count,'Saved once-only flag prevents repeat');
await mkdir('_local/reports/stage6-positioning',{recursive:true});await writeFile('_local/reports/stage6-positioning/pursuit.json',JSON.stringify({scope:'Explicit rescued/capacity fixture, not normal combat completion',cap:22,spawned:spawned.map(u=>({id:u.id,x:u.x,y:u.y})),onceOnly:true},null,2));console.log('PASS cap22 deferral, 4 rear hounds when room, valid contact, saved once-only');
for(const id of ['bridge-crows','bridge-boars']){const q=battlefield(g,6),action=q.b.honroEvents.find(e=>e.id===id).action;assert.notEqual(g.HonroAllies.execute(q.app,{...action,source:id}),false);const wave=q.b.units.filter(u=>u.honroSpawnSource===id);assert.equal(wave.length,4);for(const u of wave){if(id==='bridge-crows'){assert(u.y<1800);assert(g.HONRO_CORE.flightClear({b:q.b},u,{x:u.x,y:u.y}));}else{assert(u.y>2500);assert(g.HONRO_CORE.validTerrainContactPose(q.b.terrain,u));}}console.log(id,wave.map(u=>({x:u.x,y:u.y})));}
