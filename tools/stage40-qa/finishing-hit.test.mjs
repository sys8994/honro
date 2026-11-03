/** Resume the exact real failed save via ordinary App.continue. No unit,
 * resource, HP, round, flag or RNG edits. This R25 continuation is NOT a20R pass. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createFinale} from './bootstrap.mjs';
const profilePath='_local/reports/stage40-upperfix-01/final-profile.json',raw=await readFile(profilePath),saved=JSON.parse(raw),prior=execFileSync('git',['show','16f88a28:tools/stage40-qa/browser-planner.js'],{encoding:'utf8'}),fixed=await readFile('tools/stage40-qa/browser-planner.js','utf8');
const actions=[],{g,e,b,ops,app}=await createFinale({profilePath,entryRound:saved.honroBattle.round,record:x=>actions.push(x)});ops.frame();ops.ready();
const foe=b.units.find(v=>v.id==='final40-dock-stair-7');assert.equal(foe.hp,9);assert.equal(b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0).length,1);const decisions=[];let choice,actor;
for(const id of ['knight','mage','archer','occultist']){if(!ops.select(id))continue;const before=JSON.stringify(b),old=vm.runInContext('('+prior+')("plan")',g),next=vm.runInContext('('+fixed+')("plan")',g);assert.equal(JSON.stringify(b),before,'Planner mutated live state');assert.equal(old.choice,null,'Frozen planner unexpectedly accepted finishing hit');decisions.push({id,old:old.choice,next:next.choice,rejected:next.rejected});if(next.choice){choice=next.choice;actor=id;break;}}
console.log(JSON.stringify({scope:'Exact failed-save ordinary resume, not naturalR1/20R completion',profileSha256:createHash('sha256').update(raw).digest('hex'),round:b.round,decisions}));assert(choice,'No safe finishing option from exact save; investigate actual lane before another trial');const before={can:app.canInput(),grounded:e.grounded(e.active),active:e.active.id,vy:e.active.vy,loadout:e.active.loadout,selected:app.selected,phase:b.phase,shot:b.shot};const accepted=ops.fire(choice.id,choice.angle,choice.power);console.log(JSON.stringify({before,accepted,actions,after:{can:app.canInput(),grounded:e.grounded(e.active),active:e.active.id,phase:b.phase,shot:b.shot}}));assert(accepted);ops.ready();assert(foe.dead||foe.hp===0,'Actual finishing cast did not remove9HP foe');console.log(JSON.stringify({passed:true,actor,choice,round:b.round,remaining:b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0).length,actions},null,2));
