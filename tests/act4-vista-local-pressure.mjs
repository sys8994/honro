/** Real tide/recovery methods with explicit stage fixtures, not whole play. */
import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
import {appHarness} from './app-regression-helpers.mjs';import {loadPilotRuntime} from '../tools/stage31/pilot-runtime.mjs';
process.env.HONRO_ACT4_RELEASE='1';const h=await appHarness({productionStory:true}),g=h.g;g.HonroApp=h.load(h.profileThrough(39));
g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
for(const name of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);await loadPilotRuntime(g);
const P=g.HonroAct4TerrainPreview,s=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===38),p=g.HonroMaps.profileFor(s);g.HonroEquipment.fresh(p);const b=g.HonroMaps.createBattle(s,g.HONRO_PROJECT,p,{origin:'campaign'});
const lower=b.units.find(u=>u.id==='a4-38-b-7'),upper=b.units.find(u=>u.id==='a4-38-c-2'),far=b.units.find(u=>u.id==='a4-38-b-1');
assert(P.coast.vistaThreatens(b,lower),'Nearby lower-route threat still blocks optional camera');assert(!P.coast.vistaThreatens(b,upper),'Separate upper route does not force extra extermination');assert(!P.coast.vistaThreatens(b,far),'Distant return-route foe does not force backtracking');
const legacy=structuredClone(b);delete legacy.honroAct4EncounterRevision;assert(P.coast.vistaThreatens(legacy,upper),'Legacy map behavior preserved');
console.log('PASS optional vista nearby-lane pressure and legacy fallback; no stage clear/strategy claim');
