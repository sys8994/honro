import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

// Exact parent-authored input; never infer prose or discard existing row metadata.
export function applyPatch(input,patch){
 assert.equal(patch.version,3);const data=structuredClone(input),rows=new Map();
 function walk(v){if(!v||typeof v!=='object')return;if(Array.isArray(v)&&typeof v[0]==='string'&&typeof v[1]==='string'&&v[2]?.rowId){assert(!rows.has(v[2].rowId),v[2].rowId);rows.set(v[2].rowId,v);}else Object.values(v).forEach(walk);}
 walk(data);
 for(const r of patch.replacements){const row=rows.get(r.rowId);assert(row,r.rowId);assert.equal(row[0],r.who);assert.equal(row[1],r.before,r.rowId);row[1]=r.after;}
 for(const r of patch.sceneReplacements){const old=data.stages[r.stage][r.section][r.key];assert.deepEqual(old.map(l=>[l[0],l[1],l[2].rowId]),r.before.map(l=>[l[0],l[1],l[2].rowId]));const byId=new Map(old.map(l=>[l[2].rowId,l]));const context={};for(const k of ['storyId','storyTitle']){const value=old.find(l=>l[2]?.[k])?.[2][k];if(value)context[k]=value;}
  data.stages[r.stage][r.section][r.key]=r.after.map(([who,text,meta])=>[who,text,{...context,...byId.get(meta.rowId)?.[2],...meta}]);
 }
 for(const r of patch.insertions){let found=0;function insert(v){if(!v||typeof v!=='object')return;if(Array.isArray(v)){const i=v.findIndex(l=>Array.isArray(l)&&l[2]?.rowId===r.afterRowId);if(i>=0){const meta=v[i][2],context={};for(const k of ['storyId','storyTitle'])if(meta[k])context[k]=meta[k];v.splice(i+1,0,...r.rows.map(([who,text,m])=>[who,text,{...context,...m}]));found++;return;}}Object.values(v).forEach(insert);}insert(data);assert.equal(found,1,r.afterRowId);}
 for(const r of patch.valueReplacements){let target=data;for(const k of r.path.slice(0,-1))target=target[k];const key=r.path.at(-1);assert.equal(target[key],r.before,r.path.join('.'));target[key]=r.after;}
 rows.clear();walk(data);return data;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file='shared/data/narrative-current.json',patch=JSON.parse(await readFile('game/docs/act2-time-farewell-20261023/patch-final.json','utf8'));const next=applyPatch(JSON.parse(await readFile(file,'utf8')),patch);await writeFile(file,JSON.stringify(next,null,2)+'\n');console.log('Applied parent patch v3: '+patch.replacements.length+' rows, '+patch.insertions.length+' insertions, '+patch.sceneReplacements.length+' scenes, '+patch.valueReplacements.length+' values');}
