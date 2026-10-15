/** Explicit empty-entry placement fixture; uses production spawn + AI and preserves atomic occupancy. */
import assert from 'node:assert/strict';import{runtime,battlefield}from'../game/tests/helpers.mjs';import{writeFile}from'node:fs/promises';
const g=await runtime({legacyMaps:false}),{b,e,app}=battlefield(g,5),action={...b.honroEvents.find(v=>v.id==='lower-beasts').action,source:'lower-beasts'};
for(const u of b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget)){u.dead=true;u.hp=0;}
const hero=e.active;Object.assign(hero,b.honroMapAnchors.shotGap);const count=b.units.length;
assert.equal(g.HonroAllies.execute(app,action),false,'Occupied entry waits atomically');assert.equal(b.units.length,count);
Object.assign(hero,{x:2650,y:g.HonroWorld.top(b,2650,3300,'valley-floor')});
assert.equal(g.HonroAllies.execute(app,action),true,'Free real shore admits full six-body wave');const born=b.units.filter(u=>u.honroSpawnSource==='lower-beasts');assert.equal(born.length,6);const rows=born.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp}));
for(let i=0;i<120;i++)e.stepUnits(1/60);for(const u of born){assert(!u.dead);assert(e.grounded(u));}
await writeFile('_local/reports/stage5-lake/wave-placement.json',JSON.stringify({scope:'Explicit enemy removal and hero placement; not normal combat',atomicOccupancy:true,rows},null,2));console.log('PASS atomic occupied entry and six grounded shore arrivals');
