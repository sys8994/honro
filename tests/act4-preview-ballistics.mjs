/** Original projectile collision in controlled poses; no normal-play claim. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
vm.runInContext(await readFile('tools/act4/review-art.js','utf8'),g);
vm.runInContext(await readFile('tools/act4/terrain-preview.js','utf8'),g);
const rows=[];
for(const [n,x,targetX,angle,power,blocked]of [[31,3600,4140,30,.65,false],[35,3060,3490,0,.2,true],[35,3350,3490,0,.2,false]]){
 const p=g.HonroAct4TerrainPreview.create(n),b=g.HonroMaps.createBattle(p.stages[0],p);
 b.units=b.units.filter(u=>u.id==='archer'||u.x===targetX);const u=b.units[0],target=b.units[1];
 Object.assign(u,{x,y:g.HonroMapEngine.surfaceY(b.terrain,x).y,vx:0,vy:0,critChance:0});
 const e=new C.Engine(b,()=>{});e.checkEnd=()=>false;let hit=null,collision=null;
 const hurt=e.hurt.bind(e);e.hurt=(who,...args)=>{if(who===target)hit={id:who.id,damage:args[0],vy:args[3]?.vy};return hurt(who,...args);};
 const impact=e.impact.bind(e);e.impact=(shot,h)=>{collision=h.terrain?.honroElementId||h.terrain?.id;return impact(shot,h);};
 assert(e.fire('A01',angle,power));
 for(let i=0;i<2000&&b.projectiles.length;i++)for(const shot of [...b.projectiles])if(b.projectiles.includes(shot))e.stepProjectile(shot,C.STEP);
 assert.equal(b.projectiles.length,0);
 if(blocked){assert(!hit);assert(collision?.includes('thick-bamboo'));}
 else{assert(hit?.damage>0);if(n===31)assert(hit.vy>0,'bank arc reached target on descent');}
 rows.push({chapter:n,x,targetX,skill:'A01',angle,power,hit,collision,blocked});
}
await mkdir('_local/reports/act4-preview',{recursive:true});
await writeFile('_local/reports/act4-preview/ballistic-contracts.json',JSON.stringify({scope:'fixed poses; real original projectiles/terrain/hurt; no injected hit',rows},null,2)+'\n');
console.log('PASS Act4 real bank arc; thick bamboo collision and side-clearing shot');
