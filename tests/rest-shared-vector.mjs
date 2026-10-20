/** Rest-only data/render smoke. No battle replay, progression or skill sweep. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {vectorKitRuntime} from '../tools/environment/vector-kit-runtime.mjs';
import {REST_BACKDROPS,REST_STYLES,compileRestScene} from '../shared/assets/environment/vector-kit/rest.mjs';
const g=vm.createContext({});
vm.runInContext(await vectorKitRuntime(),g);
vm.runInContext(await readFile('shared/runtime/journey-art.js','utf8'),g);
g.HONRO_REST_BACKDROPS={revision:1,images:Object.fromEntries(Object.keys(REST_BACKDROPS).map(key=>[key,`/fixture/${key}.webp`]))};
for(const frame of Object.values(REST_BACKDROPS))assert((await stat('shared/assets/environment/'+frame.file)).size>0);
const rows=[];
assert.equal(Object.keys(REST_STYLES).length,30);
for(let stage=1;stage<=30;stage++){
 const assembled=compileRestScene(stage),style=REST_STYLES[stage];
 assert(assembled&&style);
 assert(REST_BACKDROPS[style.backdrop]);
 assert(!style.backdrop.includes('draft'));
 const svg=g.HonroJourneyArt.scene('forest','surface',stage);
 assert.equal(svg,g.HonroJourneyArt.scene('forest','surface',stage));
 assert.match(svg,new RegExp(`data-rest-stage="${stage}"`));
 assert.match(svg,/viewBox="0 0 1600 900"/);
 assert.match(svg,/data-rest-backdrop="raster-/);
 assert.match(svg,new RegExp(`data-rest-raster="${style.backdrop}"`));
 assert.doesNotMatch(svg,/<filter\b|data-art-layer="(?:campaign-distant-landscape|distant-ink-mountains|cavern-enclosure)"/);
 assert.match(svg,/data-art-layer="campfire"/);
 assert.doesNotMatch(svg,/<(?:script|foreignObject|animate)\b|data-rest-motion="pine-crown"/);
 const ids=[...svg.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids.length,new Set(ids).size);
 for(const m of svg.matchAll(/url\(#([^)]*)\)/g))assert(ids.includes(m[1]),m[1]);
 const doors=assembled.architecture.groups.flatMap(p=>p.compiled.nodes).filter(n=>n.assetId==='hanok.door.open');
 for(const d of doors){const height=224*d.matrix[3],adult=102*2.21*168.75/300;assert(height/adult>=1.2&&height/adult<=1.5);}
 if(style.underground){assert.match(svg,/data-journey-layer="underground"/);assert.doesNotMatch(svg,/data-art-layer="open-sky"/);}
 if(stage===5)assert.equal([...svg.matchAll(/data-rest-motion="rest5-fall"/g)].length,2);
 rows.push({stage,assembly:style.name,palette:style.palette,underground:!!style.underground,doors:doors.length,backdrop:style.backdrop});
}
// The unique guardian roots and taut ritual thread keep their old paths.
g.HONRO_PAINTED_PILOTS={revision:1,images:{rest10RootSteps:'retained-root-steps'}};
const guardian=g.HonroJourneyArt.scene('temple','surface',10);
assert.match(guardian,/data-art-layer="guardian-root-stairs"/);
assert.match(guardian,/href="retained-root-steps"/);
assert.match(guardian,/data-art-layer="distant-taut-thread"/);
assert.equal(compileRestScene(0),null);
assert.equal(compileRestScene(31),null);
// The actual scene/actor anchor contract is retained by JourneyArt.
assert.equal(g.HonroJourneyArt.anchors.fire.groundY,765);
await mkdir('_local/reports/rest-shared-vector',{recursive:true});
await writeFile('_local/reports/rest-shared-vector/mapping.json',JSON.stringify(rows,null,2)+'\n');
console.log('PASS 30 rest mappings: SVG references, adult-sized doors, static trees, existing raster references, retained fire/water hooks; no battle replay');
