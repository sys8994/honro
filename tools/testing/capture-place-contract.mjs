/** Capture explicit reviewed place revision inputs. Does not update frozen fixtures. */
import fs from'node:fs';import path from'node:path';import vm from'node:vm';import{pathToFileURL}from'node:url';import{createHash}from'node:crypto';
const root=process.cwd(),baseline=process.argv[2],out=process.argv[3]||'_local/reports/place-contract';if(!baseline)throw Error('Supply exact baseline checkout path');fs.mkdirSync(out,{recursive:true});const load=(r,p)=>import(pathToFileURL(path.join(r,p)));
const {currentRuntimeManifest:m,currentRuntimeSources}=await load(baseline,'tests/current-runtime-contract-helpers.mjs');const{currentCampaignManifest:cm}=await load(baseline,'tests/current-campaign-contract-helpers.mjs');const{beforeStage5Lake}=await load(baseline,'tests/stage5-lake-history-helpers.mjs');const{beforeQuestProjectProse}=await load(baseline,'tests/quest-project-prose-history.mjs');
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex'),write=(p,v)=>fs.writeFileSync(path.join(out,p),JSON.stringify(v,null,2)+'\n');
write('before-runtime.json',m);write('before-campaign-manifest.json',cm);write('before-sources.json',currentRuntimeSources());
for(const [label,dir]of[['before',baseline],['after',root]]){const{runtimeParts}=await load(dir,'shared/build.mjs');const builds={};let rawParts;
 const previous=process.cwd();process.chdir(dir);
 for(const[k,v]of Object.entries(m.variants)){if(k==='temple')continue;const parts=await runtimeParts(v.options);builds[k]={...v,parts:parts.map(hash),sha256:hash(parts.join('\n'))};if(k==='v0r0a0')rawParts=parts;}
 const temple=[...rawParts.filter(s=>!s.startsWith('globalThis.HONRO_PROJECT=')),...['main','story','interactions','rest-journey','training'].map(n=>fs.readFileSync('shared/runtime/'+n+'.js','utf8'))];builds.temple={...m.variants.temple,parts:temple.map(hash),sha256:hash(temple.join('\n'))};
 const part=rawParts.find(s=>s.startsWith('globalThis.HONRO_PROJECT='));const{runtime}=await load(dir,'game/tests/helpers.mjs');const ctx=await runtime({legacyMaps:false});const raw=JSON.parse(fs.readFileSync('shared/data/campaign.json','utf8'));
 process.chdir(previous);write(label+'-builds.json',builds);write(label+'-project-part.json',{part});write(label+'-raw.json',beforeQuestProjectProse(beforeStage5Lake(raw)));write(label+'-project.json',beforeQuestProjectProse(beforeStage5Lake(ctx.HONRO_PROJECT)));
 console.log('Captured',label,'nine variants and normalized raw/project');
}
