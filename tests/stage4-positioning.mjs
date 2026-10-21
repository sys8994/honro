import assert from 'node:assert/strict';import{readFile,mkdir,writeFile}from'node:fs/promises';
import{runtime,battlefield}from'../game/tests/helpers.mjs';import{drive,isolate}from'./tactical-finite-driver.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,routes=[],shots=[];
for(const cls of ['archer','mage']){
 const q=battlefield(g,4),u=isolate(q,cls),pts=[{x:960,jumpTo:{x:1000,support:'west-step-1'}},{x:1130,jumpTo:{x:1170,support:'west-step-2'}},{x:1320,jumpTo:{x:1400,support:'west-shoulder'}},{x:1650},{x:1400,drop:true},{x:1200,drop:true},{x:1060,drop:true},{x:1150}];
 const r=drive(g,q,u,pts,{label:'west-defense-return'});routes.push(r);assert(r.passed,cls+JSON.stringify(r.failure));
}

for(const cls of ['archer','mage']){
 const q=battlefield(g,4),u=isolate(q,cls);Object.assign(u,{x:3100,y:C.topAt(q.b.terrain.find(t=>t.id==='gate-basin'),3100),vx:0,vy:0});
 const r=drive(g,q,u,[{x:3100,jumpTo:{x:3140,support:'east-step-1'}},{x:3250,jumpTo:{x:3310,support:'east-step-2'}},{x:3420,jumpTo:{x:3490,support:'east-watch'}},{x:3750}],{label:'east-climb-prepared-ground-start'});routes.push(r);assert(r.passed,cls+JSON.stringify(r.failure));
}
for(const mode of ['gate','party']){const{b,e}=battlefield(g,4);for(const u of b.units)if(mode==='gate'?u.id==='objective':u.side===0){u.dead=true;u.hp=0;}e.checkEnd();assert.equal(b.phase,'lost');}

for(const [cls,support,x,target]of [['archer','west-shoulder',1790,'foe-3-cluster'],['mage','gate-basin',1250,'foe-0'],['archer','east-step-2',3320,'foe-5-cluster']]){
 const q=battlefield(g,4),u=q.e.heroesAlive().find(u=>u.cls===cls),enemy=q.e.unit(target),id=cls==='mage'?'M01':'A01';q.e.select(u.id);Object.assign(u,{x,y:C.topAt(q.b.terrain.find(t=>t.id===support),x),vx:0,vy:0});assert(C.validTerrainContactPose(q.b.terrain,u));
 let aim;const candidates=q.e.shotSeeds(u,C.SKILLS[id],enemy);for(let angle=-88;angle<=88;angle+=4)for(let power=.2;power<=1.001;power+=.05)candidates.push({angle,power});
 for(const p of candidates){const hit=q.e.predict(u,C.SKILLS[id],p.angle,p.power,enemy,false);if(hit.unit===target){aim=p;break;}}assert(aim,target+' trajectory');
 const hp=enemy.hp,shield=enemy.shield||0;assert(q.e.fire(id,aim.angle,aim.power));for(let i=0;i<1800&&q.b.projectiles.length;i++)for(const p of [...q.b.projectiles])if(q.b.projectiles.includes(p))q.e.stepProjectile(p,C.STEP);const damage=hp-enemy.hp+shield-(enemy.shield||0);assert(damage>0);shots.push({cls,support,x,target,skill:id,damage,aim});
}
if(process.env.HONRO_BASELINE){const before=JSON.parse(await readFile(process.env.HONRO_BASELINE,'utf8')),plain=x=>JSON.parse(JSON.stringify(x)),stage=g.HONRO_PROJECT.stages[3];assert.deepEqual(plain(g.HONRO_PROJECT.library),before.library);assert.deepEqual(plain(g.HONRO_PROJECT.stages.filter((s,i)=>i!==3)),before.stages.filter((s,i)=>i!==3));assert.deepEqual(plain(stage.events),before.stages[3].events);assert.deepEqual(plain(stage.markers),before.stages[3].markers);assert.deepEqual(plain(stage.units),before.stages[3].units);for(const t of stage.terrains){const old=before.stages[3].terrains.find(o=>o.id===t.id);assert.deepEqual(plain(t.properties.surfaceKind==='defenseDeck'?t.points.slice(0,t.points.length/2):t),t.properties.surfaceKind==='defenseDeck'?old.points.slice(0,old.points.length/2):old);}}

await mkdir('_local/reports/stage4-positioning',{recursive:true});await writeFile('_local/reports/stage4-positioning/routes-shots.json',JSON.stringify({scope:'Isolated finite route inputs and supported prepared-position actual projectiles; not normal combat completion.',routes,shots},null,2));console.log('PASS both heroes west defense return; three projectiles; other29/library/walkable tops/events/markers/units unchanged');
