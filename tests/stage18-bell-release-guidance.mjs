/** Isolated production E / durability / Canvas contract. Initial objective and
 * supported hero pose are fixtures; no normal arrival or browser claim. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {guidanceRuntime,canvas,guidanceFixture} from './act2-guidance-helpers.mjs';
const g=await guidanceRuntime(),C=g.HONRO_CORE,A=g.HonroAct2,out='_local/reports/stage18-bell/release-guidance';await mkdir(out,{recursive:true});
g.document.addEventListener=()=>{};vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const q=guidanceFixture(g,18,'silence'),{b,e}=q,app={engine:e,profile:C.defaults(),stage:g.HONRO_CONTENT.stages[17],training:false,done:false,event(){},sayLines(){},checkMission(){return false;},canInput(){return e.canAct();},cancelInput(){}};
g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);A.attach(app,e);
const target=b.terrain.find(t=>t.id==='upper-chain'),cv=canvas(1440,960),scene=new g.HonroScene(cv);Object.assign(scene,{x:target.x+target.w/2,y:target.y+210,scale:.58,manual:true,time:2});
const health=()=>scene.terrainHealthTargets(b).find(t=>t.id===target.id),capture=async name=>{const before=JSON.stringify(b);scene.render(e,0);await new Promise(r=>setTimeout(r,20));scene.render(e,0);assert.equal(JSON.stringify(b),before);await writeFile(`${out}/${name}.png`,cv.toBuffer('image/png'));};
assert.equal(health().blocked,'담허가 억제를 시작하면 공격 가능');const hp=target.hp;e.damageTerrain(target,35,0,'p-mage');assert.equal(target.hp,hp);await capture('before-start');
assert(g.HonroInteractions.eligibility(app,q.marker).ok);assert(g.HonroInteractions.use(app,q.marker));A.tick(app,0);
assert(A.memory(b).silenced);const hold=A.memory(b).holds['hold-silence'];assert.equal(hold.progress,0);assert(!A.satisfied(b,A.steps(b).find(s=>s.id==='hold-silence')));assert.equal(health().blocked,'');e.damageTerrain(target,35,0,'p-mage');assert(target.hp<hp,'E start immediately opens damage while hold remains 0/4');await capture('started-zero-of-four');
const saved=structuredClone(b);assert.equal(scene.terrainHealthTargets(saved).find(t=>t.id===target.id).blocked,'');assert.equal(saved.honroState.act2.holds['hold-silence'].progress,0);
// The old revision-absent snapshot retains its prior wording exactly.
const old=JSON.parse(await readFile('tests/fixtures/stage18-bell-before.json','utf8')).stages[0],oldBattle=g.HonroMaps.createBattle(old,{...g.HONRO_PROJECT,stages:[old]},C.defaults(),{origin:'campaign'});assert(!g.HonroStage18Bell.active(oldBattle));assert.equal(scene.terrainHealthTargets(oldBattle).find(t=>t.id==='upper-chain').blocked,'공명 억제 후 파괴 가능');
const hash=x=>createHash('sha256').update(x).digest('hex');await writeFile(`${out}/result.json`,JSON.stringify({passed:true,projectSha256:hash(JSON.stringify(g.HONRO_PROJECT)),rendererSha256:hash(await readFile('shared/runtime/renderer.js','utf8')),before:'담허가 억제를 시작하면 공격 가능',after:'',holdProgress:hold.progress,holdRequired:4,hpBefore:hp,hpAfter:target.hp,legacyWordingPreserved:true,scope:'Isolated initial pose/objective fixture, real interaction E and damageTerrain hook, production Native Canvas with exact nonmutation assertion. Actual projectile release is separately covered by the tactics/melee suites.'},null,2));console.log('PASS fresh18 E start opens release at 0/4; legacy wording remains exact');
