/** Exact captured birth replay under ordinary defend input. A diagnostic, not a
 * fresh campaign playthrough, browser proof, or all-six tactical quality gate. */
import assert from 'node:assert/strict';import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {runtimeParts} from '../shared/build.mjs';
import {appHarness,plain} from './app-regression-helpers.mjs';
const hash=v=>createHash('sha256').update(v).digest('hex');
const source={commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dirty:execFileSync('git',['status','--short'],{encoding:'utf8'}).trim(),enemyAI:hash(await readFile('shared/engine/src/enemyAI.ts')),runtime:hash((await runtimeParts({vector:false,render:false})).join('\n')),controller:hash(await readFile(new URL(import.meta.url)))};
const f=JSON.parse(await readFile('tests/fixtures/stage5-enemy-standoff.json','utf8')),h=await appHarness(),{g,C}=h;
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);g.HonroScene.prototype.render=function(){};
let frame=f.birth.frame,now=frame*1000/60;g.performance={now:()=>now};
const profile=plain(f.profile);profile.honroBattle=plain(f.birth.battle);profile.heroes=plain(f.birth.battle.heroes);profile.honroGrowth=plain(f.birth.battle.honroGrowth.ledger);
const app=h.load(profile);app.continue();const e=app.engine,b=e.b;assert.deepEqual(plain(b),f.birth.battle);
const fires=[],hits=[],ends=[],inputs=[],starts=[],wave=u=>u?.honroSpawnSource==='lower-beasts';
const fire=e.fire.bind(e);e.fire=(skill,angle,power,...args)=>{const u=e.active,target=C.targetFor(e,u),row={frame,round:b.round,actor:u.id,skill,angle,power,x:u.x,y:u.y,moveLeft:u.moveLeft,target:target?.id,viability:target?plain(C.shotViable(e,u,C.SKILLS[skill],target,angle,power)):null};const accepted=fire(skill,angle,power,...args);if(wave(u))fires.push({...row,accepted});return accepted;};
const hurt=e.hurt.bind(e);e.hurt=(u,...args)=>{const hp=u.hp,shield=u.shield,r=hurt(u,...args);if(wave(e.unit(args[1]))&&(u.hp<hp||u.shield<shield))hits.push({frame,round:b.round,target:u.id,side:u.side,owner:args[1],hp:hp-u.hp,shield:shield-u.shield});return r;};
const action=e.enemyAction.bind(e);e.enemyAction=()=>{const u=e.active;if(wave(u)&&!starts.some(v=>v.actor===u.id&&v.round===b.round))starts.push({frame,round:b.round,actor:u.id,x:u.x,y:u.y,moveLeft:u.moveLeft});return action();};
const finish=e.finishAction.bind(e);e.finishAction=(...args)=>{const u=e.active;if(wave(u)&&!ends.some(v=>v.actor===u.id&&v.round===b.round)){const overlaps=b.units.filter(v=>v.id!==u.id&&!v.dead&&Math.abs(v.x-u.x)<v.r+u.r&&u.y>v.y-v.h&&u.y-u.h<v.y).map(v=>v.id);ends.push({frame,round:b.round,actor:u.id,x:u.x,y:u.y,moveLeft:u.moveLeft,intent:u.intent,overlaps,battle:plain(b)});}return finish(...args);};
const until=Number(process.env.HONRO_STANDOFF_UNTIL||28);
for(let i=0;i<24000&&b.round<until&&!['won','lost'].includes(b.phase);i++){
 if(app.dialogue)g.HonroStory.next(app);now+=1000/60;app.frame(now);frame++;assert(!app.lastError,app.lastError);
 if(app.canInput()){inputs.push({frame,round:b.round,actor:e.active.id,kind:'defend'});app.defend();}
}
const checks={boundaryReached:b.round===until,allSixObserved:new Set(ends.map(v=>v.actor)).size===6,clearActualEnds:ends.every(v=>!v.overlaps.length),acceptedWaveFire:fires.some(v=>v.accepted),unchangedShotSafety:fires.filter(v=>v.accepted).every(v=>v.viability.ok),partyEffect:hits.some(v=>v.side===0&&(v.hp>0||v.shield>0)),sourceUnchanged:source.runtime===hash((await runtimeParts({vector:false,render:false})).join('\n'))};
const summary=Object.fromEntries(f.birth.battle.units.filter(wave).map(u=>[u.id,{turns:ends.filter(v=>v.actor===u.id).length,acceptedFires:fires.filter(v=>v.actor===u.id&&v.accepted).length,partyEffects:hits.filter(v=>v.owner===u.id&&v.side===0),firstEffect:hits.find(v=>v.owner===u.id&&v.side===0)||null}]));
const out=process.env.HONRO_STANDOFF_OUT||'_local/reports/stage5-enemy-standoff';await mkdir(out,{recursive:true});
const report={scope:'Exact captured natural birth replay with ordinary defend input; not fresh normal play or all-six quality acceptance',source,checks,startFrame:f.birth.frame,frame,until,stop:b.round===until?'Reached requested round boundary':['won','lost'].includes(b.phase)?'Battle terminal state':'Frame observation limit',summary,fires,hits,ends,inputs,starts,final:plain(b)};
await writeFile(out+'/replay.json',JSON.stringify(report,null,2));console.log(JSON.stringify({frame,until,summary,fires,hits,ends:ends.map(({battle,...v})=>v)},null,2));

// Preserve raw failed observations too; an artifact is not itself a passing gate.
for(const [name,passed] of Object.entries(checks))assert(passed,name);
