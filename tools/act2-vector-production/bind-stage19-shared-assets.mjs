/** Run after the finalized Stage18 material commit is merged. No asset copies. */
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {stage19Digest} from './apply-stage19-candidate.mjs';
const contract=JSON.parse(await readFile('art/act2-near-vector-candidates/stage19-farewell-shared-v1/source-contract.json','utf8'));
const shared=JSON.parse(await readFile('tools/act2-vector-production/stage18-art-source.json','utf8'));
if(!shared.assets?.length)throw Error('Final Stage18 asset manifest is required');
const assets=[];for(const row of shared.assets){const bytes=await readFile('shared/data/act2/'+row.file);const a=JSON.parse(bytes);if(a.id!==row.assetId||createHash('sha256').update(bytes).digest('hex')!==row.sha256||a.collision.length||a.params.bodyTerrainIds.some(id=>id.startsWith('sb-bell-')))throw Error('Invalid shared asset '+row.file);assets.push({file:row.file,assetId:row.assetId,sha256:row.sha256,canonicalSha256:stage19Digest(a)});}
await writeFile('tools/act2-vector-production/stage19-art-source.json',JSON.stringify({stage:19,rawStageSha256:contract.rawStageSha256,sharedSourceStage:18,sharedManifest:'stage18-art-source.json',sharedManifestSha256:stage19Digest(shared),scope:'Reuse canonical Stage18 static material assets; independent Stage19 placement proof required.',assets},null,2));console.log('Bound '+assets.length+' canonical shared assets without copying them.');
