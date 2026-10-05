import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {hash} from './state.mjs';
/** Explicit complete build-input trees, not extension filtering. Includes forge baselines/references, environment composition and approval orchestration. */
export const INPUT_TREES=['shared','game/engine','game/config','game/vendor','game/templates','game/src','tools/party-forge','tools/monster-forge','tools/actor-forge','tools/environment','tools/intent-pipeline','tests/fixtures','assets','workshop/src'];
export const INPUT_FILES=['game/build.mjs','workshop/build.mjs','game/package.json','game/package-lock.json','tools/intent-pipeline/runtime.mjs','tools/intent-pipeline/validate.mjs','tools/intent-pipeline/source.mjs'];
export async function sourceSnapshot(root,{includeCompiler=true}={}){
 const files=new Set();
 async function walk(dir){for(const ent of await readdir(dir,{withFileTypes:true})){const f=path.join(dir,ent.name);if(ent.isSymbolicLink())throw Error('Build input symlink requires explicit provenance: '+f);if(ent.isDirectory())await walk(f);else if(ent.isFile())files.add(f);}}
 for(const dir of INPUT_TREES)await walk(path.join(root,dir));for(const file of INPUT_FILES)files.add(path.join(root,file));
 const hashes=[];for(const f of [...files].sort())hashes.push([path.relative(root,f).split(path.sep).join('/'),hash(await readFile(f))]);
 if(includeCompiler){const require=createRequire(path.join(root,'game/engine/build.mjs')),tsFile=require.resolve('typescript');hashes.push(['installed-typescript-entry',hash(await readFile(tsFile))]);}
 let commit='fixture';try{commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}
 return{fingerprintVersion:2,commit,projectHash:hash(await readFile(path.join(root,'shared/data/campaign.json'))),codeHash:hash(hashes),dependencyCount:hashes.length};
}
export function sameSource(a,b){return a.fingerprintVersion===b.fingerprintVersion&&a.projectHash===b.projectHash&&a.codeHash===b.codeHash;}
export function assertUnchangedSource(before,after){if(!sameSource(before,after))throw Error('Build inputs or generated runtime assets changed during preparation. Regenerate proposals; prior approval is stale.');}
export async function prepareVerifiedRuntime(expected,{snapshot,load}){
 const before=await snapshot();if(expected&&!sameSource(expected,before))throw Error('Source changed since the presented options; regenerate and ask again.');
 const runtime=await load(),after=await snapshot();assertUnchangedSource(before,after);
 if(expected?.runtimeHash&&runtime.bundleHash!==expected.runtimeHash)throw Error('Exact compiled runtime differs from the presented evidence. Approval is stale.');
 return{runtime,source:{...after,runtimeHash:runtime.bundleHash}};
}
