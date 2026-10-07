/** A branch from a real completed-stage-25 diagnostic save. Never fabricate
 * entry HP/MP/items or overwrite combat/objective fields. This verifies a first
 * defensive choice, not a second claimed 24→27 continuous completion. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const input=process.argv[2];if(!input)throw Error('Pass a recorded real stage-25 outcome checkpoint');
const saved=JSON.parse(await readFile(input,'utf8')),profile=saved.profile;
assert.equal(saved.id,25);assert.equal(saved.b.phase,'won');assert.equal(profile.honroSplitCampaign.nextStage,26);assert.equal(profile.honroSplitCampaign.mode,'continuous');
const h=await appHarness(),{g}=h,app=h.load(profile);app.showRest();h.finish(app);const e=app.engine,b=e.b,S=g.HonroSplitCampaign;
assert.equal(b.honroStage,26);const view=()=>b.units.filter(S.hero).map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,mp:u.focus,x:u.x,y:u.y,dead:u.dead,shield:u.shield}));const before=view(),items=plain(b.items),actions=[];
async function ready(){for(let i=0;i<20000&&!e.canAct()&&!['won','lost'].includes(b.phase);i++){e.tick(1/60);if(!app.dialogue)g.HonroMission.tick(app,1/60);app.startQueuedStory();if(app.dialogue)h.finish(app);}if(g.HonroStory.turnPaused(app))await new Promise(r=>setTimeout(r,Math.max(1,Math.ceil(app.turnNotice.pauseUntil-performance.now()))));}
await ready();const sodan=e.heroesAlive().find(u=>u.cls==='occultist');app.selectHero(sodan.id);assert(app.canInput());app.defend();actions.push({actor:'occultist',action:'App.defend',after:view()});await ready();
assert.equal(b.round,1);app.defend();actions.push({actor:'archer',action:'App.defend',after:view()});await ready();
const result={input,scope:'Real stage-25 outcome branch: one normal first-turn defensive choice by each B-team member, no state edits. Not a full campaign win.',before,after:view(),itemsBefore:items,itemsAfter:plain(b.items),round:b.round,phase:b.phase,actions};
assert.equal(b.round,2);assert(!['won','lost'].includes(b.phase));assert(S.allPresent(b));assert.deepEqual(plain(b.items),items);assert(sodan.hp>before.find(u=>u.cls==='occultist').hp,'The low-HP actor should have a real usable defensive recovery window');
await mkdir('_local/reports/act3-low-hp-entry',{recursive:true});await writeFile('_local/reports/act3-low-hp-entry/result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
