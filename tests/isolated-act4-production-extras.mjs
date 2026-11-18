/** Test-only isolated Scene loader. Uses official App manifest bytes/order; never runs App. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {runtimeEntries,root} from '../shared/build.mjs';
export async function isolatedAct4ProductionExtras(existing){
 assert.equal(process.env.HONRO_ACT4_RELEASE,'1');
 const official=await runtimeEntries({vector:false,render:false,app:true,productionStory:true});
 const names=official.map(e=>e.name),start=names.indexOf('shared/runtime/act4-art.js'),end=names.indexOf('shared/runtime/act4-pilot-art.js');
 assert(start>=0&&end>start,'Official Act4 manifest interval missing');
 const wantedGlobals=['HONRO_ACT4_PILOT_COMBAT_REFERENCE','HONRO_ACT4_PREVIEW_SEEDS'];
 const manifest=[...wantedGlobals.map(n=>{const rows=official.filter(e=>e.global===n||e.name===n);assert.equal(rows.length,1,n);return rows[0];}),...official.slice(start,end+1).filter(e=>e.name!=='shared/runtime/act4-campaign.js')];
 // Campaign is an App lifecycle wrapper, deliberately omitted from a no-App Scene.
 const oldNames=existing.map(e=>e.name);assert.equal(new Set(oldNames).size,oldNames.length,'Existing duplicate registration');
 const additions=[],proof=[];
 for(const e of manifest){
  assert.equal(manifest.filter(v=>v.name===e.name).length,1,'Official duplicate '+e.name);
  if(e.name.startsWith('shared/runtime/'))assert.equal(e.code,(await readFile(path.join(root,e.name),'utf8')).replace(/\r\n/g,'\n'),'Official entry differs from source '+e.name);
  const previous=existing.find(v=>v.name===e.name);
  if(previous)assert.equal(previous.code,e.code,'Existing official code mismatch '+e.name);else additions.push(e);
  proof.push({name:e.name,sha256:createHash('sha256').update(e.code).digest('hex'),alreadyLoaded:!!previous});
 }
 const finalNames=[...existing,...additions].map(e=>e.name);assert.equal(new Set(finalNames).size,finalNames.length);
 const helpers=manifest.filter(e=>/\/stage\d+.*\.js$/.test(e.name)).map(e=>{
  const m=e.code.match(/if\(G\.(HonroStage\w+)\)return/);assert(m,'Unrecognized stage helper export '+e.name);
  return {name:e.name,global:m[1]};
 });
 for(const name of ['stage33-exterior-art','stage34-foundation-edge','stage37-alpha-edge','stage38-alpha-edge'])assert(helpers.some(h=>h.name==='shared/runtime/'+name+'.js'),'Required combined helper absent '+name);
 const proofJSON=JSON.stringify({source:'official runtimeEntries(app:true)',excludedAppWrapper:'shared/runtime/act4-campaign.js',proof,helpers});
 const guard=';globalThis.HONRO_ISOLATED_ACT4_MANIFEST='+proofJSON+';for(const h of HONRO_ISOLATED_ACT4_MANIFEST.helpers){if(!globalThis[h.global]||typeof globalThis[h.global].draw!=="function")throw Error("Official helper missing "+h.global);}';
 return {code:additions.map(e=>e.code).join('\n;\n')+guard,proof,helpers};
}
