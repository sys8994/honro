import assert from 'node:assert/strict';
import vm from 'node:vm';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtimeParts} from '../shared/build.mjs';
import {cheonroeArena} from './cheonroe-fixture.mjs';
const g=vm.createContext({console,performance,structuredClone});for(const s of await runtimeParts({vector:false,render:false}))vm.runInContext(s,g);
const C=g.HONRO_CORE,near=(a,b)=>assert(Math.abs(a-b)<1e-7,`${a} != ${b}`),rows=[];
const rays=f=>f.events.filter(ev=>ev.name==='lightningBolt');
function originalCenter(f){const point=f.p.targetPoint,start={x:point.x,y:Math.min(-170,point.y-600)},h=f.e.projectileCollision(start,point,3,f.p.owner,[],false);return h?{x:h.x,y:h.y}:point;}
function originalStrike(f){const end=originalCenter(f);f.e.blast(end.x,end.y,f.p.blast,f.p.damage,f.p.owner,false,f.p);f.e.remove(f.p);}
function check(f,label){f.impact();const end=originalCenter(f),snapshot=[...f.e.blastUnitTargets(end.x,end.y,f.p.blast,f.p.owner,false,f.p)],expected=snapshot.filter(v=>v.unit.side===1&&v.unit.hp>0);const positions=expected.map(v=>v.head);f.strike();assert.equal(rays(f).length,expected.length,label);rays(f).forEach((ray,i)=>{near(ray.x2,positions[i].x);near(ray.y2,positions[i].y);near(ray.size,3.5);assert.equal(ray.lightningSeed,C.cheonroeVisualSeed(f.p.id,expected[i].unit.id));});assert.equal(f.b.projectiles.includes(f.p),false);const count=new Map;for(const h of f.hits)count.set(h.id,(count.get(h.id)||0)+1);assert([...count.values()].every(n=>n===1),'one damage application per target');rows.push({label,targets:expected.length,rays:rays(f).length,hits:f.hits});return f;}
for(const rank of [1,4,8])for(const count of [0,1,4,10]){
 const f=check(cheonroeArena(C,{rank,count}),`SP${rank}/${count}`);assert.equal(rays(f).length,count);
 const before=cheonroeArena(C,{rank,count,damageScale:1/1.15});before.impact();originalStrike(before);assert.equal(f.hits.length,before.hits.length);
 for(let i=0;i<f.hits.length;i++){assert.equal(f.hits[i].id,before.hits[i].id);near(f.hits[i].raw,before.hits[i].raw*1.15);assert(Math.abs(f.hits[i].hp-before.hits[i].hp*1.15)<=1.15);}
 rows.at(-1).launchBefore=before.p.damage;rows.at(-1).launchAfter=f.p.damage;rows.at(-1).radius=f.p.blast;
}
// Strict radius + hurtbox boundary with the existing y - .45h anchor, not the head.
{const f=cheonroeArena(C,{count:3}),radius=f.p.blast,t=f.b.units.slice(1);for(let i=0;i<3;i++)Object.assign(t[i],{x:1000+radius+t[i].r+[-.001,0,.001][i],y:997+t[i].h*.45});check(f,'strict-radius-boundary');assert.deepEqual(f.hits.map(h=>h.id),[t[0].id]);}
// Eligibility is sampled after the delay: removed, killed, captured, released-projectile
// targets are excluded; a moved-in enemy is included and moved-out is excluded.
{const f=cheonroeArena(C,{count:10});f.impact();f.b.units[1].dead=true;f.b.units.splice(2,1);f.b.units[2].eaterCapturedBy='eater';f.b.units[3].eaterReleasedProjectile=f.p.id;f.b.units[4].x=2400;f.b.units[5].x=1000;f.p.age=.349;C.redesignStep(f.e,f.p,0);assert.equal(rays(f).length,0);f.strike();assert.equal(rays(f).length,5);rows.push({label:'live-delay-removal-capture',rays:rays(f).length});}
for(const y of [650,740,790]){
 const f=cheonroeArena(C,{count:4,ceiling:true});f.b.terrain[1].y=y;check(f,'ceiling-'+y);
 const before=cheonroeArena(C,{count:4,ceiling:true,damageScale:1/1.15});before.b.terrain[1].y=y;before.impact();originalStrike(before);assert.equal(f.hits.length,before.hits.length);f.hits.forEach((v,i)=>near(v.raw,before.hits[i].raw*1.15));
 for(const ray of rays(f)){assert(ray.y>=y+120+2.9,'starts below the roof underside');assert(ray.y2>=ray.y,'ends at the head');}
}
// Original oneWay center rule and visual underside clipping both survive.
{const f=cheonroeArena(C,{count:1,ceiling:true});f.b.terrain[1].y=800;f.b.terrain[1].h=20;f.b.terrain[1].oneWay=true;check(f,'oneWay-ceiling');assert.equal(rays(f).length,1);assert(rays(f)[0].y>=823);}
// Death caused by this strike must not erase the pre-damage visual or move its endpoint.
{const f=cheonroeArena(C,{count:10});for(const t of f.b.units.slice(1))t.hp=1;check(f,'lethal-snapshot');assert(f.b.units.slice(1).every(t=>t.dead));}
// Recasts are independent; a saved waiting cast keeps its stored damage.
{const f=check(cheonroeArena(C,{count:10}),'first-cast');f.b.phase='aim';f.b.side=0;f.u.acted=false;assert(f.e.fire('M05',0,.5));const p=f.b.projectiles[0];p.x=1000;p.y=1000;f.e.impact(p,{x:1000,y:1000,t:0,n:{x:0,y:-1},terrain:f.floor});p.age=.35;C.redesignStep(f.e,p,0);assert.equal(rays(f).length,20);assert.equal(f.hits.length,20);}
{const f=cheonroeArena(C,{count:1,damageScale:1/1.15});f.impact();const saved=JSON.parse(JSON.stringify(f.b)),events=[],e=new C.Engine(saved,ev=>events.push(ev));const p=saved.projectiles[0],damage=p.damage;p.age=.35;C.redesignStep(e,p,0);near(p.damage,damage);assert.equal(events.filter(v=>v.name==='lightningBolt').length,1);}
// No target cap: emitted rays are not limited to ten or to the renderer particle budget.
{const f=cheonroeArena(C,{count:420});for(const [i,t] of f.b.units.slice(1).entries())Object.assign(t,{x:900+i*.4});check(f,'420-no-target-cap');assert.equal(rays(f).length,420);}
assert.equal(C.SKILLS.M05.damage,128.8);assert.equal(C.SKILLS.LM05.damage,94,'legacy NPC copy unchanged');
await mkdir('_local/reports/cheonroe-target-lightning',{recursive:true});await writeFile('_local/reports/cheonroe-target-lightning/contracts.json',JSON.stringify({scope:'Production engine in VM, diagnostic fixtures; no browser or art approval',rows},null,2));
console.log('PASS cheonroe: counts, ranks, exact boundary, delay, removed/dead/captured, ceiling/oneWay, lethal snapshot, recast, saved cast, 420 targets');
