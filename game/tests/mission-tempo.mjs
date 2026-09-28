import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {runtime,battlefield,gameRoot} from './helpers.mjs';
const g=await runtime(),C=g.HONRO_CORE,checks=[];
const check=(name,fn)=>{checks.push({name,passed:true,detail:fn()});};
for(const skill of Object.values(C.SKILLS).filter(s=>s.mode.startsWith('honro')))check(`${skill.name}: short miss lifetime and unchanged trajectory`,()=>{
 const {b,e}=battlefield(g,2),u=e.active;b.width=20000;b.height=10000;b.terrain=[];b.sceneVersion++;Object.assign(u,{side:1,x:10000,y:5000,focus:999,loadout:[skill.id]});b.units=[u];e.fire(skill.id,45,.5,true);
 const initial=structuredClone(b.projectiles[0]),p=b.projectiles[0];for(let i=0;i<120;i++)e.stepProjectile(p,C.STEP,true);const ref={x:p.x,y:p.y,vx:p.vx,vy:p.vy};
 b.projectiles=[structuredClone(initial)];const q=b.projectiles[0];for(let i=0;i<60;i++)e.stepProjectile(q,C.STEP);for(const key of Object.keys(ref))assert.ok(Math.abs(ref[key]-q[key])<1e-7,key);
 let frames=60;while(b.projectiles.length&&frames<1000){e.stepProjectile(q,C.STEP);frames++;}assert.ok(frames*C.STEP<=3.01);return {secondsAt1x:frames*C.STEP,secondsAt4x:frames*C.STEP/4};
});
for(let id=1;id<=10;id++)check(`stage ${id}: authored objective can be completed by its intended state`,()=>{
 const {b,e,st}=battlefield(g,id);g.HonroEncounters.configure(b);const before=g.HonroObjectives.state(b,st);assert.equal(before.complete,false);if(id!==4)assert.ok(before.targets.length||id===3);
 for(const [who,text,meta] of g.HonroObjectives.briefings[id]||[]){assert.notEqual(who,'길 위의 기록');assert.ok(text.length>8);if(meta?.focus)assert.ok(before.allTargets.some(t=>t.kind===meta.focus),`${id}:${meta.focus}`);}
 for(const event of b.honroEvents)b.honroState.flags['event:'+event.id]=true;
 for(const u of b.units)if(u.side===1){u.dead=true;u.hp=0;}
 if(id===1)e.active.x=st.w-100;
 if(id===2)b.units.find(u=>u.id==='objective').x=b.honroEscortGoalX;
 if(id===3)b.honroState.ledger=true;
 if(id===4)b.round=(st.holdRounds||6)+2;
 if(id===5)for(const t of b.terrain)if(t.honroSeal)t.broken=true;
 if(id===6){b.honroState.rescued=true;b.units.find(u=>u.id==='objective').x=st.w-100;}
 if(id===7)b.honroState.rescuedCount=3;
 if(id===8){for(const t of b.terrain)if(t.honroSeal)t.broken=true;const boss=b.units.find(u=>u.id==='boss');boss.dead=true;boss.hp=0;}
 if(id===9)b.honroState.receivers=2;
 if(id===10){b.honroState.sodanCoop=true;b.honroState.coopHold=2;}
 assert.equal(g.HonroObjectives.state(b,st).complete,true);return {initial:before.summary,targets:before.targets.map(t=>t.label)};
});
check('Stage 2 RC12 is wider and lower while preserving elevated overwatch',()=>{const {b}=battlefield(g,2);assert.equal(b.width,4300);assert.equal(b.height,4000);const archer=b.units.find(u=>u.side===0&&u.cls==='archer'),bier=b.units.find(u=>u.id==='objective');assert.ok(bier.y-archer.y>900);assert.ok(b.width>b.height);return {width:b.width,height:b.height,verticalSeparation:+(bier.y-archer.y).toFixed(0)};});
check('Stage 10 cannot complete before Sodan cooperates and both receiving arrays have done their job',()=>{const {b,st}=battlefield(g,10);for(const u of b.units)if(u.side===1&&u.id!=='boss'){u.dead=true;u.hp=0;}for(const ev of b.honroEvents)b.honroState.flags['event:'+ev.id]=true;b.honroState.receivers=2;assert.equal(g.HonroObjectives.state(b,st).complete,false);b.honroState.sodanCoop=true;b.honroState.coopHold=2;const boss=b.units.find(u=>u.id==='boss');boss.side=2;assert.equal(g.HonroObjectives.state(b,st).complete,true);});
await writeFile(gameRoot+'/../_local/game-reports/mission-tempo.json',JSON.stringify({checks},null,2)+'\n');console.log(`${checks.length} mission and enemy-flight checks passed`);
