import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,rm,readFile,readdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createActRun,cancelRun,reviseIntent,requireRefinement,rejectOptions,decide,replaceOptions,nextQuestion,deliveryStatus,validateRun,recordTechnical,basisOf,hash,saveRun,readRun} from '../tools/intent-pipeline/state.mjs';
const evidence={kind:'user-message',actor:'user',reference:'test:explicit-scope-change-only'};
const source={commit:'test',projectHash:hash('campaign')};
const intent={scope:'act',actId:2,stageIds:[11,12,13,14,15,16,17,18,19,20],goal:'Approve the whole-act visual and spatial concept before layouts.',constraints:['Whole act first'],assumptions:[{id:'concept',text:'No chapter implementation',scope:'Act 2',expiresAtGate:'act2.concept'}]};
const initial=()=>createActRun({id:'act2-test',intent,source});
const options=['mine-history','pilgrimage','living-ruins'].map(id=>({id,label:id,description:'Distinct whole-act concept '+id,evidence:[{kind:'concept-board',path:`_local/${id}.png`,sha256:hash(id)}]}));
const proposed=()=>replaceOptions(initial(),{decisionId:'act2.concept',question:'Which whole-act concept?',options});
test('whole-act scope begins at a concept gate without choosing or generating a chapter',()=>{
 const r=initial();assert.deepEqual(r.intent.stageIds,intent.stageIds);assert.equal(r.intent.stageId,undefined);assert.equal(deliveryStatus(r).state,'awaiting_concept_candidates');assert.equal(nextQuestion(r).decisionId,'act2.concept');assert.equal(nextQuestion(r).kind,'agent-work-required');assert(r.decisions.every(d=>d.selection===null));assert.deepEqual(r.artifacts,[]);
});
test('act scope validation rejects incomplete scope and downstream bypasses',()=>{
 for(const mutate of [r=>{r.intent.stageIds=[18];},r=>{r.intent.stageIds=[11,11];},r=>{r.decisions[1].dependsOn=[];},r=>{r.decisions[2].dependsOn=[];}]){const r=initial();mutate(r);assert.throws(()=>validateRun(r));}
 assert.throws(()=>replaceOptions(initial(),{decisionId:'act2.art-direction',question:'Too early',options}));
 assert.throws(()=>recordTechnical(initial(),{basis:basisOf(initial()),checks:[{name:'premature',status:'passed'}]}));
});
test('concept boards produce a new native question revision and cannot approve layouts',()=>{
 let r=proposed();assert.equal(nextQuestion(r).decisionRevision,2);assert.equal(nextQuestion(r).kind,'human-choice');assert.equal(nextQuestion(r).defaultOption,null);
 assert.throws(()=>decide(r,{decisionId:'act2.concept',decisionRevision:1,optionId:options[0].id,userEvidence:evidence}));
 r=decide(r,{decisionId:'act2.concept',decisionRevision:2,optionId:options[0].id,userEvidence:evidence});assert.equal(nextQuestion(r).decisionId,'act2.layouts');assert.equal(nextQuestion(r).kind,'agent-work-required');assert.equal(r.decisions[1].selection,null);assert.equal(r.decisions[2].selection,null);assert.equal(deliveryStatus(r).productionReady,false);assert.deepEqual(r.artifacts,[]);
});
test('scope cancellation permanently invalidates buttons and stops regeneration',()=>{
 const r=proposed(),cancelled=cancelRun(r,{reason:'User rejected chapter-only scope',userEvidence:evidence,supersededBy:'act2-restarted'});assert.equal(deliveryStatus(cancelled).state,'cancelled');assert.equal(nextQuestion(cancelled),null);assert.equal(deliveryStatus(cancelled).supersededBy,'act2-restarted');assert(cancelled.decisions.every(d=>d.selection===null));
 assert.throws(()=>decide(cancelled,{decisionId:'act2.concept',decisionRevision:2,optionId:options[0].id,userEvidence:evidence}),/cancelled/);
 assert.throws(()=>replaceOptions(cancelled,{decisionId:'act2.concept',question:'Revive old scope',options}),/cancelled/);
 assert.throws(()=>cancelRun(initial(),{reason:'Unverified',userEvidence:{...evidence,actor:'agent'}}));
});
test('cancelled and new upstream states survive persisted resume without adoption',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'honro-act-gate-'));try{const r=cancelRun(proposed(),{reason:'Scope superseded',userEvidence:evidence,supersededBy:'act2-new'});await saveRun(dir,r);const restored=await readRun(dir);assert.equal(deliveryStatus(restored).state,'cancelled');assert.equal(nextQuestion(restored),null);assert(restored.history.some(e=>e.kind==='user-cancelled-scope'));}finally{await rm(dir,{recursive:true,force:true});}
});

test('fixed-premise corrections invalidate old art options while preserving whole-act scope',()=>{
 const before=proposed(),updatedIntent={...structuredClone(before.intent),goal:'Korean terrain is fixed; use SVG-like flat-vector drafts.',fixedDirection:{terrain:'Korean terrain',graphics:'SVG-like flat vector'},constraints:[...before.intent.constraints,'Recover existing context first']};
 const corrected=reviseIntent(before,{intent:updatedIntent,userEvidence:evidence,reason:'Previous choices did not match the fixed terrain and requested graphic style'});
 assert.deepEqual(corrected.intent.stageIds,[11,12,13,14,15,16,17,18,19,20]);assert.equal(nextQuestion(corrected).decisionRevision,3);assert.equal(nextQuestion(corrected).kind,'agent-work-required');assert.equal(nextQuestion(corrected).intent.fixedDirection.graphics,'SVG-like flat vector');assert(corrected.decisions.every(d=>d.options.length===0&&d.selection===null));assert.notEqual(basisOf(corrected),basisOf(before));
 assert.throws(()=>decide(corrected,{decisionId:'act2.concept',decisionRevision:2,optionId:options[0].id,userEvidence:evidence}),/Stale/);
 assert.throws(()=>reviseIntent(before,{intent:updatedIntent,reason:'No explicit user evidence'}));
 assert.throws(()=>reviseIntent(before,{intent:{...updatedIntent,stageIds:[18,19]},userEvidence:evidence,reason:'Silently narrow scope'}),/new run/);
 assert.equal(before.decisions[0].options.length,3,'Intent correction must not mutate prior snapshot');
 const reproposed=replaceOptions(corrected,{decisionId:'act2.concept',question:'Which SVG-like treatment of Korean terrain?',options});assert.equal(nextQuestion(reproposed).decisionRevision,4);assert.equal(nextQuestion(reproposed).defaultOption,null);
});

test('qualified choice preserves concept and inserts tone approval before layouts',()=>{
 const chosen=decide(proposed(),{decisionId:'act2.concept',decisionRevision:2,optionId:options[0].id,userEvidence:evidence});
 const req={id:'act2.tone',afterDecisionId:'act2.concept',question:'Approve the darker version?',constraints:['Much darker, gloomier and scarier, while keeping the selected terrain and vector style'],userEvidence:evidence};
 const pending=requireRefinement(chosen,req);assert.equal(pending.decisions.find(d=>d.id==='act2.concept').selection.optionId,options[0].id);assert.deepEqual(pending.decisions.find(d=>d.id==='act2.concept').selection.qualifications,req.constraints);assert.equal(nextQuestion(pending).decisionId,'act2.tone');assert.equal(deliveryStatus(pending).state,'awaiting_refinement_artwork');assert.deepEqual(pending.decisions.find(d=>d.id==='act2.layouts').dependsOn,['act2.tone']);assert.equal(deliveryStatus(pending).productionReady,false);
 assert.throws(()=>requireRefinement(initial(),req));assert.throws(()=>requireRefinement(chosen,{...req,userEvidence:null}));assert.throws(()=>requireRefinement(pending,req));
 const board={id:'A-dark-v1',label:'Approve this tone',description:'The selected direction with the required dark-fantasy refinement',evidence:[{kind:'concept-board',path:'_local/A-dark.png',sha256:hash('dark-render')}]};
 let shown=replaceOptions(pending,{decisionId:'act2.tone',question:'Approve this tone?',options:[board]});assert.equal(nextQuestion(shown).selectionMode,'approval');assert.equal(nextQuestion(shown).decisionRevision,2);assert.equal(nextQuestion(shown).options.length,1);assert.equal(nextQuestion(shown).rejectAction,'reject-options');assert.equal(deliveryStatus(shown).state,'awaiting_refinement_approval');
 assert.throws(()=>replaceOptions(pending,{decisionId:'act2.tone',question:'Reopen terrain?',options}));
 const rejected=rejectOptions(shown,{decisionId:'act2.tone',decisionRevision:2,userEvidence:evidence,feedback:'Still too bright'});assert.equal(rejected.decisions.find(d=>d.id==='act2.concept').selection.optionId,options[0].id);assert.equal(nextQuestion(rejected).decisionId,'act2.tone');assert.equal(nextQuestion(rejected).kind,'agent-work-required');
 shown=decide(shown,{decisionId:'act2.tone',decisionRevision:2,optionId:'A-dark-v1',userEvidence:evidence});assert.equal(nextQuestion(shown).decisionId,'act2.layouts');assert.equal(shown.decisions.find(d=>d.id==='act2.layouts').selection,null);assert.equal(shown.artistic,null);assert.equal(deliveryStatus(shown).productionReady,false);
 const bad=structuredClone(pending);bad.decisions.find(d=>d.id==='act2.tone').requirementEvidence.actor='agent';assert.throws(()=>validateRun(bad));
});
