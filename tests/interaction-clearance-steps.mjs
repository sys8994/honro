// Serialized progress fixtures; no natural combat-completion claim.
import assert from'node:assert/strict';import vm from'node:vm';import{readFile}from'node:fs/promises';import{appHarness,plain}from'./app-regression-helpers.mjs';
const h=await appHarness(),g=h.g,A=g.HonroAct2;vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
for(const [id,goal,prior]of [[16,'hall',['monk','witness']],[17,'brace',[]],[20,'escort',[]]]){
 const app=h.load(h.profileThrough(id-1));app.launch(id);h.finish(app);app.close();app.turnNotice=null;const b=app.engine.b,a=A.memory(b);for(const key of prior)a.done[key]=true;
 const raw=JSON.stringify(b.honroAct2Steps);assert.equal(A.current(b).id,goal);assert(!A.steps(b).some(s=>['clear','pacing-secure'].includes(s.kind)));
 const m=b.honroMarkers.find(m=>m.id===goal),s=A.current(b);if(s.requiredClass||m.requiredClass)app.selectHero('p-'+(s.requiredClass||m.requiredClass));const u=app.engine.active;Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0});
 const threat=b.units.find(v=>v.side===1&&!v.honroSpirit&&!v.honroObjectiveTarget&&!v.dead);Object.assign(threat,{x:m.x+50,y:m.y});const live=JSON.stringify(b.units.filter(v=>v.side===1).map(v=>[v.id,v.hp,v.dead]));
 assert(g.HonroInteractions.eligibility(app,m).ok,g.HonroInteractions.eligibility(app,m).reason);assert(g.HonroInteractions.use(app,m));assert(a.done[goal]);assert.equal(JSON.stringify(b.honroAct2Steps),raw);assert.equal(JSON.stringify(b.units.filter(v=>v.side===1).map(v=>[v.id,v.hp,v.dead])),live);
 for(const q of b.honroAct2Steps.filter(s=>s.kind==='clear'))assert(!a.done[q.id],'Do not forge clearance completion/reward facts');console.log('PASS current',id,goal,'with living threats, raw plan and kill facts preserved');
}
// A legacy automatic evidence step can depend on the former safety-clear ID.
{
 const app=h.load(h.profileThrough(15));app.launch(16);h.finish(app);const b=app.engine.b;b.honroEvidenceRevision=1;const s={id:'witness',kind:'evidence',afterEvidence:'clear-rescue-threat'};A.memory(b).done.monk=true;assert(g.HonroEvidenceQuests.satisfied(b,s));assert(!A.memory(b).done['clear-rescue-threat']);delete A.memory(b).done.monk;assert(!g.HonroEvidenceQuests.satisfied(b,s));
}
for(const id of [11,12,13,14,15,16,17,19,20]){
 for(const family of ['raw','effective','objectiveLegacy','canonPrior']){const plan=g.HONRO_NARRATIVE_COMPAT[family][id-1]?.steps;if(!plan?.length)continue;const b={honroStage:id,honroCustom:false,honroAct2Revision:2,honroAct2Steps:plain(plan),honroState:{act2:{done:{}}}};const snapshot=JSON.stringify(b.honroAct2Steps),done=JSON.stringify(A.memory(b).done);
 assert(!A.steps(b).some(s=>['clear','pacing-secure'].includes(s.kind)),family+'/'+id);assert.equal(JSON.stringify(b.honroAct2Steps),snapshot);assert.equal(JSON.stringify(A.memory(b).done),done);
 const mechanical=plan.filter(s=>['defeat','destroy','hold','escort'].includes(s.kind));assert.deepEqual(plain(A.steps(b).filter(s=>['defeat','destroy','hold','escort'].includes(s.kind))),plain(mechanical));
}
}
// Existing earned facts, custom plans and the parallel Stage18 goal owner stay exact.
for(const id of [14,18]){const app=h.load(h.profileThrough(id-1));app.launch(id);const b=app.engine.b;A.memory(b).done['clear-village']=true;const before=JSON.stringify(A.memory(b).done);A.steps(b);assert.equal(JSON.stringify(A.memory(b).done),before);b.honroCustom=true;assert.deepEqual(plain(A.steps(b)),plain(b.honroAct2Steps));}
console.log('PASS legacy evidence dependency, four serialized contract families, explicit combat/mechanical goals, earned flags and custom/Stage18 boundaries');
