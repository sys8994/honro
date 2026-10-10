import assert from 'node:assert/strict';import {mkdir,writeFile} from 'node:fs/promises';
import {act1Runtime,fixture,traverse} from './stage8-bier-act1-history-helpers.mjs';
const g=await act1Runtime(),C=g.HONRO_CORE,rows=[];
for(const id of [1,3,4,5,6,8])for(const cls of ['archer','mage','knight','occultist']){
 const {b,e}=fixture(g,id),q=g.HONRO_PROJECT.stages[id-1].design.forestChoice,u=C.makeUnit(cls,0,q.from.x,q.from.y,{id:'choice-probe'});b.units=[u];b.active=u.id;e.checkEnd=()=>false;const r=traverse(g,b,e,u,[q.to]),support=e.contactSurface(u)?.t?.id??e.surface(u.x,u.y-5,u.y+5)?.t?.id;const row={stage:id,cls,...r,support,passed:r.passed&&support===q.supportId};rows.push(row);console.log(JSON.stringify({stage:id,cls,passed:row.passed,support,failed:r.failed}));
}
for(const id of [1,3,4,5,6,8]){
 const {b,e}=fixture(g,id),q=g.HONRO_PROJECT.stages[id-1].design.forestChoice,u=C.makeUnit('archer',0,q.to.x,q.to.y,{id:'choice-shot'}),foes=b.units.filter(v=>v.side===1&&!v.dead).sort((a,z)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(z.x-u.x,z.y-u.y)),skill=C.SKILLS.A01;let result=null;
 for(const target of foes){b.units=[u,target];b.active=u.id;b.phase='aim';b.side=0;e.checkEnd=()=>false;const aim=e.shotSeeds(u,skill,target).find(seed=>e.predict(u,skill,seed.angle,seed.power,target,false).unit===target.id);if(!aim)continue;const before=target.hp,fired=e.fire(skill.id,aim.angle,aim.power);for(let f=0;f<1800&&b.projectiles.length;f++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);result={stage:id,mode:'actual arrow',target:target.id,aim,damage:before-target.hp,passed:fired&&target.hp<before};if(result.passed)break;}
 result??={stage:id,mode:'actual arrow',passed:false};rows.push(result);console.log(JSON.stringify(result));
}
await mkdir('_local/reports/forest-cavern',{recursive:true});await writeFile('_local/reports/forest-cavern/forest-choices.json',JSON.stringify(rows,null,2));if(rows.some(r=>!r.passed))process.exitCode=1;
