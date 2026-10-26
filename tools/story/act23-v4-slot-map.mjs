/** Diagnostic mapping only. Never consumed by a production bundle. */
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtimeCandidate} from '../../tests/act23-v4-helpers.mjs';
const g=await runtimeCandidate(),drafts=[];
function walk(value){if(Array.isArray(value)){for(const row of value)walk(row);return;}if(!value||typeof value!=='object')return;if(typeof value.id==='string'&&/^A[23]\.S\d+\./.test(value.id))drafts.push(value.id);for(const child of Object.values(value))walk(child);}
for(const file of ['honro-act2-v4-dialogue-draft.json','honro-act3-v4-dialogue-draft.json'])walk(JSON.parse(await readFile('game/docs/story/v4-planning/'+file,'utf8')));
const sources={},declarations=[];
for(const file of (await readdir('shared/runtime')).filter(file=>/^act23-v4.*\.js$/.test(file))){const content=await readFile('shared/runtime/'+file,'utf8');sources[file]=createHash('sha256').update(content).digest('hex');for(const[line,text]of content.split('\n').entries())for(const match of text.matchAll(/\b(?:V\.)?slot\(app,([^,\n]+)/g))declarations.push({file,line:line+1,expression:match[1]});}
const stages=g.HONRO_PROJECT.stages.filter(s=>s.metadata.stageId>=11&&s.metadata.stageId<=30).map(s=>({stage:s.metadata.stageId,mapRevision:g.HonroAct23V4.mapRevision(s.metadata.stageId),steps:s.initialState.honroV4Steps.map(q=>({...q,marker:s.markers.find(m=>m.id===q.id)||null,objectiveSlot:{id:'objective:'+q.id,rowPrefix:'v4.'+s.metadata.stageId+'.objective:'+q.id}})),events:s.events.map(q=>({id:q.id,when:q.when,source:q.action?.source})),route:s.initialState.honroRouteSpec,force:s.initialState.honroAct23V4TrajectoryForce,draftIds:[...new Set(drafts.filter(id=>new RegExp('^A[23]\\.S'+s.metadata.stageId+'\\.').test(id)))]}));
await writeFile('game/docs/story/ACT23_V4_MACHINE_SLOTS.json',JSON.stringify({scope:'Diagnostic Phase A machine IDs, coordinates and source-declared scene slots. No manuscript is loaded from this file.',bindingStatus:'Unreviewed draft IDs are candidates only. Phase B must bind and deduplicate the reviewed script; no order or one-to-one mapping is implied.',planningCommit:'99016126ba40c93f7fa0f3210e5be946e128adf7',sources,slotDeclarations:declarations,stages},null,2)+'\n');
console.log('Wrote diagnostic machine/slot mapping for20 chapters; production catalogues untouched.');
