/** Read-only planner regression. The saved natural endpoint is diagnostic evidence,
 * not a fresh normal-input playthrough. Independent replay owns that acceptance. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {buildCore} from '../game/engine/build.mjs';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,plain=v=>JSON.parse(JSON.stringify(v));
let code=await buildCore();
const gate=/function waterfallTactics\(e\) \{[^}]+\}/;
assert(gate.test(code));
code=code.replace(gate,'function waterfallTactics(e) { return false; }');
vm.runInContext('(()=>{'+code+'})()',g);
const original=g.HONRO_CORE;Object.assign(original.SKILLS,C.SKILLS);g.HONRO_CORE=C;
const fixture=JSON.parse(await readFile('tests/fixtures/stage5-enemy-standoff.json','utf8'));
const b=plain(fixture.battle),e=new C.Engine(b,()=>{},true),u=e.unit(fixture.actor),target=e.unit(fixture.target),before=JSON.stringify(b);
const oldPlan=original.planEnemyMove(e,u,target),newPlan=C.planEnemyMove(e,u,target);
assert.equal(oldPlan,undefined,'Original natural endpoint falsely prefers its unsafe stay');
assert.equal(newPlan,undefined,'Remaining 110px has no unoccupied candidate; do not select an overlapped body');
assert.equal(JSON.stringify(b),before,'Both planners preserve the entire live battle including RNG');
// The captured natural birth already has each actor's genuine 550px turn budget.
const birth=plain(fixture.birth.battle),moving=new C.Engine(birth,()=>{},true),walker=moving.unit('event-144'),birthTarget=C.targetFor(moving,walker),birthBefore=JSON.stringify(birth),fullPlan=C.planEnemyMove(moving,walker,birthTarget);assert(fullPlan);
assert.equal(JSON.stringify(birth),birthBefore);
const clear=(p,pad=0)=>birth.units.every(v=>v.id===walker.id||v.dead||Math.abs(v.x-p.x)>=walker.r+v.r+pad||p.y<=v.y-v.h||p.y-walker.h>=v.y);
for(const p of fullPlan.path){assert(C.traceTravel(moving,walker,walker,p,walker.moveLeft));assert(clear(p,10),'Candidate avoids every living body');}
// Isolated movement execution selects the captured actor; full App replay is separate.
birth.active=walker.id;birth.side=1;birth.phase='enemy';walker.aiMove=fullPlan;const movementBudget=walker.moveLeft;
for(let i=0;i<1000&&walker.aiMove;i++)moving.stepUnits(C.STEP);
assert(!walker.aiMove);assert(clear(walker),'Actual arrival avoids body overlap');assert(walker.moveLeft>=0&&walker.moveLeft<=movementBudget);
const arrival={x:walker.x,y:walker.y,moveLeft:walker.moveLeft};
const scope=[];
for(const stage of Array.from({length:30},(_,i)=>i+1).filter(id=>id!==5)){
 let {b,e}=battlefield(g,stage),source='fresh campaign';
 if(!b.units.some(u=>u.side===1&&!u.dead)){b=plain(fixture.battle);b.honroStage=stage;e=new C.Engine(b,()=>{},true);source='captured actor fixture: fresh stage has no enemies';}
 const u=b.units.find(u=>u.side===1&&!u.dead&&!u.fixed)||b.units.find(u=>u.side===1&&!u.dead),target=u&&C.targetFor(e,u);assert(u&&target);
 const before=JSON.stringify(b),a=original.planEnemyMove(e,u,target),z=C.planEnemyMove(e,u,target);
 assert.deepEqual(plain(a??null),plain(z??null),'Other stage '+stage+' planner unchanged');
 const skills=u.loadout.map(id=>C.SKILLS[id]).filter(s=>s&&!s.passive&&e.manaCost(s,u)<=u.focus);
 if(skills.length)assert.deepEqual(plain(original.chooseEnemyShot(e,u,target,skills)),plain(C.chooseEnemyShot(e,u,target,skills)),'Other stage '+stage+' shot unchanged');
 assert.equal(JSON.stringify(b),before,'Other stage '+stage+' planning is read only');scope.push({stage,source});console.log("Unchanged stage",stage);
}
for(const mode of ['old','custom']){
 const b=plain(fixture.battle);if(mode==='old')delete b.honroStage5WaterfallRevision;else b.honroCustom=true;
 const e=new C.Engine(b,()=>{},true),u=e.unit(fixture.actor),t=e.unit(fixture.target),before=JSON.stringify(b),skills=u.loadout.map(id=>C.SKILLS[id]);
 assert.deepEqual(plain(original.planEnemyMove(e,u,t)??null),plain(C.planEnemyMove(e,u,t)??null));
 assert.deepEqual(plain(original.chooseEnemyShot(e,u,t,skills)),plain(C.chooseEnemyShot(e,u,t,skills)));
 assert.equal(JSON.stringify(b),before);scope.push(mode);
}
const report={scope:'Saved endpoint and unchanged actual plans/shot choices; not normal-input or browser evidence',fixtureFrame:fixture.frame,oldPlan:oldPlan??null,newPlan:plain(newPlan??null),fullPlan:plain(fullPlan),arrival,unchangedScopes:scope,readOnly:true};
await mkdir('_local/reports/stage5-enemy-standoff',{recursive:true});await writeFile('_local/reports/stage5-enemy-standoff/contracts.json',JSON.stringify(report,null,2));console.log(report);
