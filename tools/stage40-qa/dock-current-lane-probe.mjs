/** Registered R6 hold/rear260/rear520 comparison. Native DOM/clock doubles,
 * normal saved-profile Continue and walking; read-only shot inspection only. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createFinale} from './bootstrap.mjs';
import {evaluateLegalCast} from './legal-cast.mjs';
import {evaluateInputTolerance} from './input-tolerance.mjs';
const out='/tmp/stage40-dock-current-lanes-41690685003';await mkdir(out,{recursive:true});
const input='tools/stage40-qa/records/41690685003-r6-mage-profile.json.xz';
const raw=execFileSync('xz',['-dc',input]);const profilePath=out+'/input.json';await writeFile(profilePath,raw);
const saved=JSON.parse(raw),src=await readFile(new URL('diagnostic-finishing.mjs',import.meta.url),'utf8');
const body=src.slice(src.indexOf('function plan('),src.indexOf('function healing()'));
const rows=[];
for(const distance of [0,-260,-520]){
 const {C,e,b,ops,app,g}=await createFinale({profilePath,entryRound:6});
 function ready(){ops.ready();ops.frame();for(let i=0;i<360&&(g.HonroStory.turnPaused(app,ops.now)||!e.grounded(e.active));i++)ops.frame();assert(!g.HonroStory.turnPaused(app,ops.now)&&e.grounded(e.active));}
 ready();assert.equal(e.active.id,'mage');const u=e.active,surface=v=>e.contactSurface(v.x,v.y-4,v.y+5)?.t.id;
 const pose=()=>({round:b.round,active:e.active?.id,x:u.x,y:u.y,hp:u.hp,move:u.moveLeft,support:surface(u),facing:u.facing});const before=pose();assert.equal(before.support,'approved40-dock');
 const goal=u.x+distance;for(let i=0;distance&&i<320&&e.active===u&&u.moveLeft>100&&Math.abs(u.x-goal)>15;i++){ops.move(Math.sign(goal-u.x),C.STEP);ops.frame();}ready();
 assert.equal(b.round,6);assert.equal(e.active,u);assert.equal(u.hp,before.hp);assert.equal(surface(u),'approved40-dock');
 const live=JSON.stringify(b),pe=new C.Engine(JSON.parse(live),()=>{},true),pu=pe.unit(u.id),actions=[];
 const targets=pe.b.units.filter(v=>v.side===1&&!v.dead&&Math.abs(v.y-pu.y)<=600&&Math.hypot(v.x-pu.x,v.y-pu.y)<1400).sort((a,z)=>Math.hypot(a.x-pu.x,a.y-pu.y)-Math.hypot(z.x-pu.x,z.y-pu.y)).slice(0,6);
 const availability=pu.loadout.map(id=>{const skill=C.SKILLS[id],shots=[];for(const t of targets.slice(0,5))for(const aim of pe.shotSeeds(pu,skill,t).slice(0,6)){const v=C.shotViable(pe,pu,skill,t,aim.angle,aim.power);shots.push({target:t.id,angle:aim.angle,power:aim.power,afford:pe.canAfford(skill,pu,aim.power),ok:v.ok,reason:v.reason,risk:v.risk,firstHit:v.hit.unit,enemyDamage:v.enemyDamage,friendlyDamage:v.friendlyDamage});}return{id,allowed:pe.skillAllowed(skill,pu),cooldown:pe.cooldownLeft(pu,id),shots};});
 const query=new Function('C','b','e','actions','evaluateLegalCast','evaluateInputTolerance','assert','facing',body+';return plan(facing);');
 const faced=query(C,b,e,actions,evaluateLegalCast,evaluateInputTolerance,assert,u.facing);
 const unrestricted=distance===0?query(C,b,e,actions,evaluateLegalCast,evaluateInputTolerance,assert,null):null;
 assert.equal(JSON.stringify(b),live,'Inspection changed live battle');
 rows.push({distance,savedMage:saved.honroBattle.units.find(v=>v.id==='mage'),before,after:pose(),availability,faced,unrestricted,rejected:actions});
 await writeFile(out+'/result.json',JSON.stringify({scope:'Native normal walking and read-only availability; no actual shots, enemy response or whole-stage acceptance',rows},null,2));
 console.log(JSON.stringify({distance,before,after:pose(),faced:faced&&{id:faced.id,score:faced.score,angle:faced.angle,power:faced.power},unrestricted:unrestricted&&{id:unrestricted.id,score:unrestricted.score}}));
}
