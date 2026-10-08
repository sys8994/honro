import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runtime} from '../game/tests/helpers.mjs';
import {beforeVerticalWaterworks,beforeVerticalWaterworksLibrary,verticalWaterworksHistoryDelta as f,verticalHash as hash} from './vertical-waterworks-history-helpers.mjs';
const g=await runtime({legacyMaps:false}),p=JSON.parse(readFileSync('shared/data/campaign.json','utf8')),c=JSON.parse(JSON.stringify(g.HONRO_CONTENT)),snapshot=JSON.stringify({p,c});
function frozen(p,c){const old=beforeVerticalWaterworks(p,c);for(const row of f.hashes)assert.equal(hash(old.project.stages[row.stage-1]),row.beforeSha256,'Complete immutable B stage '+row.stage);return old;}
const old=frozen(p,c);assert.equal(hash(p),f.afterProjectSha256,'Entire reviewed C canonical source');assert.equal(JSON.stringify({p,c}),snapshot,'C projection is read-only');
for(const row of f.hashes)assert.equal(hash(p.stages[row.stage-1]),row.afterSha256,'Reviewed C canonical stage '+row.stage);
for(let i=0;i<30;i++)if(![24,26].includes(i)){assert.deepEqual(old.project.stages[i],p.stages[i]);assert.deepEqual(old.content.stages[i],c.stages[i]);}
assert.deepEqual(old.project.library,p.library,'Map/content projection never hides Library changes');
assert.equal(hash(p.library),f.library.afterSha256,'Exact reviewed C additive Library');
const library=beforeVerticalWaterworksLibrary(p.library);assert.equal(hash(library),f.library.beforeSha256);assert.equal(hash({...old.project,library}),f.beforeProjectSha256,'All thirty maps, global settings and Library recover exact immutable B source');
const locate=(q,row)=>{let target=(row.domain==='map'?q.p.stages:q.c.stages)[row.stage-1];for(const key of row.path.slice(0,-1))target=target[key];return {target,key:row.path.at(-1)};};
for(const row of f.rows){const q={p:structuredClone(p),c:structuredClone(c)},{target,key}=locate(q,row);target[key]=typeof target[key]==='number'?target[key]+.01:'unapproved';assert.throws(()=>beforeVerticalWaterworks(q.p,q.c),/Exact approved vertical waterworks delta/,'Reject mutated C path');const missing={p:structuredClone(p),c:structuredClone(c)},r=locate(missing,row);if(row.hasAfter){delete r.target[r.key];assert.throws(()=>beforeVerticalWaterworks(missing.p,missing.c),/Exact approved vertical waterworks delta/,'Reject missing C path');}}
for(const mutate of [q=>q.stages[24].id+=' drift',q=>q.stages[26].metadata.act=77,q=>q.stages[24].metadata.unapproved='drift',q=>q.stages[26].objectives[0].required=false]){const q=structuredClone(p);mutate(q);assert.throws(()=>frozen(q,c),'Unreviewed changes remain visible to frozen B stage hashes');}
const unrelated=structuredClone(p);unrelated.stages[0].units[0].x++;assert.equal(beforeVerticalWaterworks(unrelated,c).project.stages[0].units[0].x,unrelated.stages[0].units[0].x,'Projection never discards unrelated changes');
for(const mutate of [q=>q[0].name+=' drift',q=>q.at(-1).name+=' drift',q=>q.pop(),q=>q.push(structuredClone(q[0])),q=>q.reverse(),q=>q.push({id:'unapproved'}),q=>{[q[f.library.beforeLength],q[f.library.beforeLength+1]]=[q[f.library.beforeLength+1],q[f.library.beforeLength]];}]){const q=structuredClone(p.library);mutate(q);assert.throws(()=>beforeVerticalWaterworksLibrary(q));}
assert.throws(()=>beforeVerticalWaterworks(old.project,old.content),'Cannot silently accept B as C');
console.log(`PASS C → immutable B history: ${f.rows.length} exact paths, changed/missing controls, complete B25/27 hashes, 28 untouched maps, exact additive assets, original Library/order and unrelated-drift rejection`);
