import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {applyPatch} from '../tools/story/apply-act2-time-farewell.mjs';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const patch=await read('game/docs/act2-time-farewell-20261023/patch-final.json'),current=await read('shared/data/narrative-current.json');
assert.equal(patch.version,3);assert.equal(patch.valueReplacements.length,7);
const original=JSON.parse(execFileSync('git',['show','edf36a5f:shared/data/narrative-current.json'],{maxBuffer:8*1024*1024}));
assert.deepEqual(current,applyPatch(original,patch),'Only the exact approved edit set may change');
const index=data=>{const m=new Map();function walk(v){if(!v||typeof v!=='object')return;if(Array.isArray(v)&&v[2]?.rowId){assert(!m.has(v[2].rowId));m.set(v[2].rowId,v);}else Object.values(v).forEach(walk);}walk(data);return m;};
const old=index(original),next=index(current);
for(const [id,row]of old){const now=next.get(id);assert(now,'Existing row identity '+id);for(const [key,value]of Object.entries(row[2]))if(!patch.sceneReplacements.some(r=>r.after.some(l=>l[2].rowId===id&&Object.hasOwn(l[2],key))))assert.deepEqual(now[2][key],value,id+':'+key);}
for(const r of patch.replacements)assert.equal(next.get(r.rowId)[1],r.after);
for(const r of patch.valueReplacements){let value=current;for(const key of r.path)value=value[key];assert.equal(value,r.after);}
assert.deepEqual(current.actEndings[20].images,original.actEndings[20].images);
console.log('PASS exact parent v3,19 rows/5 insertions/8 scenes/7 values, unique IDs and retained metadata');
