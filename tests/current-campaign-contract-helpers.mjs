import {applyTempleCampaignManifest} from './temple-testimony-history.mjs';
import {applyEvidenceCampaignManifest} from './evidence-quests-campaign-history.mjs';
import {applyStoryCampaignManifest} from './act23-story-revision-history.mjs';
import {beforeQuestProjectProse} from './quest-project-prose-history.mjs';
/** Separately approved current contract. Never replaces historical expectations. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const campaignHash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const bytes=readFileSync(new URL('./fixtures/campaign-contracts/current-manifest.json',import.meta.url));
assert.equal(campaignHash(bytes),'fb85e9889b9598992b153c55a1044c09d6cf747ab805800bc823bc5cc5562e43','Reviewed current manifest; not automatically refreshed');
export const currentCampaignManifest=applyTempleCampaignManifest(applyEvidenceCampaignManifest(applyStoryCampaignManifest(JSON.parse(bytes))));
export function campaignScope(scope){assert(['full','act12'].includes(scope),'Explicit full or act12 scope required');return scope;}
export function scopeCampaign(p,scope){campaignScope(scope);const q=structuredClone(p);if(scope==='act12'){q.stages=q.stages.slice(0,20);q.library=q.library.filter(a=>!a.id.startsWith('a3-'));}return q;}
function rows(view,scope){return{stages:scope==='full'?view.stages:view.stages.slice(0,20),library:scope==='full'?view.library:view.library.filter(a=>!a.id.startsWith('a3-'))};}
function exactLibrary(library,expected){assert.deepEqual(library.map(a=>a.id),expected.map(a=>a.id),'Explicit current asset membership/order');for(const[a,i]of library.map((a,i)=>[a,i]))assert.equal(campaignHash(a),expected[i].sha256,'Exact reviewed current asset '+a.id);}
export function assertCurrentCampaign(project,{scope='full',variant='raw'}={}){project=beforeQuestProjectProse(project);campaignScope(scope);assert(['raw','runtime'].includes(variant),'Explicit raw/runtime variant');const view=currentCampaignManifest[variant],r=rows(view,scope);assert.deepEqual(Object.fromEntries(Object.entries(project).filter(([k])=>!['stages','library'].includes(k))),view.globals,'Complete current global fields');assert.deepEqual(project.stages.map(s=>({id:s.id,stageId:s.metadata.stageId})),r.stages.map(({id,stageId})=>({id,stageId})),'Exact canonical chapter membership/order');for(const[s,i]of project.stages.map((s,i)=>[s,i]))assert.equal(campaignHash(s),r.stages[i].sha256,'Exact reviewed current stage '+s.id);exactLibrary(project.library,r.library);return project;}
export function assertCurrentCampaignLibrary(library,{scope='full'}={}){campaignScope(scope);exactLibrary(library,rows(currentCampaignManifest.raw,scope).library);return library;}
