/** Exact baseline core rollback contract. Does not call the unfinished skirt repaired. */
import {writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {runtimeEntries} from '../shared/build.mjs';
const [mode,file,comparison]=process.argv.slice(2),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const entries=await runtimeEntries({vector:false,render:false,productionStory:true}),p=entries.find(e=>e.project).project;
const stage=p.stages.find(s=>s.metadata?.stageId===7),body=p.library.find(a=>a.id==='act1-site:7:body');
assert(stage&&body);
const summary={stageHash:hash(stage),bodyHash:hash(body),vectorHash:hash(body.vector),symbolsHash:hash(body.vector.symbols),rootHash:hash(body.vector.root),bounds:body.bounds,referenceBounds:body.reference.bounds,collision:body.collision};
await writeFile(file,JSON.stringify(summary,null,2));
if(mode==='verify'){
 const baseline=JSON.parse(await readFile(comparison,'utf8'));assert.deepEqual(summary,baseline,'Safe candidate must preserve the complete original stage7 body and stage, not merely selected paths');
 assert.deepEqual(body.collision,[]);assert.deepEqual(body.bounds,{x:-390,y:0,w:2238,h:1466});
 assert(!body.vector.root.children.some(n=>n.clipPath?.startsWith('village-')));
 const regs=JSON.parse(await readFile(new URL('../shared/data/terrain-path-registrations.json',import.meta.url),'utf8'));assert(!regs.some(r=>r.id==='act1-site:7:body'));assert(regs.some(r=>r.id==='act1-site:3:body'));
 console.log(JSON.stringify({passed:true,scope:'Full stage and original BODY exact. Rejected extension deliberately excluded; lower exterior still unfinished.',summary}));
}else assert.equal(mode,'export');
