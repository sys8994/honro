import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../shared/runtime/stage59-normal-entry.inc.js',import.meta.url),'utf8');
const match=source.match(/      function speak59State\(a,s,r\)\{[\s\S]*?\n      \}/);
assert.ok(match,'The production defense event reader exists');
const shown=[],seen=new Set();
const showAct6Milestone=(_a,_s,id)=>{
  if(seen.has(id))return false;
  seen.add(id);shown.push(id);return true;
};
const speak=runInNewContext(`(${match[0]})`,{showAct6Milestone,finale59Dialogue:new Proxy({}, {get:()=>[]})});
const b={honroState:{localFinaleProgress:{fronts:[{spawned:2},{spawned:2}]}}};
const state={engine:{b}}, app={};
const flags={cliff:false,mage:false,soul:false,bridge:false},r={states:flags};
assert.equal(speak(app,state,r),true);
assert.deepEqual(shown,['twoWings']);
flags.bridge=true;flags.soul=true;
// Neither rim has been stabilized. Finished bridge/soul objectives must not
// be held hostage by a once-seen enemy arrival cue.
assert.equal(speak(app,state,r),true);
assert.equal(speak(app,state,r),true);
assert.equal(speak(app,state,r),false);
assert.deepEqual(shown,['twoWings','bridgeHeld','soulHeld']);
flags.activated=true;flags.cliff=true;
assert.equal(speak(app,state,r),false);
console.log('PASS Act 6-9 reinforcements, bridge, and soul lane dialogue do not block later milestones');
