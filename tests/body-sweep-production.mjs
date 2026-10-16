// Real authored terrain, isolated actor/cast fixtures; not normal chapter clears.
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
let count=0;
const expectedSlopes={1:4,3:4,5:4,11:4,18:4,27:2}; // Reviewed final Stage27 adds two valid solid slope probes.
for(const stage of [1,3,5,11,18,27]){
 const template=battlefield(g,stage).b;
 let sampled=0;
 for(const terrain of template.terrain){
  if(terrain.broken||terrain.oneWay)continue;
  const vertices=C.poly(terrain);
  for(let i=0;i<vertices.length;i++){
   const a=vertices[i],z=vertices[(i+1)%vertices.length],slope=(z.y-a.y)/(z.x-a.x);
   if(z.x-a.x<40||Math.abs(slope)<.15||Math.abs(slope)>3)continue;
   const x=(a.x+z.x)/2,y=(a.y+z.y)/2;
   const actor=C.makeUnit('knight',0,x,y,{id:'prod-probe',loadout:['S15'],focus:999,maxFocus:999,ranks:{S15:8},acted:false});
   if(!C.validTerrainContactPose(template.terrain,actor))continue;
   for(const angle of [15,45,135,165]){
    const b=structuredClone(template);
    Object.assign(b,{units:[structuredClone(actor)],active:actor.id,phase:'aim',side:0,projectiles:[]});
    const e=new C.Engine(b),u=e.active;
    assert(e.fire('S15',angle,1));
    for(let tick=0;tick<2000&&b.projectiles.length;tick++){
     e.stepProjectile(b.projectiles[0],1/120);
     assert(!b.terrain.some(t=>!t.broken&&!t.oneWay&&C.terrainContains(t,u.x,u.y-.2)),`${stage}/${terrain.id}/${angle}/${tick}: ${u.x},${u.y}`);
    }
    count++;
   }
   if(++sampled>=4)break;
  }
  if(sampled>=4)break;
 }
 assert.equal(sampled,expectedSlopes[stage],'Exact reviewed slope coverage for stage '+stage);
 console.log('stage',stage,'slopes',sampled);
}
assert.equal(count,88,'Exact current production sample coverage');
console.log('PASS production slope rush',count);
