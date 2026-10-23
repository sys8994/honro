import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const ts=createRequire(new URL('../game/engine/build.mjs',import.meta.url))('typescript');
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {buildCore} from '../game/engine/build.mjs';
const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);
const source=await readFile('shared/engine/src/icons.ts','utf8');
const old=execFileSync('git',['show','5987f6db:shared/engine/src/icons.ts'],{encoding:'utf8'});
const legacy={exports:{}};vm.runInNewContext(ts.transpileModule(old,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:legacy.exports,require:()=>({SKILLS:g.HONRO_CORE.SKILLS})});
const manifest=JSON.parse(await readFile('shared/assets/skill-icons/v1/manifest.json','utf8'));
for(const id of Object.keys(manifest.icons)){const markup=g.HONRO_CORE.icon('skill:'+id);assert(markup.includes('data-skill-icon="'+id+'"'));assert(markup.includes('<img'));assert(!markup.includes('<svg'));}
for(const name of ['flame','arrow','sword','snow','bolt','rune','target','shield','potion','play','pause','close','chevron','back','map','star','lock','check','gear','wind','book','save','volume','home','zoom','funeral','hermitage','fortress','ferry','gorge','bridge','godtree','guardian','brazier','range','plus'])assert.equal(g.HONRO_CORE.icon(name),legacy.exports.icon(name),name+' non-skill UI preserved');
for(const name of ['REDESIGN_PATHS','skillPath','GOURD','STAKE'])assert(!source.includes(name),name+' removed');
const active=JSON.parse(await readFile('web/manifest.json','utf8'));
const oldGourd='M12 2h8v4q4 2 3 6l-3 3q10 5 6 12-3 5-10 4-7 1-10-4-4-7 6-12l-3-3q-1-4 3-6ZM10 14l12 1m-6 0v12m0-9 4 1-1 6';
for(const file of active.files.filter(f=>f.path.endsWith('.js')))assert(!(await readFile(file.path,'utf8')).includes(oldGourd),file.path+' excludes obsolete skill-only vector data');
console.log('PASS 84 skill IDs: no SVG at markup creation; 36 generic/class/item/map symbols exact; obsolete skill vector generator/source and current graph removed');
