/** Focused additive-author/render contracts. Native/browser appearance is separate. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {applyStoryAnomalyEnvironment,STORY_ANOMALY_ENVIRONMENTS,VOID_ENCOUNTER_TERRAIN} from '../tools/map-forge/story-anomaly-revision.mjs';
const p=JSON.parse(await readFile('shared/data/campaign.json','utf8')),clone=x=>structuredClone(x);
function removeOwned(project){const q=clone(project);for(const s of q.stages){delete s.initialState.honroStoryAnomalyRevision;delete s.initialState.honroStoryAnomalyEnvironment;if(s.metadata.stageId===27){delete s.initialState.honroAct3Void;delete s.design.act3.voidEncounter;}}return q;}
const original=removeOwned(p),before=JSON.stringify(original),authored=applyStoryAnomalyEnvironment(original);
assert.equal(JSON.stringify(original),before,'author must not mutate caller');
assert.deepEqual(removeOwned(authored),original,'all original geometry, enemies, quests, crossing IDs and other stages remain exact');
assert.deepEqual(applyStoryAnomalyEnvironment(authored),authored,'focused author replay is idempotent');
for(const id of [25,27]){const s=authored.stages[id-1];assert.equal(s.initialState.honroWaterworksRevision,3);assert.equal(s.design.act3.crossings.length,id===25?5:4);assert.deepEqual(s.design.act3.crossings,original.stages[id-1].design.act3.crossings);assert.deepEqual(s.initialState.honroAct3Steps,original.stages[id-1].initialState.honroAct3Steps);assert.equal(s.units.filter(u=>u.team==='player').length,2);}
assert.deepEqual(authored.stages[26].initialState.honroAct3Void,{revision:1,state:'READY'});
assert.deepEqual(authored.stages[26].design.act3.voidEncounter,VOID_ENCOUNTER_TERRAIN);
const firstSign=authored.stages[24].initialState.honroStoryAnomalyEnvironment.drip,firstSignArrival=authored.stages[24].markers.find(m=>m.id==='stake-arrival-3');
assert(Math.abs(firstSign.x+firstSign.turn-firstSignArrival.x)<220,'the spoken stage25 observation stays beside its actual arrival on a narrow screen');
const gallery=authored.stages[26].elements.find(e=>e.id==='gallery-6'),asset=authored.library.find(a=>a.id===gallery?.assetId),surface=asset?.collision?.[0];
assert(surface,'the fall/return uses a real authored support');
assert(surface.some(p=>p.y===3050&&p.x<=3370));assert(surface.some(p=>p.y===3050&&p.x>=4230));
const g=vm.createContext({structuredClone,HonroBellAnomaly:{active:b=>b.honroStage===18&&!b.winner,zone:b=>b.honroStage===18?{x:5400,y:6250,rx:540,ry:520}:null},HonroEnvironmentArt:{time:s=>s.time}});
vm.runInContext(await readFile('shared/runtime/story-anomaly-art.js','utf8'),g);
const art=g.HonroStoryAnomalyArt;
function draw(b,{time=1.8,x=4000,y=3900,scale=.3}={}){const calls=[],c=new Proxy({canvas:{width:1440,height:1000}},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args]),set:(o,k,v)=>(o[k]=v,true)}),scene={time,x,y,scale,size:()=>({w:1440,h:1000})},saved=JSON.stringify(b);art.draw(c,scene,b);assert.equal(JSON.stringify(b),saved,'draw is pure including incomplete/old state');return calls;}
for(const id of [17,18,19,25,27]){const s=authored.stages[id-1],b={...clone(s.initialState),honroStage:id,honroMap:{act3:clone(s.design?.act3)}};assert(art.active(b));assert(draw(b,{x:id===18?5400:id===19?7140:id===17?9340:3500,y:id===18?6250:id===19?6950:id===17?4240:3600}).length>0);const old=clone(b);delete old.honroStoryAnomalyRevision;assert.equal(draw(old).length,0,'Continue without new revision stays visually unchanged');const custom={...b,honroCustom:true};assert.equal(draw(custom).length,0);}
const b={honroStage:27,...clone(authored.stages[26].initialState),honroMap:{act3:clone(authored.stages[26].design.act3)}};
const ready=draw(b,{x:3850,y:3050,scale:.65});b.honroAct3Void={revision:1,state:'FALLING',fallProgress:.5};const falling=draw(b,{x:3850,y:3050,scale:.65});assert(falling.length>ready.length,'only FALLING temporarily displaces the authored seam');b.honroAct3Void.state='RESOLVED';assert.deepEqual(draw(b,{x:3850,y:3050,scale:.65}),ready,'restored support view is exact');
const st25={honroStage:25,...clone(authored.stages[24].initialState)};assert(draw(st25,{x:2860,y:3400,time:1.8}).length>draw(st25,{x:2860,y:3400,time:4.2}).length,'sideways droplet is brief, not a continuous visual hazard');
assert(draw(st25,{x:2860,y:3400}).some(c=>c[0]==='drawImage'),'existing masonry is sampled, not replaced with a new unsupported platform');
assert(!draw(st25,{x:300,y:5400,scale:1}).some(c=>c[0]==='drawImage'),'early realistic waterway has no visible spatial anomaly');
assert.equal(draw({...st25,honroStoryAnomalyEnvironment:clone(STORY_ANOMALY_ENVIRONMENTS[18])}).length,2,'stage18 projectile effect never leaks into other chapters');
console.log('PASS focused anomaly author preserves every non-owned field; 5/4 free crossings, real safe support, old Continue/custom opt-out, pure/cullable local art, transient droplets, FALLING-only seam and exact restoration');
