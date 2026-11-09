import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {buildCore} from '../game/engine/build.mjs';
import {commandRoute} from './stage11-ravine-command-helpers.mjs';
const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);const C=g.HONRO_CORE;
const record=JSON.parse(await readFile('shared/data/act2/stage11-compact-package.json','utf8')),c=record.stage,rows=[];
function fixture(c,cls,start){
 const p=C.defaults();p.recruited=[cls];p.party=[cls];p.heroes[cls]=C.freshHero(cls);p.heroes[cls].xp=C.xpAtLevel(10);
 const b=C.createBattle(1,p,'campaign',{party:[cls]});
 b.width=c.width;b.height=c.height;b.honroStage=11;b.honroCustom=true;b.honroMapOrigin='workshop';b.physics=C.makePhysics();
 b.terrain=c.terrains.map(t=>{const xs=t.points.map(p=>p.x),ys=t.points.map(p=>p.y);return{id:t.id,x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys),vertices:structuredClone(t.points),mat:'rock',hp:999999,maxHp:999999,indestructible:true,oneWay:t.oneWay,route:true};});
 const u=C.makeUnit(cls,0,start.x,start.y,{id:'p-'+cls,h:92,r:22,loadout:[C.baseSkill(cls)],equipmentIds:[]});C.applyHero(u,p.heroes[cls],true);b.units=[u];b.active=u.id;b.fields=[];b.waters=[];b.drafts=[];b.decor=[];b.zones=[];b.projectiles=[];b.phase='aim';b.side=0;b.round=1;b.queue=[];
 const e=new C.Engine(b,()=>{},false);e.checkEnd=()=>false;return{b,e,u};
}
for(const route of c.design.compact11.verticalRoutes.routes)for(const cls of ['archer','mage','knight','occultist']){
 const q=fixture(c,cls,route.anchors[0]);const result=commandRoute(g,q,q.u,route.anchors);
 const clearance=route.anchors.every(p=>C.validTerrainContactPose(q.b.terrain,{...q.u,x:p.x,y:p.y}));
 const save=JSON.parse(JSON.stringify(q.b)),restored=new C.Engine(save,()=>{},false);restored.checkEnd=()=>false;
 const u=save.units[0];assert.deepEqual([u.x,u.y],[q.u.x,q.u.y]);assert.deepEqual(save.terrain,q.b.terrain);
 const before=u.hp,accepted=restored.drop(u);let frames=0;while(u.platformDrop&&frames++<2000)restored.tick(C.STEP);
 const support=restored.surface(u.x,u.y-5,u.y+5)?.t?.id;
 const row={route:route.id,cls,...result,clearance,saveRestored:true,drop:{accepted,frames,support,damage:before-u.hp,x:u.x,y:u.y,grounded:restored.grounded(u)}};
 rows.push(row);console.log(JSON.stringify(row));
}
await mkdir('_local/reports/stage11-verticality',{recursive:true});await writeFile('_local/reports/stage11-verticality/movement.json',JSON.stringify(rows,null,2)+'\n');
assert(rows.every(r=>r.passed&&r.clearance&&r.drop.accepted&&r.drop.grounded&&r.drop.damage===0&&r.drop.support==='compact-floor'));
// Separate empty-lane combat fixtures: real prediction/fire/projectile steps,
// not encounter victory or normal-turn campaign pacing.
const shots=[];
for(const [id,start,target] of [
 ['north-edge',{x:4520,y:1597.2},{x:4290,y:1809.8181818181818}],
 ['lower-to-neck',{x:2760,y:2378.285714285714},{x:2690,y:2220.5714285714284}]
]){
 const q=fixture(c,'archer',start),enemy=C.makeUnit('archer',1,target.x,target.y,{id:'target-'+id,h:92,r:22});q.b.units.push(enemy);
 let found=null;
 for(const power of [.2,.35,.5,.65,.8,1]){for(let angle=95;angle<=265;angle+=1){q.u.facing=-1;const hit=q.e.predict(q.u,C.SKILLS.A01,angle,power,enemy,false);if(hit.unit===enemy.id){found={angle,power};break;}}if(found)break;}
 assert(found,'Expected real shot from '+id);
 const hp=enemy.hp;assert(q.e.fire('A01',found.angle,found.power));let ticks=0;
 while(q.b.projectiles.length&&ticks++<3600)for(const projectile of [...q.b.projectiles])if(q.b.projectiles.includes(projectile))q.e.stepProjectile(projectile,C.STEP);
 shots.push({id,...found,damage:hp-enemy.hp,ticks});assert(enemy.hp<hp);
}
await writeFile('_local/reports/stage11-verticality/shots.json',JSON.stringify(shots,null,2)+'\n');console.log(JSON.stringify({shots}));
