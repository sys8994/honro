/** Current Stage11 canonical/scene/Workshop contract, independent of frozen history. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {authorStage11Ravine} from '../tools/map-forge/apply-stage11-ravine.mjs';
import {beforeCurrentStage17Worksite} from './stage17-worksite-history-helpers.mjs';
const plain=v=>JSON.parse(JSON.stringify(v)),hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,p=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
const old=JSON.parse(await readFile('tests/fixtures/stage11-ravine-before.json','utf8'));
const st=p.stages.find(s=>s.metadata.stageId===11),checks=[];
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
const once=await authorStage11Ravine(plain(p),g),twice=await authorStage11Ravine(plain(once),g);
check('the public Stage11 author exactly reproduces canonical data and is idempotent',()=>{
 assert.equal(hash(once),hash(p));assert.equal(hash(twice),hash(p));
 assert.equal(hash(g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===11)),hash(st),'Runtime bundle must use canonical Stage11');
});
check('all 29 unrelated maps and every old Library asset remain byte-value exact and ordered',()=>{
 // Current Stage17 is checked in full before its exact historical reversal.
 // This retains all 29 original map assertions, including the original17.
 const historical=beforeCurrentStage17Worksite(p);
 for(const row of old.otherStages)assert.equal(hash(historical.stages.find(s=>s.id===row.id)),row.sha256,row.id);
 const ids=new Set(old.libraryIds);assert.equal(hash(historical.library.filter(a=>ids.has(a.id))),old.librarySha256);
 assert.deepEqual(historical.library.filter(a=>ids.has(a.id)).map(a=>a.id),old.libraryIds);
 assert.equal(new Set(historical.library.map(a=>a.id)).size,historical.library.length);
 const count=n=>1+(n.children||[]).reduce((s,q)=>s+count(q),0);
 for(const a of historical.library.filter(a=>!ids.has(a.id))){assert(a.id.startsWith('stage11:ravine-'));assert.equal(a.collision.length,0);assert(count(a.vector.root)<=512,a.id+' vector budget');}
});
check('seven authored objective sites resolve to supported live markers, residents and story focus',()=>{
 const q=battlefield(g,11),b=q.b,hero=q.e.heroesAlive()[0];
 assert.equal(q.st.w,st.width);assert.equal(q.st.h,st.height);assert.equal(q.st.enemies,44);
 for(const s of b.honroAct2Steps){
  const site=st.design.space.sites[s.id],m=b.honroMarkers.find(m=>m.id===s.id);assert(site&&m,s.id);
  assert.equal(m.x,site.x,s.id+' marker x');assert.equal(m.y,site.y,s.id+' marker y');
  assert(C.validTerrainContactPose(b.terrain,{...hero,x:site.x,y:site.y}),s.id+' valid standing support');
  const point=g.HonroStoryStaging.point(b,{marker:s.id});assert(point);assert.equal(point.x,m.x);assert.equal(point.y,m.y);
 }
 const rescue=b.honroMarkers.find(m=>m.id==='resident'),host=b.units.find(u=>u.id===rescue.target),spirit=b.units.find(u=>u.id===rescue.spiritId);
 assert(host?.honroProtected&&spirit?.honroSpirit);assert(Math.abs(host.x-rescue.x)<100);
 assert(g.HonroStoryStaging.point(b,{actor:host.id}));assert(g.HonroStoryStaging.point(b,{actor:spirit.id}));
 assert.deepEqual(plain(q.st.steps),old.content.steps,'Seven story-bearing mission rules remain exact');
});
check('Workshop normalize and finalize preserve current collision, encounters and stage-local art',()=>{
 const normalized=g.HonroMaps.normalize(plain(p)),finalized=g.HonroMaps.finalize(plain(p));
 for(const project of [normalized,finalized])assert.deepEqual(plain(project.stages.find(s=>s.metadata.stageId===11)),st);
 const b=g.HonroMaps.createBattle(st,p);assert.equal(b.honroRavineVersion,2);assert.equal(b.honroStage11EncounterRevision,2);assert(g.HonroStage11RavineEncounters.active(b),'Campaign maps retain response hooks in Workshop/Playtest origin');
 assert.equal(b.units.filter(u=>u.side===1).length,45);assert.equal(b.honroEvents.filter(e=>e.honroStage11Response===1).length,5);
 assert.equal(g.HonroSpaceLayout.validate(st).length,0);
});
await mkdir('_local/reports/stage11-ravine',{recursive:true});await writeFile('_local/reports/stage11-ravine/authoring.json',JSON.stringify({checks,canonicalSha256:hash(p),stageSha256:hash(st),scope:'Authoring, data, scene references and Workshop data roundtrip; not browser interaction or combat completion.'},null,2)+'\n');
