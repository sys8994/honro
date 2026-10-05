#!/usr/bin/env node
import {readFile,mkdir,readdir,access} from 'node:fs/promises';
import path from 'node:path';
import {createRun,createActRun,cancelRun,readRun,saveRun,nextQuestion,decide,rejectOptions,replaceOptions,reviseIntent,requireRefinement,recordTechnical,recordPlay,recordArtistic,deliveryStatus,basisOf,hash} from './state.mjs';
import {ROOT,loadRuntime,compilePlan,renderPlan,writeJSON,validateArtProject} from './runtime.mjs';
import {validatePrototype} from './validate.mjs';
import {sourceSnapshot,sameSource,prepareVerifiedRuntime} from './source.mjs';
const [command='help',...argv]=process.argv.slice(2),args={};
for(let i=0;i<argv.length;i++){if(!argv[i].startsWith('--'))throw Error('Expected --argument');const k=argv[i].slice(2);if(!argv[i+1]||argv[i+1].startsWith('--'))args[k]=true;else args[k]=argv[++i];}
const runId=args.run||'stage18-first',runDir=path.join(ROOT,'_local/reports/intent-pipeline/runs',runId);
if(!/^[a-z0-9][a-z0-9_-]*$/i.test(runId))throw Error('Unsafe run id');
const output=x=>console.log(JSON.stringify(x,null,2));
const relative=f=>path.relative(ROOT,f).split(path.sep).join('/');
const local=f=>{const p=path.resolve(ROOT,f);if(!p.startsWith(ROOT+path.sep))throw Error('Evidence path must be inside this checkout');return p;};
async function fileRef(file,kind){return{path:relative(file),kind,sha256:hash(await readFile(file))};}
const snapshot=()=>sourceSnapshot(ROOT);
const verifiedRuntime=expected=>prepareVerifiedRuntime(expected,{snapshot,load:()=>loadRuntime({render:true})});
async function verifyRefs(refs){for(const a of refs){if(hash(await readFile(local(a.path)))!==a.sha256)throw Error('Changed or corrupt evidence: '+a.path);}}
async function assertSource(run){
 const expected=run.executionSource||run.source;
 let current;if(run.executionSource){const{actSourceSnapshot}=await import('./act-adapter.mjs');current=await actSourceSnapshot(ROOT);}else current=await snapshot();
 if(!sameSource(current,expected))throw Error('Source changed since this evidence. For authorized full-act implementation, refresh with act-cli build; do not reuse old technical/art approvals.');
 for(const a of run.implementationAuthorization?.planArtifacts||[])await verifyRefs([a]);
 for(const d of run.decisions){await verifyRefs(d.options.flatMap(o=>o.evidence));for(const o of d.options){if(o.planPath&&hash(await readFile(local(o.planPath)))!==o.planHash)throw Error('Approved plan bytes changed; revise options and ask again.');if(o.projectPath&&hash(await readFile(local(o.projectPath)))!==o.projectHash)throw Error('Selected art project bytes changed; revise options and ask again.');}}
}
async function emitPacket(run){const status=deliveryStatus(run),question=nextQuestion(run);await writeJSON(path.join(runDir,'question.json'),question);await writeJSON(path.join(runDir,'status.json'),status);output({runId,runPath:relative(path.join(runDir,'run.json')),status,question,resumeCommand:`node tools/intent-pipeline/cli.mjs resume --run ${runId}`});}
async function initialize(){
 try{await access(path.join(runDir,'run.json'));throw Error('Run already exists; use resume. Existing decisions are never overwritten.');}catch(e){if(e.code!=='ENOENT')throw e;}
 await mkdir(path.join(runDir,'candidates'),{recursive:true});const prepared=await verifiedRuntime(),runtime=prepared.runtime,source=JSON.parse(await readFile(path.join(ROOT,'shared/data/campaign.json'))),candidates=[];
 for(const id of ['A','B','C']){
  const plan=JSON.parse(await readFile(path.join(ROOT,`tools/intent-pipeline/plans/stage18-${id}.json`))),dir=path.join(runDir,'candidates',id);await mkdir(dir,{recursive:true});
  const planFile=path.join(dir,'plan.json');await writeJSON(planFile,plan);
  const project=compilePlan(runtime.g,source,plan),report=validatePrototype(runtime.g,source,project,plan);
  const projectFile=path.join(dir,'preview-project.json'),reportFile=path.join(dir,'checks.json');await writeJSON(projectFile,project);await writeJSON(reportFile,report);
  const renders=await renderPlan(runtime,project,plan,dir);const evidence=renders.map(e=>({...e,path:relative(e.path)}));
  candidates.push({id,label:plan.buttonLabel,description:plan.description,topologyId:plan.topologyId,planPath:relative(planFile),planHash:hash(await readFile(planFile)),evidence,technicalReport:await fileRef(reportFile,'prototype-validation'),limitations:plan.limitations});
  if(report.checks.some(c=>c.status==='failed'))throw Error(`Candidate ${id} has a technical failure; repair before asking the user. Report: ${relative(reportFile)}`);
 }
 const intent={goal:args.goal||'사용자는 중요한 기획·그래픽 선택을 구분된 시각 옵션으로 결정한다. 첫 검증은 18장 묵종의 공간 구조 비교다.',stageId:18,
  constraints:['User explicitly selects every major layout and art direction. No timeout or default selection.','Options differ in topology, not palette or seed alone.','Preserve narrative, objective IDs/order/classes, roster and count, nonlethal keeper, one spirit lamp and other 19 stages.','No public upload, deployment, merge or live campaign modification.','Technical evidence and user artistic approval are separate.'],
  assumptions:[{id:'prototype-scope',text:'This run proposes only the spatial structure of Stage 18.',scope:'Stage 18 layout comparison',expiresAtGate:'stage18.layout'},{id:'comparison-skin',text:'Existing assets and rock rendering are temporary comparison skin, not a proposed or approved finished art style.',scope:'Unapproved prototype renders',expiresAtGate:'stage18.art-direction'},{id:'mission-held',text:'Keep current mission/story/roster while comparing geometry; balance remains unvalidated.',scope:'First vertical slice only',expiresAtGate:'final-artistic-review'}]};
 const run=createRun({id:runId,intent,source:prepared.source,candidates});await saveRun(runDir,run,{expectedRevision:null});await emitPacket(run);process.exitCode=2;
}
async function resume(run){
 if(run.lifecycle?.status==='cancelled'){await emitPacket(run);process.exitCode=4;return;}
 await assertSource(run);if(run.intent.executionMode==='planning-only'){await emitPacket(run);output({blocked:'Only concretization and code planning are authorized. No production compiler is invoked.'});process.exitCode=3;return;}if(run.intent.scope==='act'){await emitPacket(run);output({scope:'act',blocked:'Whole-act concept decisions are recorded here. Stage 18 compilation is never invoked for this scope; downstream act-wide production requires an explicitly approved plan and its adapter.'});process.exitCode=nextQuestion(run)?.kind==='human-choice'?2:3;return;}const layout=run.decisions.find(d=>d.kind==='layout');
 if(!layout.selection){await emitPacket(run);process.exitCode=2;return;}
 if(run.technical?.basis===basisOf(run)){await verifyRefs(run.artifacts);await emitPacket(run);process.exitCode=deliveryStatus(run).productionReady?0:3;return;}
 const option=layout.options.find(o=>o.id===layout.selection.optionId),plan=JSON.parse(await readFile(local(option.planPath))),prepared=await verifiedRuntime(run.source),runtime=prepared.runtime,source=JSON.parse(await readFile(path.join(ROOT,'shared/data/campaign.json')));let project=compilePlan(runtime.g,source,plan);
 const artDecision=run.decisions.find(d=>d.kind==='art-direction'),artOption=artDecision.selection&&artDecision.options.find(o=>o.id===artDecision.selection.optionId);
 if(artOption){if(!artOption.projectPath||!artOption.projectHash){await emitPacket(run);output({blocked:'Selected art direction has no implemented canonical project. Prepare it and attach a hashed projectPath/projectHash; do not treat the temporary skin as implemented art.'});process.exitCode=3;return;}
  const styled=JSON.parse(await readFile(local(artOption.projectPath)));project=validateArtProject(runtime.g,project,styled);
 }
 const dir=path.join(runDir,'approved-layout',basisOf(run).slice(0,12));await mkdir(dir,{recursive:true});
 const report=validatePrototype(runtime.g,source,project,plan);report.checks.push({name:'creative-implementation',status:artOption?'passed':'blocked',reason:artOption?'Selected canonical art project rendered without changing approved geometry':'Art direction is not yet selected or implemented'});const projectFile=path.join(dir,'workshop-project.json'),checksFile=path.join(dir,'technical.json');await writeJSON(projectFile,project);await writeJSON(checksFile,report);
 const renders=await renderPlan(runtime,project,plan,dir),artifacts=[{...await fileRef(projectFile,'compiled-map'),sourceProjectHash:artOption?.projectHash||null},await fileRef(checksFile,'technical-report'),...renders.map(e=>({...e,path:relative(e.path)}))];
 await assertSource(run);const next=recordTechnical(run,{basis:basisOf(run),checks:report.checks,artifacts});await saveRun(runDir,next,{expectedRevision:run.revision});await emitPacket(next);process.exitCode=3;
}
const getUserEvidence=()=>{if(!args.evidence)throw Error('--evidence must identify the verified user message/native choice, not agent preference');return{kind:args['evidence-kind']||'user-message',actor:'user',reference:String(args.evidence)};};
async function main(){
 if(command==='help'){console.log(`HONRO human-gated pipeline\n\ninit-act --run NAME : create whole-act concept gate without generating chapter maps\ncancel --run NAME --evidence USER_MESSAGE_ID --reason TEXT [--superseded-by RUN_ID] : invalidate old buttons permanently\ninit --run NAME [--goal TEXT] : generate three safe proposals and stop (exit 2)\nstatus|question --run NAME : inspect persistent gates\ndecide --run NAME --decision ID --revision N --option ID --evidence USER_MESSAGE_ID\nreject --run NAME --decision ID --revision N --evidence USER_MESSAGE_ID [--feedback TEXT] : reject all; regenerate without adopting\nresume --run NAME : compile an explicitly approved layout, validate, render, then stop at next gate\npropose --run NAME --packet REPO_LOCAL_JSON : replace a creative decision's options; invalidates downstream\nrecord-technical|record-play --run NAME --packet REPO_LOCAL_JSON : import independently gathered hashed evidence\napprove-art --run NAME --basis SHA --evidence USER_MESSAGE_ID : record user's review of current actual renders\ndeliver --run NAME : verify all gates and output a LOCAL delivery manifest; never publishes\n\nExit 0: command completed (delivery only if all gates passed); 2: human choice missing; 3: blocked/unverified production; 4: invalid/stale input.\nNo credentials, background model calls, web buttons, upload or deploy endpoints are implemented.`);return;}
 if(command==='init-act'){
  try{await access(path.join(runDir,'run.json'));throw Error('Run already exists; use resume.');}catch(e){if(e.code!=='ENOENT')throw e;}
  const run=createActRun({id:runId,source:await snapshot(),intent:{scope:'act',actId:2,stageIds:Array.from({length:10},(_,i)=>i+11),goal:'2막 전체를 관통하는 미술·공간 언어와 장별 변화의 큰 방향을 먼저 사용자가 선택한다.',constraints:['Whole Act 2, stages 11–20, is the scope. No arbitrary single-stage restriction.','A whole-act concept is the mandatory upstream gate before any stage layout or production art.','Provide distinct, detailed visual concept options; simple geometry alone is not a concept board.','No concept, layout or graphics option is adopted without the user choosing it.','Existing chapter geometry, gameplay, story and public deployment remain unapplied at this concept stage.'],assumptions:[{id:'concept-only',text:'This run is collecting whole-act concept alternatives, not authorizing chapter-specific implementation.',scope:'Act 2, stages 11–20',expiresAtGate:'act2.concept'}]}});await saveRun(runDir,run,{expectedRevision:null});await emitPacket(run);process.exitCode=2;return;
 }
 if(command==='init'){await initialize();return;}
 const run=await readRun(runDir);
 if(['status','question'].includes(command)){await emitPacket(run);return;}
 if(command==='resume'){await resume(run);return;}
 if(command==='require-refinement'){await assertSource(run);if(!args.packet)throw Error('--packet required');const packet=JSON.parse(await readFile(local(args.packet)));const next=requireRefinement(run,{...packet,userEvidence:getUserEvidence()});await saveRun(runDir,next,{expectedRevision:run.revision});await emitPacket(next);process.exitCode=2;return;}
 if(command==='revise-intent'){await assertSource(run);if(!args.packet)throw Error('--packet required');const packet=JSON.parse(await readFile(local(args.packet)));const next=reviseIntent(run,{...packet,userEvidence:getUserEvidence()});await saveRun(runDir,next,{expectedRevision:run.revision});await emitPacket(next);process.exitCode=2;return;}
 if(command==='cancel'){const next=cancelRun(run,{reason:args.reason||'User cancelled this scope',userEvidence:getUserEvidence(),supersededBy:args['superseded-by']||null});await saveRun(runDir,next,{expectedRevision:run.revision});await emitPacket(next);return;}
 if(command==='reject'){await assertSource(run);const next=rejectOptions(run,{decisionId:args.decision,decisionRevision:Number(args.revision),userEvidence:getUserEvidence(),feedback:args.feedback||''});await saveRun(runDir,next,{expectedRevision:run.revision});await emitPacket(next);process.exitCode=2;return;}
 if(command==='decide'){
  await assertSource(run);const next=decide(run,{decisionId:args.decision,decisionRevision:Number(args.revision),optionId:args.option,userEvidence:getUserEvidence()});await saveRun(runDir,next,{expectedRevision:run.revision});await emitPacket(next);return;
 }
 if(['propose','record-technical','record-play'].includes(command)){
  await assertSource(run);if(!args.packet)throw Error('--packet required');const packet=JSON.parse(await readFile(local(args.packet)));
  if(command==='propose')await verifyRefs(packet.options.flatMap(o=>o.evidence));
  if(command==='record-technical')await verifyRefs(packet.artifacts||[]);
  if(command==='record-play')await verifyRefs((packet.evidence||[]).filter(e=>e.path));
  const next=command==='propose'?replaceOptions(run,packet):command==='record-technical'?recordTechnical(run,packet):recordPlay(run,packet);await saveRun(runDir,next,{expectedRevision:run.revision});await emitPacket(next);return;
 }
 if(command==='approve-art'){await assertSource(run);await verifyRefs(run.artifacts);const next=recordArtistic(run,{basis:args.basis,userEvidence:getUserEvidence()});await saveRun(runDir,next,{expectedRevision:run.revision});await emitPacket(next);return;}
 if(command==='deliver'){
  await assertSource(run);await verifyRefs(run.artifacts);const status=deliveryStatus(run);if(!status.productionReady){await emitPacket(run);process.exitCode=3;return;}
  await verifyRefs(run.play.evidence);const manifest={schemaVersion:1,scope:'local-only',source:run.source,basis:status.basis,artifacts:run.artifacts,decisions:run.decisions.map(d=>({id:d.id,revision:d.revision,selection:d.selection})),publicationAuthorized:false};await writeJSON(path.join(runDir,'delivery.json'),manifest);output(manifest);return;
 }
 throw Error('Unknown command '+command);
}
main().catch(e=>{console.error(JSON.stringify({error:e.message,command,runId}));process.exitCode=4;});
