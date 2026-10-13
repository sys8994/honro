/** Canonical regeneration and production Game/Workshop compile equivalence. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime} from '../game/tests/helpers.mjs';
import {authorStage5Waterfall} from '../tools/map-forge/stage5-waterfall.mjs';
const g=await runtime({legacyMaps:false}),p=JSON.parse(await readFile('shared/data/campaign.json','utf8')),plain=v=>JSON.parse(JSON.stringify(v)),hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const q=authorStage5Waterfall(p,g);assert.deepEqual(plain(q),p,'The canonical waterfall author must reproduce every source byte');assert.deepEqual(plain(g.HONRO_PROJECT.stages[4]),p.stages[4],'Active runtime receives canonical stage5');
const s=p.stages[4],profile=g.HonroMaps.profileFor(s),campaign=g.HonroMaps.createBattle(s,p,profile,{origin:'campaign'}),workshop=g.HonroMaps.createBattle(s,p,profile),geometry=b=>plain({terrain:b.terrain,markers:b.honroMarkers,materials:b.honroSurfaceZones,anchors:b.honroMapAnchors,revision:b.honroStage5WaterfallRevision});
assert.equal(campaign.honroMapOrigin,'campaign');assert.equal(workshop.honroMapOrigin,'workshop');assert.equal(workshop.honroCustom,false);assert(g.HonroStage5Waterfall.active(campaign)&&g.HonroStage5Waterfall.active(workshop));assert.deepEqual(geometry(campaign),geometry(workshop));
for(const open of [false,true]){g.HonroStage5WaterGeometry.setOpen(campaign,open);g.HonroStage5WaterGeometry.setOpen(workshop,open);assert.deepEqual(geometry(campaign),geometry(workshop));}
const roundtrip=g.HonroMaps.normalize(JSON.parse(g.HonroMaps.serialize(p))),imported=g.HonroMaps.createBattle(roundtrip.stages[4],roundtrip);assert(g.HonroStage5Waterfall.active(imported));assert.deepEqual(geometry(imported),geometry(g.HonroMaps.createBattle(s,p)));
const old=plain(campaign);delete old.honroStage5WaterfallRevision;const before=JSON.stringify(old);g.HonroStage5WaterGeometry.setOpen(old,false);assert.equal(JSON.stringify(old),before,'Existing saved stage5 without opt-in is never rewritten');
const report={scope:'Production compiler, not browser UI',canonicalStage5:hash(s),wholeProject:hash(p),generatorExact:true,runtimeExact:true,gameWorkshopClosedAndOpenEqual:true,serializedImportEqual:true,legacySetOpenNoOp:true};await mkdir('_local/reports/stage5-waterfall',{recursive:true});await writeFile('_local/reports/stage5-waterfall/authoring-contracts.json',JSON.stringify(report,null,2));console.log(report);
