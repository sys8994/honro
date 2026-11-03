/** Pure captured-state policy/author fixtures. Not actual gameplay evidence. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {cleanupDestinationAllowed as allowed} from '../../shared/engine/src/act4CleanupRoutes.ts';
import {authorAct4Finale} from '../../shared/act4-finale-author.mjs';
const load=p=>JSON.parse(execFileSync('xz',['-dc',p],{maxBuffer:32e6}));
const cases=[
 [load('tools/stage40-qa/records/41721169502-stage31-last-storage.json.xz').honroBattle,'pilot31-ridge-court-3',6170,'approved31-upper-east'],
 [load('tools/stage40-qa/records/41690685003-r15-start-profile.json.xz').honroBattle,'final40-dock-stair-5',2360,'approved40-dock-stair']
];
for(const [b,id,limit,support]of cases){
 const u=b.units.find(v=>v.id===id),before=JSON.stringify(b),inside={...u,x:limit-20};
 assert(allowed(b,inside,{x:limit,y:u.y},support));
 assert(!allowed(b,inside,{x:limit+1,y:u.y},support));
 assert(!allowed(b,inside,{x:limit-10,y:u.y},'unrelated-support'));
 assert(allowed(b,u,{x:u.x-20,y:u.y},support),'Existing outside save can walk inward');
 assert(!allowed(b,u,{x:u.x+20,y:u.y},support));
 assert(!allowed(b,u,{x:u.x,y:u.y},support));
 for(const change of [{honroCustom:true},{honroAct4Official:0},{honroStage:24},{honroAct4Preview:24}])assert(allowed({...b,...change},inside,{x:9000,y:0},'anything'));
 for(const change of [{id:'unrelated'},{side:0},{enthrall:'archer'},{honroPilotCombatBudget:false},{honroPilotRole:'guard'},{honroEncounterSupport:'unrelated'},{eaterCapturedBy:'x'},{carriedBy:1}])assert(allowed(b,{...inside,...change},{x:9000,y:0},'anything'));
 assert.equal(JSON.stringify(b),before,'Read-only policy must not rewrite saved state');
}
const base={metadata:{stageId:40},initialState:{},units:[],encounters:[],design:{act4:{geometry40:{}}}};
const source=JSON.stringify(base),s=authorAct4Finale(base,(_s,support,x)=>({x,y:100}));
assert.equal(JSON.stringify(base),source);assert.equal(s.units.length,42);
assert.deepEqual(s.units.filter(u=>u.stageOverrides.honroDensityCell==='final40-stair-overwatch').map(u=>u.id),['final40-dock-stair-5']);
assert.deepEqual(s.initialState.honroEncounterDensityActivation['final40-dock-stair'],{supports:['approved40-dock-stair'],radius:850,maxHeight:500,engagementRounds:1});
assert.deepEqual(s.initialState.honroEncounterDensityActivation['final40-stair-overwatch'],{supports:['approved40-dock-stair'],extra:[{support:'approved40-dock',minX:1880,maxX:2240}],radius:850,maxHeight:500,engagementRounds:1});
assert.equal(s.initialState.honroActiveLimit,6);
const originalRevision={...base,initialState:{honroFinalDefenseRevision:2}};assert.equal(authorAct4Finale(originalRevision,()=>{throw Error('Must not rewrite existing revision');}),originalRevision);
// Imported code is reachable from the real planner, not an unused helper.
const ai=await readFile('shared/engine/src/enemyAI.ts','utf8');assert(ai.includes('cleanupDestinationAllowed(e.b,u,{x,y},foot.t.id)'));
console.log('PASS two authored voluntary corridors, outside-save inward steps, negative scope and one-actor activation fixtures; NOT gameplay acceptance');
