/** Actual authored finite-wave ingress geometry. No event timing/fullplay claim. */
import assert from 'node:assert/strict';
import{mkdir,writeFile,readFile}from'node:fs/promises';import{createHash}from'node:crypto';
import{runtime,battlefield}from'../game/tests/helpers.mjs';import{authorStage8Bier}from'../tools/map-forge/stage8-bier.mjs';import{bierEntryProfile}from'./stage8-bier-entry-helper.mjs';
const g=await runtime({legacyMaps:false});g.HONRO_PROJECT=await authorStage8Bier(g.HONRO_PROJECT,g,{art:false});const{b,e}=battlefield(g,8,{profile:bierEntryProfile(g,{ordinaryStats:0,basicOnly:true}).profile,entry:false}),stage=g.HONRO_CONTENT.stages[7],before=JSON.stringify(b),rows=[];
for(const event of b.honroEvents.filter(v=>g.HonroStage8Bier.sources.includes(v.id))){const action=event.action,entry=g.HonroStage8Bier.entryFor(b,event.id);
 for(const[choice,at]of[entry,...entry.alternates].entries()){
  const shadow=structuredClone(b),slots=[],placed=[];
  for(let i=0;i<action.n;i++){
   const x=at.x+(i-(action.n-1)/2)*at.spacing,flying=!!g.HonroWorld.archetypes[action.kind]?.flying,contact=at.air&&flying?{y:at.y}:g.HonroMapEngine.surfaceY(shadow.terrain,x,at.y,at.support),y=contact?.y;
   assert(Number.isFinite(y));if(!at.air)assert.equal(contact.t.id,at.support);
   const u=g.HonroWorld.createEnemy(shadow,stage,x,action.kind,shadow.nextId+i,y,!!at.air);g.HonroStage8Bier.tuneOrdinary(shadow,u,stage,action.kind);
   assert.equal(u.x,x);assert.equal(u.y,y);
   const originalPlacement=g.HonroTerrain.place(shadow,u,{flying,maxDistance:0,clearance:18}),occupancy=g.HonroStage8Bier.hazards(shadow,u,{x:u.x-u.r-18,y:u.y-u.h-3,w:u.r*2+36,h:u.h+6});
   if(!originalPlacement)assert(occupancy.length>0,'Initial placement may only be blocked by actual actors');
   const exact=g.HonroTerrain.place({...shadow,units:placed},u,{flying,maxDistance:0,clearance:18});assert(exact,'Exact ingress exists '+event.id+' '+choice+' '+i);assert.equal(exact.x,x);assert(Math.abs(exact.y-y)<.01,'No slot repair');assert.equal(g.HonroStage8Bier.terrainBlockers(e,u).length,0,'Whole body clears actual terrain');
   placed.push(u);slots.push({x,y,kind:action.kind,body:{r:u.r,h:u.h},initialRosterPlacement:!!originalPlacement,initialOccupancy:occupancy,placementDelta:{x:exact.x-x,y:exact.y-y}});
  }
  rows.push({source:event.id,choice:choice?'same-side-alternate':'primary',side:entry.side,support:at.support||'air',slots});
 }
}
assert.equal(rows.length,6);assert.equal(rows.reduce((n,r)=>n+r.slots.length,0),16);assert.equal(JSON.stringify(b),before,'Ingress probes cannot alter actual battle/IDs/RNG/XP');
const source=Object.fromEntries(await Promise.all(['tools/map-forge/stage8-bier.mjs','tools/map-forge/stage8-bier-geometry.mjs','shared/runtime/stage8-bier.js'].map(async p=>[p,createHash('sha256').update(await readFile(p)).digest('hex')])));
await mkdir('_local/reports/stage8-bier',{recursive:true});await writeFile('_local/reports/stage8-bier/entry-contacts.json',JSON.stringify({passed:true,source,scope:'Actual authored primary and same-side-alternate slots use production enemy constructors and zero-distance placement with only previous wave slots present. Original32 actor occupancy is separately recorded: occupied alternate slots must wait, never repair. No trigger/timing/fullplay claim.',rows},null,2));console.log('PASS actual ingress: primary8 + alternate8 exact terrain slots; initial actor blockage recorded; battle unchanged');
