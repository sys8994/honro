/** Exact failed R4 profile reload, current-state selection only. No battle writes. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createFinale} from './bootstrap.mjs';
import {evaluateLegalCast} from './legal-cast.mjs';
import {evaluateInputTolerance} from './input-tolerance.mjs';
const dir=process.argv[2];assert(dir);const profilePath=dir+'/facing-profile.json';await writeFile(profilePath,execFileSync('xz',['-dc',dir+'/browser/final-storage.json.xz']));
const {C,e,b,ops}=await createFinale({profilePath,entryRound:4});ops.ready();assert.equal(e.active.id,'knight');assert.equal(e.active.facing,-1);
const src=await readFile(new URL('diagnostic-finishing.mjs',import.meta.url),'utf8'),body=src.slice(src.indexOf('function plan('),src.indexOf('function healing()')),actions=[],before=JSON.stringify(b);
const choice=new Function('C','b','e','actions','evaluateLegalCast','evaluateInputTolerance','assert',body+';return plan(e.active.facing);')(C,b,e,actions,evaluateLegalCast,evaluateInputTolerance,assert);
assert.equal(JSON.stringify(b),before);assert(choice,'Expected usable current-facing shot');assert.equal(choice.angle>90?-1:1,e.active.facing);assert(choice.inputTolerance.safeUseful);
const result={scope:'Exact failed R4 save, current-facing selection; not actual browser continuation',choice,round:b.round,active:e.active.id,facing:e.active.facing,hp:e.active.hp,move:e.active.moveLeft};await writeFile(dir+'/facing-regression.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
