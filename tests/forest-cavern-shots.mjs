import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {act1Runtime,fixture} from './act1-spatial-test-helpers.mjs';
const g=await act1Runtime(),C=g.HONRO_CORE,rows=[];
const cases=[
 [7,'lower branch',725,3948.214285714286,'foe-3'],
 [7,'middle fork',2420,2808.125,'foe-4'],
 [7,'hollow lookout',1480,2021,'foe-2'],
 [15,'crown arc',4140,2996.315789473684,'a2-enemy-12'],
 [15,'middle shoulder',4540,3295,'a2-enemy-13'],
 [15,'lower tunnel',4210,null,'a2-enemy-10'],
 [15,'eastern crown',7310,3504.7368421052633,'a2-enemy-17']
];
for(const [id,name,x,y,targetId]of cases){const {b,e}=fixture(g,id),u=C.makeUnit('archer',0,x,y??C.topAt(b.terrain.find(t=>t.id==='act2-floor'),x),{id:'shot-probe'}),target=b.units.find(u=>u.id===targetId),skill=C.SKILLS.A01;b.units=[u,target];b.active=u.id;b.phase='aim';b.side=0;e.checkEnd=()=>false;assert(e.grounded(u),name+' shooter grounded');
 let aim=e.shotSeeds(u,skill,target).find(seed=>e.predict(u,skill,seed.angle,seed.power,target,false).unit===target.id);
 if(!aim)outer:for(const power of [.2,.35,.5,.65,.8,1])for(let angle=-85;angle<=265;angle+=2)if(e.predict(u,skill,angle,power,target,false).unit===target.id){aim={angle,power};break outer;}
 const before=target.hp;let fired=false;if(aim){fired=e.fire(skill.id,aim.angle,aim.power);for(let f=0;f<1800&&b.projectiles.length;f++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);}
 const row={stage:id,name,from:{x:u.x,y:u.y},target:targetId,to:{x:target.x,y:target.y},aim,fired,damage:before-target.hp,passed:fired&&target.hp<before};rows.push(row);console.log(JSON.stringify(row));
}
await mkdir('_local/reports/forest-cavern',{recursive:true});await writeFile('_local/reports/forest-cavern/shots.json',JSON.stringify(rows,null,2));if(rows.some(r=>!r.passed))process.exitCode=1;
