import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {orderedScriptSource} from '../shared/web-build.mjs';

const dir=await mkdtemp(path.join(tmpdir(),'honro-ordered-'));
try{
  await writeFile(path.join(dir,'loader.mjs'),'export async function yieldIfNeeded(){await Promise.resolve();globalThis.__orderedProof.push("yield");}\n');
  const scripts=[
    {name:'base',code:'var privateValue=1; const local=2; globalThis.__orderedProof=["base"]; globalThis.__orderedValue=()=>local;'},
    {name:'patch',code:'var privateValue=3; const local=4; const old=globalThis.__orderedValue; globalThis.__orderedValue=()=>old()+local; globalThis.__orderedProof.push("patch");'},
    {name:'consumer',code:'globalThis.__orderedProof.push(globalThis.__orderedValue()); if(this!==undefined)throw Error("module this changed");'}
  ];
  await writeFile(path.join(dir,'group.mjs'),orderedScriptSource(scripts,'./loader.mjs'));
  await import(pathToFileURL(path.join(dir,'group.mjs')));
  assert.deepEqual(globalThis.__orderedProof,['base','yield','patch','yield',6,'yield']);
  assert.equal(globalThis.privateValue,undefined);
  assert.throws(()=>orderedScriptSource([{name:'async-barrier',code:'await Promise.resolve();'}],'./loader.mjs'));
  assert.throws(()=>orderedScriptSource([{name:'module-barrier',code:'export const x=1;'}],'./loader.mjs'));
  console.log('PASS exact patch/consumer order, private lexical/var scopes, module this, per-script yields, async/module barriers');
}finally{
  delete globalThis.__orderedProof;delete globalThis.__orderedValue;
  await rm(dir,{recursive:true,force:true});
}
