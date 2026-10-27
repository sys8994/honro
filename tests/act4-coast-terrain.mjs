/** Native Engine fixtures: geometry with bodies removed and movement replenished. */
import assert from 'node:assert/strict';import vm from 'node:vm';import{readFile,mkdir,writeFile}from'node:fs/promises';import{runtime}from'../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,before=JSON.stringify(g.HONRO_PROJECT),rows=[];
for(const p of ['review-art','terrain-preview','coast-maps'])vm.runInContext(await readFile('tools/act4/'+p+'.js','utf8'),g);
for(const chapter of [32,33,34,37,38,39,40]){
 const p=g.HonroAct4TerrainPreview.create(chapter),s=p.stages[0];assert.deepEqual(Array.from(g.HonroMaps.validate(p).filter(x=>x.level==='err')),[]);assert.equal(s.metadata.campaign,false);
 const b=g.HonroMaps.createBattle(s,p),e=new C.Engine(b,()=>{});e.checkEnd=()=>false;const spawn=b.units.map(u=>({x:u.x,y:u.y,hp:u.hp}));
 for(let i=0;i<300;i++)e.tick(C.STEP);for(const [i,u]of b.units.entries()){assert(Math.abs(u.x-spawn[i].x)<.1,u.id);assert(Math.abs(u.y-spawn[i].y)<.1,u.id);assert.equal(u.hp,spawn[i].hp,u.id);}
 const count=b.units.length;b.units=b.units.filter(u=>u.id==='archer');const u=e.active;let stalled=0,jumps=0;
 for(let i=0;i<9000&&u.x<s.design.act4.exit.x-80;i++){u.moveLeft=100000;const x=u.x;e.move(1,C.STEP);e.tick(C.STEP);stalled=u.x-x<.05?stalled+1:0;if(stalled>5&&e.grounded(u)){if(e.jump(u))jumps++;stalled=0;}}
 assert(u.x>=s.design.act4.exit.x-80,chapter+' ordinary route '+u.x);assert.equal(u.hp,spawn[0].hp,chapter+' route damage');
 rows.push({chapter,count,spawnStable:true,routeX:u.x,jumps,fullDomain:g.HonroTerrainDomain.active(b)});
}
assert.equal(JSON.stringify(g.HONRO_PROJECT),before);await mkdir('_local/reports/act4-preview',{recursive:true});await writeFile('_local/reports/act4-preview/coast-terrain-contracts.json',JSON.stringify({scope:'native geometry; bodies removed, movement replenished; no normal encounter completion',rows},null,2));console.log('PASS seven coastal schemas/domains/stable spawns/basic routes; normal campaign untouched');
