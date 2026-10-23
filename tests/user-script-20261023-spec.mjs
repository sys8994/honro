// Evidence-only input: never imported by production runtime/build.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const inputPath='game/docs/story/user-script-20261023/approved-patch.json';
export const patch=JSON.parse(readFileSync(inputPath,'utf8'));
export const hash=v=>createHash('sha256').update(v).digest('hex');
assert.equal(readFileSync(inputPath).length,199130);assert.equal(hash(readFileSync(inputPath)),'7b408cfb80601d324cac9f2defb8a0dbbc39fd8713dc5b1ca5b5f14b8eceb59d');
assert.equal(patch.sourceFile,'shared/data/narrative-current.json');
const raw=execFileSync('git',['show',patch.sourceCommit+':'+patch.sourceFile],{maxBuffer:8e6});assert.equal(hash(raw),patch.sourceSha256);
export const before=JSON.parse(raw),after=structuredClone(before);
export const parts=p=>p.split('/').slice(1).map(s=>s.replace(/~1/g,'/').replace(/~0/g,'~'));
export function get(value,path){return parts(path).reduce((node,key)=>node[key],value);}
export function set(value,path,text){const keys=parts(path),last=keys.pop();keys.reduce((node,key)=>node[key],value)[last]=text;}
const allowed=p=>p==='/stages/12/beats/sign/3/2/mageAbsentText'||/^\/stages\/(?:[1-9]|[12]\d|30)\/(?:storySummary|narration\/\d+)$/.test(p)||/^\/actEndings\/(?:10|20|30)\/lines\/\d+$/.test(p)||/^\/(?:mapScenes|optional|stages|scenes|arrivals|routes|restEndings)\/.+\/1$/.test(p);
assert.equal(patch.operations.length,661);assert.equal(new Set(patch.operations.map(o=>o.path)).size,661);
for(const o of patch.operations){assert(allowed(o.path),'Text-only target '+o.path);assert.equal(typeof o.before,'string');assert.equal(typeof o.after,'string');assert.notEqual(o.before,o.after);assert.equal(get(before,o.path),o.before,'Exact original '+o.path);set(after,o.path,o.after);}
export function verify(actual){
 const differences=[];
 function walk(a,b,path=''){assert.equal(typeof a,typeof b,path);if(a&&typeof a==='object'){assert.deepEqual(Object.keys(a),Object.keys(b),'Keys/row order '+path);if(Array.isArray(a))assert.equal(a.length,b.length,'Row count '+path);for(const k of Object.keys(a))walk(a[k],b[k],path+'/'+k.replace(/~/g,'~0').replace(/\//g,'~1'));}else if(a!==b){assert.equal(typeof a,'string','Non-text delta '+path);differences.push(path);}}
 walk(before,actual);assert.deepEqual(differences.sort(),patch.operations.map(o=>o.path).sort(),'Exactly the approved661 paths');assert.deepEqual(actual,after,'Exact supplied after strings; other data unchanged');
 return {operations:661,beforeExact:true,afterExact:true,structureAndMetadataUnchangedExceptMageAbsentText:true,sourceSha256:patch.sourceSha256,resultSha256:hash(JSON.stringify(actual))};
}
