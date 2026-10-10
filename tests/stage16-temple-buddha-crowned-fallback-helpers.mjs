import {beforeStage18Bell} from './stage8-bier-history-helpers.mjs';
/** Exact current crowned first-art -> immutable revision3 audit projection.
 * This is a forward fallback in source history, not a repository reset. Existing
 * first-art/refinement/ascetic fixtures stay immutable; no duplicate asset delta. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buddhaHash as hash,buddhaPlain as plain} from './stage16-temple-buddha-contract-helpers.mjs';
export const stage16BuddhaCrownedFirst=JSON.parse(readFileSync(new URL('./fixtures/stage16-temple-buddha-art-delta.json',import.meta.url),'utf8'));
export const stage16BuddhaCrownedPrior=JSON.parse(readFileSync(new URL('./fixtures/stage16-temple-buddha-ascetic-delta.json',import.meta.url),'utf8'));
export const stage16BuddhaCrownedFallback={
 beforeSourceCommit:'624a1848e569170cabb042d23394d9efdc06c204',
 restoredFromSourceCommit:'dbef41ce1eefc897afcf17ee0ed2a17ce27aebf9',
 restoredRecipeSha256:'c2abcd6dfdef28516c1c2cad7d614bc8de56e08d8430d7482f984603487cf7ed',
 assetId:stage16BuddhaCrownedPrior.assetId
};
export function assertStage16BuddhaCrownedFallbackCurrent(project){
 project=beforeStage18Bell(project); // Normalize VM-realm prototypes without mutating runtime data.
 const first=stage16BuddhaCrownedFirst,prior=stage16BuddhaCrownedPrior,id=stage16BuddhaCrownedFallback.assetId;
 const full=project.stages?.length===30,rows=full?prior.stages:prior.stages.filter(s=>Number(s.id.slice(6))<=20);
 assert.deepEqual(project.stages?.map(s=>s.id),rows.map(s=>s.id),'Fallback preserves exact full/Act12 stage membership and order');
 for(const row of rows)assert.equal(hash(project.stages.find(s=>s.id===row.id)),row.sha256,'Fallback preserves the complete map '+row.id);
 assert.equal(first.assets.length,1);assert.equal(first.assets[0].id,id);
 const assets=project.library?.filter(a=>a.id===id);
 assert.equal(assets?.length,1,'Fallback has exactly one original Buddha asset');
 assert.deepEqual(assets[0],first.assets[0],'Current crowned artwork exactly matches the immutable first-art value');
 assert.deepEqual(assets[0].collision,[],'Restored crowned Buddha is still collision-free');
 assert.deepEqual(project.library.map(a=>a.id),full?prior.libraryOrder:prior.libraryOrder.filter(a=>!a.startsWith('a3-')),'Fallback preserves all asset IDs and order');
 assert.equal(hash(project.library),full?first.afterLibrarySha256:first.afterAct12LibrarySha256,'Fallback preserves every other asset value');
 assert.equal(hash(project),full?first.afterProjectSha256:first.afterAct12ProjectSha256,'Fallback is the exact first-art project, including all globals');
 return assets[0];
}
export function beforeStage16BuddhaCrownedFallback(project){
 assertStage16BuddhaCrownedFallbackCurrent(project);
 const out=beforeStage18Bell(project),f=stage16BuddhaCrownedPrior,full=out.stages.length===30;
 out.library[out.library.findIndex(a=>a.id===f.assetId)]=plain(f.afterAsset);
 assert.equal(hash(out.library),full?f.afterLibrarySha256:f.afterAct12LibrarySha256,'One-asset projection exactly recovers the reviewed ascetic Library');
 assert.equal(hash(out),full?f.afterProjectSha256:f.afterAct12ProjectSha256,'One-asset projection exactly recovers the reviewed ascetic project');
 return out;
}
