import vm from'node:vm';import ts from'../../game/node_modules/typescript/lib/typescript.js';import{readFile}from'node:fs/promises';
const compile=code=>ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,strict:true},fileName:'math.ts'}).outputText;
const original=compile(await readFile('shared/engine/src/math.ts','utf8')),candidate=compile(await readFile('_local/collision-index/math-candidate.ts','utf8')),run=vm.runInContext;let replacements=0;
vm.runInContext=function(code,...args){if(code.includes(original)){code=code.replace(original,candidate);replacements++;}return run.call(this,code,...args);};
process.on('exit',()=>{console.error('isolated math replacements:',replacements);if(replacements<1)process.exitCode=1;});
