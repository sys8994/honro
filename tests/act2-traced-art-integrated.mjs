/** Final build-hook contract; exact baseline geometry, never a gameplay pass. */
import vm from 'node:vm';import assert from 'node:assert/strict';import{writeFile,mkdir}from'node:fs/promises';import{runtimeEntries}from'../shared/build.mjs';import{reviewedArtStages}from'../tools/act2-vector-production/apply-candidates.mjs';
const plain=x=>JSON.parse(JSON.stringify(x??null));
async function load(enabled){process.env.HONRO_ACT2_ART_CANDIDATES=enabled?'1':'0';const e=await runtimeEntries({vector:false,render:false,productionStory:true});const g=vm.createContext({console,performance,structuredClone,setTimeout,clearTimeout});g.window=g;for(const p of e)vm.runInContext(p.code,g);return g;}
const a=await load(false),b=await load(true),rows=[];
for(const old of a.HONRO_PROJECT.stages){const id=old.metadata.stageId,next=b.HONRO_PROJECT.stages.find(s=>s.id===old.id);assert(next);
 if(!reviewedArtStages.includes(id)){assert.deepEqual(plain(next),plain(old),'Untouched stage '+id);continue;}
 const p=a.HonroMaps.createBattle(old,a.HONRO_PROJECT),q=b.HonroMaps.createBattle(next,b.HONRO_PROJECT);a.HonroStageRules.sanitizeStageBattle(p);b.HonroStageRules.sanitizeStageBattle(q);
 for(const key of ['terrain','honroWorldTerrain','units','waters','honroMarkers','objectives','honroState'])assert.deepEqual(plain(q[key]),plain(p[key]),`Stage${id} physical/event field ${key}`);
 assert.equal(next.width,old.width);assert.equal(next.height,old.height);assert.deepEqual(plain(next.camera),plain(old.camera));
 const arts=(q.honroLandmarks||[]).filter(l=>l.asset?.id?.startsWith('act2-traced:stage'+id+'-'));assert(arts.length>0);assert(arts.every(l=>!l.collisionIds.length));
 rows.push({stage:id,width:next.width,height:next.height,landmarkAssets:arts.map(x=>x.asset.id),collisionAndEventsIdentical:true});}
await mkdir('_local/reports/act2-integrated-art',{recursive:true});await writeFile('_local/reports/act2-integrated-art/contracts.json',JSON.stringify({passed:true,reviewedArtStages,rows,scope:'Pre-author hook and effective physics invariants only; gameplay and browser gates separate.'},null,2));console.log(JSON.stringify(rows));
