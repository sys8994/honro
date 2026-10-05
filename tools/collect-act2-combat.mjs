/** Bind existing legal normal-combat traces to the exact current gameplay geometry.
 * Never marks scripted objective fixtures or stale checkpoints as a normal clear. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const project=JSON.parse(await readFile('shared/data/campaign.json','utf8')),rows=[];
const actions=new Set(['heal-item','ward-item','retreat-defend','interact','fire-target','focus-item','fire','defend']);
for(let id=11;id<=20;id++){
 const st=project.stages.find(s=>s.metadata.stageId===id),expected=hash({terrain:st.terrains,routes:st.routes,sites:st.design.space.sites,units:st.units,materials:st.materials}),file=`_local/reports/act2-revision/normal-play-${id}.json`;
 try{const bytes=await readFile(file,'utf8'),trace=JSON.parse(bytes),valid=trace.stage===id&&trace.phase==='won'&&trace.geometryFingerprint===expected&&Array.isArray(trace.actions)&&trace.actions.length>0&&trace.actions.every(a=>actions.has(a.action));
  rows.push({stageId:id,status:valid?'passed':'failed',phase:trace.phase,rounds:trace.round,actions:trace.actions?.length,survivors:trace.heroes?.map(h=>({cls:h.cls,hp:h.hp})),geometryFingerprint:expected,recordedGeometryFingerprint:trace.geometryFingerprint,evidence:file,evidenceSha256:hash(bytes)});
 }catch(error){rows.push({stageId:id,status:'blocked',geometryFingerprint:expected,reason:error.message});}
}
const result={schemaVersion:1,checkedAt:new Date().toISOString(),method:'Production engine move/jump/fire/items/wait/interaction APIs with no combat-state fixture shortcuts',passed:rows.every(r=>r.status==='passed'),stages:rows,limits:['One automated normal-entry party build per stage, not a multi-build difficulty study','Stage11 continued through matching-geometry checkpoint resumes','No browser HUD/input/game/workshop/performance acceptance','Visual-only source changes do not invalidate gameplay geometry traces']};
await mkdir('_local/reports/act2-spatial',{recursive:true});await writeFile('_local/reports/act2-spatial/normal-combat-final.json',JSON.stringify(result,null,2)+'\n');for(const r of rows)console.log(r.status.toUpperCase(),'normal combat',r.stageId,r.phase||r.reason,'rounds',r.rounds,'actions',r.actions);if(!result.passed)process.exitCode=1;
