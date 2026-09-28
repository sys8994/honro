import ts from 'typescript';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export async function buildCore(){
  const dir=path.join(path.dirname(fileURLToPath(import.meta.url)),'../../shared/engine/src');
  const files=(await readdir(dir)).filter(f=>f.endsWith('.ts')).sort();
  const modules=[];
  for(const f of files){
    const code=await readFile(path.join(dir,f),'utf8');
    const out=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,strict:true},fileName:f});
    modules.push(`${JSON.stringify(f.slice(0,-3))}: function(module,exports,require){\n${out.outputText}\n}`);
  }
  const exports=['audio','bgm','campUI','icons','atlasControls','art','engine','data','world','store','math','progression','enemyAI','balance','balanceModel','stageRules','atlasLayout','physics','projectileGrowth','skillMechanics','skillVisuals','summons','locomotion'];
  return `const modules={${modules.join(',\n')}};const cache={};function load(id){id=id.replace(/^\\.\\//,'').replace(/\\.js$/,'');if(cache[id])return cache[id].exports;if(!modules[id])throw new Error('Missing internal module: '+id);const m={exports:{}};cache[id]=m;modules[id](m,m.exports,load);return m.exports;}\nglobalThis.HONRO_CORE={${exports.map(id=>`...load('${id}')`).join(',')}};`;
}
