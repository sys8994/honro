/** Decision fixtures only, not physical reachability or gameplay acceptance. */
import assert from 'node:assert/strict';
import {finaleRoleGoal} from './role-route.mjs';
const foes=[{id:'final40-dock-left-1',x:420},{id:'final40-dock-right-1',x:1700}];
const goal=(cls,support='approved40-dock-stair')=>finaleRoleGoal({cls,x:2200},{support,foes});
assert.equal(goal('knight').kind,'rear-role-descend');assert.equal(goal('occultist').kind,'rear-role-descend');assert(goal('mage').hold&&goal('archer').hold);assert.notEqual(goal('mage').x,goal('archer').x);assert.equal(goal('knight','approved40-dock').target,'final40-dock-left-1');assert.equal(finaleRoleGoal({cls:'mage',x:2200},{support:'approved40-dock-stair',foes:[]}),null);console.log('PASS distinct current-state flank roles, no premature ranged drop');
