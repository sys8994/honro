/** Source/generated-core preservation only. Not gameplay or publication evidence. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const root=process.cwd(), sha=b=>createHash('sha256').update(b).digest('hex');
// Fixed native afc437b68e5cd4fde6d5b759b433444fb4d189e8 source, not a
// replacement publication/gameplay signature. Never refresh to make a run pass.
const baselineAI='b84884f916f4910c2f96040da399575d5a30cd8350e9ac0dbb080c90513bf071';
const baselineGeneratedAI='59c7a7f80eb5feb42a382adc1ea1d5e88b937909c12886cd16d64d24bb07a9e3';
const removeOnce=(text,exact)=>{assert.equal(text.split(exact).length,2,'Expected one exact allowed addition: '+exact);return text.replace(exact,'');};
const stable=JSON.parse(await readFile('tools/stage40-qa/preserved-source-hashes.json','utf8'));
for(const [file,expected]of Object.entries(stable))assert.equal(sha(await readFile(file)),expected,'Preserved Stage40/current-master source changed: '+file);
const source=await readFile('shared/engine/src/enemyAI.ts','utf8');
const sourceImport="import {cleanupDestinationAllowed} from './act4CleanupRoutes';\n";
const sourceGuard='  if((e.b as any).honroStage===31&&!cleanupDestinationAllowed(e.b,u,{x,y},foot.t.id,e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id))return;\n';
assert.equal(sha(removeOnce(removeOnce(source,sourceImport),sourceGuard)),baselineAI,'Only the exact Stage31 import/gate may differ');
// Use the production core generator once. No historical checkout or second full build.
const {buildCore}=await import(pathToFileURL(path.join(root,'game/engine/build.mjs')));
const core=await buildCore(),marker='"enemyAI": function(module,exports,require){\n';
assert.equal(core.split(marker).length,2,'One generated enemyAI module');
const start=core.indexOf(marker)+marker.length,end=core.indexOf('\n},\n"',start);
assert(end>start,'Generated enemyAI module end');
const generated=core.slice(start,end);
const generatedImport='const act4CleanupRoutes_1 = require("./act4CleanupRoutes");\n';
const generatedGuard='        if (e.b.honroStage === 31 && !(0, act4CleanupRoutes_1.cleanupDestinationAllowed)(e.b, u, { x, y }, foot.t.id, e.contactSurface(u.x, u.y - 4, u.y + 5)?.t?.id))\n            return;\n';
assert.equal(sha(removeOnce(removeOnce(generated,generatedImport),generatedGuard)),baselineGeneratedAI,'Compiled planner differs beyond the Stage31 gate');
// Execute the exact generated clause in an isolated unit probe, never a live battle.
const guard=new Function('e','u','foot','x','y','act4CleanupRoutes_1',generatedGuard+'return true;');
for(const stage of [undefined,6,9,17,24,40]){
 let contacts=0,filters=0;
 const e={b:{honroStage:stage},contactSurface(){contacts++;throw Error('Non-31 must short-circuit contact');}};
 const filter={cleanupDestinationAllowed(){filters++;throw Error('Non-31 must short-circuit helper');}};
 assert.equal(guard(e,{x:99999,y:-99999},{t:{id:'old-save-outside-layer'}},1,2,filter),true);
 assert.equal(contacts,0);assert.equal(filters,0);
}
let contacts=0,filters=0;
assert.equal(guard({b:{honroStage:31},contactSurface(){contacts++;return {t:{id:'approved31-upper-east'}};}},{x:6200,y:100},{t:{id:'approved31-upper-east'}},6300,100,{cleanupDestinationAllowed(){filters++;return false;}}),undefined);
assert.equal(contacts,1);assert.equal(filters,1);
console.log('PASS exact baseline enemyAI preservation and production-generated Stage31-only gate; Stage40 performs zero added contact/helper calls. NOT gameplay/publication acceptance.');
