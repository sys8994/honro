import fs from 'node:fs';
import assert from 'node:assert/strict';
const f='shared/build.mjs',src=fs.readFileSync(f,'utf8');
const origin='  terrainOptimization.apply(project.library);';
const mask='M1146.977273 496.336648 L1169.515152 483.028567 L1182.393939 474.442708 L1208.580808 474.442708 L1201.712121 485.175032 L1184.540404 506.854324 L1146.977273 506.854324 Z';
const delta=`
  // Non-production test: official validation has run with entirely unmodified source inputs.
  if(process.env.HONRO_QA36_ART_REPORT){
    const {createHash}=await import('node:crypto'), {writeFileSync}=await import('node:fs');
    const sha=s=>createHash('sha256').update(s).digest('hex');
    const id='approved36:near-slope-join-inland', key='source-alpha-silhouette';
    const owners=project.library.filter(a=>a.id===id);
    const stage=project.stages.find(s=>s.metadata?.stageId===36);
    const placements=stage?.elements.filter(e=>e.assetId===id);
    if(owners.length!==1||placements?.length!==1||placements[0].id!=='approved36-near-slope-join'||placements[0].x!==-260||placements[0].y!==685||placements[0].scale!==1)throw Error('Stage 36 pocket owner changed');
    const asset=owners[0],v=asset.vector;const prior=v.clips[key];
    if(v.root.transform?.join()!=='2.2,0,0,2.2,0,0'||prior.length!==1||sha(prior[0])!=='5114ae34297c77fab749fe506c840e241356b57587c3b5cc5e5426bcfd65b53f')throw Error('Stage 36 exact optimized stock mask changed');
    const sig=()=>sha(JSON.stringify(project));
    const oldProject=sig(),oldAsset=sha(JSON.stringify(asset));
    v.clips[key]=[prior[0]+' ${mask}'];
    const candidate=v.clips[key],newProject=sig(),newAsset=sha(JSON.stringify(asset));
    v.clips[key]=prior;
    if(sig()!==oldProject||sha(JSON.stringify(asset))!==oldAsset)throw Error('Stage 36 patch affected non-mask data');
    v.clips[key]=candidate;
    if(sig()!==newProject||oldProject===newProject)throw Error('Stage 36 patch project not repeatable');
    writeFileSync(process.env.HONRO_QA36_ART_REPORT,JSON.stringify({id,key,stage:36,place:placements[0],oldProject,newProject,oldAsset,newAsset,unchangedProjectWhenMaskRestored:oldProject,baselineMaskSha256:sha(prior[0]),candidateMaskSha256:sha(candidate[0]),addedWindingPath:candidate[0].slice(prior[0].length+1)},null,2));
  }`;
assert.equal(src.split(origin).length,2);
fs.writeFileSync(f,src.replace(origin,origin+delta));
