/** Isolated net-open/anchor-stable Stage39 route with the real movement owner.
 * Initial rescue conditions and the archer's test pose are explicit fixtures. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {readWorldSource} from '../tools/act4-source/world-source.mjs';
import {supportPoint} from '../shared/act4-finale-revision.mjs';
import {authorAct4Stage39} from '../shared/act4-stage39-author.mjs';

process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g,C=g.HONRO_CORE;
const profile=h.profileThrough(38);
profile.settings.difficulty='story';
const app=h.load(profile);
g.HonroApp=app;
g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
g.HONRO_ACT4_PILOT_COMBAT_REFERENCE=JSON.parse(await readFile('shared/data/act4/pilot-combat-reference.json','utf8'));
for(const name of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-pilot-combat']){
 vm.runInContext(await readFile(`shared/runtime/${name}.js`,'utf8'),g);
}
const P=g.HonroAct4TerrainPreview;
const original=JSON.parse((await readWorldSource()).bytes).stages.find(s=>s.metadata.stageId===39);
const amended=authorAct4Stage39(original,supportPoint),guardId='a4-39-n-1';
assert.notEqual(amended,original);
assert.equal(authorAct4Stage39(amended,supportPoint),amended);
assert.deepEqual(amended.units.filter(u=>u.id!==guardId),original.units.filter(u=>u.id!==guardId));
assert.deepEqual(amended.encounters,original.encounters);
assert.deepEqual(amended.design.act4,original.design.act4);
assert.equal(amended.design.act4.rescue.bossRequired,false);

function mount(stage){
 const b=g.HonroMaps.createBattle(stage,g.HONRO_PROJECT,plain(app.profile),{origin:'campaign'});
 const e=new C.Engine(b,()=>{});
 app.engine=e;
 app.stage={...g.HONRO_CONTENT.stages[38]};
 app.dialogue=null;
 const q=P.previewMemory(b);
 Object.assign(b,{phase:'aim',side:0,round:3,active:'archer'});
 q.exitStable={sourceRun:b.session,actor:'mage',once:true};
 q.netOpen={sourceRun:b.session,actor:'occultist'};
 return {b,e,q};
}

function escort({b,e,q},rounds){
 for(let round=0;round<rounds;round++){
  for(let frame=0;frame<175;frame++){
   q.clock+=.025;
   P.coastObserve(app,.025);
   e.stepUnits(.025);
  }
  b.round++;
 }
}

const old=mount(original),oldGuard=old.e.unit(guardId);
const oldStats=[oldGuard.hp,oldGuard.attack,oldGuard.armor,oldGuard.r,oldGuard.h,plain(oldGuard.loadout)];
escort(old,4);
assert.equal(old.q.rescued.ids.length,4);
const resumed=new C.Engine(plain(old.b),()=>{});
assert.equal(resumed.unit(guardId).x,4860,'the original saved guard retains its authored position');

const current=mount(amended),{b,e,q}=current,guard=e.unit(guardId);
assert.deepEqual([guard.hp,guard.attack,guard.armor,guard.r,guard.h,plain(guard.loadout)],oldStats);
assert(e.grounded(guard));
assert(g.HonroTerrain.separated(b,guard,guard.x,guard.y,12));
escort(current,4);
assert(!q.rescued);
assert(e.unit('a4-rescue-3').x>3919.5&&e.unit('a4-rescue-3').x<guard.x);

// A normal line from the relocated guard can actually hit the lower route.
const hero=e.unit('archer');
Object.assign(hero,supportPoint(amended,'approved39-wreck-deck',4180),{vx:0,vy:0,acted:false});
e.refreshActivation();
assert(guard.awake);
assert.equal(C.targetFor(e,guard)?.id,hero.id);
const shot=C.chooseEnemyShot(e,guard,hero,guard.loadout.map(id=>C.SKILLS[id]));
assert(shot);
const hp=hero.hp;
Object.assign(b,{phase:'enemy',side:1,active:guardId});
assert(e.fire(shot.skill.id,shot.aim.angle,shot.aim.power,true));
for(let i=0;i<1000&&b.projectiles.length;i++){
 for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);
}
assert(hero.hp<hp);

// Prepared clearance of the local blocker resumes the same physical route.
// All other threats, including the optional wreck, stay alive.
Object.assign(guard,{dead:true,hp:0});
Object.assign(hero,{x:hero.spawnX,y:hero.spawnY});
Object.assign(b,{phase:'aim',side:0,active:hero.id,volley:undefined});
app.dialogue=null;
escort(current,5);
assert.equal(q.rescued.ids.length,4);
assert(e.unit('a4-wreck').hp>0&&!e.unit('a4-wreck').dead);
assert(!q.complete,'safe civilians still require the original exit interaction');
console.log('PASS Stage39 real rescue route blocked by a supported guard, live guard attack, ordinary rescue after local clearance with wreck alive, and original snapshot preserved.');
