// Real Act2 archetype/configuration, focused insertion fixtures. Not campaign play.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {runtimeParts} from '../shared/build.mjs';
const g=vm.createContext({console,performance,structuredClone,setTimeout,clearTimeout,matchMedia:()=>({matches:false}),document:{querySelector:()=>null}});g.window=g;
for(const source of await runtimeParts({vector:false,render:false}))vm.runInContext(source,g);
const map=g.HONRO_PROJECT.stages[15],b=g.HonroMaps.createBattle(map,g.HONRO_PROJECT);g.HonroStageRules.sanitizeStageBattle(b);
const e=new g.HONRO_CORE.Engine(b,()=>{},true),stage=g.HONRO_CONTENT.stages[15],C=g.HonroReinforcementCamera;
const scene={x:300,y:900,scale:.65,manual:true,size:()=>({w:1280,h:800}),canvas:{getBoundingClientRect:()=>({top:0})}};
C.prime(scene,b);const initial=new Set(b.units.map(u=>u.id)),added=[];
for(const [i,kind]of ['resonance','echo','bellCluster','monkVessel'].entries()){
 const u=g.HonroWorld.createEnemy(b,stage,2200+i*400,kind,500+i,1100,true);u.id='camera-combat-'+kind;
 assert(u.honroSpirit&&u.spiritHidden&&u.hp>0&&!u.dead);assert(u.existenceDefense.soul>u.existenceDefense.form,'actual combat defence contract');b.units.push(u);added.push(u);
}
const before=JSON.stringify(b);assert(C.update(scene,e,1280,800,0));C.update(scene,e,1280,800,420);assert(scene.x>2000,'targets the new combat spirit group, not any old unit');
for(const u of added){assert(!initial.has(u.id));const x=(u.x-scene.x)*scene.scale+640,y=(u.y-scene.y)*scene.scale+400;assert(x>0&&x<1280&&y>0&&y<800);}
assert.equal(JSON.stringify(b),before,'camera never rewrites spirit combat/visibility state');
g.HonroAct2.expose(b,b.round+3);assert(added.every(u=>u.manifested&&u.revealSpiritToParty));assert(C.update(scene,e,1280,800,500));
C.update(scene,e,1280,800,1500);C.update(scene,e,1280,800,1920);assert.equal(scene.x,300);assert.equal(scene.manual,true);
// A presentation-only spirit and a staging-hidden (absent) actor cannot start
// a shot or borrow a nearby combat enemy as fallback.
const visual=g.HonroWorld.createEnemy(b,stage,3000,'resonance',600,1100,true);Object.assign(visual,{id:'camera-visual-spirit',honroVisualOnly:true});b.units.push(visual);
const absent=g.HonroWorld.createEnemy(b,stage,3400,'echo',601,1100,true);b.honroStaging??={};b.honroStaging.hidden={absent};assert.equal(C.update(scene,e,1280,800,2000),false);
console.log('PASS production combat spirits: resonance/echo/bellCluster/monkVessel, hidden and exposed, group bounds/return, visual-only/absent exclusion; no battle mutation');
