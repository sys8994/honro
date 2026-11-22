import assert from 'node:assert/strict';
import {readFile,writeFile,lstat,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join,resolve,relative,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
const base='2c4e90ff24d1f5aa5d04f01317caa02f89b8194c',tree='8d90f1fc6737adb025a5bb092b03462e283297ce';
const ma='web/manifest.json',coef='shared/web-retention.mjs',source='shared/data/act4/sideview-art/33-coastal-v2.json';
const expected={manifest:'12b99fa8b1b35c4ed94962c370ff38c6a06597473dc4417b2861ad46d04e0dbc',
 module:'dde8232a57a4e3f9e1649de09ce958614ce578798853d14400f96c45afaeebfa',
 source:'3ab093ce8cff00efb620d2fed8eae6cc4c732892',retiredSha:'8f2c285ea91ec496fc685e63c065d90dff823621040b099a54e197bb2bf2dfca',baselineCount:1329,orphans:155,intermediate:4,bytes:66605228};
const sha=(v,kind='sha256')=>createHash(kind).update(v).digest('hex');
const blob=v=>createHash('sha1').update('blob '+v.length+'\0').update(v).digest('hex');
const jsonSHA=value=>sha(JSON.stringify(value));
const identical=(a,b,msg)=>assert.equal(jsonSHA(a),jsonSHA(b),msg);
const facts=v=>({bytes:v.length,sha256:sha(v)});
const row=(a)=>({bytes:a.bytes,sha256:a.sha256});
const within=(a,b)=>{const x=relative(a,b);return x&&x!=='..'&&!x.startsWith('../')&&!x.startsWith('/');};
const git=(r,...x)=>execFileSync('git',['-C',r,...x],{encoding:'utf8',maxBuffer:2*1024*1024});
function rows(gens){return gens.flatMap(g=>g.files);}
function inventory(list){
 const seen=new Map();
 for(const f of list){
  assert(/^web\/(runtime|entries|data|styles|graphics|fonts)\/[\w.-]+$/.test(f.path)&&Number.isSafeInteger(f.bytes)&&f.bytes>=0&&/^[0-9a-f]{64}$/.test(f.sha256));
  const m=f.path.match(/\.([0-9a-f]{16})\./);assert(m&&f.sha256.startsWith(m[1]),f.path);
  if(seen.has(f.path))assert.deepEqual(seen.get(f.path),row(f),f.path);
  seen.set(f.path,row(f));
 }
 return seen;
}
const addr=m=>inventory([...m.files,...m.previousFiles,...m.previousGenerations.flat(),...rows(m.publishedGenerations)]);
const missing=async file=>{try{const s=await lstat(file);assert(s.isFile()&&!s.isSymbolicLink(),file);return false;}catch(e){if(e.code==='ENOENT')return true;throw e;}};
async function exact(root,path,f){
 const file=join(root,path); assert.equal(await realpath(file),file,'redirect on immutable file: '+path);
 const b=await readFile(file); assert.deepEqual(facts(b),f,path);return b;
}
export function classified(a,b,before,after,policy){
 const pp=t=>({pub:policy.selectPublishedGenerations(a.publishedGenerations,{now:t}),...policy.planWebAssetRetention(a,b.files,{now:t})});
 const p=pp(before);identical(p,pp(after),'retention window boundary crossed; not a comparable replay');
 assert.deepEqual(a.publishedRetention,b.publishedRetention);
 identical(p.pub,a.publishedGenerations,'published records would age at current clock; do not touch them');
 identical(b.publishedGenerations,p.pub,'B manifest publishedGenerations differs from canonical plan');
 identical(b.previousFiles,p.previousFiles,'B manifest previousFiles differs from canonical plan');
 identical(b.previousGenerations,p.previousGenerations,'B manifest previousGenerations differs from canonical plan');
 const aAct=inventory(a.files),bAct=inventory(b.files),ap=inventory(rows(a.publishedGenerations)),aPrev=inventory(a.previousFiles);
 const aSlots=inventory(a.previousGenerations.flat()),bLive=addr(b),aAll=addr(a),ob=inventory(p.obsoleteFiles);
 const match=new Map();
 for(const [path,f] of ob){
  assert(aPrev.has(path)&&!aAct.has(path)&&!bAct.has(path)&&!ap.has(path)&&!bLive.has(path),'not A-only retired intermediate metadata: '+path);
  assert.deepEqual(aPrev.get(path),f);match.set(path,{...f,kind:aSlots.has(path)?'old-unpublished-intermediate-slot':'old-previousFiles-only-unregistered'});
 }
 return {aAll,bLive,match};
}
async function main(root,before,after){
 assert(Number.isSafeInteger(before)&&Number.isSafeInteger(after)&&before<=after&&after-before<=14*60*1000);
 const rt=await realpath(process.env.RUNNER_TEMP);root=await realpath(root);assert(within(rt,root));
 const a=join(root,'A'),b=join(root,'B');assert.equal(await realpath(a),a);assert.equal(await realpath(b),b);
 for(const r of [a,b]){
  assert.equal(git(r,'rev-parse','HEAD').trim(),base);assert.equal(git(r,'rev-parse','HEAD^{tree}').trim(),tree);
  assert.equal(git(r,'branch','--show-current').trim(),'');
 }
 assert.equal(git(b,'hash-object',source).trim(),expected.source);
 assert.equal(git(a,'status','--porcelain=v1','-z'),'');
 const bytesA=await readFile(join(a,ma)),bytesB=await readFile(join(b,ma));
 assert.equal(sha(bytesA),expected.manifest);
 const policyBytes=await readFile(join(a,coef));assert.equal(sha(policyBytes),expected.module);
 assert.deepEqual(await readFile(join(b,coef)),policyBytes);
 const policy=await import(pathToFileURL(join(a,coef)).href);
 const x=classified(JSON.parse(bytesA),JSON.parse(bytesB),before,after,policy);
 assert.equal(x.aAll.size,expected.baselineCount);
 assert.equal([...x.match.values()].filter(o=>o.kind==='old-previousFiles-only-unregistered').length,expected.orphans);
 assert.equal([...x.match.values()].filter(o=>o.kind==='old-unpublished-intermediate-slot').length,expected.intermediate);
 assert.equal([...x.match.values()].reduce((n,f)=>n+f.bytes,0),expected.bytes);
 const retiredSHA=jsonSHA([...x.match].sort(([a],[b])=>a.localeCompare(b)).map(([p,o])=>[p,o.bytes,o.sha256,o.kind]));
 assert.equal(retiredSHA,expected.retiredSha);
 const gitRows=git(a,'ls-tree','-rz',base,'--','web').split('\0').filter(Boolean)
   .map(r=>r.match(/^(100644) blob ([0-9a-f]{40})\t(.+)$/));
 const pins=new Map(gitRows.filter(Boolean).map(m=>[m[3],m[2]]));
 for(const [path,f] of x.bLive)await exact(b,path,f); // verify every currently active and protected target before any writes
 const absent=[];
 for(const [path,f] of x.aAll){
  const bytes=await exact(a,path,f);assert.equal(blob(bytes),pins.get(path),'pristine A Git object mismatch '+path);
  if(await missing(join(b,path))){
   assert(x.match.has(path),'unexpected missing active/retained byte in target '+path);
   assert.equal(await realpath(dirname(join(b,path))),dirname(join(b,path)));
   absent.push(path);
  }else await exact(b,path,f); // existing differing bytes must never be replaced
 }
 for(const path of absent){
  const z=x.match.get(path),bytes=await exact(a,path,row(z));assert.equal(blob(bytes),pins.get(path));
  await writeFile(join(b,path),bytes,{flag:'wx'});await exact(b,path,row(z));
 }
 assert.equal(sha(await readFile(join(b,ma))),sha(bytesB),'B active manifest changed');
 for(const [path,f] of x.bLive)await exact(b,path,f);
 const out={base,manifestA:sha(bytesA),manifestB:sha(bytesB),activeTargetCount:JSON.parse(bytesB).files.length,
  baselinePhysicalByteAuthority:x.aAll.size,protectedTargetAuthority:x.bLive.size,originalCandidateGit:expected.source,
  canonicalObsoleteExpected:{sha256:retiredSHA,previousFilesOnly:expected.orphans,oldUnpublishedSlot:expected.intermediate,totalBytes:expected.bytes},
  restored:absent.map(path=>({path,...x.match.get(path),gitBlob:pins.get(path)})),
  restoredBytes:absent.reduce((n,p)=>n+x.match.get(p).bytes,0),retentionPolicyUnchanged:true,manifestRewrite:false,holdOldOfficial:true};
 await writeFile(join(root,'out','QA-OLD-URLS.json'),JSON.stringify(out,null,2)+'\n',{flag:'wx'});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
 await main(process.argv[2],Number(process.argv[3]),Number(process.argv[4]));
