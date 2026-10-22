// Route/input authoring only. Geometry, actors and all quest facts stay intact.
import{readFileSync,writeFileSync}from'node:fs';import{pathToFileURL}from'node:url';
export const STAGE17_RETURN_TAKEOFF_X=8000;
export const STAGE17_RETURN_JUMP=Object.freeze({x:7915,support:'ws-east-upper-rock',speed:.6,steerDelaySeconds:.15});
export function applyStage17ReturnRoute(project){const s=project.stages.find(s=>s.metadata?.stageId===17),r=s.design.space.routes.find(r=>r.id==='east-upper-return'),a=r.anchors.find(a=>a.surfaceId==='ws-east-upper-step-3'&&a.jumpTo?.support==='ws-east-upper-rock');if(!a)throw Error('Expected Stage17 return link missing');Object.assign(a,{x:STAGE17_RETURN_TAKEOFF_X,y:4070,jumpTo:{...STAGE17_RETURN_JUMP}});return project;}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file='shared/data/campaign.json',p=JSON.parse(readFileSync(file,'utf8'));applyStage17ReturnRoute(p);writeFileSync(file,JSON.stringify(p)+'\n');console.log('Updated one Stage17 return jump declaration only.');}
