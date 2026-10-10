/** Bounded paired enemy-AI fixture. The listed player poses and isolated finite
 * wave are setup; all movement, aiming, turns and damage afterwards are native.
 * This does not claim normal arrival, a chapter clear or browser validation. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtimeParts} from '../shared/build.mjs';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {authorStage8Bier} from '../tools/map-forge/stage8-bier.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,original=structuredClone(g.HONRO_PROJECT),rows=[];
const sha=value=>createHash('sha256').update(value).digest('hex');
const provenance={sourceHash:sha(JSON.stringify(original)),runtimeSha256:sha((await runtimeParts({vector:false,render:false})).join('\n')),observedAt:new Date().toISOString()};
const sources=['stage8-first-seal','stage8-settled-crows','stage8-low-health'];
for(const source of sources)for(const roster of ['candidate28e5','density36e9']){
 g.HONRO_PROJECT=await authorStage8Bier(original,g,{roster,art:false});const q=battlefield(g,8),{b,e,app}=q;
 g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);
 const entry=b.honroStage8BierSpec.entries[source],action=b.honroEvents.find(ev=>ev.id===source).action;
 // Isolate exactly the original finite response, with no substitutes or HP
 // changes. The boss/end objective is outside this local response experiment.
 b.units=b.units.filter(u=>u.side===0);for(const t of b.terrain)if(t.honroSeal)t.broken=true;e.checkEnd=()=>false;
 const support=source==='stage8-first-seal'?'s8-ground':'s8-court',xs=source==='stage8-first-seal'?{archer:2585,mage:2780,knight:2680}:{archer:5840,mage:6060,knight:6180};
 for(const u of e.heroesAlive()){const p=g.HonroMapEngine.surfaceY(b.terrain,xs[u.cls],undefined,support);assert(p);Object.assign(u,{x:xs[u.cls],y:p.y,vx:0,vy:0});assert(C.validTerrainContactPose(b.terrain,u));}
 const members=entry.members||Array.from({length:action.n},(_,i)=>({kind:action.kind,x:entry.x+(i-(action.n-1)/2)*entry.spacing,y:entry.support?g.HonroMapEngine.surfaceY(b.terrain,entry.x+(i-(action.n-1)/2)*entry.spacing,entry.y,entry.support).y:entry.y,air:entry.air,support:entry.support}));
 // The shared exact-member spawn is opt-in in production. Explicitly opt this
 // isolated old-entry control in to use the same factory and safety check.
 b.honroEncounterDensityRevision=1;b.honroEncounterDensityPopulationCap=45;
 assert(g.HonroEncounterDensity.spawnMembers(app,action,{members}),source+' '+roster+' exact wave');
 for(const ev of b.honroEvents)b.honroState.flags['event:'+ev.id]=true;b.honroState.pendingEvents=[];
 const initial=b.units.map(u=>({id:u.id,side:u.side,kind:u.honroVariant||u.cls,x:u.x,y:u.y,hp:u.hp})),actions=[],damage=[],shots=[];
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const u=e.active,was=u?.acted,out=finish(...args);if(u?.side===1&&!was&&u.acted)actions.push({round:b.round,id:u.id,x:u.x,y:u.y,intent:u.intent});return out;};
 const hurt=e.hurt.bind(e);e.hurt=function(u,...args){const hp=u.hp,shield=u.shield||0,out=hurt(u,...args);if(hp>u.hp||shield>(u.shield||0))damage.push({round:b.round,id:u.id,side:u.side,owner:args[1],amount:hp-u.hp,shieldDamage:Math.max(0,shield-(u.shield||0))});return out;};
 const fire=e.fire.bind(e);e.fire=function(skill,angle,power,...args){const u=e.active,out=fire(skill,angle,power,...args);if(out&&u?.side===1)shots.push({round:b.round,id:u.id,skill,angle,power,x:u.x,y:u.y});return out;};
 let frames=0;while(actions.length<5&&frames<15000&&e.heroesAlive().length){if(e.canAct())e.wait();e.tick(C.STEP);frames++;}
 assert.equal(actions.length,5,'The paired window contains exactly five actual enemy actions');
 const row={source,roster,initial,frames,actions,shots,damage,heroDamage:damage.filter(d=>d.side===0).reduce((n,d)=>n+d.amount,0),heroShieldDamage:damage.filter(d=>d.side===0).reduce((n,d)=>n+d.shieldDamage,0),final:b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp}))};rows.push(row);console.log(JSON.stringify({source,roster,frames,actions:actions.length,shots:shots.length,heroDamage:row.heroDamage,heroShieldDamage:row.heroShieldDamage}));
}
await mkdir('_local/reports/encounter-density',{recursive:true});await writeFile('_local/reports/encounter-density/stage8-response-pressure.json',JSON.stringify({provenance,rows,scope:'Matched supported player-pose / isolated real finite-wave setup; production enemy turns, movement and live projectile damage. Not normal chapter completion.'},null,2)+'\n');
for(const source of sources){const old=rows.find(r=>r.source===source&&r.roster==='candidate28e5'),dense=rows.find(r=>r.source===source&&r.roster==='density36e9');assert(dense.heroDamage+dense.heroShieldDamage>0,source+' actually hits the guarding party');assert(dense.heroDamage+dense.heroShieldDamage>old.heroDamage+old.heroShieldDamage,source+' improves on the remote old entrance');}
console.log('PASS all three Stage8 finite responses hit HP or guarding shields within five natural enemy actions');
