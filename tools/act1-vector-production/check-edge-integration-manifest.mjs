import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const manifest=JSON.parse(await readFile('tests/fixtures/terrain-edge-integration-20261117.json','utf8'));
for(const entry of manifest.files){
 const bytes=await readFile(entry.path);
 const actual=createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
 assert.equal(actual,entry.gitBlobSha1,`Candidate identity changed: ${entry.path}`);
}
console.log(JSON.stringify({files:manifest.files.length,sourceIdentitiesPreserved:true,scope:manifest.scope}));
