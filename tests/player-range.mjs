/** Focused production-step contracts for new casts, budgets, saves and previews. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {buildCore} from '../game/engine/build.mjs';
const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);const C=g.HONRO_CORE,plain=x=>JSON.parse(JSON.stringify(x));
const rows=[];
export function arena(id,{angle=5,power=1,drop=0,ranks={},wind=0}={}){
 const s=C.SKILLS[id],profile=C.defaults(),b=C.createBattle(1,profile,'practice',{party:[s.cls],wind:0}),u=b.units.find(u=>u.side===0);
 Object.assign(u,{x:1000,y:1400,h:92,r:22,vx:0,vy:0,loadout:[id],ranks:{[id]:1,...ranks},focus:10000,maxFocus:10000,tune:.5,critChance:0,attack:1,acted:false});
 Object.assign(b,{width:8000,height:3500,wind,physics:C.makePhysics(),terrain:[{id:'floor',x:0,y:1400+drop,w:8000,h:1500-drop,mat:'rock',hp:99999,maxHp:99999,indestructible:true},...(drop?[{id:'ledge',x:800,y:1400,w:200,h:30,mat:'rock',hp:99999,maxHp:99999,indestructible:true}]:[])],units:[u],projectiles:[],waters:[],drafts:[],fields:[],zones:[],decor:[],active:u.id,phase:'aim',side:0,sceneVersion:1});
 const events=[],e=new C.Engine(b,event=>events.push(event));e.checkEnd=()=>false;
 assert(e.fire(id,angle,power));return {C,profile,b,u,e,p:b.projectiles[0],events};
}
function step(f,n=1){for(let i=0;i<n;i++)for(const p of [...f.b.projectiles])if(f.b.projectiles.includes(p))f.e.stepProjectile(p,C.STEP);}
function finish(f){for(let i=0;i<15000&&f.b.projectiles.length;i++)step(f);assert.equal(f.b.projectiles.length,0);}
for(const id of ['O01','O04','O05','O16']){
 const f=arena(id),ghost=arena(id);const prediction=ghost.e.predict(ghost.u,C.SKILLS[id],5,1);let endpoint;
 for(let i=0;i<2000&&f.b.projectiles.includes(f.p);i++){step(f);if(f.p.wraithState==='manifest'){endpoint={x:f.p.x,y:f.p.y};break;}}
 endpoint??={x:f.p.x,y:f.p.y};assert(Math.hypot(endpoint.x-prediction.x,endpoint.y-prediction.y)<1e-6,id+' live and guide endpoint');
 assert(f.p.flightRange&&f.p.rangeRevision===1);rows.push({id,kind:'guide/airburst',endpoint,age:f.p.age});
}
// Low charge ends nearby; range/time is immutable across delayed clones and children.
for(const id of ['O01','O04','O05']){const f=arena(id,{power:.15});finish(f);assert(f.p.x<1700,id+' weak charge cannot fly to maximum range');}
{
 const f=arena('O03',{angle:15});let children=[];for(let i=0;i<400&&!children.length;i++){step(f);children=f.b.projectiles.filter(p=>p.mode==='spiritRain');}
 assert.equal(children.length,7);for(const p of children){assert.equal(p.flightRange.x,f.p.flightRange.x);assert(p.flightAge>=f.p.flightAge);assert.equal(p.age,0);}
 finish(f);rows.push({id:'O03',kind:'inherited root budget',children:children.length});
}
// A save at the airburst cannot add another burst, and total burst power is still .95.
{
 const f=arena('O05',{angle:5}),blasts=[],blast=f.e.blast.bind(f.e);f.e.blast=(x,y,r,damage,...args)=>{blasts.push(damage);return blast(x,y,r,damage,...args);};
 for(let i=0;i<500&&f.p.wraithState!=='manifest';i++)step(f);
 assert.equal(f.p.wraithState,'manifest');assert.equal(blasts.length,1);assert.equal(blasts[0],f.p.damage*.38);
 const saved=plain(f.b),p=saved.projectiles[0],foe=C.makeUnit('knight',1,p.x-100,p.y+46,{id:'return-target',h:92,r:22,hp:5000,maxHp:5000,armor:0,fixed:true,loadout:[]});saved.units.push(foe);
 const e=new C.Engine(saved),after=[],doBlast=e.blast.bind(e);e.blast=(x,y,r,d,...args)=>{after.push(d);return doBlast(x,y,r,d,...args);};const resumed={b:saved,e,p};finish(resumed);
 assert.equal(after.length,1);assert.equal(after[0],p.damage*.57);assert(Math.abs(blasts[0]+after[0]-p.damage*.95)<1e-9);assert(foe.hp<5000);
 rows.push({id:'O05',kind:'save resumes one return burst',air:blasts[0],return:after[0],oldTotal:p.damage*.95});
}
// Grounded early contact keeps the old full return burst; old flying saves are not tagged.
{
 const f=arena('O05',{angle:-20});for(let i=0;i<500&&f.p.wraithState!=='manifest';i++)step(f);assert.equal(f.p.wraithAirBurst,undefined);assert.equal(f.p.wraithState,'manifest');
 const old=plain(f.b);delete old.projectiles[0].flightRange;delete old.projectiles[0].rangeRevision;delete old.projectiles[0].flightAge;
 const before=plain(old.projectiles);new C.Engine(old);assert.deepEqual(plain(old.projectiles),before);
 rows.push({id:'O05',kind:'early contact and old save unchanged'});
}
// Propulsion ends at1500, but the body continues falling and lands on actual floor.
{
 const f=arena('S15',{angle:30,drop:1000,ranks:{SP03:8,SP01:8},wind:30});let capped=false,lastX=f.u.x,maxDelta=0;
 for(let i=0;i<2000&&f.b.projectiles.length;i++){step(f);maxDelta=Math.max(maxDelta,Math.abs(f.u.x-lastX));lastX=f.u.x;if(f.u.x>=2499.99&&f.u.y<2399){capped=true;assert(f.b.projectiles.includes(f.p));assert(f.u.airborne);}}
 assert(capped);assert(f.u.x<=2500.0001);assert.equal(f.u.airborne,false);assert(Math.abs(f.u.y-2400)<.1);assert(maxDelta<20);rows.push({id:'S15',kind:'bounded propulsion then real landing',x:f.u.x,y:f.u.y,maxDelta});
}
// NPC and enemy launch calibration stays on the historical formula.
for(const cls of ['archer','mage','knight','occultist'])for(const side of [0,1])for(const flag of ['honroAlly','honroCivilian','summoned']){
 const id={archer:'A14',mage:'M01',knight:'S01',occultist:'O01'}[cls],f=arena(id),u={...f.u,side,[flag]:true};
 assert.equal(C.playerRangeApplies(u,C.SKILLS[id]),false);const power=.7,v=f.e.velocity(u,C.SKILLS[id],0,power),expected=(side===0&&!u.summoned?805*power:(270+535*power))*f.e.effective(C.SKILLS[id],u).speed;assert(Math.abs(v.vx-expected)<1e-9);
}
// Independent echoes have a local launch budget, not a tether to the caster.
{
 const f=arena('O01'),echo=C.makeUnit('occultist',0,6000,1400,{id:'echo',summoned:true,summonKind:'echo',summonOwner:f.u.id,summonRank:1,summonExpires:99});f.b.units.push(echo);f.b.projectiles=[];f.b.phase='aim';f.u.acted=false;f.u.focus=10000;assert(f.e.fire('O01',5,1));const copy=f.b.projectiles.find(p=>p.echoSource==='echo');assert(copy);assert.equal(copy.flightRange.x,echo.x);assert.equal(copy.flightAge,0);assert(!C.flightRangeSpent(copy));
}
// Lanterns do not launch toward unreachable targets; their local movement is unchanged.
{
 const f=arena('O12'),s=C.makeUnit('occultist',0,2000,1400,{id:'lantern',summoned:true,summonKind:'lantern',summonOwner:f.u.id}),t=C.makeUnit('knight',1,3400,1400,{id:'far',h:92,r:22,hp:5000,maxHp:5000});f.b.units.push(s,t);f.b.projectiles=[];f.e.launchSummonBolt(s,t);assert.equal(f.b.projectiles.length,0);t.x=3100;f.e.launchSummonBolt(s,t);assert.equal(f.b.projectiles.length,1);const p=f.b.projectiles[0];finish(f);assert(t.hp<5000);assert(p.age<1.2);assert.equal(C.SUMMON_TUNING.lantern.move,1240);rows.push({id:'O12',kind:'selection1100 and actual hit',age:p.age});
}
await mkdir('_local/reports/player-range',{recursive:true});await writeFile('_local/reports/player-range/contracts.json',JSON.stringify({rows},null,2));console.log('PASS focused range: guide, airburst, inherited budget, return damage/save, legacy scope, echo, lantern, body landing');
