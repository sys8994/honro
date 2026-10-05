/** Human-gated orchestration. No model calls, automatic creative votes, or publication. */
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,rename,open,unlink} from 'node:fs/promises';
import path from 'node:path';
export const SCHEMA_VERSION=1;
export const REQUIRED_TECHNICAL=['canonical-schema','objective-contract','creative-implementation','movement-physics','normal-playthrough','browser-game-workshop','save-compatibility','performance'];
export const hash=value=>createHash('sha256').update(typeof value==='string'||value instanceof Uint8Array?value:JSON.stringify(value)).digest('hex');
const copy=x=>structuredClone(x), now=()=>new Date().toISOString();
const requireThat=(ok,message)=>{if(!ok)throw new Error(message);};
const text=x=>typeof x==='string'&&x.trim().length>0;
export const decisionApproved=d=>!!(d&&(d.selection||d.approval));
function userEvidence(e){requireThat(e&&e.actor==='user'&&['user-message','native-choice'].includes(e.kind)&&text(e.reference),'Explicit user evidence is required; agent scores cannot approve creative decisions');}
function optionValid(o){
 requireThat(o&&text(o.id)&&text(o.label)&&text(o.description),'Option id, label, description are required');
 requireThat(Array.isArray(o.evidence)&&o.evidence.length>0,'Each option needs reviewable evidence');
 if(o.projectPath||o.projectHash)requireThat(text(o.projectPath)&&/^[a-f0-9]{64}$/.test(o.projectHash),'Art project needs a path and SHA256');
 for(const e of o.evidence)requireThat(text(e.kind)&&text(e.path)&&/^[a-f0-9]{64}$/.test(e.sha256),'Evidence requires kind, path and sha256');
}
function optionsValid(options,{layout=false,allowEmpty=false,review=false}={}){
 requireThat(Array.isArray(options)&&((allowEmpty&&options.length===0)||(review?options.length===1:options.length>=2&&options.length<=3)),review?'A visual review has exactly one proposed treatment plus a separate reject/revise action':'Provide 2–3 distinct options; no silent default');
 options.forEach(optionValid);requireThat(new Set(options.map(o=>o.id)).size===options.length,'Duplicate option IDs');
 requireThat(new Set(options.map(o=>o.label)).size===options.length,'Duplicate option labels');
 if(layout){requireThat(options.every(o=>text(o.topologyId)&&text(o.planPath)&&/^[a-f0-9]{64}$/.test(o.planHash)),'Layout options need topology and hashed plan');requireThat(new Set(options.map(o=>o.topologyId)).size===options.length,'Layout candidates must use distinct topologies');}
}
export function createRun({id,intent,source,candidates}){
 requireThat(text(id)&&/^[a-z0-9][a-z0-9_-]*$/i.test(id),'Safe run id is required');
 requireThat(intent&&text(intent.goal)&&Number.isInteger(intent.stageId),'Intent goal and stageId are required');
 requireThat(Array.isArray(intent.constraints)&&Array.isArray(intent.assumptions),'Bounded intent constraints and assumptions are required');
 for(const a of intent.assumptions)requireThat(text(a.id)&&text(a.text)&&text(a.scope)&&text(a.expiresAtGate),'Assumptions need id, text, scope, expiresAtGate');
 requireThat(source&&text(source.commit)&&/^[a-f0-9]{64}$/.test(source.projectHash),'Source commit and project hash are required');
 optionsValid(candidates,{layout:true});
 const prefix=`stage${intent.stageId}`;
 const run={schemaVersion:1,id,revision:0,createdAt:now(),updatedAt:now(),intent:copy(intent),source:copy(source),
  decisions:[{id:prefix+'.layout',kind:'layout',revision:1,question:'어떤 공간 구조로 제작할까요?',options:copy(candidates),selection:null,dependsOn:[]},
   {id:prefix+'.art-direction',kind:'art-direction',revision:1,question:'선택한 구조에 어떤 그래픽 방향을 적용할까요?',options:[],selection:null,dependsOn:[prefix+'.layout']}],
  technical:null,play:null,artistic:null,artifacts:[],history:[],invalidations:[]};
 return validateRun(run);
}
export function createActRun({id,intent,source,candidates=[]}){
 requireThat(intent?.scope==='act'&&Number.isInteger(intent.actId),'Act-scoped intent is required');
 const prefix=`act${intent.actId}`;
 const run={schemaVersion:1,id,revision:0,createdAt:now(),updatedAt:now(),intent:copy(intent),source:copy(source),
  decisions:[
   {id:prefix+'.concept',kind:'concept',revision:1,question:'2막 전체의 미술·공간 콘셉트를 어느 방향으로 잡을까요?',status:candidates.length?'proposed':'needs-candidates',options:copy(candidates),selection:null,dependsOn:[]},
   {id:prefix+'.layouts',kind:'layout',revision:1,question:'승인한 2막 콘셉트를 장별 공간에 어떻게 펼칠까요?',status:'needs-candidates',options:[],selection:null,dependsOn:[prefix+'.concept']},
   {id:prefix+'.art-direction',kind:'art-direction',revision:1,question:'승인된 콘셉트와 공간에 적용할 실제 제작안을 골라주세요.',status:'needs-candidates',options:[],selection:null,dependsOn:[prefix+'.concept',prefix+'.layouts']}
  ],technical:null,play:null,artistic:null,artifacts:[],history:[],invalidations:[]};
 return validateRun(run);
}
export function cancelRun(run,{reason,userEvidence:evidence,supersededBy=null}){
 userEvidence(evidence);requireThat(text(reason),'Cancellation reason required');
 return change(run,'user-cancelled-scope',{reason,userEvidence:evidence,supersededBy},r=>{
  r.lifecycle={status:'cancelled',reason,userEvidence:copy(evidence),supersededBy,at:now()};
  for(const d of r.decisions){d.revision++;d.selection=null;d.approval=null;d.status='cancelled';}
  invalidate(r,'User cancelled scope: '+reason);
 });
}
export function validateRun(run){
 requireThat(run?.schemaVersion===SCHEMA_VERSION,'Unsupported run schema');
 requireThat(text(run.id)&&/^[a-z0-9][a-z0-9_-]*$/i.test(run.id)&&Number.isInteger(run.revision)&&run.revision>=0,'Invalid run identity/revision');
 requireThat(run.intent&&text(run.intent.goal)&&(run.intent.scope==='act'?Number.isInteger(run.intent.actId)&&Array.isArray(run.intent.stageIds)&&run.intent.stageIds.length>1&&run.intent.stageIds.every(Number.isInteger)&&new Set(run.intent.stageIds).size===run.intent.stageIds.length:Number.isInteger(run.intent.stageId)),'Invalid intent');
 requireThat(Array.isArray(run.intent.constraints)&&run.intent.constraints.every(text)&&Array.isArray(run.intent.assumptions),'Invalid bounded intent');
 for(const a of run.intent.assumptions)requireThat(text(a.id)&&text(a.text)&&text(a.scope)&&text(a.expiresAtGate),'Invalid bounded assumption');
 requireThat(run.source&&text(run.source.commit)&&/^[a-f0-9]{64}$/.test(run.source.projectHash),'Invalid source provenance');
 requireThat(Array.isArray(run.decisions)&&run.decisions.length>=2,'Missing creative decisions');
 requireThat(new Set(run.decisions.map(d=>d.id)).size===run.decisions.length,'Duplicate decision IDs');
 requireThat(run.decisions.some(d=>d.kind==='layout')&&run.decisions.some(d=>d.kind==='art-direction'),'Layout and art-direction gates are mandatory');
 for(const d of run.decisions){
  requireThat(text(d.id)&&text(d.question)&&Number.isInteger(d.revision)&&d.revision>0,'Invalid decision');
  optionsValid(d.options,{review:d.kind==='visual-review'||d.role==='implementation-review',layout:d.kind==='layout'&&d.options.length>0,allowEmpty:!!d.approval||d.kind!=='layout'||['needs-regeneration','needs-candidates','cancelled'].includes(d.status)});
  if(d.kind==='visual-review'){requireThat(Array.isArray(d.requirements)&&d.requirements.length>0&&d.requirements.every(text),'Visual review requires explicit refinement requirements');userEvidence(d.requirementEvidence);}
  requireThat(Array.isArray(d.dependsOn)&&d.dependsOn.every(id=>run.decisions.some(x=>x.id===id)&&id!==d.id),'Invalid decision dependencies');
  if(d.approval){requireThat(!d.selection&&d.kind==='layout'&&d.approval.type==='delivered-plan','Invalid delivered-plan approval');requireThat(d.approval.decisionRevision===d.revision,'Stale delivered-plan approval');userEvidence(d.approval.userEvidence);requireThat(d.dependsOn.every(id=>decisionApproved(run.decisions.find(q=>q.id===id))),'Plan approved before upstream choices');requireThat(Array.isArray(d.approval.artifacts)&&['implementation-plan','layout-plan'].every(kind=>d.approval.artifacts.some(a=>a.kind===kind)),'Plan approval requires both delivered artifacts');for(const a of d.approval.artifacts)requireThat(text(a.path)&&text(a.libraryFileId)&&/^[a-f0-9]{64}$/.test(a.sha256),'Plan artifact must be tied to its delivered Library identity and hash');}
  if(d.selection){requireThat(d.dependsOn.every(id=>decisionApproved(run.decisions.find(x=>x.id===id))),'Downstream choice without upstream approval');requireThat(d.options.some(o=>o.id===d.selection.optionId),'Unknown selected option');requireThat(d.selection.decisionRevision===d.revision,'Stale stored decision');userEvidence(d.selection.userEvidence);}
 }
 // A cycle would make an unanswered decision invisible to the next-question adapter.
 const visit=(d,seen)=>{requireThat(!seen.has(d.id),'Decision dependency cycle');for(const id of d.dependsOn)visit(run.decisions.find(x=>x.id===id),new Set([...seen,d.id]));};
 run.decisions.forEach(d=>visit(d,new Set()));
 if(run.intent.scope==='act'){
  const concept=run.decisions.find(d=>d.kind==='concept');requireThat(concept&&!concept.dependsOn.length,'Whole-act concept must be the upstream gate');
  const hasAncestor=(d,id)=>d.dependsOn.includes(id)||d.dependsOn.some(x=>hasAncestor(run.decisions.find(q=>q.id===x),id));
  requireThat(run.decisions.filter(d=>d.id!==concept.id).every(d=>hasAncestor(d,concept.id)),'Every downstream creative gate must depend on the whole-act concept');
 }
 if(run.executionSource)requireThat(run.executionSource.adapter==='whole-act-canonical-v1'&&/^[a-f0-9]{64}$/.test(run.executionSource.codeHash)&&/^[a-f0-9]{64}$/.test(run.executionSource.projectHash)&&/^[a-f0-9]{64}$/.test(run.executionSource.runtimeHash),'Invalid execution source');
 if(run.implementationAuthorization){const a=run.implementationAuthorization;requireThat(['approved','invalidated'].includes(a.status)&&a.publicationAuthorized===false&&a.finalArtApproved===false,'Invalid implementation-only authorization');userEvidence(a.userEvidence);userEvidence(a.continuationEvidence);if(a.status==='approved')requireThat(run.decisions.some(d=>d.approval),'Implementation requires an approved delivered plan');}
 if(run.lifecycle){requireThat(run.lifecycle.status==='cancelled'&&text(run.lifecycle.reason),'Invalid lifecycle');userEvidence(run.lifecycle.userEvidence);requireThat(run.decisions.every(d=>!decisionApproved(d)),'Cancelled runs cannot retain adopted choices');}
 if(run.compilationRevision!==undefined)requireThat(Number.isInteger(run.compilationRevision)&&run.compilationRevision>=0,'Invalid compilation revision');
 for(const key of ['artifacts','history','invalidations'])requireThat(Array.isArray(run[key]),'Invalid '+key);
 const artifactValid=a=>requireThat(a&&text(a.path)&&text(a.kind)&&/^[a-f0-9]{64}$/.test(a.sha256),'Malformed hashed artifact');
 run.artifacts.forEach(artifactValid);
 if(run.technical){requireThat(/^[a-f0-9]{64}$/.test(run.technical.basis)&&Array.isArray(run.technical.checks)&&run.technical.checks.length>0,'Invalid technical evidence');for(const c of run.technical.checks)requireThat(text(c.name)&&['passed','failed','blocked'].includes(c.status),'Invalid technical result');requireThat(new Set(run.technical.checks.map(c=>c.name)).size===run.technical.checks.length,'Duplicate technical checks');}
 if(run.play){requireThat(/^[a-f0-9]{64}$/.test(run.play.basis)&&['passed','failed','blocked'].includes(run.play.status)&&Array.isArray(run.play.evidence)&&run.play.evidence.length>0,'Invalid play evidence');if(run.play.status==='passed'){run.play.evidence.forEach(artifactValid);requireThat(run.play.evidence.some(e=>e.kind==='browser-live-play'),'Live browser evidence required');}}
 if(run.artistic){requireThat(/^[a-f0-9]{64}$/.test(run.artistic.basis),'Invalid artistic evidence');userEvidence(run.artistic.userEvidence);}
 return run;
}
export function basisOf(run){return hash({source:run.source,executionSource:run.executionSource||null,intent:run.intent,compilationRevision:run.compilationRevision||0,artifacts:run.artifacts.map(a=>({kind:a.kind,path:a.path,sha256:a.sha256,sourceProjectHash:a.sourceProjectHash||null})),decisions:run.decisions.map(d=>({id:d.id,revision:d.revision,option:d.selection?.optionId||null,approval:d.approval||null,optionsHash:hash(d.options)}))});}
function change(run,kind,detail,fn){validateRun(run);requireThat(run.lifecycle?.status!=='cancelled','This run was cancelled; use its superseding whole-act run');const r=copy(run);fn(r);r.revision++;r.updatedAt=now();r.history.push({kind,detail:copy(detail),at:r.updatedAt,revision:r.revision});return validateRun(r);}
function invalidate(r,reason){for(const k of ['technical','play','artistic'])if(r[k])r.invalidations.push({kind:k,basis:r[k].basis,reason,at:now()});r.technical=null;r.play=null;r.artistic=null;r.artifacts=[];if(r.implementationAuthorization&&!r.decisions.some(d=>d.approval)){r.implementationAuthorization.status='invalidated';r.implementationAuthorization.reason=reason;r.intent.executionMode='planning-only';}}
function downstream(r,id){const out=new Set();let changed=true;while(changed){changed=false;for(const d of r.decisions)if(!out.has(d.id)&&d.dependsOn.some(x=>x===id||out.has(x))){out.add(d.id);changed=true;}}return out;}
export function decide(run,{decisionId,decisionRevision,optionId,userEvidence:evidence}){
 validateRun(run);requireThat(run.lifecycle?.status!=='cancelled','This run was cancelled; old buttons are invalid');userEvidence(evidence);const d=run.decisions.find(d=>d.id===decisionId);requireThat(d,'Unknown decision');
 requireThat(d.revision===decisionRevision,'Stale decision revision; refresh the current question');
 requireThat(d.options.some(o=>o.id===optionId),'Unknown option; no default selection is permitted');
 requireThat(d.dependsOn.every(id=>decisionApproved(run.decisions.find(x=>x.id===id))),'Upstream creative decision is missing');
 if(d.selection?.optionId===optionId)return copy(run); // Repeated native callback is idempotent.
 return change(run,'user-decision',{decisionId,decisionRevision,optionId,userEvidence:evidence},r=>{
  const target=r.decisions.find(x=>x.id===decisionId);
  target.approval=null;target.selection={optionId,decisionRevision,userEvidence:copy(evidence),at:now()};
  for(const id of downstream(r,decisionId)){const next=r.decisions.find(x=>x.id===id);next.revision++;next.selection=null;next.approval=null;next.options=[];next.status='needs-candidates';}
  invalidate(r,'Creative choice changed: '+decisionId);
 });
}
export function replaceOptions(run,{decisionId,question,options}){
 const d=run.decisions.find(d=>d.id===decisionId);requireThat(d,'Unknown decision');requireThat(text(question),'Question required');optionsValid(options,{review:d.kind==='visual-review'||d.role==='implementation-review',layout:d.kind==='layout'});
 requireThat(d.dependsOn.every(id=>decisionApproved(run.decisions.find(x=>x.id===id))),'Cannot propose downstream options before upstream choice');
 return change(run,'options-revised',{decisionId},r=>{
  const target=r.decisions.find(x=>x.id===decisionId);target.revision++;target.question=question;target.options=copy(options);target.selection=null;target.approval=null;target.status='proposed';
  for(const id of downstream(r,decisionId)){const child=r.decisions.find(x=>x.id===id);child.revision++;child.selection=null;child.approval=null;child.options=[];child.status='needs-candidates';}
  invalidate(r,'Option evidence revised: '+decisionId);
 });
}
export function rejectOptions(run,{decisionId,decisionRevision,userEvidence:evidence,feedback=''}){
 validateRun(run);requireThat(run.lifecycle?.status!=='cancelled','This run was cancelled; old buttons are invalid');userEvidence(evidence);const d=run.decisions.find(d=>d.id===decisionId);requireThat(d,'Unknown decision');requireThat(d.revision===decisionRevision,'Stale decision revision');
 return change(run,'user-rejected-options',{decisionId,decisionRevision,feedback,userEvidence:evidence,rejectedOptions:d.options.map(o=>({id:o.id,evidence:o.evidence}))},r=>{
  const target=r.decisions.find(x=>x.id===decisionId);target.revision++;target.selection=null;target.approval=null;target.options=[];target.status='needs-regeneration';target.feedback=feedback;
  for(const id of downstream(r,decisionId)){const child=r.decisions.find(x=>x.id===id);child.revision++;child.selection=null;child.approval=null;child.options=[];child.status='needs-candidates';}
  invalidate(r,'User rejected all options: '+decisionId);
 });
}
export function requireRefinement(run,{id,afterDecisionId,question,constraints,userEvidence:evidence}){
 validateRun(run);userEvidence(evidence);requireThat(text(id)&&text(question)&&Array.isArray(constraints)&&constraints.length>0&&constraints.every(text),'Refinement requires identity, review question and constraints');
 const parent=run.decisions.find(d=>d.id===afterDecisionId);requireThat(parent?.selection,'Choose the upstream direction before requesting its refinement');requireThat(!run.decisions.some(d=>d.id===id),'Refinement gate already exists; revise its proposed evidence instead');
 const descendants=downstream(run,afterDecisionId);
 return change(run,'user-required-refinement',{id,afterDecisionId,constraints,userEvidence:evidence},r=>{
  const index=r.decisions.findIndex(d=>d.id===afterDecisionId),upstream=r.decisions[index];
  upstream.selection.qualifications=[...new Set([...(upstream.selection.qualifications||[]),...constraints])];
  r.decisions.splice(index+1,0,{id,kind:'visual-review',revision:1,question,status:'needs-candidates',options:[],selection:null,dependsOn:[afterDecisionId],requirements:copy(constraints),requirementEvidence:copy(evidence)});
  for(const d of r.decisions.filter(d=>descendants.has(d.id))){d.dependsOn=d.dependsOn.map(x=>x===afterDecisionId?id:x);d.revision++;d.options=[];d.selection=null;d.approval=null;d.status='needs-candidates';}
  r.intent.constraints=[...new Set([...r.intent.constraints,...constraints])];
  r.intent.requiredRefinements=[...(r.intent.requiredRefinements||[]),{decisionId:id,afterDecisionId,constraints:copy(constraints),userEvidence:copy(evidence)}];
  invalidate(r,'Required creative refinement: '+id);
 });
}
export function reviseIntent(run,{intent,userEvidence:evidence,reason}){
 validateRun(run);userEvidence(evidence);requireThat(text(reason),'Intent revision reason required');
 requireThat(intent?.scope===run.intent.scope&&intent?.actId===run.intent.actId&&intent?.stageId===run.intent.stageId&&hash(intent?.stageIds||[])===hash(run.intent.stageIds||[]),'Use a new run for a different act or chapter scope');
 return change(run,'user-revised-intent',{reason,userEvidence:evidence,previousIntent:run.intent,previousDecisions:run.decisions.map(d=>({id:d.id,revision:d.revision,options:d.options,selection:d.selection}))},r=>{
  r.intent=copy(intent);for(const d of r.decisions){d.revision++;d.options=[];d.selection=null;d.approval=null;d.status='needs-regeneration';d.feedback=reason;}
  invalidate(r,'User revised the fixed creative premise: '+reason);
 });
}
export function approveDeliveredPlan(run,{decisionId,artifacts,userEvidence:evidence,continuationEvidence}){
 validateRun(run);userEvidence(evidence);userEvidence(continuationEvidence);const d=run.decisions.find(d=>d.id===decisionId);requireThat(d?.kind==='layout','Delivered plan must resolve a layout-planning gate');requireThat(d.dependsOn.every(id=>decisionApproved(run.decisions.find(q=>q.id===id))),'Upstream concept/tone approval required');
 requireThat(Array.isArray(artifacts)&&artifacts.length===2&&['implementation-plan','layout-plan'].every(kind=>artifacts.some(a=>a.kind===kind)),'The exact delivered MD and JSON artifacts are required');
 for(const a of artifacts)requireThat(text(a.path)&&text(a.libraryFileId)&&/^[a-f0-9]{64}$/.test(a.sha256),'Invalid delivered plan artifact');
 return change(run,'user-approved-delivered-plan',{decisionId,artifacts,userEvidence:evidence,continuationEvidence},r=>{
  const plan=r.decisions.find(q=>q.id===decisionId);plan.revision++;plan.selection=null;plan.options=[];plan.status='approved-from-delivered-plan';plan.feedback=null;plan.approval={type:'delivered-plan',decisionRevision:plan.revision,artifacts:copy(artifacts),userEvidence:copy(evidence),at:now()};
  for(const id of downstream(r,decisionId)){const q=r.decisions.find(x=>x.id===id);q.revision++;q.selection=null;q.approval=null;q.options=[];q.status='needs-implementation-evidence';if(q.kind==='art-direction'){q.role='implementation-review';q.question='승인된 계획으로 구현한 실제 결과를 검수합니다.';}}
  invalidate(r,'New delivered plan approved for implementation');r.intent.executionMode='implementation';r.intent.nextWork={scope:'Implement the exact approved full-act plan; perform routine implementation, testing and repair autonomously',implementationAuthorized:true,publicationAuthorized:false,majorDesignDeviationRequiresUser:true,notifyOn:['question','decision','completion']};
  r.implementationAuthorization={status:'approved',scope:{actId:r.intent.actId,stageIds:copy(r.intent.stageIds)},planDecisionId:decisionId,planArtifacts:copy(artifacts),userEvidence:copy(evidence),continuationEvidence:copy(continuationEvidence),routineTechnicalWorkAllowed:true,majorDesignDeviationRequiresUser:true,publicationAuthorized:false,finalArtApproved:false,at:now()};
 });
}
export function recordImplementationSource(run,source){
 requireThat(run.implementationAuthorization?.status==='approved','Actual implementation is not authorized');
 requireThat(source?.adapter==='whole-act-canonical-v1'&&/^[a-f0-9]{64}$/.test(source.codeHash)&&/^[a-f0-9]{64}$/.test(source.projectHash)&&/^[a-f0-9]{64}$/.test(source.runtimeHash),'Complete whole-act execution source required');
 if(hash(run.executionSource||null)===hash(source))return copy(run);
 return change(run,'implementation-source-captured',{source},r=>{r.executionSource=copy(source);invalidate(r,'Implementation source changed; previous technical/play/art evidence is stale');});
}
export function recordTechnical(run,{basis,checks,artifacts=[]}){
 requireThat(run.intent.executionMode!=='planning-only','Planning-only authorization does not permit production compilation or implementation evidence');
 requireThat(basis===basisOf(run),'Stale technical evidence basis');requireThat(decisionApproved(run.decisions.find(d=>d.kind==='layout')),'Layout approval required before production compilation');
 requireThat(Array.isArray(checks)&&checks.length>0,'Technical checks required');
 for(const c of checks)requireThat(text(c.name)&&['passed','failed','blocked'].includes(c.status),'Invalid technical check');
 requireThat(new Set(checks.map(c=>c.name)).size===checks.length,'Duplicate technical checks');
 for(const a of artifacts)requireThat(text(a.path)&&text(a.kind)&&/^[a-f0-9]{64}$/.test(a.sha256),'Hashed artifact references required');
 return change(run,'technical-evidence',{basis,checks:checks.map(c=>({name:c.name,status:c.status}))},r=>{r.artifacts=copy(artifacts);r.compilationRevision=(r.compilationRevision||0)+1;r.technical={basis:basisOf(r),checks:copy(checks),at:now()};r.play=null;r.artistic=null;});
}
export function recordPlay(run,{basis,status,evidence,limitations=[]}){
 requireThat(basis===basisOf(run),'Stale play evidence basis');requireThat(run.technical?.basis===basis,'Current compiled technical evidence required');
 requireThat(['passed','failed','blocked'].includes(status),'Invalid play status');
 requireThat(Array.isArray(evidence)&&evidence.length>0,'Play evidence required');
 if(status==='passed')requireThat(evidence.some(e=>e.kind==='browser-live-play'&&text(e.path)&&/^[a-f0-9]{64}$/.test(e.sha256)),'Node smoke tests cannot approve live browser play');
 return change(run,'play-evidence',{basis,status},r=>{r.play={basis,status,evidence:copy(evidence),limitations:copy(limitations),at:now()};r.artistic=null;});
}
export function recordArtistic(run,{basis,userEvidence:evidence}){
 userEvidence(evidence);requireThat(basis===basisOf(run),'Stale artistic evidence basis');
 requireThat(run.decisions.every(decisionApproved),'All major creative choices must be explicitly selected');
 requireThat(run.artifacts.some(a=>a.kind==='render'),'Current rendered evidence required');
 requireThat(run.technical?.basis===basis,'Current technical evidence required');
 return change(run,'user-artistic-approval',{basis,userEvidence:evidence},r=>{r.artistic={basis,userEvidence:copy(evidence),at:now()};});
}
export function nextQuestion(run){
 validateRun(run);if(run.lifecycle?.status==='cancelled')return null;const d=run.decisions.find(d=>!decisionApproved(d)&&d.dependsOn.every(id=>decisionApproved(run.decisions.find(x=>x.id===id))));
 if(!d)return null;
 if(!d.options.length)return{kind:'agent-work-required',decisionId:d.id,decisionRevision:d.revision,task:d.role==='implementation-review'?'Implement the exact approved whole-act plan, producing real canonical maps, assets and engine evidence. Routine technical work may proceed; ask before a major creative deviation. This gate awaits actual implementation evidence and final review, not a new geology choice.':run.intent.executionMode==='planning-only'?'Concretize the approved whole-act terrain and dark tone, and prepare the actual code implementation plan only. Do not generate or apply chapter geometry, modify gameplay code, or publish. Raise options only for unresolved major choices; do not reopen approved concept or tone.':d.kind==='visual-review'?'Refine only the already-selected direction to satisfy the recorded requirements, then attach one inspected treatment for explicit user approval or revision. Do not reopen the upstream choice.':d.kind==='concept'?(run.intent.fixedDirection?'Recover the established context, then create inspected SVG-like visual variations within the fixed Korean-terrain premise across the whole act. Do not ask the user to choose an unrelated overarching concept.':'Create 2–3 distinct, detailed concept boards for the entire act, showing its art direction and spatial language across the full journey. Do not narrow to a single chapter or imply production approval.'):d.kind==='layout'?'Create 2–3 materially different space plans addressing the user rejection, compile and validate safe previews, then propose again. Do not reuse or auto-select a rejected option.':'Create 2–3 distinct visual options on the approved layout, attach actual renderer evidence, then propose. Do not silently retain or invent an approved art direction.',feedback:d.feedback||null,intent:copy(run.intent),requirements:copy(d.requirements||[]),blocksProduction:true};
 return{kind:'human-choice',runId:run.id,decisionId:d.id,decisionRevision:d.revision,basis:basisOf(run),question:d.question,intent:copy(run.intent),requirements:copy(d.requirements||[]),selectionMode:d.kind==='visual-review'||d.role==='implementation-review'?'approval':'single',rejectAction:'reject-options',allowFreeText:true,defaultOption:null,options:d.options.map(o=>({id:o.id,label:o.label,description:o.description,evidence:copy(o.evidence)})),adapter:'Parent maps this packet to native user-choice UI. Images are delivered as native attachments. No fake web callback or model API.'};
}
export function deliveryStatus(run){
 validateRun(run);const basis=basisOf(run),blockers=[];if(run.lifecycle?.status==='cancelled')return{state:'cancelled',basis,productionReady:false,publicationAuthorized:false,blockers:['User cancelled this scope'],supersededBy:run.lifecycle.supersededBy};
 if(run.intent.executionMode==='planning-only')blockers.push('Only planning is authorized; implementation and publication remain unapproved');
 for(const d of run.decisions)if(!decisionApproved(d))blockers.push('User choice missing: '+d.id);
 if(run.technical?.basis!==basis)blockers.push('Current technical evidence missing');
 for(const name of REQUIRED_TECHNICAL)if(!run.technical?.checks.some(c=>c.name===name&&c.status==='passed'))blockers.push('Technical gate not passed: '+name);
 if(run.technical?.checks.some(c=>c.status!=='passed'))blockers.push('Technical checks contain failed or blocked results');
 if(run.play?.basis!==basis||run.play.status!=='passed')blockers.push('Live play evidence not passed');
 if(run.artistic?.basis!==basis)blockers.push('User artistic approval missing');
 const art=run.decisions.find(d=>d.kind==='art-direction'),artOption=art?.options.find(o=>o.id===art.selection?.optionId);
 if(!artOption?.projectPath||!artOption?.projectHash)blockers.push('Selected art has no implemented canonical project');
 for(const kind of ['compiled-map','technical-report','render'])if(!run.artifacts.some(a=>a.kind===kind))blockers.push('Required delivery artifact missing: '+kind);
 if(!artOption?.projectHash||!run.artifacts.some(a=>a.kind==='compiled-map'&&a.sourceProjectHash===artOption.projectHash))blockers.push('Compiled artifact is not bound to the selected art project');
 const layout=run.decisions.find(d=>d.kind==='layout');
 const concept=run.decisions.find(d=>d.kind==='concept'),pending=run.decisions.find(d=>!decisionApproved(d)&&d.dependsOn.every(id=>decisionApproved(run.decisions.find(q=>q.id===id))));
 const state=run.technical?.checks.some(c=>c.status==='failed')?'technical_blocked':run.implementationAuthorization?.status==='approved'&&pending?.role==='implementation-review'&&!pending.options.length?'implementation_authorized':run.intent.executionMode==='planning-only'?'awaiting_layout_planning':pending?.kind==='visual-review'?(pending.options.length?'awaiting_refinement_approval':'awaiting_refinement_artwork'):concept&&!concept.selection?(concept.options.length?'awaiting_concept_decision':'awaiting_concept_candidates'):!decisionApproved(layout)?'awaiting_layout_decision':!run.technical?'ready_to_compile':run.technical.checks.some(c=>c.status==='failed')?'technical_blocked':run.decisions.some(d=>!decisionApproved(d))?'awaiting_art_direction':!run.play||run.play.status!=='passed'?'awaiting_live_play':!run.artistic?'awaiting_artistic_approval':blockers.length?'technical_blocked':'ready_for_local_delivery';
 return{state,basis,productionReady:blockers.length===0,publicationAuthorized:false,blockers};
}
export async function readRun(dir){return validateRun(JSON.parse(await readFile(path.join(dir,'run.json'),'utf8')));}
export async function saveRun(dir,run,{expectedRevision=null}={}){
 run=copy(run);validateRun(run);await mkdir(dir,{recursive:true});const lock=path.join(dir,'.run.lock');let handle;
 try{handle=await open(lock,'wx');}catch(e){if(e.code==='EEXIST')throw Error('Run is locked by another writer; do not overwrite.');throw e;}
 const temp=path.join(dir,`.run-${process.pid}-${Date.now()}.tmp`);
 try{
  let old=null;try{old=await readRun(dir);}catch(e){if(e.code!=='ENOENT')throw e;}
  requireThat(old?expectedRevision===old.revision:expectedRevision===null,'Stale run revision; reload before writing');
  requireThat(!old||old.id===run.id,'Cannot replace another run');
  requireThat(!old||run.revision>old.revision||run.revision===old.revision&&hash(run)===hash(old),'A changed run must advance revision; cannot overwrite or roll back');
  await writeFile(temp,JSON.stringify(run,null,2)+'\n',{flag:'wx'});await rename(temp,path.join(dir,'run.json'));
 }finally{await unlink(temp).catch(()=>{});await handle.close();await unlink(lock);}
 return run;
}
