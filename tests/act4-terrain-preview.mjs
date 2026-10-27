/** Native Engine geometry fixtures. No normal campaign completion claim. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
const campaign=JSON.stringify(g.HONRO_PROJECT),content=JSON.stringify(g.HONRO_CONTENT.stages);
vm.runInContext(await readFile('tools/act4/terrain-preview.js','utf8'),g);
const rows=[];
for(const n of [31,35,36]){
 const project=g.HonroAct4TerrainPreview.create(n),map=project.stages[0];
 assert.deepEqual(JSON.parse(JSON.stringify(g.HonroMaps.validate(project).filter(v=>v.level==='err'))),[]);
 assert.equal(map.metadata.campaign,false);assert.equal(map.metadata.act4Preview,n);
 const b=g.HonroMaps.createBattle(map,project),e=new C.Engine(b,()=>{});e.checkEnd=()=>false;
 assert(g.HonroTerrainDomain.active(b));assert.equal(b.honroCustom,true);
 const start=b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp}));
 for(let i=0;i<300;i++)e.tick(C.STEP);
 for(const [i,u]of b.units.entries()){assert(Math.abs(u.x-start[i].x)<.01,u.id+' x');assert(Math.abs(u.y-start[i].y)<.01,u.id+' y');assert.equal(u.hp,start[i].hp,u.id+' spawn damage');}
 // Remove bodies to isolate terrain connectivity. Refill movement explicitly;
 // this proves a route with ordinary locomotion, not an encounter turn budget.
 b.units=b.units.filter(u=>u.id==='archer');const u=e.active;let blocked=0,jumps=0;
 for(let i=0;i<5000&&u.x<6800;i++){u.moveLeft=10000;const x=u.x;e.move(1,C.STEP);e.tick(C.STEP);blocked=u.x-x<.05?blocked+1:0;if(blocked>5&&e.grounded(u)){if(e.jump(u))jumps++;blocked=0;}}
 assert(u.x>=6800,n+' connected lower route');assert.equal(u.hp,start[0].hp);
 rows.push({chapter:n,initial:start.length,enemies:start.length-4,routeEnd:u.x,jumps,spawnStable:true,fullTerrainDomain:true});
}
assert.equal(JSON.stringify(g.HONRO_PROJECT),campaign,'campaign maps changed');
assert.equal(JSON.stringify(g.HONRO_CONTENT.stages),content,'campaign content changed');
assert.throws(()=>g.HonroAct4TerrainPreview.create(32),/unavailable/);
await mkdir('_local/reports/act4-preview',{recursive:true});
await writeFile('_local/reports/act4-preview/terrain-contracts.json',JSON.stringify({scope:'native geometry/support fixtures; movement replenished; no normal combat win',rows},null,2)+'\n');
console.log('Act4 preview: 3 schemas/domains, 26 stable spawns, 3 connected lower routes, campaign data unchanged');
