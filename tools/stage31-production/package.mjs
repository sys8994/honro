/** Portable candidate only. Does not satisfy release gate or modify campaign. */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const input=process.argv[2]||'_local/reports/stage31-production/release-candidate/stage31.draft.honro-map.json';
const p=JSON.parse(await readFile(input)),s=p.stages.find(s=>s.id==='stage-31');
if(!s)throw Error('Stage31 candidate missing');
const used=new Set(s.elements.map(e=>e.assetId));
if(s.design.vectorArrivalBoatAssetId)used.add(s.design.vectorArrivalBoatAssetId);
for(const v of s.environment?.placements||[])used.add(v.assetId);
const library=p.library.filter(a=>used.has(a.id));
for(const id of used)if(!library.some(a=>a.id===id))throw Error('Missing asset '+id);
const out='art/stage31-vector-production/package';await mkdir(out,{recursive:true});
for(const [name,data]of [['stage',s],['library',library],['production-card',p.production.cards[s.id]]])await writeFile(`${out}/${name}.json`,JSON.stringify(data));
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
await writeFile(out+'/manifest.json',JSON.stringify({stage:31,status:'native-candidate-browser-release-review-pending',stageSha256:sha(s),librarySha256:sha(library),projectFingerprintScope:'Full input contains baseline other stages; package contains only Stage31 and referenced library assets.',collisionScope:'Intentional Stage31 redesign from tools/stage31-production/blueprint.json. Not physical parity with old official Stage31.',assets:library.map(a=>({id:a.id,bytes:Buffer.byteLength(JSON.stringify(a))})),source:input,authoring:'Gameplay skeleton → image concepts → actual Inkscape raw → bounded optimization → BODY/REAR/FORE assembly.',remaining:['Actual browser HUD/touch review','Final current-runtime actual-input evidence binding','Remote publication and existing Pages verification'],reviewPolicy:'No automatic art approval, fabricated camera/mobile gate pass, or replacement of browser QA by native Canvas.'},null,2));
console.log(JSON.stringify({package:out,stage:s.id,assets:library.length,bytes:Buffer.byteLength(JSON.stringify(library))}));
