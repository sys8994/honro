// Exact normal-play turn-45 export plus declared all-entry-blocked fixtures.
// Production App Continue/wait/ticks are used; this is not browser completion.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C}=h,A=g.HonroAct2,R=g.HonroStage11RavineEncounters,D=g.HonroEncounterDensity;
const profile=JSON.parse(await readFile('tests/fixtures/stage11-hold-pending-save.json','utf8')),checks=[];
const source='hold-knots-3';
function load(){const app=h.load(profile);app.continue();return{app,b:app.engine.b,e:app.engine};}
function action(b){const at=b.honroStage11DefenseEntries[1];return{type:'spawn',n:3,kind:'echo',source,x:at.x,y:at.y,spacing:130,maxDistance:450};}
function block(b){for(const [i,at]of R.defenseEntries(b,1).entries()){const m=at.members.at(-1);(b.stakes??=[]).push({id:'all-entry-blocker-'+i,x:m.x,y:m.y,active:true,expires:1000});}}
function check(name,fn){fn();checks.push(name);console.log('PASS',name);}
check('exact save is duration-complete with one warned trio pending, not a wave-kill gate',()=>{
 const {app,b}=load(),s=A.current(b),hold=A.memory(b).holds[s.id];
 assert.equal(s.id,'hold-knots');assert.equal(hold.progress,4);assert.equal(hold.spawned,3);assert.equal(s.wave.count,6);
 assert.equal(A.satisfied(b,s),false);assert(b.honroState.ravineComposition.echoWarnings[1].opportunity);
 const before=JSON.stringify(b),text=g.HonroObjectives.state(b,app.stage).currentInstruction;
 assert(text.includes('잔향 3명 진입 대기'));assert(text.includes('동쪽 진입로 주변을 비워'));assert(!text.includes('0턴'));
 assert.equal(JSON.stringify(b),before,'Guidance does not alter progression');
 hold.guarded=false;assert(g.HonroObjectives.state(b,app.stage).currentInstruction.includes('동행 1명을 표시된 원에 두세요'));
});
check('same-support fallback is original-first, outward, bounded and preserves authored formation',()=>{
 const {b}=load(),before=JSON.stringify(b);
 for(const i of [0,1]){const original=b.honroStage11DefenseEntries[i],entries=R.defenseEntries(b,i);assert.equal(entries[0],original);assert(entries.length>1);
  for(const at of entries.slice(1))for(const [j,m]of at.members.entries()){
   const old=original.members[j];assert.equal(m.support,old.support);assert(Math.hypot(m.x-old.x,m.y-old.y)<=320);assert((m.x-old.x)*(i===0?-1:1)>0);
   const p=g.HonroMapEngine.surfaceY(b.terrain,m.x,undefined,m.support),q=g.HonroMapEngine.surfaceY(b.terrain,old.x,undefined,old.support);
   assert(Math.abs((p.y-m.y)-(q.y-old.y))<1e-8);assert.equal(m.elite,old.elite);assert.equal(m.kind,old.kind);
  }
 }
 assert.equal(JSON.stringify(b),before);
});
{
 let {app,b,e}=load();const initial=plain(b),next=b.nextId,spawned=b.honroCounters.spawned;
 assert(e.canAct());e.wait();
 for(let i=0;i<600&&A.current(b)?.id==='hold-knots';i++){e.tick(C.STEP);if(app.dialogue)h.finish(app);app.missionTick(C.STEP);}
 assert.equal(A.current(b)?.id,'resident','One normal action/ticks must admit the nearby trio and advance the exact save');
 const born=b.units.filter(u=>u.honroSpawnSource===source);assert.equal(born.length,3);assert.equal(born.filter(u=>u.honroAct2Elite).length,1);
 assert.equal(b.nextId,next+3);assert.equal(b.honroCounters.spawned,spawned+3);assert.equal(b.units.length,initial.units.length+3);
 assert.equal(A.memory(b).holds['hold-knots'].spawned,6);assert.equal(A.memory(b).done['hold-knots'],true);
 const entry=b.honroState.ravineComposition.entries[source];assert(entry.choice>0);assert.equal(entry.x,8080);
 assert.deepEqual(plain(b.terrain),initial.terrain);for(const u of born){assert(!g.HonroStage8Bier.terrainBlockers(e,u).length);assert(e.heroesAlive().every(v=>Math.abs(v.x-u.x)>=280||Math.abs(v.y-u.y)>=300));}
 const ids=born.map(u=>u.id);app.export();app=h.load(await h.exported());app.continue();b=app.engine.b;
 assert.deepEqual(b.units.filter(u=>u.honroSpawnSource===source).map(u=>u.id),ids);assert.equal(A.current(b)?.id,'resident');
 for(let i=0;i<4;i++)app.missionTick(0);assert.equal(b.units.filter(u=>u.honroSpawnSource===source).length,3);
 checks.push('exact normal save advances after a real wait; one safe trio, unchanged terrain, repeated Continue has no duplicates');console.log('PASS',checks.at(-1));
}
{
 let {app,b}=load();block(b);app.actorBoundary=b.active;
 const before=JSON.stringify(b);assert(D.safe(app));assert.equal(g.HonroAllies.execute(app,action(b)),false);assert.equal(JSON.stringify(b),before,'All-blocked admission is fully atomic');
 const text=g.HonroObjectives.state(b,app.stage).currentInstruction;assert(text.includes('진입 대기')&&text.includes('동쪽 진입로 주변을 비워'));assert(!text.includes('0턴'));
 app.export();const saved=plain(b);app=h.load(await h.exported());app.continue();assert.deepEqual(plain(app.engine.b),saved);
 checks.push('fully blocked entries preserve all actors/budget/progress and show actionable pending-wave guidance through Continue');console.log('PASS',checks.at(-1));
}
check('other chapters, custom and old draft battles retain their original entry policy and guidance',()=>{
 for(const alter of [b=>b.honroStage=12,b=>b.honroCustom=true,b=>b.honroStage11EncounterRevision=1,b=>delete b.honroEncounterDensityRevision]){
  const b=plain(profile.honroBattle);alter(b);assert.equal(R.defenseEntries(b,1).length,1);
  if(b.honroStage!==11||b.honroCustom||b.honroStage11EncounterRevision!==2)assert.equal(R.holdInstruction(b,{id:'hold-knots',kind:'hold',rounds:4,wave:{count:6}}),null);
 }
});
await report('stage11-hold-pending',checks,{scope:'Exact normal save and controlled all-entry safety fixtures; no browser or full campaign completion claim.'});
