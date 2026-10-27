/** Source/fixture integrity only. Not gameplay or successful scene delivery. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const directory='game/docs/story/v4-reviewed/',manifest=JSON.parse(await readFile(directory+'MANIFEST.json','utf8'));
for(const row of manifest.files){const bytes=await readFile(directory+row.name);assert.equal(bytes.length,row.bytes,row.name);assert.equal(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex'),row.git_blob_sha,row.name);}
let count=0;for(let n=21;n<=30;n++){const final=JSON.parse(await readFile(directory+'HONRO-CH'+n+'-reviewed-final.json','utf8')),data=JSON.parse(await readFile('shared/data/reviewed/act23-v4-ch'+n+'.json','utf8'));assert.equal(data.sourceCommit,'c6bb72992f2e920739f7f95e15f9ac95ba34dddb');assert.equal(data.adopted_status_verbatim,final.status);assert.equal(data.rows.length,final.rows.length);assert.equal(new Set(data.rows.map(r=>r.id)).size,data.rows.length);for(const row of final.rows){const actual=data.rows.find(r=>r.id===row.id);assert(actual,row.id);for(const[key,value]of Object.entries(row))assert.deepEqual(actual[key],value,row.id+' '+key);count++;}for(const[key,value]of Object.entries(final))if(!['rows','status'].includes(key))assert.deepEqual(data[key],value,n+' '+key);}
assert.equal(count,321);console.log('PASS canonical docs byte/blob manifest and all321 rows/all original fields/aliases preserved; source-only inspection, not runtime proof');
