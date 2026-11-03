/** Focused gate compatibility tests. Explicit state variants are fixtures;
 * unchanged R34 exported profile is separately loaded through actual Continue. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {runtimeCandidate,battlefield,plain} from './act23-v4-helpers.mjs';
import {appHarness} from './app-regression-helpers.mjs';
const base='tests/fixtures/stage17-gate/',raw=gunzipSync(await readFile(base+'old-natural-continue34.json.gz')),manifest=JSON.parse(await readFile(base+'manifest.json','utf8'));
assert.equal(createHash('sha256').update(raw).digest('hex'),manifest.sourceSha256);const saved=JSON.parse(raw);
const g=await runtimeCandidate(),V=g.HonroAct23V4,P=g.HonroAct23V4Act2,gate=b=>b.terrain.find(t=>t.id==='gate-repair'),memory=b=>P.memory(b),copy=()=>plain(saved.b);
const stable=b=>({actors:b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,maxHp:u.maxHp,focus:u.focus,moveLeft:u.moveLeft,dead:u.dead,side:u.side})),steps:plain(V.steps(b)),progress:plain(V.mem(b)),terrain:plain(b.terrain),world:plain(b.honroWorldTerrain||[])});
const expectedOpen=s=>{for(const list of [s.terrain,s.world]){const t=list.find(t=>t.id==='gate-repair');if(t)t.broken=true;}return s;};
{
 const q=battlefield(g,17);P.prepare(q.b);assert.equal(gate(q.b).broken,false);V.mem(q.b).done['17.mesh']=true;V.mem(q.b).done['17.lock']=true;P.prepare(q.b);assert.equal(gate(q.b).broken,false,'completion flags alone cannot open gate');
}
for(const variant of ['no-lock','unseated','no-mesh','unproven-carrier']){
 const b=copy(),a=memory(b);if(variant==='no-lock')delete a.proof['17.lock'];if(variant==='unseated')a.proof['17.lock'].pinSeated=false;if(variant==='no-mesh')delete a.proof['17.mesh'];if(variant==='unproven-carrier')delete a.proof['17.mesh'].parts.workerCarrier;
 P.prepare(b);assert.equal(gate(b).broken,false,variant+' remains closed');
}
{
 const b=copy(),before=stable(b),version=b.sceneVersion||0,e=new g.HONRO_CORE.Engine(b,()=>{},true),u=e.unit('p-knight'),contact=()=>e.collision({x:9290,y:4534},{x:9430,y:4534},1,u.id,[],false);assert.equal(contact()?.terrain?.id,'gate-repair');assert.equal(gate(b).broken,false);P.prepare(b);assert(gate(b).broken);assert.notEqual(contact()?.terrain?.id,'gate-repair','canonical collision respects opened gate');assert.equal(b.sceneVersion,version+1);assert.deepEqual(stable(b),expectedOpen(before),'only existing gate state changes; actors/quests/enemy budgets/geometry preserved');const once=JSON.stringify(b);P.prepare(b);assert.equal(JSON.stringify(b),once,'prepare idempotent');
}
{
 const b=copy(),app={engine:{b},dialogue:{},modal:{classList:{contains:()=>false}}},version=b.sceneVersion||0;P.tick(app,0);assert(gate(b).broken,'already progressed update heals before paused story');assert.equal(b.sceneVersion,version+1);const once=JSON.stringify(b);P.tick(app,0);assert.equal(JSON.stringify(b),once,'update idempotent');
}
for(const variant of ['unrelated-stage','custom','non-v4']){
 const b=copy();if(variant==='unrelated-stage')b.honroStage=16;if(variant==='custom')b.honroCustom=true;if(variant==='non-v4')b.honroAct23V4Revision=0;P.prepare(b);assert.equal(gate(b).broken,false,variant+' excluded');
}
{
 const h=await appHarness({productionStory:true});const profile=plain(saved.profile),before=JSON.stringify(profile);const app=h.load(profile);app.continue();assert(app.engine);assert.equal(app.engine.b.honroStage,17);assert.equal(app.engine.b.round,34);assert(gate(app.engine.b).broken,'exact natural exported profile migrates through Continue');assert.equal(JSON.stringify(profile),before,'source profile object not rewritten');
 const fields=['id','x','y','hp','maxHp','focus','moveLeft','dead','side'];const actors=b=>b.units.map(u=>Object.fromEntries(fields.map(k=>[k,u[k]])));assert.deepEqual(plain(actors(app.engine.b)),plain(actors(saved.b)));assert.deepEqual(plain(h.g.HonroAct23V4.mem(app.engine.b).done),plain(V.mem(saved.b).done));
}
console.log('PASS Stage17 repair gate: closed prerequisites, genuine proof restore, exact old Continue, idempotence, actors/quests/geometry preserved, non-V4/custom/other-stage excluded.');
