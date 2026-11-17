/** Composition metadata only: retain the authored buried foundation rectangles. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export const STAGE22_BURIED_EDGE_BLEND=Object.freeze({side:140,bottom:260});
export const isStage22BuriedPlane=p=>['v22-art-built-buried-west-foundation','v22-art-built-buried-east-foundation'].includes(p.id);
export function applyStage22BuriedBlend(project){
 return {...project,stages:project.stages.map(s=>s.metadata?.stageId!==22?s:{...s,design:{...s.design,space:{...s.design.space,terrainPlanes:s.design.space.terrainPlanes.map(p=>isStage22BuriedPlane(p)?{...p,buriedEdgeBlend:{...STAGE22_BURIED_EDGE_BLEND}}:p)}}})};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const file=new URL('../../shared/data/campaign.json',import.meta.url),p=JSON.parse(await readFile(file,'utf8'));
 await writeFile(file,JSON.stringify(applyStage22BuriedBlend(p))+'\n');
}
