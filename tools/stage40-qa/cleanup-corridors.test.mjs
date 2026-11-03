/** Pure captured-state policy/author fixtures. Not actual gameplay evidence. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {cleanupDestinationAllowed} from '../../shared/engine/src/act4CleanupRoutes.ts';
import {authorAct4Finale} from '../../shared/act4-finale-author.mjs';
const load=p=>JSON.parse(execFileSync('xz',['-dc',p],{maxBuffer:32e6}));
const allowed=(b,u,p,s,current=u.honroEncounterSupport)=>cleanupDestinationAllowed(b,u,p,s,current);
const cases=[
 [load('tools/stage40-qa/records/41721169502-stage31-last-storage.json.xz').honroBattle,'pilot31-ridge-court-3',6170,'approved31-upper-east']
];
for(const [b,id,limit,support]of cases){
 const u=b.units.find(v=>v.id===id),before=JSON.stringify(b),inside={...u,x:limit-20};
 assert(allowed(b,inside,{x:limit,y:u.y},support));
 assert(!allowed(b,inside,{x:limit+1,y:u.y},support));
 assert(!allowed(b,inside,{x:limit-10,y:u.y},'unrelated-support'));
 assert(allowed(b,u,{x:u.x-20,y:u.y},support),'Existing outside save can walk inward');
 assert(!allowed(b,u,{x:u.x+20,y:u.y},support));
 assert(!allowed(b,u,{x:u.x,y:u.y},support));
 assert(allowed(b,u,{x:u.x+20,y:u.y},'legacy-stepping-stone','legacy-outside-layer'),'Wrong-support saves retain original destination eligibility');
 assert(allowed(b,u,{x:u.x+20,y:u.y},'legacy-stepping-stone',null),'Unknown actual contact must not trap an old save');
 for(const change of [{honroCustom:true},{honroAct4Official:0},{honroStage:24},{honroAct4Preview:24}])assert(allowed({...b,...change},inside,{x:9000,y:0},'anything'));
 for(const change of [{id:'unrelated'},{side:0},{enthrall:'archer'},{honroPilotCombatBudget:false},{honroPilotRole:'guard'},{honroEncounterSupport:'unrelated'},{eaterCapturedBy:'x'},{carriedBy:1}])assert(allowed(b,{...inside,...change},{x:9000,y:0},'anything'));
 assert.equal(JSON.stringify(b),before,'Read-only policy must not rewrite saved state');
}
const base={metadata:{stageId:40},initialState:{},units:[],encounters:[],design:{act4:{geometry40:{}}}};
const source=JSON.stringify(base),s=authorAct4Finale(base,(_s,support,x)=>({x,y:100}));
assert.equal(JSON.stringify(base),source);assert.equal(s.units.length,42);
assert.equal(s.units.filter(u=>u.stageOverrides.honroDensityCell==='final40-dock-stair').length,7);
assert.deepEqual(s.initialState.honroEncounterDensityActivation['final40-dock-stair'],{supports:['approved40-dock-stair'],radius:850,maxHeight:500,engagementRounds:1});
assert.equal(s.initialState.honroEncounterDensityActivation['final40-stair-overwatch'],undefined);
// Exact Stage40 author bytes are those used in current-master R15-to-R22 run41729470340.
const author=await readFile('shared/act4-finale-author.mjs');
assert.equal(createHash('sha256').update(author).digest('hex'),'058fb529bb3200fadd3bafb5d3929871a8e78a4dc667f7b34c5e508f55cdf410');
for(const name of ['41690685003-r15-start-profile.json.xz','41690685003-r18-outside-layer-profile.json.xz']){
 const b=load('tools/stage40-qa/records/'+name).honroBattle;
 for(const u of b.units)for(const support of [u.honroEncounterSupport,'approved40-coast-west','approved40-dock','approved40-dock-stair','outside'])for(const x of [0,2360,9000])assert(allowed(b,u,{x,y:u.y},support),'Stage40 filter must be a no-op for every actor and support');
}
assert.equal(s.initialState.honroActiveLimit,6);
const originalRevision={...base,initialState:{honroFinalDefenseRevision:2}};assert.equal(authorAct4Finale(originalRevision,()=>{throw Error('Must not rewrite existing revision');}),originalRevision);
// Imported code is reachable from the real planner, not an unused helper.
const ai=await readFile('shared/engine/src/enemyAI.ts','utf8');assert(ai.includes('if((e.b as any).honroStage===31&&!cleanupDestinationAllowed(e.b,u,{x,y},foot.t.id,e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id))return;'));
console.log('PASS Stage31 corridor/outside-save scope and exact original Stage40 author/no-op destination policy; NOT gameplay acceptance');
