import ts from 'typescript';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export function scopeNormal51Engine(s){
  const bytes=Buffer.from(s),hash=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  if(hash!=='2b715dadd94bc6758043f79128cadf42624f52f6')throw Error('Unexpected pinned Stage51 engine '+hash);
  const a='get stage() { return STAGES[this.b.stageId - 1]; }';
  if(s.split(a).length!==2)throw Error('Stage51 live engine hook source drift');
  return s.replace(a,'get stage() { return normal51Provider.content(this.b) || STAGES[this.b.stageId - 1]; }');
}
export async function buildCore({normal51=false}={}){
  const dir=path.join(path.dirname(fileURLToPath(import.meta.url)),'../../shared/engine/src');
  const files=(await readdir(dir)).filter(f=>f.endsWith('.ts')).sort();
  const modules=[];
  for(const f of files){
    let code=await readFile(path.join(dir,f),'utf8');
    if(normal51&&f==='engine.ts')code=scopeNormal51Engine(code);
    const out=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,strict:true},fileName:f});
    modules.push(`${JSON.stringify(f.slice(0,-3))}: function(module,exports,require){\n${out.outputText}\n}`);
  }
  const exports=['equipmentCombat','equipment','playerRange','skillAudioMap','waterfallPhysics','audio','bgm','campUI','icons','atlasControls','art','engine','data','world','store','math','progression','enemyAI','balance','balanceModel','passiveBalance','spBalanceModel','stageRules','atlasLayout','physics','projectileGrowth','mageGeometry','gateTravel','totemBehavior','skillMechanics','skillVisuals','warriorData','warriorMechanics','combatPassives','warriorVisuals','summons','locomotion','existence','damageVariance'];
  return `const modules={${modules.join(',\n')}};const cache={};function load(id){id=id.replace(/^\\.\\//,'').replace(/\\.js$/,'');if(cache[id])return cache[id].exports;if(!modules[id])throw new Error('Missing internal module: '+id);const m={exports:{}};cache[id]=m;modules[id](m,m.exports,load);return m.exports;}\nglobalThis.HONRO_CORE={${exports.map(id=>`...load('${id}')`).join(',')}};`;
}
