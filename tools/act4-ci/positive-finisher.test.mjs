/** Pure QA decision regression, not actual game acceptance. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const planner=await readFile('tools/act4-ci/normal-shot-plan.js','utf8'),play=await readFile('tools/act4-ci/stage31-fullplay.py','utf8');
const extract=s=>s.match(/const qaDirectFinisher\s*=\s*(\(shot,target,battle\)=>\{.*?;\});/)[1];
const expression=extract(planner);assert.equal(extract(play),expression,'Planner and settled-angle check must agree');
const accept=Function('return ('+expression+')')(),t={id:'last',side:1,hp:2,shield:0,dead:false},b={units:[t]},z={ok:false,hit:{unit:'last'},enemyDamage:2,net:2,friendlyDamage:0,risk:0};
assert(accept(z,t,b));assert(accept({...z,enemyDamage:1,net:1},{...t,hp:1},b));
for(const patch of [{hit:{unit:'wall'}},{hit:{unit:'last',terrain:'wall'}},{enemyDamage:1},{net:0},{friendlyDamage:.01},{risk:.01}])assert(!accept({...z,...patch},t,b));
for(const patch of [{hp:0},{hp:3},{hp:2,shield:1},{dead:true}])assert(!accept(z,{...t,...patch},b));
assert(!accept(z,t,{units:[t,{...t,id:'another'}]}));
assert(planner.includes('for (const delta of [0, -.2, .2])')&&planner.includes('points.slice(1).some'));
assert(play.includes('return [-.1,0,.1].every')&&play.includes('points.slice(1).some'));
console.log('PASS sole-lowHP direct-finisher QA policy and identical settled-angle check; no gameplay claim');
