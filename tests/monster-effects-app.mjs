/** Prepared canonical Stage5/8 encounters; production App save/Continue and
 * real engine input progression. Actor placement is a fixture, not chapter play. */
import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C}=h,rows=[];
for(const [stage,id,skill] of [[5,'s5-cave-shade','HSH02'],[8,'s8-15','HWD02']]){
 let a=h.load(h.profileThrough(stage-1));a.launch(stage);h.finish(a);let e=a.engine,b=e.b;
 assert.equal(b.honroMonsterEffectsRevision,1);assert.deepEqual(plain(b.units.filter(u=>u.honroMonsterEffectSkill).map(u=>[u.id,u.honroMonsterEffectSkill])),[[id,skill]]);
 const heroId='p-archer';let hero=e.unit(heroId),caster=e.unit(id);
 const x=caster.x+(stage===5?-160:150),surface=e.contactSurface(x,caster.y-100,caster.y+100);assert(surface);
 Object.assign(hero,{x,y:surface.y,vx:0,vy:0,acted:false,shield:0});assert(C.validTerrainContactPose(b.terrain,hero));
 // Isolate one existing controller, preserve quest actors and each hero identity.
 b.units=b.units.filter(u=>u.side===0||u.honroObjectiveTarget||u.id===id);caster.awake=true;caster.aggroUntil=999;
 Object.assign(b,{active:id,queue:[id],side:1,phase:'enemy'});caster.acted=false;caster.lastAct=b.round;e.refreshActivation();
 const tick=(until,max=2400)=>{for(let n=0;n<max&&!until();n++)e.tick(C.STEP);assert(until(),'bounded actual engine progression');};
 async function reload(label){a.export();const saved=await h.exported(),before=plain(b);a=h.load(saved);a.continue();e=a.engine;b=e.b;hero=e.unit(heroId);caster=e.unit(id);for(const key of Object.keys(before))assert.deepEqual(plain(b[key]),before[key],`${stage}/${label}: App Continue field ${key}`);a.export();await h.import(await h.exported());a.continue();e=a.engine;b=e.b;hero=e.unit(heroId);caster=e.unit(id);assert.deepEqual(plain(b),before,`${stage}/${label}: repeat file import Continue`);rows.push({stage,label,wholeBattleExact:true});}
 // Actual AI cadence, not manually installing a warning or effect.
 e.enemyAction();tick(()=>!!caster.enemyEffectCast);assert.equal(caster.enemyEffectCast.skill,skill);await reload('telegraph');
 tick(()=>b.side===0&&b.phase==='aim');assert(e.select(heroId));e.observeEnemyEffectWarning(id,caster.enemyEffectCast.serial);
 assert(caster.enemyEffectCast.offered);const hp=hero.hp,startX=hero.x;
 // Fire away from caster. Production projectiles/actions settle normally.
 assert(e.fire('A01',stage===5?170:10,.1));tick(()=>hero.acted);
 await reload('response-used');assert(caster.enemyEffectCast.responded);
 for(let n=0;n<10&&b.side===0;n++){if(e.canAct())e.wait();tick(()=>b.side!==0||b.phase==='aim');}
 tick(()=>!!hero.enemySoftBind||!!hero.enemyPush||!caster.enemyEffectCast);
 assert(hero.hp<hp,'pilot really impacts after normal response');assert(stage===5?hero.enemySoftBind:hero.enemyPush,'control really applied');
 await reload('active-control');
 if(stage===8){tick(()=>!hero.enemyPush);assert(hero.x!==startX,'gust moves on canonical safe court');assert(Math.abs(hero.x-startX)<=80.0001);assert(C.validTerrainContactPose(b.terrain,hero));await reload('push-ended');}
 else {tick(()=>b.side===0&&b.phase==='aim');assert(e.select(heroId));const before=hero.moveLeft;assert(before<=hero.maxMove*.55+.001);e.wait();tick(()=>hero.acted);assert(!hero.enemySoftBind);await reload('bind-expired');}
 // Legacy fixture removes only new opt-in state; Continue must not enable it.
 const legacy=plain(b);delete legacy.honroMonsterEffectsRevision;for(const u of legacy.units){for(const key of ['honroMonsterEffectSkill','enemyEffectCast','enemyEffectRecovery','enemyEffectCooldown','enemySoftBind','enemyPush','enemyControlGrace','enemyEffectHits'])delete u[key];}a.export();const profile=await h.exported();profile.honroBattle=legacy;a=h.load(profile);a.continue();assert.equal(a.engine.b.honroMonsterEffectsRevision,undefined);assert.deepEqual(plain(a.engine.b),legacy,'legacy whole battle stays unchanged');rows.push({stage,legacyExact:true});
}
await report('monster-effects-app',rows,{scope:'Canonical actor/placement fixtures; AI-selected warning then real fire/wait/ticks. Actual App export/import/Continue with DOM/storage/render doubles; not normal chapter completion or browser proof.'});
console.log('PASS monster effects actual App canonical pilot lifecycle and Continue',rows);
