// Lightweight production readers over an untouched normal turn-52 export.
// Engine core plus the actual objective readers; no App/render/browser workload.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {buildCore} from '../game/engine/build.mjs';
const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);
Object.assign(g,{HONRO_CONTENT:{hero:{occultist:{name:'소단'}},stages:[]},HonroWorld:{archetypes:{}},HonroAllies:{execute(){}},HonroEncounters:{populationCap(){return 64;},flush(){}},HonroAct2Plan:{forStage:()=>({})}});
vm.runInContext(await readFile('shared/runtime/act2.js','utf8'),g);const baseState=g.HonroAct2.state;
for(const file of ['stage11-ravine-encounters','objective-guidance','objectives'])vm.runInContext(await readFile(`shared/runtime/${file}.js`,'utf8'),g);
const profile=JSON.parse(await readFile('tests/fixtures/stage11-rescue-spirit-save.json','utf8')),original=profile.honroBattle,plain=v=>JSON.parse(JSON.stringify(v)),A=g.HonroAct2,R=g.HonroStage11RavineEncounters,stage={id:11,act:2},checks=[];
function fixture(){const b=plain(original),m=b.honroMarkers.find(m=>m.id==='resident'),spirit=b.units.find(u=>u.id===m.spiritId),resident=b.units.find(u=>u.id===m.target),sodan=b.units.find(u=>u.cls==='occultist'&&u.side===0);return{b,m,spirit,resident,sodan};}
function result(q){const before=JSON.stringify(q.b),r=g.HonroObjectives.state(q.b,stage),help=g.HonroObjectives.help({engine:{b:q.b},stage});assert.deepEqual(plain(help.targets),plain(r.targets));assert.equal(JSON.stringify(q.b),before,'All target and tooltip readers preserve the entire battle');return r;}
function check(name,fn){fn();checks.push(name);console.log('PASS',name);}
check('exact normal save targets the identified 551/551 spirit, not the healthy resident',()=>{
 const q=fixture();assert.equal(q.b.round,52);assert.equal(q.b.active,q.sodan.id);assert.equal(q.spirit.hp,551);assert.equal(q.resident.hp,950);assert.equal(A.interactionThreats(q.b,q.m).length,0);
 const r=result(q),t=r.targets[0];assert.equal(r.currentObjectiveId,'resident');assert.equal(t.unitId,q.spirit.id);assert.equal(t.label,'주민에게 붙은 공명혼');assert.equal(t.x,q.spirit.x);assert.equal(t.y,q.spirit.y-q.spirit.h);assert.equal(t.kind,'boss');assert(r.currentInstruction.includes('40%'));
 q.spirit.x+=150;q.spirit.y-=30;assert.equal(result(q).targets[0].x,q.spirit.x,'Cue follows the actual linked actor');
 q.b.active=q.b.units.find(u=>u.cls==='archer'&&u.side===0).id;assert.equal(result(q).targets[0].unitId,q.spirit.id,'Changing viewpoint must not redirect the cue to the civilian');
});
check('40% boundary returns the E cue to the real resident, preserving actual eligibility',()=>{
 const q=fixture();q.spirit.hp=q.spirit.maxHp*.4+.01;assert.equal(result(q).targets[0].unitId,q.spirit.id);assert.equal(A.eligibility({engine:{b:q.b,active:q.sodan}},q.m).ok,false);
 q.spirit.hp=q.spirit.maxHp*.4;const r=result(q);assert.equal(r.targets[0].unitId,q.resident.id);assert.equal(r.targets[0].x,q.resident.x);assert.equal(r.targets[0].kind,'interact');assert(r.currentInstruction.includes('주민에게 다가가 E'));assert.equal(A.eligibility({engine:{b:q.b,active:q.sodan}},q.m).ok,true);
});
check('dead, missing or subdued spirit falls back to the resident; dead Sodan retains legal defeat target',()=>{
 for(const change of [q=>Object.assign(q.spirit,{dead:true,hp:0}),q=>q.b.units=q.b.units.filter(u=>u!==q.spirit),q=>Object.assign(q.spirit,{honroSubdued:true,hp:q.spirit.maxHp*.2})]){const q=fixture();change(q);assert.equal(result(q).targets[0].unitId,q.resident.id);assert.equal(A.eligibility({engine:{b:q.b,active:q.sodan}},q.m).ok,true);}
 const unusual=fixture();unusual.spirit.honroSubdued=true;assert.equal(result(unusual).targets[0].unitId,unusual.spirit.id,'Cue preserves the existing above-40% gate even in an unusual saved subdued state');
 const q=fixture();Object.assign(q.sodan,{dead:true,hp:0});q.b.active=q.b.units.find(u=>u.cls==='archer'&&u.side===0).id;q.spirit.hp=q.spirit.maxHp*.2;assert.equal(result(q).targets[0].unitId,q.spirit.id);assert(result(q).currentInstruction.includes('혼을 제압'));
});
check('guard-first, completed, legacy, custom and other-chapter target behavior is unchanged',()=>{
 const q=fixture(),guard=q.b.units.find(u=>u.side===1&&!u.dead&&u!==q.spirit);Object.assign(guard,{x:q.m.x,y:q.m.y});assert.equal(R.rescueTarget(q.b,A.current(q.b)),null);assert(result(q).currentInstruction.includes('주민 주변의 적'));
 const completed=fixture();A.memory(completed.b).done.resident=true;assert.notEqual(result(completed).targets[0].unitId,completed.spirit.id);assert.notEqual(result(completed).currentObjectiveId,'resident');
 for(const change of [b=>b.honroStage11EncounterRevision=1,b=>delete b.honroStage11EncounterRevision,b=>b.honroCustom=true,b=>b.honroStage=12]){const q=fixture();change(q.b);assert.equal(R.rescueTarget(q.b,{id:'resident',kind:'rescue'}),null);assert.deepEqual(plain(A.state(q.b).targets),plain(baseState(q.b).targets));}
});
check('serialized battle preserves target identity and remains byte-equal after repeated reads',()=>{
 const q=fixture(),first=plain(result(q));const saved=JSON.stringify(q.b);q.b=JSON.parse(saved);assert.deepEqual(plain(result(q)),first);assert.equal(JSON.stringify(q.b),saved);
});
console.log('PASS resident spirit targeting:',checks.length,'lightweight exact-save/context groups');
