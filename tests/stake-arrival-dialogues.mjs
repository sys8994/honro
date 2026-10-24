import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const base='def07505f5608f3b192d7e1361df3adce3c5767d',path='shared/runtime/act3-objectives.js',before=execFileSync('git',['show',base+':'+path],{encoding:'utf8'}),after=await readFile(path,'utf8'),g=await runtime({legacyMaps:false}),plain=x=>JSON.parse(JSON.stringify(x)),results={};
function run(id,source,{catalogue=true,waterworks=3}={}){
 vm.runInContext(source,g);const A=g.HonroAct3,Q=g.HonroEvidenceQuests,P=g.HonroStakeCrossing,f=battlefield(g,id),{app,b,e}=f;app.screen='battle';app.actorBoundary=b.active;app.modal={classList:{contains:()=>false}};b.honroWaterworksRevision=waterworks;if(!catalogue)delete b.honroNarrativeCatalogueRevision;
 P.initialize(b);
 const stops=[];app.sayLines=lines=>{const goal=lines[0]?.[2]?.evidenceGoal;stops.push({kind:'dialogue',goal,lines:plain(lines)});if(goal)Q.animateField(app,{goal},1);};app.event=(text,meta)=>{if(meta?.kind==='narration')stops.push({kind:'narration',goal:meta.source.slice('objective:'.length),text});};
 const list=A.steps(b),first=list.findIndex(s=>s.id==='stake-arrival-1');for(const s of list.slice(0,first)){A.memory(b).done[s.id]=true;const m=A.marker(b,s.id);if(m)m.collected=true;}
 const cargoProfile=plain(app.profile),entries=[];
 for(const [i,c]of P.crossings(b).entries()){
  const id=c.markerId,m=A.marker(b,id),team=e.heroesAlive();
  // Explicit landing checkpoints isolate presentation; no remote completion is called.
  b.honroStakeCrossing.index=i;for(const [j,u]of team.entries())Object.assign(u,{x:m.x-30+j*60,y:m.y,vx:0,vy:0,airborne:false,jumping:false});
  A.tick(app,0);assert(!A.memory(b).done[id],'Physical provenance remains required');
  b.honroStakeCrossing.index=i+1;
  if(b.honroStage===25){team[1].y-=200;A.tick(app,0);assert(!A.memory(b).done[id],'Both actors on same floor remain required');team[1].y=m.y;}
  A.tick(app,0);assert(A.memory(b).done[id]);if(id.startsWith('stake-arrival'))assert(Q.field(b).events[id]);
  const proof=plain({checkpoint:A.memory(b).checkpoints,events:Q.field(b).events,contributions:b.honroObjectiveContributions});
  const n=stops.length;A.tick(app,0);assert.equal(stops.length,n,'Repeated frames never repeat completion dialogue');entries.push({id,proof,hud:A.state(b).summary});
 }
 if(id===25){assert(Q.field(b).cargo['25:household-tally']);assert.equal(stops.filter(s=>s.goal==='household-tally').length,1);}
 if(id===27){assert.equal(A.current(b).id,'family-manifest');assert(!A.memory(b).done['family-manifest']);assert(!Q.field(b).cargo['27:family-manifest']);}
 const saved=plain(b);assert.deepEqual(plain(A.memory(saved)),plain(A.memory(b)));assert.deepEqual(plain(Q.field(saved)),plain(Q.field(b)));
 return {stops,entries,state:plain({steps:A.steps(b),done:A.memory(b).done,checkpoints:A.memory(b).checkpoints,events:Q.field(b).events,cargo:Q.field(b).cargo,profileCargo:app.profile.honroFieldCargo,heroes:app.profile.heroes,items:app.profile.items,units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft})),markers:b.honroMarkers,objectiveContributions:b.honroObjectiveContributions}),cargoProfile};
}
for(const id of [25,27]){
 const old=run(id,before),now=run(id,after);assert.deepEqual(now.state,old.state,'Gameplay/evidence/cargo/resources/checkpoints identical');assert.deepEqual(now.cargoProfile,old.cargoProfile);
 assert.deepEqual(now.stops.filter(s=>s.kind==='dialogue'),old.stops.filter(s=>id===25?['stake-arrival-1','stake-arrival-3','household-tally'].includes(s.goal):false),'Kept exact authored rows/metadata');
 assert.equal(old.stops.length,id===25?6:4);assert.equal(now.stops.length,id===25?3:0);
 for(const options of [{catalogue:false},{waterworks:2}])assert.deepEqual(run(id,after,options),run(id,before,options),'Historical/non-current saved authoring unchanged');
 results[id]={beforeStops:old.stops.map(s=>s.goal),afterStops:now.stops.map(s=>s.goal),physicalStateExact:true,checkpointSerializationExact:true,historicalExact:true};
}
vm.runInContext(after,g);
// Source/config data and every unrelated runtime file remain byte-for-byte base.
for(const file of ['shared/data/narrative-current.json','shared/runtime/evidence-quests.js','shared/runtime/stake-crossing.js','shared/runtime/act3-void.js','shared/runtime/narrative-catalogue.js'])assert.equal(await readFile(file,'utf8'),execFileSync('git',['show',base+':'+file],{encoding:'utf8',maxBuffer:20e6}));
await mkdir('_local/reports/stake-arrival-dialogues',{recursive:true});await writeFile('_local/reports/stake-arrival-dialogues/native.json',JSON.stringify({base,results,scope:'Production objective/engine with explicit noncombat landing checkpoints and intercepted presentation; no complete normal route/combat claim.'},null,2));console.log('PASS25 6→3 /27 4→0; exact kept rows, physical gates, two-hero floor, evidence/cargo/resources/checkpoints, repeat, historical authoring');
