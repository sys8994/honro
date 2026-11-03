/** Isolated explicit combat fixtures. Production engine and monster definitions;
 * no campaign completion, browser rendering, or normal-play claim. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {buildCore} from '../game/engine/build.mjs';
export const plain=x=>JSON.parse(JSON.stringify(x));
export const solid=(id,x,y,w,h,extra={})=>({id,x,y,w,h,mat:'rock',hp:99999,maxHp:99999,indestructible:true,...extra});
export async function monsterCore(){
 const g=vm.createContext({console,performance,structuredClone});
 vm.runInContext(await buildCore()+"\nglobalThis.MonsterEffectsTestAPI=load('enemyEffects');",g);
 vm.runInContext(await readFile('shared/runtime/world.js','utf8'),g);
 return {C:g.HONRO_CORE,E:g.MonsterEffectsTestAPI,g};
}
export function arena(C,skill='HSH02',{revision=true}={}){
 const b=C.createBattle(1,C.defaults(),'skirmish',{wind:0});
 const hero=C.makeUnit('archer',0,650,800,{id:'hero',hp:10000,maxHp:10000,armor:0,attack:1,loadout:['A01'],focus:999,maxFocus:999});
 const friend=C.makeUnit('knight',0,950,800,{id:'friend',hp:10000,maxHp:10000,loadout:['S01','S15'],focus:999,maxFocus:999});
 const caster=C.makeUnit(skill==='HSH02'?'occultist':'knight',1,350,800,{id:'caster',hp:10000,maxHp:10000,armor:0,attack:1,loadout:[skill],honroMonsterEffectSkill:skill,awake:true});
 Object.assign(b,{width:1600,height:1200,units:[hero,friend,caster],terrain:[solid('floor',0,800,1600,400)],waters:[],fields:[],zones:[],stakes:[],drafts:[],projectiles:[],wind:0,active:hero.id,side:0,phase:'aim',queue:[caster.id],events:[]});
 if(revision)b.honroMonsterEffectsRevision=1;
 const events=[],e=new C.Engine(b,event=>events.push(event));
 return {b,e,hero,friend,caster,events};
}
export function turn(q,u){q.b.active=u.id;q.b.side=u.side;q.b.phase=u.side===0?'aim':'enemy';u.acted=false;}
export function warning(E,q){turn(q,q.caster);assert(E.prepareEnemyEffect(q.e,q.caster,q.caster.loadout[0],q.hero,35,.5));assert(q.caster.enemyEffectCast);return q.caster.enemyEffectCast;}
export function attack(E,q){
 let projectile;const hurt=q.e.hurt.bind(q.e);q.e.hurt=(...args)=>{if(args[4]?.enemyEffectAttack)projectile=args[4];return hurt(...args);};
 const c=warning(E,q);turn(q,q.hero);assert(q.e.observeEnemyEffectWarning(q.caster.id,c.serial));assert(c.offered);assert(q.e.fire('A01',85,.1));q.e.finishAction(true);assert(c.responded);
 q.b.teamEnds[0]=c.createdTeamEnd+1;turn(q,q.caster);assert(E.resolveEnemyEffect(q.e,q.caster));
 q.e.hurt=hurt;assert(projectile,'prepared warning resolves through production hurt');return projectile;
}
export function hit(q,p,target=q.hero){const hp=target.hp;q.e.hurt(target,20,q.caster.id,true,p,{x:target.x,y:target.y-target.h/2});return hp-target.hp;}
