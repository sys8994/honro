/** Only the supported 35px family lintel: bodies jump through, weapons don't. */
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export function applyStage14FamilyPlatform(project){
 const t=project.stages.find(s=>s.metadata?.stageId===14).terrains.find(t=>t.id==='v14-family-roof-step');
 if(JSON.stringify(t.points)!=='[{"x":4140,"y":6535},{"x":4480,"y":6535},{"x":4480,"y":6570},{"x":4140,"y":6570}]')throw Error('Expected approved family lintel');
 t.oneWay=true;t.properties.projectileSolid=true;return project;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const f='shared/data/campaign.json',p=JSON.parse(readFileSync(f,'utf8'));applyStage14FamilyPlatform(p);writeFileSync(f,JSON.stringify(p)+'\n');}
