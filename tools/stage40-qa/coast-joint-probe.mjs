/** One normal continuation of actual R4 archer save through remaining three roles. */
import assert from 'node:assert/strict';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {execFileSync} from 'node:child_process';
import {createFinale} from './bootstrap.mjs';import {evaluateLegalCast} from './legal-cast.mjs';import {evaluateInputTolerance} from './input-tolerance.mjs';import {coastFlankGoal} from './coast-flank-route.mjs';
const out='/tmp/stage40-coast-joint';await mkdir(out,{recursive:true});const profilePath=out+'/input.json';await writeFile(profilePath,execFileSync('xz',['-dc','tools/stage40-qa/records/41646946262-turn-013.json.xz']));
const {C,e,b,ops,app,g}=await createFinale({profilePath,entryRound:4});
function ready(){ops.ready();ops.frame();for(let i=0;i<360&&(g.HonroStory.turnPaused(app,ops.now)||!e.grounded(e.active));i++)ops.frame();assert(!g.HonroStory.turnPaused(app,ops.now)&&e.grounded(e.active),'Readiness bound');}
const source=await readFile(new URL('diagnostic-finishing.mjs',import.meta.url),'utf8'),body=source.slice(source.indexOf('function plan('),source.indexOf('let failure=')),heroes=()=>b.units.filter(v=>v.side===0&&!v.summoned&&!v.honroAct4Resident),surface=v=>e.contactSurface(v.x,v.y-4,v.y+5)?.t.id;
const state=()=>({round:b.round,active:e.active.id,heroes:heroes().map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead,move:v.moveLeft,facing:v.facing})),foes:b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0).map(v=>({id:v.id,hp:v.hp})),report:structuredClone(b.honroReport)});
function plan(){const live=JSON.stringify(b),actions=[],choice=new Function('C','b','e','actions','evaluateLegalCast','evaluateInputTolerance','assert','heroes',body+';return healing()||plan(e.active.facing);')(C,b,e,actions,evaluateLegalCast,evaluateInputTolerance,assert,heroes);assert.equal(JSON.stringify(b),live);return{choice,rejected:actions};}
const rows=[];ready();const initial=state();
for(const actor of ['archer','mage','occultist']){
 assert.equal(b.round,4);if(e.active.id!==actor)ops.select(actor);ready();const u=e.active;assert.equal(u.id,actor);const before=state();let p=plan(),goal=null;
 if(!p.choice){goal=coastFlankGoal(u,{support:surface(u),foes:b.units.filter(v=>v.side===1&&!v.dead&&v.hp>0),heroes:heroes(),surface,topAt:C.topAt,terrains:b.terrain});if(goal){for(let i=0;i<320&&e.active===u&&u.moveLeft>100&&Math.abs(u.x-goal.x)>15;i++){ops.move(Math.sign(goal.x-u.x),C.STEP);ops.frame();}ready();p=plan();}}
 const positioned=state();let accepted=false;
 if(p.choice)accepted=ops.fire(p.choice.id,p.choice.angle,p.choice.power);else accepted=ops.defend();
 assert(accepted,'Actual App action rejected');for(let i=0;i<5000&&(e.active===u||!app.canInput());i++)ops.frame();ready();rows.push({actor,before,goal,positioned,choice:p.choice,rejected:p.rejected,after:state()});await writeFile(out+'/result.json',JSON.stringify({initial,rows},null,2));console.log(actor,b.round,p.choice?.id||'defend');
}
assert.equal(b.round,5);console.log('One joint native R4 remaining-role continuation reached R5; inspect all outcomes, not whole-stage approval.');
