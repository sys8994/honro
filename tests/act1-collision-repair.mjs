// Original/repaired geometry regression for the canonical stage-3 stone.
// HBUG-103 now protects old saved geometry too; reproducing the obsolete engine
// failure is no longer an expected outcome when running the current solver.
// Actor positions are initialized only; tests use actual move/tick commands.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {act1Runtime,fixture,isolatedHero,traverse,routePoints,CLASSES,plain,reportRoot} from './act1-spatial-test-helpers.mjs';
import {applyAct1CollisionRepair,ACT1_STONE_REPAIR as repair} from '../tools/map-forge/act1-collision-repair.mjs';
const g=await act1Runtime(),rows=[],frameStates={};
const before=plain(g.HONRO_PROJECT),instance=before.stages[2].elements.find(e=>e.id===repair.elementId);instance.y=repair.fromY;
const after=applyAct1CollisionRepair(plain(before));assert.equal(after.stages[2].elements.find(e=>e.id===repair.elementId).y,repair.toY);const diff=plain(after);diff.stages[2].elements.find(e=>e.id===repair.elementId).y=repair.fromY;assert.deepEqual(diff,before,'repair may change exactly one instance Y');assert.deepEqual(applyAct1CollisionRepair(plain(after)),after,'repair must be idempotent');
// Applying a new canonical recipe must never rewrite an existing battle save.
g.HONRO_PROJECT=before;const oldBattle=plain(fixture(g,3).b),oldState=plain(oldBattle);g.HONRO_PROJECT=after;g.HonroStageRules.sanitizeStageBattle(oldBattle);assert.deepEqual(oldBattle,oldState,'Existing stage-3 saves must retain their old geometry and state');
for(const version of ['before','after'])for(const cls of CLASSES){
 g.HONRO_PROJECT=version==='before'?before:after;const {b,e,u}=isolatedHero(g,3,cls),startHp=u.hp;let ticks=0,still=0,maxY=u.y,fallen=false;
 for(;ticks<1500;ticks++){u.moveLeft=u.maxMove;const x=u.x;e.move(1,1/60);e.tick(1/60);maxY=Math.max(maxY,u.y);if(u.y>2500){fallen=true;break;}if(Math.abs(u.x-x)<.01&&e.grounded(u))still++;else still=0;if(still>100||u.x>1240)break;}
 const row={version,hero:cls,x:u.x,y:u.y,ticks,maxY,fallen,grounded:e.grounded(u),damage:startHp-u.hp,stopped:still>100};rows.push(row);
 if(version==='after'){assert(!fallen&&e.grounded(u)&&still>100,`${cls}: repaired stone must stop walking safely`);assert(u.x>1040&&u.x<1070);assert.equal(u.hp,startHp);}
 if(version==='before'){assert(!fallen&&e.grounded(u)&&still>100,`${cls}: old saved stone must also stop walking safely`);assert.equal(u.hp,startHp);}
 if(cls==='knight')frameStates[version]=plain(b);console.log(JSON.stringify(row));
}
assert(rows.every(r=>!r.fallen&&r.grounded&&r.damage===0),'Current physics must protect both existing saves and the repaired canonical instance');
for(const cls of CLASSES){g.HONRO_PROJECT=after;const {b,e,u}=isolatedHero(g,3,cls),r=traverse(g,b,e,u,routePoints(g,3,b));assert(r.passed,`${cls}: repair blocked legitimate jump route`);rows.push({version:'after',hero:cls,mode:'ordinary jump to ledger and exit',...r});}
// The raised contact remains a normal blocking face across common input steps.
for(const dt of [1/30,1/60,1/120])for(const cls of CLASSES){
 g.HONRO_PROJECT=after;const {b,e,u}=isolatedHero(g,3,cls),hp=u.hp;let still=0,fallen=false;
 for(let tick=0;tick<3000;tick++){u.moveLeft=u.maxMove;const x=u.x;e.move(1,dt);e.tick(dt);if(u.y>2500){fallen=true;break;}if(Math.abs(u.x-x)<.01&&e.grounded(u))still++;else still=0;if(still>100)break;}
 assert(!fallen&&still>100&&e.grounded(u),`${cls}/${dt}: contact must block safely`);assert.equal(u.hp,hp);rows.push({version:'after',mode:'variable input step',hero:cls,dt,stopped:true,fallen:false,damage:0});
}
const out=reportRoot();await mkdir(out,{recursive:true});for(const [version,b]of Object.entries(frameStates))await writeFile(`${out}/collision-state-${version}.json`,JSON.stringify(b)+'\n');await writeFile(`${out}/collision-repair.json`,JSON.stringify({repair,scope:'HBUG-103 current contact solver protects both old saved and repaired canonical stone geometry without rewriting either map',rows},null,2)+'\n');
