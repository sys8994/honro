/** Exact parent-source composition; old browser receipts are reused only for
 * byte-identical art/runtime. New dialogue still requires fresh UI evidence. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtimeDigest} from '../stage31/probes.mjs';
const refs={base:'54507cb9c647fafacd68dbc30a8cfc49fba96a55',public:'c916eb7ba2962ae4a6b702843119949dbf484060',source:'c5f9765e369cd6a69d4e7440a65756d8519e4923',measured:'781cb3bc0441b58330105e812cef8b16c7473c4d',monster:'741c1c8b4726a5f0108c0d903b63fbee194c032b'};
const git=(...a)=>execFileSync('git',a,{maxBuffer:64*1024*1024});
function tree(ref){return new Map(git('ls-tree','-r',ref).toString().trim().split('\n').map(l=>{const [meta,path]=l.split('\t');return[path,meta.split(' ')[2]];}));}
const t=Object.fromEntries(Object.entries(refs).map(([k,v])=>[k,tree(v)])),head=tree('HEAD');
const generated=p=>p.startsWith('web/')||['HONRO.html','HONRO_WORKSHOP.html','index.html'].includes(p);
const allowed=new Set(['tools/act2-dialogue-ci/source-parity.mjs','.github/workflows/act2-dialogue-integration.yml','tools/act4-ci/stage31-fullplay.py','game/docs/ACT2_DIALOGUE_INTEGRATION.md']);
const packagePath='tools/stage31/production-package.json',monsterPath='game/docs/MONSTER_REDESIGN_PLAN_v1.md';let checked=0;
for(const path of new Set([...t.base.keys(),...t.public.keys(),...t.source.keys(),...head.keys()])){
 if(generated(path)||allowed.has(path))continue;
 let expected;
 if(path===packagePath)expected=t.measured.get(path);
 else if(path===monsterPath)expected=t.monster.get(path);
 else if(t.public.get(path)===t.base.get(path))expected=t.source.get(path);
 else if(t.source.get(path)===t.base.get(path))expected=t.public.get(path);
 else if(t.public.get(path)===t.source.get(path))expected=t.public.get(path);
 else if(path==='game/docs/BUG_LOG.md')expected=t.source.get(path); // Existing master notes already retained verbatim in source branch.
 else throw Error('Unreviewed source overlap: '+path);
 assert.equal(head.get(path),expected,'Unexpected source bytes: '+path);checked++;
}
for(const path of ['shared/data/act2','art/act2-near-vector-candidates'])assert.equal(git('rev-parse','HEAD:'+path).toString(),git('rev-parse',refs.source+':'+path).toString(),'Changed previously tested art tree');
// Exact file-union validation above rejects extra archive payloads. The source
// merge itself has only published c916 and production c5 as parents.
const digest=await runtimeDigest();assert.equal(digest,'b411a1760163366d9a44c87f6b975f2de9cba4a867e83a34d6beac1083d91798','Runtime changed: genuine fresh evidence required');
const bytes=await readFile(packagePath);assert(bytes.equals(git('show',refs.measured+':'+packagePath)),'Measured package must be byte-exact');
const p=JSON.parse(bytes),objective=p.production.probeResults[p.stageId].find(r=>r.id==='boarding-objective');assert.equal(objective.sourceRunId,41543828006);assert.equal(objective.sourceCommit,refs.source);
const dirty=git('diff','--name-only','HEAD').toString().trim().split('\n').filter(Boolean).filter(p=>!generated(p));assert.deepEqual(dirty,[],'Uncommitted source edits');
const report={passed:true,sourceCommit:git('rev-parse','HEAD').toString().trim(),parents:refs,checkedSourcePaths:checked,runtimeSha256:digest,stage31PackageSha256:createHash('sha256').update(bytes).digest('hex'),reusedEvidence:{stage31Run:41543828006,stage17ContinueRun:41549658978},scope:'Exact source/art/runtime equality only; dialogue/browser acceptance separately required'};
const out=process.argv[2];if(out){await mkdir(out,{recursive:true});await writeFile(out+'/source-parity.json',JSON.stringify(report,null,2)+'\n');}console.log(JSON.stringify(report));
