/** Exact outer approval layer. Missing final pin is an error, never a bypass.
 * Inverses are historical evidence only; live gameplay retains current identity. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {storyDeltaHash as hash,applyExactStoryJsonDelta} from './exact-story-revision-delta.mjs';
import {assertExactFollowupDelta} from './ui-followup-source-delta.mjs';
export const ACT3_FINAL_FIXTURE_SHA256='UNPINNED_FINAL_TEN_STAGES';
let cached;
export function act3FinalDelta(){
 if(cached)return cached;
 assert.match(ACT3_FINAL_FIXTURE_SHA256,/^[a-f0-9]{64}$/,'Final ten-stage approval is not pinned');
 const bytes=readFileSync(new URL('./fixtures/act3-environment-final-delta.json',import.meta.url));
 assert.equal(hash(bytes),ACT3_FINAL_FIXTURE_SHA256,'Immutable reviewed final environment delta');
 const d=JSON.parse(bytes);assert.equal(d.baseCommit,'d7c1f8457dd33decda5481c7c3b57d8505f6f157');
 assert.deepEqual(Object.keys(d.stageCommits).map(Number),[21,22,23,24,25,26,27,28,29,30]);
 for(const sha of Object.values(d.stageCommits))assert.match(sha,/^[a-f0-9]{40}$/);
 assert.equal(d.kind,'act3-environment-final');
 for(const view of Object.values(d.campaign.views))for(const row of view.stages)assert(row.stageId>=21&&row.stageId<=30);
 assert.deepEqual(d.runtime.beforeManifest.modelFiles,d.runtime.afterManifest.modelFiles,'No model registration change');
 assert.deepEqual(d.runtime.beforeManifest.engineFiles,d.runtime.afterManifest.engineFiles,'No engine files change');
 assert.equal(d.runtime.beforeManifest.coreSha256,d.runtime.afterManifest.coreSha256,'No common AI/core changes');
 for(const c of d.sourceChanges)assert(d.allowedSources.includes(c.path),'Explicit reviewed source allowlist');
 cached=d;return d;
}
const manifest=(m,kind,reverse)=>{const d=act3FinalDelta()[kind],from=reverse?'afterManifest':'beforeManifest',to=reverse?'beforeManifest':'afterManifest';assert.equal(hash(m),hash(d[from]),'Exact '+kind+' approval input');return structuredClone(d[to]);};
export const applyAct3CampaignManifest=m=>manifest(m,'campaign',false);
export const beforeAct3CampaignManifest=m=>manifest(m,'campaign',true);
export const applyAct3RuntimeManifest=m=>manifest(m,'runtime',false);
export const beforeAct3RuntimeManifest=m=>manifest(m,'runtime',true);
function library(input,view,reverse,scope){const proof=act3FinalDelta().campaign.views[view].library,filter=a=>scope!=='act12'||!a.id.startsWith('a3-'),from=reverse?'after':'before',to=reverse?'before':'after';assert.deepEqual(input.map(a=>({id:a.id,sha256:hash(a)})),proof[from].filter(filter),'Exact library membership/order/bytes');const entries=new Map(input.map(a=>[a.id,a]));for(const c of proof.changes){const value=c[to];if(value&&filter(value))entries.set(c.id,structuredClone(value));else entries.delete(c.id);}return proof[to].filter(filter).map(row=>{const a=entries.get(row.id);assert(a);assert.equal(hash(a),row.sha256);return a;});}
export const beforeAct3Library=(a,{variant='raw',scope='full'}={})=>library(a,variant,true,scope);
export const afterAct3Library=(a,{variant='raw',scope='full'}={})=>library(a,variant,false,scope);
function campaign(input,{variant='raw',scope='full',reverse=true}={}){
 const d=act3FinalDelta().campaign.views[variant],p=structuredClone(input),from=reverse?'after':'before',to=reverse?'before':'after';
 assert.deepEqual(Object.fromEntries(Object.entries(p).filter(([k])=>!['stages','library'].includes(k))),d.globals,'No global changes');
 const rows=d[from+'Stages'].filter(r=>scope!=='act12'||r.stageId<=20);
 assert.deepEqual(p.stages.map(s=>({id:s.id,stageId:s.metadata.stageId,sha256:hash(s)})),rows,'Exact complete '+variant+' '+from+' stage set');
 for(const r of d.stages){if(scope==='act12')continue;p.stages[r.stageId-1]=applyExactStoryJsonDelta(p.stages[r.stageId-1],r,{reverse});}
 p.library=library(p.library,variant,reverse,scope);assert.deepEqual(p.stages.map(s=>({id:s.id,stageId:s.metadata.stageId,sha256:hash(s)})),d[to+'Stages'].filter(r=>scope!=='act12'||r.stageId<=20));return p;
}
export const beforeAct3Campaign=(p,o={})=>campaign(p,{...o,reverse:true});
export const afterAct3Campaign=(p,o={})=>campaign(p,{...o,reverse:false});
export function beforeAct3Source(path,text){const c=[...act3FinalDelta().sourceChanges,...act3FinalDelta().packagingChanges].find(c=>c.path===path);return c?(c.added?(assert.equal(hash(text),c.sha256),undefined):assertExactFollowupDelta(text,c)):text;}
export function beforeAct3Sources(s){return Object.fromEntries(Object.entries(s).flatMap(([p,t])=>{const v=beforeAct3Source(p,t);return v===undefined?[]:[[p,v]];}));}
export function beforeAct3ProjectPart(part){const d=act3FinalDelta().project;assert.equal(hash(part),d.afterSha256);assert(part.startsWith(d.prefix)&&part.endsWith(d.suffix));const p=beforeAct3Campaign(JSON.parse(part.slice(d.prefix.length,-d.suffix.length)),{variant:'project'}),out=d.prefix+JSON.stringify(p)+d.suffix;assert.equal(hash(out),d.beforeSha256);return out;}
export function assertAct3FinalNegatives({sources,raw,runtime,manifest}){
 beforeAct3RuntimeManifest(manifest);beforeAct3Campaign(raw);beforeAct3Campaign(runtime,{variant:'runtime'});let count=0;
 for(const c of act3FinalDelta().sourceChanges){assert.throws(()=>beforeAct3Source(c.path,sources[c.path]+' '));count++;if(!c.added){const bad=structuredClone(c);bad.exactEdits[0].afterLine++;assert.throws(()=>assertExactFollowupDelta(sources[c.path],bad));count++;}}
 for(const [p,variant]of[[raw,'raw'],[runtime,'runtime']]){for(const row of act3FinalDelta().campaign.views[variant].stages){const bad=structuredClone(p.stages[row.stageId-1]);bad.units[0].hp=(bad.units[0].hp||0)+1;assert.throws(()=>applyExactStoryJsonDelta(bad,{...row,afterSha256:hash(bad)},{reverse:true}),'Repinning cannot hide unrelated HP');count++;}}
 for(const [p,variant]of[[raw,'raw'],[runtime,'runtime']])for(const edit of[q=>q.stages[0].width++,q=>q.stages[26].units[0].hp=(q.stages[26].units[0].hp||0)+1,q=>q.library.reverse(),q=>q.library.pop(),q=>q.stages.reverse()]){const bad=structuredClone(p);edit(bad);assert.throws(()=>beforeAct3Campaign(bad,{variant}));count++;}
 for(const edit of[m=>m.coreSha256='0'.repeat(64),m=>m.variants.v1r1a1.parts.reverse(),m=>m.sourceRows.pop()]){const bad=structuredClone(manifest);edit(bad);assert.throws(()=>beforeAct3RuntimeManifest(bad));count++;}return count;
}
