/** Extract a compact Stage 31 review draft, never an approval or export.
 * Dynamic runtime assets remain in the separately shipped campaign world. */
import {readFile,writeFile} from 'node:fs/promises';
import {runtime} from '../../game/tests/helpers.mjs';
import {loadPilotRuntime} from './pilot-runtime.mjs';
const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Usage: minimal-draft.mjs input-draft.json output-draft.json');
process.env.HONRO_ACT4_RELEASE='1';const g=await runtime({legacyMaps:false});await loadPilotRuntime(g);const P=g.HonroProductionContract,p=JSON.parse(await readFile(input,'utf8')),id='stage-31',stage=p.stages.find(s=>s.id===id),card=p.production?.cards?.[id];
if(!stage||!card)throw Error('Stage or production card missing');
const ids=new Set([...(stage.elements||[]),...(stage.environment?.placements||[])].map(v=>v.assetId)),stages=new Set([id,...card.referenceStages]);
const compact={...p,stages:p.stages.filter(s=>stages.has(s.id)),library:p.library.filter(a=>ids.has(a.id)),activeStageId:id};
if(compact.stages.length!==stages.size||compact.library.length!==ids.size)throw Error('Missing reference stage or direct asset');
if(P.source(compact,id)!==P.source(p,id))throw Error('Compaction changed bound source/card/assets');
const before=P.releaseStatus(p,id),after=P.releaseStatus(compact,id);
if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Compaction changed production audit or acceptance state');
if(after.exportAllowed)throw Error('This tool only emits an unapproved partial draft');
await writeFile(output,JSON.stringify(compact));console.log(JSON.stringify({fingerprint:after.fingerprint,stageCount:compact.stages.length,assetCount:compact.library.length,machinePass:after.machinePass,missingProbes:after.missingProbes,missingReviews:after.missingReviews,exportAllowed:after.exportAllowed}));
