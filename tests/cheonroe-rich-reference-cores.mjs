/** Isolated historical visual modules for matched browser evidence; no tracked build changes. */
import {execFileSync} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import ts from '../game/node_modules/typescript/lib/typescript.js';
import {buildCore} from '../game/engine/build.mjs';
const core=await buildCore(),dir='_local/reports/cheonroe-rich-effects';mkdirSync(dir,{recursive:true});
const compile=s=>ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,strict:true}}).outputText;
for(const [variant,ref,modules] of [['original-rich','be79826869c70ae68950eb8be8a4bd7d187600dc',['skillVisuals']],['current-reduced','d33402627e0c632593a388ec19e0b5370cc68439',['skillVisuals','art']]]){
 let code=core;
 for(const name of modules){const file=`shared/engine/src/${name}.ts`,now=compile(readFileSync(file,'utf8')),old=compile(execFileSync('git',['show',`${ref}:${file}`],{encoding:'utf8'}));if(!code.includes(now))throw Error('Module mismatch '+name);code=code.replace(now,old);}
 writeFileSync(`${dir}/${variant}.js`,code);
}
console.log('Historical visual cores generated; current mechanics retained in all variants. Original-rich reference uses size5 hit replay, not historical single-target mechanics.');
