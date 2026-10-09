/** Exact completion -> immutable reviewed draft; never skip a changed category. */
import {beforeCurrentStage17Worksite,beforeStage17WorksiteLibrary} from './stage17-worksite-history-helpers.mjs';
import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';
export const completionDelta=JSON.parse(readFileSync(new URL('./fixtures/stage11-ravine-completion-delta.json',import.meta.url),'utf8'));
const clone=v=>JSON.parse(JSON.stringify(v));export const completionHash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function beforeRavineCompletionLibrary(library,{required=false}={}){
 const out=beforeStage17WorksiteLibrary(library),f=completionDelta;let isNew=required;
 for(const change of f.libraryChanges){const matches=out.filter(a=>a.id===change.id);assert(matches.length<=1,'No duplicate completion artwork '+change.id);const value=matches[0];if(!value)continue;if(change.hasAfter&&same(value,change.after))isNew||=!change.hasBefore||!same(change.before,change.after);else assert(change.hasBefore&&same(value,change.before),'Only exact old/current completion art '+change.id);}
 if(!isNew)return out;const digest=completionHash(out),full=digest===f.afterLibrarySha256,scoped=digest===f.afterAct12LibrarySha256;assert(full||scoped,'Exact completion Library and order');
 const map=new Map(out.map(a=>[a.id,a]));for(const change of f.libraryChanges){if(change.hasAfter)assert.deepEqual(map.get(change.id),change.after,'Exact completion art '+change.id);if(change.hasBefore)map.set(change.id,clone(change.before));else map.delete(change.id);}
 const ids=full?f.libraryOrderBefore:f.libraryOrderBefore.filter(id=>!id.startsWith('a3-')),before=ids.map(id=>{assert(map.has(id),id);return map.get(id);});assert.equal(map.size,ids.length);assert.equal(completionHash(before),full?f.beforeLibrarySha256:f.beforeAct12LibrarySha256);return before;
}
export function beforeRavineCompletion(project){
 const out=beforeCurrentStage17Worksite(project),matches=out.stages?.filter(s=>s.metadata?.stageId===11)||[];if(!matches.length)return out;assert.equal(matches.length,1);const st=matches[0],f=completionDelta;
 if(!st.initialState?.honroStage11CompletionRevision)return out;assert.equal(st.initialState.honroStage11CompletionRevision,1);assert.equal(completionHash(st),f.afterStageSha256,'Exact reviewed completion Stage11');
 for(const row of f.paths){let target=st;for(const key of row.path.slice(0,-1)){assert(Object.hasOwn(target,key));target=target[key];}const key=row.path.at(-1);assert.equal(Object.hasOwn(target,key),row.hasAfter);if(row.hasAfter)assert.deepEqual(target[key],row.after,'Exact completion path '+row.path.join('/'));if(row.hasBefore)target[key]=clone(row.before);else delete target[key];}
 assert.deepEqual(st,f.beforeStage,'Every original reviewed draft value restored');out.stages[out.stages.indexOf(st)]=clone(f.beforeStage);if(out.library)out.library=beforeRavineCompletionLibrary(out.library,{required:true});return out;
}
export function beforeCompletionUnits(units){assert.deepEqual(clone(units),completionDelta.unitContracts.after,'Exact current completion actors');return clone(completionDelta.unitContracts.before);}
export function beforeCompletionContent(content){assert.deepEqual(clone(content),completionDelta.semanticContent.after,'Exact current completion content');return clone(completionDelta.semanticContent.before);}
export function beforeCompletionBalance(balance){const out=clone(balance),i=out.stages.findIndex(s=>s.id===11);assert.deepEqual(out.stages[i],completionDelta.balance.after,'Exact current completion budget');out.stages[i]=clone(completionDelta.balance.before);return out;}
