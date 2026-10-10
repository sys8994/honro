/** Fresh authoring and real geometry/physics/shot contracts for dense23/30.
 * Supported hero poses in tactical tests are fixtures. These are not ordinary
 * movement, campaign clears, browser rendering or a quality approval. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {authorStage23LoadingYard} from '../tools/map-forge/stage23-loading-yard.mjs';
import {authorStage30Ferry} from '../tools/map-forge/apply-stage30-ferry.mjs';
import {escortEntryProfile} from './stage23-escort-entry-helper.mjs';
const plain=v=>JSON.parse(JSON.stringify(v)),hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,D=g.HonroEncounterDensity,original=plain(g.HONRO_PROJECT),checks=[],bodies=[],entries=[],tactics=[];
let p=await authorStage23LoadingYard(g,original,{roster:'density40e10'});p=plain(await authorStage30Ferry(p,g,{roster:'density40e10'}));g.HONRO_PROJECT=p;
const check=(name,fn)=>{const result=fn();checks.push({name,result});console.log('PASS',name);};
function fixture(stage,options){const q=battlefield(g,stage,options);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct3.attach(q.app,q.e);return q;}
const floating=u=>!!g.HonroWorld.archetypes[u.honroVariant]?.flying;
const valid=(b,u)=>floating(u)?!g.HonroTerrain.intersects(b,u):C.validTerrainContactPose(b.terrain,u);
const overlaps=units=>{const out=[];for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++){const a=units[i],z=units[j];if(Math.abs(a.x-z.x)<a.r+z.r+18&&Math.min(a.y,z.y)>Math.max(a.y-a.h,z.y-z.h)-18)out.push([a.id,z.id]);}return out;};
check('authoring preserves other28, terrain, art, markers, routes, objectives and protected actors',()=>{
 for(let i=0;i<30;i++){const a=original.stages[i],z=p.stages[i];if(![22,29].includes(i))assert.deepEqual(z,a,'other stage '+(i+1));else{
  for(const key of['terrains','elements','environment','markers','routes','anchors','materials'])assert.deepEqual(z[key],a[key],(i+1)+' '+key);
  assert.deepEqual(z.initialState.honroAct3Steps,a.initialState.honroAct3Steps);assert.deepEqual(z.units.filter(u=>u.team!=='enemy'),a.units.filter(u=>u.team!=='enemy'));
 }}return{unrelatedStages:28,protectedCarrier:true};
});
for(const n of[23,30]){
 const st=p.stages[n-1],cap=n===23?54:56,finite=n===23?14:16;
 check(n+': forty supported initial bodies, ten elites, finite'+finite+', cap'+cap+', action3',()=>{
  const {b,e}=fixture(n);assert.equal(e.alive(1).length,40);assert.equal(e.alive(1).filter(u=>u.honroAct3Elite).length,10);assert.equal(b.enemyLimit,3);assert.equal(g.HonroEncounters.populationCap(b),cap);assert.equal(b.honroDensityQueueReserve,1);
  const spec=n===23?b.honroEscortYardSpec:b.honroFerrySpec;assert.equal(Object.values(spec.entries).reduce((sum,a)=>sum+a.members.length,0),finite);
  for(const u of b.units){const row=st.units.find(v=>v.id===u.id);assert(valid(b,u),u.id+' support');assert.equal(u.x,row.x,u.id+' no horizontal repair');assert.equal(u.y,row.y,u.id+' no vertical repair');if(u.side===1){assert(u.honroEncounterRole);assert(u.honroEncounterSupport);}bodies.push({stage:n,id:u.id,x:u.x,y:u.y,hp:u.hp,elite:!!u.elite,support:u.honroEncounterSupport,role:u.honroEncounterRole});}
  assert.deepEqual(overlaps(b.units),[]);const before=plain(b.units);for(let tick=0;tick<480;tick++)e.stepUnits(1/60);
  for(const u of b.units){const old=before.find(v=>v.id===u.id);assert.equal(u.hp,old.hp);assert(!u.dead);assert(Math.abs(u.x-old.x)<.1&&Math.abs(u.y-old.y)<.1,u.id+' eight-second drift');assert(valid(b,u));}assert.deepEqual(overlaps(b.units),[]);
  return{initial:40,elite:10,finite,populationCap:cap,actionCap:3,seconds:8,cells:st.encounters.length};
 });
 check(n+': all primary and same-side alternate waves fit with all40 initial enemies alive',()=>{
  const spec=n===23?st.initialState.honroEscortYardSpec:st.initialState.honroFerrySpec;
  for(const[source,entry]of Object.entries(spec.entries))for(const[choice,at]of[entry,...entry.alternates].entries()){
   const {b,e,app}=fixture(n),snapshot=plain(b.units);assert.equal(e.alive(1).length,40);assert.equal(at.side,entry.side);assert(at.members.every(m=>m.role&&m.activationCell&&!m.air));
   assert(D.spawnMembers(app,{source,n:at.members.length},at),source+' exact atomic choice'+choice);const born=b.units.slice(snapshot.length);assert.equal(born.length,at.members.length);assert.equal(born.filter(u=>u.elite).length,source==='act3-ferry-hold'?0:1);
   born.forEach((u,i)=>{assert.equal(u.x,at.members[i].x);assert.equal(u.y,at.members[i].y);assert(valid(b,u));});assert.deepEqual(overlaps(b.units),[]);
   const before=plain(born);for(let tick=0;tick<480;tick++)e.stepUnits(1/60);born.forEach((u,i)=>{assert.equal(u.hp,before[i].hp);assert(Math.abs(u.x-before[i].x)<.1&&Math.abs(u.y-before[i].y)<.1,source+' entry drift');});
   entries.push({stage:n,source,choice,side:at.side,members:born.map(u=>({id:u.id,kind:u.honroVariant,role:u.honroEncounterRole,support:u.honroEncounterSupport,x:u.x,y:u.y,elite:u.elite}))});
  }return{entries:entries.filter(v=>v.stage===n).length};
 });
 check(n+': a blocked member prevents every birth and consumes no ID, HP or budget',()=>{
  const {b,e,app}=fixture(n),spec=n===23?b.honroEscortYardSpec:b.honroFerrySpec;
  for(const[source,at]of Object.entries(spec.entries)){const u=e.heroesAlive()[0],saved={x:u.x,y:u.y};Object.assign(u,{x:at.members.at(-1).x,y:at.members.at(-1).y});const before=plain({units:b.units,nextId:b.nextId,counters:b.honroCounters});assert.equal(D.spawnMembers(app,{source,n:at.members.length},at),false,source);assert.deepEqual(plain({units:b.units,nextId:b.nextId,counters:b.honroCounters}),before);Object.assign(u,saved);}return{atomic:true};
 });
 check(n+': real snapshot reattach retains actors, queue, mission and density warning state exactly',()=>{
  const q=fixture(n),before=plain(q.b),b=plain(q.b),e=new C.Engine(b,()=>{},false),app={...q.app,engine:e};g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct3.attach(app,e);assert.deepEqual(plain(b),before);return{exact:true};
 });
}
check('23 response-only generic activation and existing initial-cell filters coexist',()=>{
 const {b,e,app}=fixture(23),at=b.honroEscortYardSpec.entries['act3-response-23-1'];assert(D.spawnMembers(app,{source:'act3-response-23-1',n:5},at));const born=b.units.filter(u=>u.honroSpawnSource);b.round=10;for(const u of born){u.aggroUntil=0;u.awake=true;}assert(!e.combatEnemies().some(u=>born.includes(u)),'Entry party cannot activate remote low flank after recent aggro expires');const u=e.heroesAlive()[0];u.x=3110;u.y=C.topAt(b.terrain.find(t=>t.id==='sy-ground'),u.x);assert(C.validTerrainContactPose(b.terrain,u));assert(e.combatEnemies().some(v=>born.includes(v)),'Supported low-road approach activates the low-flank response');return{remoteExcluded:true,lowerApproachIncluded:true};
});
let legacy=await authorStage23LoadingYard(g,p,{roster:'originalBudget22e5',art:false});legacy=await authorStage30Ferry(legacy,g,{roster:'originalBudget20e4',art:false});
g.HONRO_PROJECT=legacy;
for(const stage of[23,30])check(stage+': historical authored roster never acquires density state or reserved queue policy',()=>{const {b,e}=fixture(stage);assert(!D.active(b));assert.equal(e.alive(1).length,stage===23?22:20);assert.equal(g.HonroEncounters.populationCap(b),30);assert(!b.honroDensityQueueReserve);assert(!b.honroState.encounterDensity);const before=plain(b.queue);assert.deepEqual(plain(D.reserveQueue(e)),before);return{initial:e.alive(1).length,densityUpgrade:false};});
g.HONRO_PROJECT=p;
check('all five production difficulty profiles retain the exact authored populations, elite flags and caps',()=>{const rows=[];for(const stage of[23,30])for(const difficulty of Object.keys(C.DIFFICULTIES)){const profile=C.defaults();profile.settings.difficulty=difficulty;const {b,e}=fixture(stage,{profile});assert.equal(e.alive(1).length,40);assert.equal(e.alive(1).filter(u=>u.elite).length,10);assert.equal(b.enemyLimit,3);assert.equal(g.HonroEncounters.populationCap(b),stage===23?54:56);rows.push({stage,difficulty,initial:40,elite:10,actionCap:3});}assert.equal(rows.length,10);return rows;});
const profile=escortEntryProfile(g).profile;
function shotFixture(stage,support,x){const q=fixture(stage,{profile:plain(profile)}),u=q.e.heroesAlive().find(u=>u.cls==='mage');u.x=x;u.y=C.topAt(q.b.terrain.find(t=>t.id===support),x);assert(valid(q.b,u));assert.deepEqual(overlaps(q.b.units),[]);q.b.active=u.id;q.b.phase='aim';q.b.side=0;return{...q,u};}
for(const c of[
 {stage:23,support:'sy-ground',x:2460,skill:'M04',angle:-10.719419780217482,power:.5869983137043493,minimum:3},
 {stage:23,support:'sy-ground',x:3390,skill:'M04',angle:-.21054195347867383,power:.5302858853895969,minimum:3},
 {stage:30,support:'sf-ferry-court',x:5500,skill:'M04',angle:149,power:.5,minimum:7,exactEnemyIds:['sf-dw1','sf-dw2','sf-dw3','sf-dw4','sf-dw6','sf-dw8','sf-de8']},
 {stage:23,support:'sy-stone-bridge',x:5360,skill:'M11',angle:89,power:.35,minimum:1,reflection:true},
 {stage:30,support:'sf-ferry-court',x:5520,skill:'M11',angle:-59,power:.5,minimum:1,reflection:true}
])check(c.stage+': actual '+c.skill+' from '+c.support+'@'+c.x,()=>{
 const q=shotFixture(c.stage,c.support,c.x),hp=Object.fromEntries(q.b.units.map(u=>[u.id,u.hp])),hits=[],contact=[],impact=q.e.impact.bind(q.e),before=plain(q.b.terrain);q.e.impact=(p,v)=>{if(v.unit)hits.push({id:v.unit.id,bounces:p.bounces});if(v.terrain)contact.push({id:v.terrain.id,bounces:p.bounces});return impact(p,v);};assert(q.e.fire(c.skill,c.angle,c.power));let frames=0;while(q.b.projectiles.length||q.u.meleeAction){q.e.tick(C.STEP);assert(++frames<1800);}
 const damaged=q.b.units.filter(u=>u.hp<hp[u.id]);assert(!damaged.some(u=>u.side===0));assert(damaged.filter(u=>u.side===1).length>=c.minimum);if(c.exactEnemyIds)assert.deepEqual(damaged.filter(u=>u.side===1).map(u=>u.id).sort(),[...c.exactEnemyIds].sort(),'The seven original AoE defenders remain; the command archer now owns a separate live entry sightline');assert.deepEqual(plain(q.b.terrain),before);if(c.reflection)assert(hits.some(h=>h.bounces>=1));const row={...c,hits,contact,damage:Object.fromEntries(damaged.map(u=>[u.id,hp[u.id]-u.hp]))};tactics.push(row);return row;
});
await mkdir('_local/reports/encounter-density',{recursive:true});await writeFile('_local/reports/encounter-density/stage2330-contracts.json',JSON.stringify({sourceHash:hash(p),controllerSha256:hash(await readFile(new URL(import.meta.url),'utf8')),scope:'Authoring, initial/spawn physics, exact snapshot reattach and legal level16 rank1 actual tactical shots. Not ordinary arrival/fullplay, browser or quality approval.',checks,bodies,entries,tactics},null,2)+'\n');
