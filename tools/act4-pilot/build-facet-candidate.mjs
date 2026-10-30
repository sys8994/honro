import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const study=JSON.parse(await readFile('tools/act4-pilot/layouts/stage31-west-ledge-facet-study.json','utf8'));
const spec=JSON.parse(await readFile(study.baseline,'utf8'));
spec.surfaces.find(f=>f.id===study.supportId).top=study.top;
spec.version=4;spec.status='Single west-ledge facet change only; root visual candidate approved, physics and metric pending';spec.geometryNotes.facetStudy=study;
const out='_local/reports/act4-pilot/stage31/west-ledge-facet-candidate';
await mkdir(out,{recursive:true});await writeFile(out+'/input.json',JSON.stringify(spec,null,2));
execFileSync(process.execPath,['tools/act4-pilot/build-skeleton.mjs','31',out,out+'/input.json'],{stdio:'inherit'});
// Isolated same-physical-window metric: only this natural support, camera as reviewed.
const diagnostic={...spec,surfaces:spec.surfaces.filter(f=>f.id===study.supportId),cameraViews:[{id:'west-ledge-study',x:study.camera.center[0],y:study.camera.center[1]}]};
await writeFile(out+'/single-support-input.json',JSON.stringify(diagnostic,null,2));
