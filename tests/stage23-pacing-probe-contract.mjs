/** Fresh isolated native diagnostic candidates. Not normal-build/browser approval. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from '../tools/act2-qa/stage17-gate-app-harness.mjs';
const kind=process.env.HONRO_QA_PROBE_KIND||'original';
assert(['original','elite-hp-90','carrier-budget-1000','escort-lookahead-180','command-post-clearance','late-front-merge'].includes(kind));
const h=await appHarness({productionStory:true}),{g}=h;
const entry=JSON.parse(await readFile(process.env.HONRO_QA_ENTRY_PATH,'utf8'));
const old=JSON.parse(await readFile(process.env.HONRO23_CHECKPOINT,'utf8'));
const oldApp=h.load(old.profile);oldApp.continue();
assert.deepEqual(plain(oldApp.engine.b),old.profile.honroBattle,'Pre-candidate whole battle Continue must remain exact');
assert(!oldApp.engine.b.honroReviewed23PacingCandidate);
const previous=kind==='original'?null:JSON.parse(await readFile(process.env.HONRO_QA_PROBE_BASELINE,'utf8'));
const ids=['s23-B-0','s23-C-0','s23-C-3','s23-E-5'];
const fields=['units','terrain','honroWorldTerrain','honroMarkers','honroEvents','honroObjectives','honroAct3Steps','enemyLimit','honroEncounterDensityPopulationCap','honroGrowth','honroReviewed23Spec'];
const samples={};
for(const difficulty of ['story','normal']){
 const p=plain(entry.profile);p.settings.difficulty=difficulty;
 const app=h.load(p);app.launch(23);const b=app.engine.b,units=b.units;
 assert.equal(b.difficulty,difficulty);assert.equal(b.honroCampaignMapRevision,423);
 assert.equal(units.filter(u=>u.side===1).length,40);assert.equal(units.filter(u=>u.side===1&&u.honroAct3Elite).length,10);
 assert.equal(b.enemyLimit,4);assert.equal(b.honroEvents.length,0);
 const npc=app.engine.unit('act3-carrier');assert.equal(npc.hp,1450);assert.equal(npc.walkSpeed,260);
 assert.equal(npc.maxMove,kind==='carrier-budget-1000'?1000:900);assert.equal(npc.moveLeft,npc.maxMove);
 if(kind!=='original')assert.equal(b.honroReviewed23PacingCandidate?.id,kind);
 if(kind==='elite-hp-90')assert.equal(b.honroReviewed23PacingApplied?.id,kind);
 if(kind==='command-post-clearance'){const q=b.honroReviewed23PacingCandidate;assert.equal(q.version,1);assert.equal(q.closeRadius,130);assert.equal(q.posts.length,5);const ids=[];for(const post of q.posts){const leader=app.engine.unit(post.leader);assert(leader.side===1&&leader.honroAct3Elite);for(const id of post.members){const member=app.engine.unit(id);assert(member.side===1&&!member.honroAct3Elite);ids.push(id);}}assert.equal(ids.length,13);assert.equal(new Set(ids).size,13);}
 for(const u of units.filter(u=>u.side===1))assert.equal(u.maxHp,Math.round(u.combatBaseHp*g.HONRO_CORE.DIFFICULTIES[difficulty].hp));
 const observed=plain(Object.fromEntries(fields.map(k=>[k,b[k]])));
 if(previous){
  const base=previous.samples[difficulty],expected=plain(base);
  for(const u of expected.units){
   if(kind==='elite-hp-90'&&ids.includes(u.id)){
    assert(u.honroAct3Elite);const hp=Math.round(u.maxHp*.9);u.hp=u.maxHp=hp;u.combatBaseHp=hp/g.HONRO_CORE.DIFFICULTIES[difficulty].hp;
   }
   if(kind==='carrier-budget-1000'&&u.id==='act3-carrier')u.maxMove=u.moveLeft=1000;
   if(kind==='late-front-merge'){const at=b.honroReviewed23PacingCandidate.placements.find(v=>v.id===u.id);if(at){u.x=u.spawnX=at.x;u.y=u.spawnY=at.y;}}
  }
  assert.deepEqual(observed,expected,'Only explicitly declared fresh stats/placements may differ');
 }
 if(kind==='late-front-merge'){for(const at of b.honroReviewed23PacingCandidate.placements){const u=app.engine.unit(at.id);assert(g.HONRO_CORE.validTerrainContactPose(b.terrain,u),'Moved unit has a legal actual terrain-contact pose: '+at.id);assert.equal(u.honroEncounterSupport,'sy-ground');for(const other of units.filter(v=>v.side===1&&v.id!==u.id))assert(Math.hypot(other.x-u.x,other.y-u.y)>=u.r+other.r,'Moved unit body overlaps another enemy: '+at.id);}}
 // App export/Continue of the newly opted-in candidate must not apply HP twice.
 app.export();const saved=await h.exported(),resume=h.load(saved);resume.continue();
 assert.deepEqual(plain(resume.engine.b),saved.honroBattle,'Candidate Continue must remain exact');
 samples[difficulty]=observed;
}
// Explicit radius boundary fixtures only; never presented as natural play.
if(kind==='escort-lookahead-180'){
 const sandbox={HonroAct3V4ReviewedCore:{register(c){return {memory:b=>b.reviewed||{}};}},
  HonroAct23V4:{mem:b=>b.root,current:()=>({id:'dock-mid'}),near:g.HonroAct23V4.near,alive:g.HonroAct23V4.alive},HONRO_CORE:{}};
 vm.runInNewContext(await readFile('shared/runtime/act23-v4-ch23-reviewed.js','utf8'),sandbox);
 const fixture={units:[{id:'act3-carrier',x:0,y:1000,hp:1450,side:2},{id:'foe',x:450,y:1000,hp:100,side:1}],root:{carrierStarted:true},honroMarkers:[{id:'route:dock-mid:0',x:200,y:1000}]};
 const blocked=sandbox.HonroAct23V4Chapter23Facts.blocked;
 assert(blocked(fixture),'Old metadata-free save keeps original300px waypoint preview');
 fixture.honroReviewed23PacingCandidate={id:kind,version:1};
 assert(!blocked(fixture),'Fresh candidate allows approach when only the old waypoint preview blocks');
 fixture.units[1].x=350;assert(blocked(fixture),'Fresh180px waypoint preview still blocks a threat150px beyond the point');
 fixture.units[1].x=250;fixture.honroMarkers[0].x=600;assert(blocked(fixture),'Unchanged300px near-carrier guard remains active independently of waypoint preview');
}
if(kind==='command-post-clearance'){
 const sandbox={HonroAct3V4ReviewedCore:{register(c){return {memory:b=>b.reviewed||{}};}},
  HonroAct23V4:{mem:b=>b.root,current:()=>({id:'dock-mid'}),near:g.HonroAct23V4.near,alive:g.HonroAct23V4.alive},HONRO_CORE:{}};
 vm.runInNewContext(await readFile('shared/runtime/act23-v4-ch23-reviewed.js','utf8'),sandbox);
 const b={units:[{id:'act3-carrier',x:0,y:1000,hp:1450,side:2},{id:'s23-C-1',x:450,y:1000,hp:829,side:1},{id:'s23-C-0',x:2000,y:1000,hp:1285,side:1,dead:false}],root:{carrierStarted:true},honroMarkers:[{id:'route:dock-mid:0',x:200,y:1000}]};
 const blocked=sandbox.HonroAct23V4Chapter23Facts.blocked;
 assert(blocked(b),'Metadata-free saves keep original waypoint blocking');
 b.honroReviewed23PacingCandidate={id:kind,version:1,closeRadius:130,posts:[{leader:'s23-C-0',members:['s23-C-1']}]};
 assert(blocked(b),'Living post keeps original range');
 b.units[2].hp=0;b.units[2].dead=true;assert(!blocked(b),'Actual post defeat relaxes only named distant members');
 b.units[1].x=130;b.honroMarkers[0].x=700;assert(blocked(b),'Exact130px actual-porter boundary still blocks independently of future waypoint');
 b.units[1].x=130.01;assert(!blocked(b),'Just beyond130px can advance after the actual post defeat');
 b.units[1].x=450;b.honroMarkers[0].x=200;b.units[1].id='unlisted-support';assert(blocked(b),'Support not in explicit post list retains original blocking');
 b.units[1].id='s23-C-1';b.units[2].dead=false;assert(blocked(b),'HP0 without actual death never unlocks');
 b.units[2].dead=true;b.units[2].side=0;assert(blocked(b),'Allegiance change is not the specified post defeat');
 b.units.pop();assert(blocked(b),'Missing leader never unlocks the post');
}
const result={passed:true,kind,oldContinueExact:true,freshContinueExact:true,storyFresh:true,tacticalFresh:true,tacticalFullClear:false,initialEnemies:40,eliteEnemies:10,
 sourceRuntimeSha256:createHash('sha256').update(await readFile('shared/runtime/act23-v4-ch23-reviewed.js')).digest('hex'),
 scope:'Native fresh construction, stats/roles/attack/armor/XP/geometry/objectives and exact save Continue checks only. Neither full play nor normal build/browser approval.',samples};
await writeFile(process.env.HONRO_QA_PROBE_CONTRACT_OUT,JSON.stringify(result));
console.log(JSON.stringify({...result,samples:undefined}));
