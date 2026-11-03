/** Current visible tide control policy, no product tide/stat changes. */
import assert from 'node:assert/strict';
import {deckEntryUnsafe,finaleDeckGoal} from './role-route-deck.mjs';
const b={round:12,honroAct4Design:{tide:{high:3412.5}},honroAct4PreviewState:{tide:{phase:'rising',highRound:13}}};
const ctx={b,support:'approved40-dock',foes:[],surface:()=>null};
for(const cls of ['archer','mage','occultist'])for(const [round,phase]of [[12,'rising'],[13,'high'],[14,'high']]){b.round=round;b.honroAct4PreviewState.tide.phase=phase;const u={cls,x:2197,y:2892},goal=finaleDeckGoal(u,ctx);assert(deckEntryUnsafe(b));assert.equal(goal.kind,'visible-tide-no-descent');assert.equal(goal.drop,undefined);assert(goal.hold);}
b.round=15;b.honroAct4PreviewState.tide.phase='low';assert(!deckEntryUnsafe(b));assert(finaleDeckGoal({cls:'mage',x:2197,y:2892},ctx).drop);
console.log('PASS: observed R13/R14 repeated high-water entry is refused for every ranged role; existing low-water entry remains available. No future state used.');
