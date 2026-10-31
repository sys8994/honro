/** Compare a fresh build to the committed published baseline, without modifying it. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const commit=process.argv[2]||'cc33f68a';
if(!/^[a-f0-9]{7,40}$/i.test(commit))throw Error('Pass a baseline commit hash');
const old=file=>execFileSync('git',['show',`${commit}:${file}`],{maxBuffer:150*1024*1024});
const sha=data=>createHash('sha256').update(data).digest('hex');
const baseline=JSON.parse(old('web/manifest.json')),current=JSON.parse(await readFile('web/manifest.json'));
for(const key of ['project','gameEntry','workshopEntry','common','gameOnly'])assert.deepEqual(current[key],baseline[key],key+' differs');
const expected=new Map(baseline.files.map(f=>[f.path,f])),actual=new Map(current.files.map(f=>[f.path,f]));
assert.equal(actual.size,expected.size);for(const [path,e] of expected){const a=actual.get(path);assert(a,`Missing ${path}`);assert.equal(a.sha256,e.sha256,path);assert.equal(a.bytes,e.bytes,path);const bytes=await readFile(path);assert.equal(bytes.length,e.bytes,path);assert.equal(sha(bytes),e.sha256,path);}
const before=JSON.parse(old(baseline.project)),after=JSON.parse(await readFile(current.project));assert.equal(before.stages.length,40);assert.equal(after.stages.length,40);
const stages=[];for(let i=0;i<40;i++){const a=JSON.parse(old(before.stages[i])),b=JSON.parse(await readFile(after.stages[i]));const first=JSON.stringify(a),second=JSON.stringify(b);assert.equal(second,first,`stage ${i+1}`);stages.push({stage:i+1,sha256:sha(first)});}
console.log(JSON.stringify({baseline:commit,files:actual.size,stages,scope:'Fresh build compared to checked-in published assets and authored stage JSON; not browser or full-play acceptance'},null,2));
