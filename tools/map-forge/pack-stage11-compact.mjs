/** Regenerate the explicit compact package from unchanged production sources.
 * No campaign, HTML or release policy writes; assets are added only explicitly.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime} from '../../game/tests/helpers.mjs';
import {createCompactProject} from './stage11-compact-project.mjs';
process.env.HONRO_STAGE11_COMPACT='0';
process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false,productionStory:true}),source=g.HONRO_PROJECT;
const p=createCompactProject(g,source,'B-open'),stage=p.stages.find(s=>s.metadata.stageId===11);
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const assets=[];
// An artwork manifest is optional during internal geometry/mission preview.
// Missing artwork is always recorded as pending, never silently approved.
let art=null;try{art=JSON.parse(await readFile('art/act2-ch1-compact-20261109/package.json','utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(art)for(const row of art.assets){const a=JSON.parse(await readFile(row.file,'utf8'));if(a.id!==row.id||a.collision?.length)throw Error('Invalid compact asset package');assets.push(a);stage.elements.push(row.placement);}
const record={revision:1,mapRevision:413,status:art?'candidate-artwork-unapproved':'geometry-preview-artwork-pending',candidate:'B-open',source:source.stages.find(s=>s.metadata.stageId===11),sourceStageSha256:digest(source.stages.find(s=>s.metadata.stageId===11)),stage,assets};
await writeFile('shared/data/act2/stage11-compact-package.json',JSON.stringify(record)+'\n');
console.log(JSON.stringify({candidate:record.candidate,stageSha256:digest(stage),assets:assets.length,status:record.status,otherStagesChanged:false}));
