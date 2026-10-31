/** Construct a partial production draft from the actual assembled campaign.
 * Authored support IDs are carried as declarations, not independently certified.
 * Blank roles, intent, reviews and probes deliberately keep the gate closed. */
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../../game/tests/helpers.mjs';
import {loadPilotRuntime} from './pilot-runtime.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false});
await loadPilotRuntime(g);
const id='stage-31',p=g.HonroProductionContract.begin(g.HONRO_PROJECT,id),s=p.stages.find(v=>v.id===id),card=p.production.cards[id];
if(!s||s.metadata?.stageId!==31)throw Error('Actual assembled Stage 31 is missing');
const enemy=new Map(s.units.filter(u=>u.team==='enemy').map(u=>[u.id,u]));
card.encounters=(s.encounters||[]).map(group=>({id:group.id,purpose:'',targetZone:null,members:group.unitIds.map(id=>{
 const u=enemy.get(id);if(!u||u.encounterGroup!==group.id)throw Error('Encounter membership mismatch: '+id);
 const supportId=u.stageOverrides?.honroEncounterSupport;
 if(typeof supportId!=='string'||!supportId)throw Error('Authored support is missing: '+id);
 return {id,role:'',supportId};
})}));
const assigned=card.encounters.flatMap(e=>e.members.map(m=>m.id));
if(assigned.length!==enemy.size||new Set(assigned).size!==enemy.size)throw Error('Enemy groups do not cover the exact roster');
const result=g.HonroProductionContract.releaseStatus(p,id);
if(result.exportAllowed)throw Error('An incomplete scaffold cannot be released');
const dir=process.argv[2]||'_local/reports/stage31-production';await mkdir(dir,{recursive:true});
await writeFile(dir+'/draft.json',JSON.stringify(p));
await writeFile(dir+'/audit.json',JSON.stringify(result,null,2)+'\n');
await writeFile(dir+'/card.json',JSON.stringify({candidateFingerprint:result.fingerprint,card,releaseApproved:false},null,2)+'\n');
console.log(JSON.stringify({directory:dir,stage:id,enemies:enemy.size,groups:card.encounters.length,fingerprint:result.fingerprint,issues:result.issues.length,exportAllowed:result.exportAllowed}));
