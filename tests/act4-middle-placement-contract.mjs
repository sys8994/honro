import fs from'node:fs';import assert from'node:assert/strict';
import {placeAct4Middle,ACT4_MIDDLE_PLACES}from'../shared/act4-middle-placement.mjs';
const base=process.env.HONRO_SOURCE_ROOT||process.cwd();
const {supportPoint}=await import(base+'/shared/act4-finale-revision.mjs');
const {authorAct4Stage37}=await import(base+'/shared/act4-stage37-author.mjs');
const {authorAct4Stage38}=await import(base+'/shared/act4-stage38-author.mjs');
const raw=JSON.parse(fs.readFileSync(base+'/shared/data/act4/world.json'));
const result=[];
for(const id of [34,35,37,38]){
 let before=structuredClone(raw.stages.find(s=>s.metadata.stageId===id));if(id===37)before=authorAct4Stage37(before,supportPoint);if(id===38)before=authorAct4Stage38(before,supportPoint);
 const after=placeAct4Middle(before,supportPoint);
 const stable=u=>{const s=structuredClone(u);delete s.x;delete s.y;delete s.encounterGroup;delete s.stageOverrides?.group;delete s.stageOverrides?.honroEncounterSupport;return s;};
 assert.deepEqual(after.units.map(stable),before.units.map(stable));for(const k of ['terrains','elements','events','objectives','design'])assert.deepEqual(after[k],before[k]);
 const changed=after.units.filter((u,i)=>u.x!==before.units[i].x||u.y!==before.units[i].y);for(const u of changed){const p=supportPoint(after,u.stageOverrides.honroEncounterSupport,u.x);if(u.id==='a4-35-e-5')p.y-=150;assert.deepEqual({x:u.x,y:u.y},p);}
 const enemies=after.units.filter(u=>u.team==='enemy'),overlap=[];for(let i=0;i<enemies.length;i++)for(let j=i+1;j<enemies.length;j++){const a=enemies[i],b=enemies[j];if(Math.abs(a.x-b.x)<55&&Math.abs(a.y-b.y)<125)overlap.push([a.id,b.id]);}
 assert.deepEqual(overlap,[],`body-overlap candidates stage${id}`);
 const listed=after.encounters.flatMap(e=>e.unitIds);assert.equal(new Set(listed).size,listed.length);for(const u of changed)assert(listed.includes(u.id));
 assert.deepEqual(placeAct4Middle(after,supportPoint),after);
 if(id===34)assert.deepEqual(after.units.find(u=>u.id==='a4-34-g0-1'),before.units.find(u=>u.id==='a4-34-g0-1'),'wrong-exit actor stays');
 if(id===38)for(const uid of ['a4-38-f-1','a4-38-pursuer-0','a4-38-pursuer-1'])assert.deepEqual(after.units.find(u=>u.id===uid),before.units.find(u=>u.id===uid),'rescue/pursuit retained');
 result.push({stage:id,count:enemies.length,moved:changed.length,places:ACT4_MIDDLE_PLACES[id].length,scope:'Source preservation/support/body-gap contract only, not visual/play approval',before:before.units,after:after.units});
}
fs.mkdirSync('_local/reports/act4-middle-placement',{recursive:true});fs.writeFileSync('_local/reports/act4-middle-placement/source-contract.json',JSON.stringify(result,null,2));console.log(result.map(({before,after,...r})=>r));

const {applyAct4FinaleRevision}=await import('../shared/act4-finale-revision.mjs');const project={...raw,stages:raw.stages.filter(s=>[34,35,37,38].includes(s.metadata.stageId))};const once=applyAct4FinaleRevision(project);assert.deepEqual(applyAct4FinaleRevision(once),once,'whole author pipeline idempotence');
