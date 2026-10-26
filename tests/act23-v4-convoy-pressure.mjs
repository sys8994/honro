/** Production Engine action boundaries and explicit combat/position fixtures. */
import assert from 'node:assert/strict';
import {runtimeCandidate,battlefield,plain} from './act23-v4-helpers.mjs';
const g=await runtimeCandidate(),V=g.HonroAct23V4,C=g.HONRO_CORE;
function make(count=4){const q=battlefield(g,20),root=V.mem(q.b),keep=new Set(count===1?['knight']:count===2?['knight','mage']:['archer','mage','knight','occultist']);for(const u of q.b.units)if(u.side===0&&!keep.has(u.cls)){u.dead=true;u.hp=0;}for(const s of V.steps(q.b)){if(['clear-pass','escape','20.outside'].includes(s.id))break;root.done[s.id]=true;}root.ringRemoved=true;root.convoyStarted=true;q.b.active=V.heroes(q.b)[0].id;q.b.side=0;q.b.phase='aim';return q;}
function resume(q){const b=plain(q.b),e=new C.Engine(b,()=>{},true),app={...q.app,engine:e};V.prepare(b,q.p);g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);V.bindApp(app,e);return{...q,b,e,app};}
for(const count of [4,2,1]){let q=make(count);V.tick(q.app,0);let state=V.mem(q.b).convoyAmbush;assert(state&&!state.admitted);assert.equal(q.b.honroV4Steps.find(s=>s.id==='hold-convoy').kind,'v4-regroup');assert.equal(q.b.honroV4Steps.find(s=>s.id==='hold-convoy').rounds,undefined);
 // Actual turns offer and end each hero. No permanent actorBoundary or
 // fabricated enemy-end/round count approves the warning.
 const ids=V.heroes(q.b).map(u=>u.id);for(const [i,id]of ids.entries()){assert.equal(q.b.active,id);V.tick(q.app,0);q.e.finishAction(true);if(i===0&&count>1){q=resume(q);state=V.mem(q.b).convoyAmbush;}assert(state.ended[id]);}
 assert.equal(state.admitted,false,'last actual end may be a transition; admission is deferred');
 // The core team transition is driven normally. Enemy actions are explicit
 // defend/finish fixtures; no enemy combat victory is claimed here.
 for(let i=0;i<100&&!state.admitted;i++){if(q.b.phase==='transition')q.e.tick(.06);else if(['enemy','ally','summon'].includes(q.b.phase))q.e.finishAction(true);V.tick(q.app,0);}
 assert(state.admitted,JSON.stringify({count,phase:q.b.phase,side:q.b.side,state}));assert.equal(state.ids.length,4);assert.equal(new Set(state.ids).size,4);assert.equal(V.satisfied(q.b,V.steps(q.b).find(s=>s.id==='clear-pass')),false);
 for(const id of [...state.ids,...V.steps(q.b).find(s=>s.id==='clear-pass').defeatIds]){const u=q.e.unit(id);u.dead=true;u.hp=0;}assert(V.satisfied(q.b,V.steps(q.b).find(s=>s.id==='clear-pass')));const n=q.b.units.length;for(let i=0;i<5;i++)V.tick(q.app,0);assert.equal(q.b.units.length,n);console.log('PASS20',count,'survivors: real finish/team switch, saved warning, finite physical ambush and route-only clearance');
}
{
 const q=make(),root=V.mem(q.b);delete root.done['hold-convoy'];root.convoyGoals={};const s=V.steps(q.b).find(s=>s.id==='hold-convoy');q.b.teamEnds[1]+=20;V.tick(q.app,0);assert(!V.satisfied(q.b,s),'elapsed enemy ends cannot replace physical regrouping');assert.equal(root.convoyAmbush,undefined);
}
console.log('PASS20 no timed regroup or unrelated-map extermination gate; initial/cleared state is a declared fixture.');
