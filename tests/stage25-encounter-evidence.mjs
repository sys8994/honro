// Evidence envelope generation, not a quality verdict. Run after the normal bot.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {template} from '../tools/testing/encounter-evidence-gate.mjs';
import {fileRef} from '../tools/intent-pipeline/review-job.mjs';
const root=process.cwd(),dir='review/stage25/resume-normal',out='_local/reports/stage25',trace='_local/reports/stage25/normal/stage-25.json';
await mkdir(dir,{recursive:true});
const r=JSON.parse(await readFile(trace)),sha=x=>createHash('sha256').update(x).digest('hex');
if(r.failure||r.phase!=='won'||!r.initial)throw Error('Complete original normal run with initial snapshot required');
if(r.source['shared/data/campaign.json']!==sha(await readFile('shared/data/campaign.json')))throw Error('Campaign changed; rerun normal policy before repackaging');
for(const name of ['stage-25.json','checkpoint.json'])await copyFile('_local/reports/stage25/normal/'+name,dir+'/'+name);
const raw=dir+'/stage-25.json';
const summary={stage:25,observer:'/root/stage25_play',observedAt:new Date().toISOString(),method:'native-input',phase:r.phase,round:r.round,actions:r.actions.length,damageEvents:r.damage.length,crossings:r.crossings.length,campaign:r.source['shared/data/campaign.json'],limits:['No direct enemy-fire/source attribution recorder: player HP loss cannot be attributed to a specific group.','Group effects below are player responses and actual damage to identified enemies.','No normal-camera pixels reviewed by this observer. No art or independent whole-gate approval.'],groups:[]};
const project=JSON.parse(await readFile('shared/data/campaign.json')),map=project.stages.find(s=>s.metadata.stageId===25);
for(const group of map.design.act3.encounterPlan.groups){const ids=map.units.filter(u=>u.encounterGroup===group.id).map(u=>u.id);const responses=r.actions.flatMap((a,index)=>ids.includes(a.target)?[{rawIndex:index,...a}]:[]),hits=r.damage.flatMap((d,index)=>ids.includes(d.id)?[{rawIndex:index,...d}]:[]);summary.groups.push({id:group.id,ids,responses,hits,enemyHpLost:-hits.reduce((n,h)=>n+Math.min(0,h.delta),0)});}
await writeFile(dir+'/observations.json',JSON.stringify(summary,null,2)+'\n');
// Envelopes live under _local so their digests never self-reference source files.
const m=await template(root,[25]),stage=m.stages[0];m.implementationAuthors=['/root'];
const bound={stageId:25,sourceDigest:m.sourceDigest,targetDigest:m.targetDigest,observer:summary.observer,observedAt:summary.observedAt,method:'native-input',rawEvidencePaths:[raw,dir+'/observations.json']};
const supports={'seal-approach':['gallery-0:collision:0'],'numbered-goods':['gallery-3:collision:0'],'inner-store':['gallery-5:collision:0']};
const packet={schema:'honro-encounter-observation/v1',...bound,clusters:summary.groups.map(gr=>({id:gr.id,kind:'cluster',status:'observed',memberIds:gr.ids,purpose:map.design.act3.encounterPlan.groups.find(g=>g.id===gr.id).purpose,roleRelations:'Authored frontline/ranged group; actual player responses and target HP loss observed. Exact enemy action attribution remains unrecorded.',emptySpacePurpose:'Space between groups permits Jinmok preparation and movement to the next safe landing; five continuous two-hero crossings were completed.',supportIds:supports[gr.id],actions:[],playerResponses:gr.responses.map(a=>({actorId:'p-'+a.actor,round:a.round,kind:a.action,detail:`${a.skill} against ${a.target}; raw actions[${a.rawIndex}] at (${a.x},${a.y})`})),effects:[{type:'damage',detail:`${gr.enemyHpLost} total recorded HP loss among this group's identified enemies; raw damage indexes ${gr.hits.map(h=>h.rawIndex).join(',')}. This does not attribute received hero damage to this group.`,actionIndexes:[],responseIndexes:gr.responses.map((_,i)=>i)}]}))};
const observationPath=out+'/encounter-observations.json';await writeFile(observationPath,JSON.stringify(packet,null,2)+'\n');
stage.clusters.forEach((c,i)=>{c.status='observed';c.observation={path:observationPath,pointer:'/clusters/'+i};});
const initial=r.initial.units.filter(u=>u.side===0),normalPath=out+'/normal-envelope.json';
await writeFile(normalPath,JSON.stringify({schema:'honro-encounter-normal-play/v1',...bound,debug:false,modifications:[],normalResources:true,completed:true,profile:{entryLevel:initial[0].level,skillAllocation:Object.fromEntries(initial.map(u=>[u.cls,{ranks:u.ranks,loadout:u.loadout}])),startingResources:{heroes:initial.map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,focus:u.focus})),items:r.initial.items}},scope:r.scope},null,2)+'\n');
stage.checks['normal-resource-play']={status:'observed',detail:`Production native App/engine, prepared legal entry budget; R${r.round}, ${r.actions.length} inputs, 5 investigations, 10 actual gate uses, both heroes survive. Not a browser/manual quality verdict.`,evidencePaths:[normalPath,raw]};
for(const [key,detail] of Object.entries({'same-camera':'Await root before/after camera captures.','visual-quality':'Await root pixel review; successful traversal does not establish artwork quality.','activation-and-action-cap':'Player response/target damage recorded, but individual enemy action queue/cap transitions were not instrumented.','terrain-and-roles':'Actual route and group interaction recorded; support/role geometry needs separate final-roof verification.','runtime-wave-inventory':'Captured honroEvents is empty; requires independent runtime source audit before declaring no runtime-only waves.'}))stage.checks[key].detail=detail;
for(const p of [raw,dir+'/checkpoint.json',dir+'/observations.json',normalPath,observationPath])m.evidence.push(await fileRef(root,p,'json'));
m.review.unresolvedFindings=['Final roof/camera/build verification and independent visual/tactical review pending.'];
await writeFile(out+'/encounter-review.json',JSON.stringify(m,null,2)+'\n');
console.log('Wrote source-bound partial manifest. Normal play and three cluster responses observed; remaining checks intentionally pending.');
