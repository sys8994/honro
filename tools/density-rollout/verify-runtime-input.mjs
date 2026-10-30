/** Read-only integration preflight. Does not replace runtime or approve release. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime} from '../../game/tests/helpers.mjs';
const dir=process.argv[2];if(!dir)throw Error('Usage: node verify-runtime-input.mjs CANDIDATE_DIRECTORY');
const read=async f=>JSON.parse(await readFile(f,'utf8')),hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const campaign=await read('shared/data/campaign.json'),world=await read(dir+'/world.json'),p=await read(dir+'/project-deduplicated.json');
assert.deepEqual(world.stages.map(s=>s.metadata.stageId).sort((a,b)=>a-b),[31,32,33,34,35,36,37,38,39,40]);
process.env.HONRO_ACT4_RELEASE='1';const g=await runtime({legacyMaps:false}),old=JSON.parse(JSON.stringify(g.HONRO_PROJECT));
const first30=x=>x.stages.filter(s=>s.metadata.stageId<=30);
assert.deepEqual(first30(p),first30(old),'Compiled authoring 1–30 changed');
for(const a of old.library.filter(a=>campaign.library.some(c=>c.id===a.id)))assert.deepEqual(p.library.find(b=>b.id===a.id),a,'Compiled campaign shared asset changed '+a.id);
for(const a of world.library)assert(!campaign.library.some(b=>b.id===a.id),'Act4 overrides campaign shared asset '+a.id);
assert.deepEqual(world.stages,p.stages.filter(s=>s.metadata.stageId>=31));
const report={candidateWorldSha256:hash(world),runtimeTarget:'shared/data/act4/world.json',untouchedCampaignSha256:hash(campaign),compiledFirst30Sha256:hash(first30(old)),first30ExactlyPreserved:true,campaignAssetsExactlyPreserved:true,act4Stages:10,releaseCommand:'npm run build',releaseGuard:'tools/stage31/check-release.mjs',writesRuntime:false,releaseApproved:false};
await writeFile(dir+'/runtime-input-preflight.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
