/** Exact one-asset revision3 -> immutable 67-node revision2 boundary. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buddhaHash as hash,buddhaPlain as plain} from './stage16-temple-buddha-contract-helpers.mjs';
export const stage16BuddhaAsceticDelta=JSON.parse(readFileSync(new URL('./fixtures/stage16-temple-buddha-ascetic-delta.json',import.meta.url),'utf8'));
const f=stage16BuddhaAsceticDelta;
const previous=JSON.parse(readFileSync(new URL('./fixtures/stage16-temple-buddha-refinement-delta.json',import.meta.url),'utf8'));
const priorAssets=new Set([hash(f.beforeAsset),hash(previous.beforeAsset)]);
const assets=library=>Array.isArray(library)?library.filter(a=>a?.id===f.assetId):[];
const isPrior=library=>{const rows=assets(library);return rows.length===1&&priorAssets.has(hash(rows[0]));};
export function beforeStage16BuddhaAsceticLibrary(library,{required=false}={}){
 const out=plain(library),rows=assets(out);
 if(!required&&(!rows.length||isPrior(out)))return out;
 assert.equal(rows.length,1,'Exact ascetic Buddha needs one asset');
 assert.deepEqual(rows[0],f.afterAsset,'Exact reviewed ascetic Buddha asset values');
 assert.deepEqual(rows[0].collision,[],'Ascetic Buddha stays noncolliding');
 const digest=hash(out),full=digest===f.afterLibrarySha256,act12=digest===f.afterAct12LibrarySha256;
 assert(full||act12,'Exact ascetic Library preserves every other asset value and order');
 assert.deepEqual(out.map(a=>a.id),full?f.libraryOrder:f.libraryOrder.filter(id=>!id.startsWith('a3-')),'All540 reviewed asset IDs remain ordered');
 out[out.findIndex(a=>a.id===f.assetId)]=plain(f.beforeAsset);
 assert.equal(hash(out),full?f.beforeLibrarySha256:f.beforeAct12LibrarySha256,'Exact revision2 Library is restored');return out;
}
export function assertStage16BuddhaAsceticCurrent(project,{unrelated=true,library=true}={}){
 const st=project.stages?.filter(s=>s.metadata?.stageId===16||s.id==='stage-16');
 assert.equal(st?.length,1,'Exact ascetic Buddha needs a unique Stage16');
 assert.equal(hash(st[0]),f.stages.find(s=>s.id==='stage-16').sha256,'Ascetic art cannot alter any Stage16 field or placement');
 if(unrelated){
  const full=project.stages.length===30,rows=full?f.stages:f.stages.filter(s=>Number(s.id.slice(6))<=20);
  assert.deepEqual(project.stages.map(s=>s.id),rows.map(s=>s.id),'Exact full/Act12 stage membership and order');
  for(const row of rows)assert.equal(hash(project.stages.find(s=>s.id===row.id)),row.sha256,'Ascetic art cannot alter map '+row.id);
  if(library&&Array.isArray(project.library))assert.equal(hash(project),full?f.afterProjectSha256:f.afterAct12ProjectSha256,'Exact complete ascetic project');
 }
 if(library&&Array.isArray(project.library))beforeStage16BuddhaAsceticLibrary(project.library,{required:true});return st[0];
}
export function beforeStage16BuddhaAscetic(project,{unrelated=false,library=true}={}){
 const out=plain(project);
 if(!library||!Array.isArray(out.library)||!assets(out.library).length||isPrior(out.library))return out;
 const has16=(out.stages||[]).some(s=>s.metadata?.stageId===16||s.id==='stage-16');
 if(has16)assertStage16BuddhaAsceticCurrent(out,{unrelated,library});
 out.library=beforeStage16BuddhaAsceticLibrary(out.library,{required:true});return out;
}
