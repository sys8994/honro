import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createFinale} from './bootstrap.mjs';
import {evaluateLegalCast} from './legal-cast.mjs';
import {evaluateInputTolerance} from './input-tolerance.mjs';
const dir=process.argv[2];assert(dir);
const profilePath=dir+'/r20-overwatch-profile.json';await writeFile(profilePath,execFileSync('xz',['-dc',dir+'/browser/turn-profile-077.json.xz'],{maxBuffer:128e6}));
const src=await readFile(new URL('diagnostic-finishing.mjs',import.meta.url),'utf8'),body=src.slice(src.indexOf('function plan('),src.indexOf('function healing()'));
const results=[],wide=false;
for(const [name,distance] of [['hold-upper',0],['existing-left-connection',-380]]){
 const {C,e,b,ops}=await createFinale({profilePath,entryRound:20});ops.ready();const u=e.active;assert.equal(u.id,'archer');
 const before={x:u.x,y:u.y,hp:u.hp,move:u.moveLeft,round:b.round};let frames=0;
 while(distance&&frames<(wide?200:120)&&e.active===u&&u.moveLeft>100&&Math.abs(u.x-before.x)<Math.abs(distance)&&(!wide||e.contactSurface(u.x,u.y-4,u.y+5)?.t.id==='approved40-dock')){ops.move(Math.sign(distance),C.STEP);ops.frame();frames++;}
 ops.ready();const actions=[],live=JSON.stringify(b);
 const availability=[];const targets=b.units.filter(v=>v.side===1&&!v.dead&&Math.abs(v.y-u.y)<=600&&Math.hypot(v.x-u.x,v.y-u.y)<1400).sort((a,z)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(z.x-u.x,z.y-u.y)).slice(0,6);
 for(const id of u.loadout){const skill=C.SKILLS[id],rows=[];for(const t of targets.slice(0,5))for(const aim of e.shotSeeds(u,skill,t).slice(0,6)){const v=C.shotViable(e,u,skill,t,aim.angle,aim.power);rows.push({target:t.id,aim,afford:e.canAfford(skill,u,aim.power),ok:v.ok,reason:v.reason,risk:v.risk,firstHit:v.hit.unit,enemyDamage:v.enemyDamage,friendlyDamage:v.friendlyDamage});}availability.push({id,allowed:e.skillAllowed(skill,u),cooldown:e.cooldownLeft(u,id),rows});}
 const choice=e.active===u?new Function('C','b','e','actions','evaluateLegalCast','evaluateInputTolerance','assert',body+';return plan();')(C,b,e,actions,evaluateLegalCast,evaluateInputTolerance,assert):null;
 assert.equal(JSON.stringify(b),live);
 results.push({name,before,after:{x:u.x,y:u.y,hp:u.hp,move:u.moveLeft,round:b.round,active:e.active?.id,support:e.contactSurface(u.x,u.y-4,u.y+5)?.t.id},frames,focus:u.focus,availability,choice,rejected:actions});
 console.log(name,JSON.stringify(results.at(-1)));await writeFile(dir+'/overwatch-exit-probe.json',JSON.stringify(results,null,2));
}
