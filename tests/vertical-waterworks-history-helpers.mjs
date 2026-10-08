// C is a separate, bounded layer above immutable B/A historical fixtures.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const verticalWaterworksHistoryDelta=JSON.parse(readFileSync(new URL('./fixtures/vertical-waterworks-history-delta.json',import.meta.url),'utf8'));
const plain=x=>JSON.parse(JSON.stringify(x));
export const verticalHash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
export function beforeVerticalWaterworksLibrary(library){
 const f=verticalWaterworksHistoryDelta.library;
 assert.equal(library.length,f.beforeLength+f.assets.length,'Exact C additive Library size');
 assert.equal(new Set(library.map(a=>a.id)).size,library.length,'Unique C Library IDs');
 for(const [i,row] of f.assets.entries()){const asset=library[f.beforeLength+i];assert.equal(asset.id,row.id,'Exact C additive asset order');assert.equal(verticalHash(asset),row.sha256,'Exact C additive asset '+row.id);}
 const prior=plain(library.slice(0,f.beforeLength));assert.equal(verticalHash(prior),f.beforeSha256,'Entire immutable B Library including original order');return prior;
}
export function beforeVerticalWaterworks(project,content){
 const out=plain(project),c=content?plain(content):undefined;
 const orders=verticalWaterworksHistoryDelta.keyOrders.filter(row=>row.domain==='map'||c);
 const objectAt=row=>{let target=(row.domain==='map'?out.stages:c.stages).find(s=>(row.domain==='map'?s.metadata?.stageId:s.id)===row.stage);for(const key of row.path)target=target[key];return target;};
 for(const row of orders)assert.deepEqual(Object.keys(objectAt(row)),row.after,'Exact approved vertical waterworks delta object order');
 for(const row of verticalWaterworksHistoryDelta.rows){
  if(row.domain==='content'&&!c)continue;
  const records=row.domain==='map'?out.stages:c.stages,matches=records.filter(s=>(row.domain==='map'?s.metadata?.stageId:s.id)===row.stage),message='Exact approved vertical waterworks delta '+row.domain+'/'+row.stage+'/'+row.path.join('/');
  assert.equal(matches.length,1,message+' unique stage');let target=matches[0];
  for(const key of row.path.slice(0,-1)){assert(target&&Object.hasOwn(target,key),message+' parent exists');target=target[key];}
  const key=row.path.at(-1);assert.equal(Object.hasOwn(target,key),row.hasAfter,message+' presence');if(row.hasAfter)assert.deepEqual(target[key],row.after,message+' value');
  if(row.hasBefore)target[key]=plain(row.before);else delete target[key];
 }
 for(const row of orders){const target=objectAt(row),values={...target};for(const key of Object.keys(target))delete target[key];for(const key of row.before)target[key]=values[key];}
 return {project:out,content:c};
}
