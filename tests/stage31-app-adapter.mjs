// Adapter correctness checks, not a claim that Stage31 was completed.
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createAppAdapter} from '../tools/stage31/app-adapter.mjs';
const temp=await mkdtemp(join(tmpdir(),'honro-stage31-adapter-'));
execFileSync(process.execPath,['tools/stage31/forge.mjs','tools/stage31/blueprint.json',temp],{stdio:'pipe'});
const project=JSON.parse(await readFile(join(temp,'stage31.draft.honro-map.json'),'utf8'));
await rm(temp,{recursive:true,force:true});
const a=await createAppAdapter(project,'stage-31',{entryBuild:'campaign-spent-v1'});
for(let i=0;i<100;i++){
 if(a.app.modal.classList.contains('open'))a.app.close();
 if(a.app.dialogue||a.engine.b.honroAct4PreviewState?.arrivalTour?.active)a.skip();
 a.tick();
}
assert(a.app.canInput(),'Simulated clock must release the actual turn notice; the adapter may not sit frozen forever');
assert.equal(a.engine.b.units.filter(u=>u.side===1).length,13);
assert(a.engine.b.terrain.some(t=>t.id==='s31-estuary-bank'));
assert(a.training.filter(r=>r.earned!==undefined).every(r=>r.spent<=r.earned),'Representative entry build spends earned SP only');
assert.equal(a.success(),false,'Input-ready is not quest completion');
const stage=project.stages.find(s=>s.id==='stage-31');
const scoped={...project,activeStageId:stage.id,stages:[stage]};
a.app.launchMap(scoped,stage.id,{story:false});
assert(a.app.engine.b.terrain.some(t=>t.id==='s31-estuary-bank'));
assert.equal(a.app.engine.b.units.filter(u=>u.side===1).length,13);
assert.equal(project.stages.length,40,'Playtest extraction must not remove sibling stages from authored project');
console.log('PASS Stage31 App adapter clock, legitimate entry SP and selected-stage play launch. Full play unverified.');
