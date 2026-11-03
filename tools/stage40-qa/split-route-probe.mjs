import {splitDockRoleGoal} from './split-role-route.mjs';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createFinale} from './bootstrap.mjs';
import {evaluateLegalCast} from './legal-cast.mjs';
import {evaluateInputTolerance} from './input-tolerance.mjs';
const dir=process.argv[2];assert(dir);
const profilePath=dir+'/r14-start-profile.json';await writeFile(profilePath,execFileSync('xz',['-dc',dir+'/browser/turn-profile-040.json.xz'],{maxBuffer:128e6}));
const src=await readFile(new URL('diagnostic-finishing.mjs',import.meta.url),'utf8'),body=src.slice(src.indexOf('function plan('),src.indexOf('function healing()')),results=[];
for(const cls of ['archer','occultist','mage']){
 const {C,e,b,ops}=await createFinale({profilePath,entryRound:14});ops.ready();ops.select(cls);ops.ready();const u=e.active;assert.equal(u.id,cls);const surface=()=>e.contactSurface(u.x,u.y-4,u.y+5)?.t.id;
 const state=()=>({x:u.x,y:u.y,hp:u.hp,focus:u.focus,move:u.moveLeft,support:surface(),round:b.round,actor:e.active.id});const before=state(),events=[];
 const walk=x=>{for(let i=0;i<200&&e.active===u&&u.moveLeft>100&&Math.abs(x-u.x)>15;i++){ops.move(Math.sign(x-u.x),C.STEP);ops.frame();}ops.ready();events.push({op:'walk',target:x,state:state()});};
 const goal=()=>splitDockRoleGoal(u,{support:surface(),foes:b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0),heroes:b.units.filter(v=>v.side===0&&!v.summoned&&!v.honroAct4Resident),surface:v=>e.contactSurface(v.x,v.y-4,v.y+5)?.t.id});
 const first=goal();assert(first);
 if(first.jumpLanding){walk(first.x);const accepted=ops.jump();for(let i=0;i<180;i++)ops.frame();ops.ready();events.push({op:'jump',accepted,state:state()});assert.equal(surface(),first.jumpLanding);walk(goal().x);}
 else walk(first.x);
 const live=JSON.stringify(b),actions=[];const choice=e.active===u?new Function('C','b','e','actions','evaluateLegalCast','evaluateInputTolerance','assert',body+';return plan();')(C,b,e,actions,evaluateLegalCast,evaluateInputTolerance,assert):null;assert.equal(JSON.stringify(b),live);
 assert.equal(e.active,u);assert.equal(b.round,14);assert(choice&&choice.score>0,'No useful safe firing choice after route');
 results.push({cls,before,events,after:state(),choice,rejected:actions});await writeFile(dir+'/split-route-probe.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.at(-1)));
}
