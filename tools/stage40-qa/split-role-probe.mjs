import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createFinale} from './bootstrap.mjs';
import {evaluateLegalCast} from './legal-cast.mjs';
import {evaluateInputTolerance} from './input-tolerance.mjs';
const dir=process.argv[2];assert(dir);
const profilePath=dir+'/r14-start-profile.json';await writeFile(profilePath,execFileSync('xz',['-dc',dir+'/browser/turn-profile-040.json.xz'],{maxBuffer:128e6}));
const src=await readFile(new URL('diagnostic-finishing.mjs',import.meta.url),'utf8'),body=src.slice(src.indexOf('function plan('),src.indexOf('function healing()')),results=[];
for(const cls of ['archer','occultist']){
 const {C,e,b,ops}=await createFinale({profilePath,entryRound:14});ops.ready();ops.select(cls);ops.ready();const u=e.active;assert.equal(u.id,cls);const surface=()=>e.contactSurface(u.x,u.y-4,u.y+5)?.t.id;
 const state=()=>({x:u.x,y:u.y,hp:u.hp,focus:u.focus,move:u.moveLeft,support:surface(),round:b.round,actor:e.active.id});const before=state(),events=[];
 const walk=x=>{for(let i=0;i<200&&e.active===u&&u.moveLeft>100&&Math.abs(x-u.x)>15;i++){ops.move(Math.sign(x-u.x),C.STEP);ops.frame();}ops.ready();events.push({op:'walk',target:x,state:state()});};
 if(cls==='archer'){walk(1900);const accepted=ops.jump();for(let i=0;i<180;i++)ops.frame();ops.ready();events.push({op:'jump',accepted,state:state()});if(surface()==='approved40-dock-stair')walk(2120);}
 else walk(1050);
 const live=JSON.stringify(b),actions=[];const choice=e.active===u?new Function('C','b','e','actions','evaluateLegalCast','evaluateInputTolerance','assert',body+';return plan();')(C,b,e,actions,evaluateLegalCast,evaluateInputTolerance,assert):null;assert.equal(JSON.stringify(b),live);
 results.push({cls,before,events,after:state(),choice,rejected:actions});await writeFile(dir+'/split-role-probe.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results.at(-1)));
}
