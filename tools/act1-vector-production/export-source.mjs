/** Export composed current geometry, not inactive candidate author recipes. */
import {runtime} from '../../game/tests/helpers.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out=process.argv[2];if(!out)throw Error('Output directory required');await mkdir(out,{recursive:true});
const g=await runtime({legacyMaps:false,productionStory:true}),project=g.HONRO_PROJECT;
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex'),rows=[];
for(let id=1;id<=10;id++){
 const stage=project.stages.find(s=>s.metadata?.stageId===id||s.id==='stage-'+id);if(!stage)throw Error('Missing stage '+id);
 const compiled=g.HonroMaps.compile(stage,project),collisions=compiled.terrain;
 const output={schema:'honro-terrain-source-v1',stage:id,name:stage.name,width:stage.width,height:stage.height,sourceCommit:execFileSync('git',['rev-parse','HEAD']).toString().trim(),geometryDigest:hash(collisions),stage,collision:collisions,worldTerrain:compiled.worldTerrain,assetReferences:stage.elements.map(e=>({id:e.id,assetId:e.assetId,x:e.x,y:e.y,scale:e.scale,rotation:e.rotation})),scope:'Current built project + compiler collision. Actors and distant backgrounds are reference metadata only; never part of generated terrain.'};
 await writeFile(`${out}/stage${String(id).padStart(2,'0')}.json`,JSON.stringify(output));rows.push({stage:id,name:stage.name,width:stage.width,height:stage.height,geometryDigest:output.geometryDigest,terrains:collisions.length});
}
await writeFile(`${out}/index.json`,JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));
