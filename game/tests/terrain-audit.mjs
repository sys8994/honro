import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {runtime,battlefield,gameRoot} from './helpers.mjs';
const g=await runtime(),C=g.HONRO_CORE,checks=[],stages=[],old=JSON.parse(await readFile(gameRoot+'/reports/terrain-before.json','utf8'));
const check=(name,fn)=>{const detail=fn();checks.push({name,passed:true,detail});};
const shelves=b=>b.terrain.filter(t=>!t.broken&&(t.oneWay||t.id.startsWith('bridge-')));
function canopy(b){const ts=shelves(b);let covered=0,maxLayers=0;for(let x=0;x<b.width;x+=10){const n=ts.filter(t=>x>=t.x&&x<t.x+t.w).length;covered+=n?10:0;maxLayers=Math.max(n,maxLayers);}return {shelves:ts.length,totalWidth:ts.reduce((n,t)=>n+t.w,0),coveredPercent:+(covered/b.width*100).toFixed(1),maxLayers};}
const free=(b,u)=>{const support=C.terrainSurface(b.terrain,u.x,u.y-.1,u.y+.1)?.t;return !g.HonroTerrain.intersects(b,u,u.x,u.y,{padding:u.fixed&&!u.honroCivilian?10:2,support:u.fixed&&!u.honroCivilian?null:support});};
try{
for(let id=1;id<=8;id++){
 const {b}=battlefield(g,id);stages.push({id,name:old[id-1].name,before:canopy(old[id-1].b),after:canopy(b)});
 check(`Stage ${id}: all authored actors occupy valid space`,()=>{for(const u of b.units)assert.ok(free(b,u),u.id);});
 check(`Stage ${id}: platforms leave open sky and do not form stacked ceilings`,()=>{const m=canopy(b);assert.ok(m.maxLayers<=1&&m.coveredPercent<=25);for(const t of shelves(b))assert.ok(t.w<=400);});
 if(id===2)check('Stage 2: original full-height canyon is restored',()=>{assert.equal(b.height,6000);assert.ok(b.terrain.some(t=>t.id==='basin-road-0'&&t.y>5000));});
 else if([1,8].includes(id))check(`Stage ${id}: reused original exposed ground is unchanged`,()=>assert.deepEqual(structuredClone(b.terrain.filter(t=>!t.honroSeal)),old[id-1].b.terrain.filter(t=>!t.honroSeal)));
 else if([3,4].includes(id))check(`Stage ${id}: remapped legacy template has a single exposed route`,()=>{const m=canopy(b);assert.ok(m.maxLayers<=1);assert.ok(b.terrain.length>=8);});
}
for(const id of [5,6,7])for(const cls of ['archer','mage','knight'])for(const dt of [1/120,1/30])for(const direction of [-1,1])check(`Stage ${id}: ${cls} walks the full route at ${dt}, direction ${direction}`,()=>{
 const {b,e}=battlefield(g,id),u=b.units.find(u=>u.side===0&&u.cls===cls)||C.makeUnit(cls,0,330,0,{id:'walker'});
 b.units=[u];for(const t of b.terrain)if(t.honroSeal)t.broken=true;b.sceneVersion++;
 const ground=b.terrain.filter(t=>!t.oneWay&&!t.honroSeal),top=x=>Math.min(...ground.filter(t=>x>=t.x&&x<=t.x+t.w).map(t=>C.topAt(t,x)));
 const end=id===7?4950:b.width-150,start=direction>0?330:end,goal=direction>0?end:330;
 Object.assign(u,{x:start,y:top(start),moveLeft:1e7,vx:0,vy:0,dead:false,jumping:false,airborne:false});const hp=u.hp;let frames=0;
 while((goal-u.x)*direction>0&&frames++<120/dt){const x=u.x;e.walk(u,direction,dt);e.integrateBody(u,dt);assert.ok((u.x-x)*direction>0,'walk blocked at '+u.x);assert.ok(Math.abs(u.y-top(u.x))<.1,'unintended fall');assert.equal(u.hp,hp);}
 assert.ok((u.x-goal)*direction>=0);return {seconds:+(frames*dt).toFixed(2),x:+u.x.toFixed(1),y:+u.y.toFixed(1)};
});
check('Bridge remnants can all be reached with the normal jump',()=>{
 const {b,e}=battlefield(g,6),u=e.active;b.units=[u];
 for(const t of shelves(b)){Object.assign(u,{x:t.x+t.w/2,y:1800,vx:0,vy:0,jumping:false,airborne:false,moveLeft:9999});assert.ok(e.jump(u));for(let i=0;i<240;i++)e.integrateBody(u,1/120);assert.equal(u.y,t.y);}
});
check('Destroying every remaining bridge leaves the civilian route intact',()=>{
 const {b,e,app}=battlefield(g,6),u=e.active,obj=e.unit('objective');for(const t of shelves(b))t.broken=true;b.sceneVersion++;b.units=[u,obj];b.honroState.rescued=true;u.x=b.width-70;u.y=g.HonroWorld.top(b,u.x);
 for(let i=0;i<2000&&!g.HonroObjectives.state(b,app.stage).complete;i++)g.HonroMission.tick(app,1/120);
 assert.ok(g.HonroObjectives.state(b,app.stage).complete);assert.ok(free(b,obj));
});
for(const [id,a,z] of [[5,3300,3650],[6,2880,3250],[7,1320,1620],[7,3250,3550]])for(const reverse of [false,true])for(const skill of ['A01','M01'])check(`Stage ${id}: ${skill} cross-height fire ${a}/${z}/${reverse}`,()=>{
 const {b,e}=battlefield(g,id),x=reverse?z:a,tx=reverse?a:z,cls=skill==='A01'?'archer':'mage';
 const u=C.makeUnit(cls,0,x,g.HonroWorld.top(b,x),{id:'shooter',focus:999,loadout:[skill],ranks:{[skill]:1}}),v=C.makeUnit('knight',1,tx,g.HonroWorld.top(b,tx),{id:'victim',fixed:true,hp:10000,maxHp:10000});
 b.units=[u,v];b.active=u.id;b.wind=0;b.phase='aim';b.side=0;b.sceneVersion++;
 const aim=e.bestShot(u,C.SKILLS[skill],v),prediction=e.predict(u,C.SKILLS[skill],aim.angle,aim.power,v,false);assert.equal(prediction.unit,v.id,JSON.stringify({aim,prediction}));
 assert.ok(e.fire(skill,aim.angle,aim.power));for(let i=0;i<1600&&b.projectiles.length;i++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,1/120);
 assert.ok(v.hp<10000,'actual projectile must damage opponent');return {angle:aim.angle,power:aim.power,damage:10000-v.hp};
});
check('Both royal knots can be attacked from the preceding exposed slope',()=>{
 const {b,e}=battlefield(g,7),u=e.active;b.units=[u];b.wind=0;
 for(const t of b.terrain.filter(t=>t.honroSeal)){Object.assign(u,{x:t.x-240,y:0});u.y=g.HonroWorld.top(b,u.x);const target={...u,id:'knot-probe',x:t.x+t.w/2,y:t.y+t.h,h:t.h,side:1},aim=e.bestShot(u,C.SKILLS.A01,target),hit=e.predict(u,C.SKILLS.A01,aim.angle,aim.power,target,false);assert.equal(hit.terrain,t.id);}
});
for(const id of [5,6,7])check(`Stage ${id}: old save migration preserves progress and is idempotent`,()=>{
 const b=structuredClone(old[id-1].b);b.honroState.hold=1;b.honroState.flags['event:keeper-awake']=true;
 const seal=b.terrain.find(t=>t.honroSeal);if(seal){seal.broken=true;seal.hp=0;}const bridge=b.terrain.find(t=>t.id==='bridge-13');if(bridge){bridge.broken=true;bridge.hp=0;}
 const stats=JSON.stringify(b.units.map(u=>[u.id,u.hp,u.focus,u.dead,u.moveLeft,u.acted])),progress=JSON.stringify([b.heroes,b.honroGrowth,b.honroState,b.round,b.side]);
 assert.ok(g.HonroLayouts.upgrade(b));assert.equal(JSON.stringify(b.units.map(u=>[u.id,u.hp,u.focus,u.dead,u.moveLeft,u.acted])),stats);assert.equal(JSON.stringify([b.heroes,b.honroGrowth,b.honroState,b.round,b.side]),progress);
 for(const u of b.units)assert.ok(free(b,u),u.id);if(seal)assert.ok(b.terrain.find(t=>t.id===seal.id).broken);if(bridge)assert.ok(b.terrain.find(t=>t.id===bridge.id).broken);
 const once=JSON.stringify(b);assert.equal(g.HonroLayouts.upgrade(b),false);assert.equal(JSON.stringify(b),once);
});
check('Saved flight geometry stays intact until a safe boundary',()=>{
 const b=structuredClone(old[6].b);b.phase='flight';b.projectiles=[{id:123}];const before=JSON.stringify(b);assert.equal(g.HonroLayouts.upgrade(b),false);assert.equal(JSON.stringify(b),before);b.phase='transition';b.projectiles=[];assert.ok(g.HonroLayouts.upgrade(b));
});
check('A saved knight near the old altar remains inside the new ritual area',()=>{
 const b=structuredClone(old[6].b),k=b.units.find(u=>u.cls==='knight'&&u.side===0);Object.assign(k,{x:4050,y:1080,vx:0,vy:0});assert.ok(g.HonroLayouts.upgrade(b));const altar=b.honroMarkers.find(m=>m.type==='shrine');assert.ok(Math.hypot(k.x-altar.x,k.y-altar.y)<330);
});
}catch(e){checks.push({name:e.message,passed:false,stack:e.stack});process.exitCode=1;console.error(e);}
await writeFile(gameRoot+'/reports/terrain-audit.json',JSON.stringify({stages,checks},null,2)+'\n');console.log(`${checks.filter(c=>c.passed).length}/${checks.length} terrain checks passed`);
