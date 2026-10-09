/** Exact additive Buddha art -> immutable completed-temple boundary.
 * The later one-asset refinement is reversed first; both fixtures stay immutable. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {beforeStage16BuddhaRefinement,beforeStage16BuddhaRefinementLibrary} from './stage16-temple-buddha-refinement-history-helpers.mjs';
import {buddhaHash as hash,buddhaPlain as plain} from './stage16-temple-buddha-contract-helpers.mjs';
export const stage16BuddhaDelta=JSON.parse(readFileSync(new URL('./fixtures/stage16-temple-buddha-art-delta.json',import.meta.url),'utf8'));
const assetPrefix='stage16:temple-stone-buddha-',elementPrefix='s16-buddha-';
const hasAsset=library=>Array.isArray(library)&&library.some(a=>typeof a?.id==='string'&&a.id.startsWith(assetPrefix));
const hasElement=stage=>Array.isArray(stage?.elements)&&stage.elements.some(e=>typeof e?.id==='string'&&e.id.startsWith(elementPrefix));
function map16(project,{required=true}={}){
 const matches=(project.stages||[]).filter(s=>s.metadata?.stageId===16||s.id==='stage-16');
 assert.equal(matches.length,required?1:Math.min(matches.length,1),'Exact Buddha layer needs a unique Stage16');
 if(!matches.length)return null;
 assert.equal(matches[0].id,'stage-16');assert.equal(matches[0].metadata.stageId,16);return matches[0];
}
export function beforeStage16BuddhaLibrary(library,{required=false}={}){
 const out=beforeStage16BuddhaRefinementLibrary(library),f=stage16BuddhaDelta;
 if(!required&&!hasAsset(out))return out;
 const digest=hash(out),full=digest===f.afterLibrarySha256,act12=digest===f.afterAct12LibrarySha256;
 assert(full||act12,'Exact reviewed Buddha Library values and order');
 const originalIds=full?f.libraryOrderBefore:f.libraryOrderBefore.filter(id=>!id.startsWith('a3-'));
 for(const asset of f.assets){const found=out.filter(a=>a.id===asset.id);assert.equal(found.length,1,'Exact Buddha asset presence');assert.deepEqual(found[0],asset,'Exact Buddha asset values');assert.deepEqual(asset.collision,[],'Buddha stays noncolliding');}
 assert.deepEqual(out.map(a=>a.id),[...originalIds,...f.assets.map(a=>a.id)],'All original539 assets remain before the only additive artwork');
 const ids=new Set(f.assets.map(a=>a.id)),prior=out.filter(a=>!ids.has(a.id));
 assert.equal(hash(prior),full?f.beforeLibrarySha256:f.beforeAct12LibrarySha256,'Every original Library value and order is restored');return prior;
}
export function assertStage16BuddhaCurrent(project,{unrelated=true,library=true}={}){
 project=beforeStage16BuddhaRefinement(project,{unrelated,library});
 const st=map16(project),f=stage16BuddhaDelta;
 assert.equal(hash(st),f.afterStageSha256,'Exact reviewed Stage16 Buddha map');
 assert.deepEqual(st.elements.map(e=>e.id),f.elementOrderAfter,'Exact Buddha element order');
 for(const element of f.elements){const found=st.elements.filter(e=>e.id===element.id);assert.equal(found.length,1);assert.deepEqual(found[0],element,'Exact Buddha placement');}
 if(unrelated){
  const full=project.stages.length===30,rows=full?f.otherStages:f.otherStages.filter(s=>Number(s.id.slice(6))<=20);
  assert.deepEqual(project.stages.map(s=>s.id),f.stageOrder.filter(id=>id==='stage-16'||rows.some(r=>r.id===id)),'Full/Act12 stage membership and order remain exact');
  for(const row of rows)assert.equal(hash(project.stages.find(s=>s.id===row.id)),row.sha256,'Unchanged original map '+row.id);
  if(library&&Array.isArray(project.library))assert.equal(hash(project),full?f.afterProjectSha256:f.afterAct12ProjectSha256,'Complete reviewed Buddha source and every unrelated field');
 }
 if(library&&Array.isArray(project.library))beforeStage16BuddhaLibrary(project.library,{required:true});return st;
}
export function beforeStage16Buddha(project,{unrelated=false,library=true}={}){
 const out=beforeStage16BuddhaRefinement(project,{unrelated,library}),st=map16(out,{required:false}),f=stage16BuddhaDelta;
 if(!st){if(library&&Array.isArray(out.library))out.library=beforeStage16BuddhaLibrary(out.library);return out;}
 if(!hasElement(st)&&!hasAsset(out.library))return out;
 assertStage16BuddhaCurrent(out,{unrelated,library});
 const ids=new Set(f.elements.map(e=>e.id));st.elements=st.elements.filter(e=>!ids.has(e.id));
 assert.deepEqual(st.elements.map(e=>e.id),f.elementOrderBefore,'Every original element retains its place and order');
 assert.equal(hash(st),f.beforeStageSha256,'Complete original Stage16 recovered after exact one-element removal');
 if(library&&Array.isArray(out.library))out.library=beforeStage16BuddhaLibrary(out.library,{required:true});return out;
}
