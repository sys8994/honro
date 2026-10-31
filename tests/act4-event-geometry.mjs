/** Focused production event/geometry fixtures. DOM visibility is a double;
 * these are not mission completion, normal campaign, or browser play proofs. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g,app=h.load(h.profileThrough(33));
app.launch(34);h.finish(app);const original=plain(app.engine.b);app.stopBattle();
g.HonroApp=app;g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
for(const name of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);
const P=g.HonroAct4TerrainPreview,C=g.HONRO_CORE,cases=[];
function trigger({x,y=2100,bounds,visible=true,dead=false}){
 const b=plain(original),e=new C.Engine(b,()=>{});e.checkEnd=()=>false;
 b.phase='aim';b.honroAct4Preview=34;b.honroCustom=true;delete b.honroAct4PreviewState;
 const w=b.honroAct4Design.wrongExit;w.entrance={x:5200,y:2100};w.exit={x:2800,y:550};if(bounds!==undefined)w.triggerBounds=bounds;else delete w.triggerBounds;
 const heroes=b.units.filter(u=>u.side===0);for(const u of heroes){u.x=x;u.y=y;}
 const actor=e.unit(w.actor);actor.x=5100;actor.y=2100;if(dead){actor.hp=0;actor.dead=true;}
 app.engine=e;app.dialogue=null;app.modal.classList.remove('open');app.scene={x:visible?5200:0,y:2100,scale:1,canvas:{clientWidth:1200,clientHeight:800}};
 P.coastObserve(app,0);const q=P.eventAPI.memory(b);assert(!q.complete,'proximity cannot complete the stage');assert(!q.events.wrong_exit?.terminal,'proximity cannot finish story');return q.dislocation?.phase;
}
assert.equal(trigger({x:2200}), 'entering');assert.equal(trigger({x:1800}),undefined);assert.equal(trigger({x:2900}),undefined);assert.equal(trigger({x:5200}),undefined);cases.push('legacy strict x-only trigger retained');
const bounds={x1:4900,x2:5500,y1:1950,y2:2220};
assert.equal(trigger({x:5200,bounds}),'entering');assert.equal(trigger({x:4900,y:1950,bounds}),'entering');
for(const p of [{x:4899,y:2100},{x:5501,y:2100},{x:5200,y:1949},{x:5200,y:2221},{x:2200,y:2100}])assert.equal(trigger({...p,bounds}),undefined);
assert.equal(trigger({x:5200,bounds,visible:false}),undefined);assert.equal(trigger({x:5200,bounds,dead:true}),undefined);
for(const z of [null,{}, {...bounds,y1:NaN},{...bounds,x1:6000}])assert.equal(trigger({x:2200,bounds:z}),undefined);
cases.push('configured cave bounds include height; entrance visibility/alive/story gates retained; malformed opt-in fails closed');
function waterWorld(ids){const b={honroCustom:true,honroAct4Preview:33,round:1,side:0,phase:'aim',units:[],sceneVersion:0,terrain:[{id:'low',x:0,y:1000,w:96,h:200},{id:'upper-rock',x:32,y:850,w:32,h:100}],honroAct4Design:{tide:{low:800,high:750,warningRound:2,highRound:5,lowRound:7},waterPolicies:[{id:'floor',kind:'recover',x1:0,x2:128,surface:750}]},honroSurfaceZones:[{id:'keep',kind:'other'}]};if(ids!==undefined)b.honroAct4Design.tide.floorTerrainIds=ids;return b;}
const legacy=waterWorld();P.coast.tide(legacy);const legacyPool=legacy.honroSurfaceZones.find(z=>z.kind==='water-pool');assert(legacyPool.bottom.some(p=>p[0]===32&&p[1]===850),'legacy includes upper rock');
const selected=waterWorld(['low']);P.coast.tide(selected);const pool=selected.honroSurfaceZones.find(z=>z.kind==='water-pool');assert(pool);assert(pool.bottom.every(p=>p[1]===1000));assert.equal(pool.bottom.at(-1)[0],96,'unsupported endpoint excluded');assert(selected.honroSurfaceZones.some(z=>z.id==='keep'));
for(const world of [legacy,selected])for(const z of world.honroSurfaceZones.filter(z=>z.kind==='water-pool'))for(const p of [...z.surface,...z.bottom,...z.points])assert(p.every(Number.isFinite));
const count=selected.honroSurfaceZones.length,version=selected.sceneVersion;P.coast.tide(selected);assert.equal(selected.honroSurfaceZones.length,count);assert.equal(selected.sceneVersion,version);
cases.push('legacy floors retained, selected low floor excludes upper rocks, unsupported endpoint finite, same-level cache idempotent');
for(const ids of [[],['absent'],['low','low'],'low',Array(65).fill('low')]){const b=waterWorld(ids);assert.throws(()=>P.coast.tide(b),/Invalid tide floorTerrainIds/);assert.throws(()=>P.coast.tide(b),/Invalid tide floorTerrainIds/);assert.equal(b.sceneVersion,0);}
for(const flag of ['oneWay','honroCeiling','honroElementCollision']){const b=waterWorld(['low']);b.terrain[0][flag]=true;assert.throws(()=>P.coast.tide(b),/Invalid tide floorTerrainIds/);}
cases.push('invalid/missing/duplicate/ineligible floor IDs rejected repeatedly without caching invalid geometry');
const dir='_local/reports/act4-event-geometry';await mkdir(dir,{recursive:true});await writeFile(dir+'/summary.json',JSON.stringify({scope:'Focused production geometry/event fixtures, not full play',cases,sourceSha256:createHash('sha256').update(await readFile('shared/runtime/act4-coast-events.js')).digest('hex')},null,2)+'\n');console.log(cases.join('\n'));
