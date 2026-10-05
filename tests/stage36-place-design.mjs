import {applyAct1CollisionRepair} from '../tools/map-forge/act1-collision-repair.mjs';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import vm from 'node:vm';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {migrate} from '../migration/migrate-stages.mjs';

const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,project=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
const plain=x=>JSON.parse(JSON.stringify(x)),checks=[];
// Historical place recipes are compared independently of later combat tuning,
// one-way platform rules, habitat props, and the authored scenery library.
const platformIds=new Set(['hidden-ledge','upper-roost','bridge-west','bridge-mid','bridge-east','lower-lookout','pier-west','pier-east','tier-low','tier-mid','tier-upper','tier-crown','ramp-1','center-lookout']);
function withoutHistoricalSodanAttack(value){const copy=applyAct1CollisionRepair(plain(value));delete copy.library;if(copy.stages)copy.stages=copy.stages.slice(0,10);for(const stage of copy.stages||[]){delete stage.environment;if(stage.design?.act1Scene){delete stage.design.act1Scene;if(!Object.keys(stage.design).length)delete stage.design;}stage.elements=stage.elements?.filter(e=>!e.id?.startsWith('habitat-prop-')&&!e.id?.startsWith('a1-scene-'));stage.markers=stage.markers?.filter(m=>!m.id?.startsWith('habitat-'));for(const t of stage.terrains||[])if(platformIds.has(t.id))delete t.oneWay;for(const u of stage.units||[])for(const key of ['xpBudget','attack','combatBaseAttack','hp','maxHp','combatBaseHp'])delete u[key];}return copy;}
function test(name,fn){try{const detail=fn();checks.push({name,pass:true,detail});console.log('PASS',name);}catch(error){checks.push({name,pass:false,error:String(error)});console.error('FAIL',name,error.message);}}
function top(st,x){const p=st.terrains[0].points.slice(0,st.detailStats.groundTop);for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i];if(a.x<=x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);}throw Error('No ground at '+x);}
function grade(st,x,width){return Math.abs(top(st,x-width/2)-top(st,x+width/2));}
vm.runInContext(await readFile('workshop/recipes/stage12-forest-basin.js','utf8'),g);
vm.runInContext(await readFile('workshop/recipes/stage36-place-design.js','utf8'),g);
const migrated=await migrate(),first=g.HonroCommands.apply(migrated,g.HonroStage12Design.commands(migrated));
test('Both Workshop recipes reproduce the active Stage 1–10 project',()=>assert.deepEqual(withoutHistoricalSodanAttack(g.HonroCommands.apply(first,g.HonroStage36Places.commands(first))),withoutHistoricalSodanAttack(project)));
test('Only Stages 3–6 receive new playable geometry and 7–10 remain unchanged',()=>{
 for(const sid of[3,4,5,6]){const a=first.stages[sid-1],b=project.stages[sid-1];assert.notDeepEqual(b.terrains[0].points,a.terrains[0].points);assert.equal(b.metadata.placeRevision,1);assert(b.detailStats.groundTop>=150);}
 const later=plain(project.stages.slice(6,10));
 later[3].elements.find(e=>e.kind==='ritualDais').layer='back';
 assert.deepEqual(withoutHistoricalSodanAttack({stages:later}).stages,withoutHistoricalSodanAttack({stages:migrated.stages.slice(6)}).stages);
});
test('Warehouse, gate and burned homes have level usable footprints',()=>{
 assert(grade(project.stages[2],5550,450)<5);
 assert(grade(project.stages[3],1030,340)<5);
 const homes=project.stages[3].elements.find(e=>e.assetId==='builtin:burnedHouses');assert.equal(homes.x,2200);assert(grade(project.stages[3],homes.x,470)<80);
});
test('Stage 3 and 4 optional structures are supported, reachable and leave the ground route intact',()=>{
 for(const [sid,id,detailId] of[[3,'ferry-side-gangway','place3-side-gangway-rig'],[4,'burned-gallery','place4-burned-gallery-rig']]){
  const st=project.stages[sid-1],t=st.terrains.find(t=>t.id===id),support=st.elements.find(e=>e.id===detailId);
  assert(t?.oneWay&&t.breakable,`${sid} optional platform`);
  assert(support&&support.y-support.height>0,`${sid} visible support`);
  const center=(t.points[0].x+t.points[5].x)/2,deckY=t.points[2].y,groundY=top(st,center);
  assert(groundY-deckY>90&&groundY-deckY<215,`${sid} basic jump reaches platform`);
  assert(Math.abs(support.y-top(st,support.x))<1,`${sid} support touches ground`);
  assert.equal(st.metadata.waterForestRevision,1);
  const {b}=battlefield(g,sid),active=b.terrain.find(t=>t.id===id);
  assert(active&&!active.broken);active.broken=true;
  assert(b.terrain.some(t=>t.id===st.terrains[0].id&&!t.broken),`${sid} permanent ground survives`);
 }
 const {b}=battlefield(g,3);assert.equal(b.waters.length,1);assert.equal(b.honroSurfaceZones.find(z=>z.id==='ferry-water')?.kind,'water-pool');
});
test('Stage 5 waterfall connects the rock lip to a shallow ground basin',()=>{
 const st=project.stages[4],fall=st.elements.find(e=>e.assetId==='builtin:waterfall'),run=st.elements.find(e=>e.id==='place5-source-run'),water=st.materials.find(m=>m.id==='place5-falls-pool');
 assert.equal(fall.x,run.x);assert(Math.abs(fall.y-fall.drop-run.y)<4);assert(water.x1<fall.x&&water.x2>fall.x);assert.equal(water.conductive,true);
});
test('Stage 6 bridge piers connect the decks to the lower road',()=>{
 const st=project.stages[5];for(const [id,deck] of[['place6-west-buttress',1870],['place6-mid-buttress',1810],['place6-east-buttress',1940]]){
  const e=st.elements.find(e=>e.id===id);assert(e);assert(Math.abs(e.y-top(st,e.x))<.001);assert(Math.abs(e.y-e.height-deck)<.001);
 }assert(st.materials.some(m=>m.id==='place6-ravine-water'&&m.conductive));
});
for(const sid of[3,4,5,6])test(`Stage ${sid} actors start outside new solid collision and saves remount safely`,()=>{
 const {b}=battlefield(g,sid);for(const u of b.units){const t=C.terrainSurface(b.terrain,u.x,u.y-.1,u.y+.1)?.t;
  assert(!g.HonroTerrain.intersects(b,u,u.x,u.y,{padding:u.fixed&&!u.honroCivilian?10:2,support:u.fixed&&!u.honroCivilian?null:t}),u.id);
 }const saved=plain(b);g.HonroStageRules.sanitizeStageBattle(b);assert.deepEqual(plain(b),saved);
});
test('Stage 5 and 6 pools are traversable, shallow and registered for conduction',()=>{
 for(const sid of[5,6]){const {b}=battlefield(g,sid),pools=b.honroSurfaceZones.filter(z=>z.kind==='water-pool');assert.equal(b.waters.length,pools.length);assert.equal(b.waters.length,1);assert(b.waters[0].depth>10&&b.waters[0].depth<120);assert(!b.terrain.some(t=>t.mat==='water'));}
});
test('Main travel surface is continuous from start to objective/exit',()=>{
 for(const sid of[3,4,5,6]){const st=project.stages[sid-1];for(let x=0;x<=st.width;x+=20){const y=top(st,x);assert(Number.isFinite(y),`${sid}/${x}`);if(x+20<=st.width)assert(Math.abs(top(st,x+20)-y)<100,`${sid}: cliff at ${x}`);}}
});
await mkdir('_local/reports/map-place',{recursive:true});await writeFile('_local/reports/map-place/unit.json',JSON.stringify({checks},null,2)+'\n');
if(checks.some(c=>!c.pass))process.exitCode=1;
