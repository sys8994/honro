/** Synthetic collision regression, not a mission or UI-play acceptance test.
 * Reproduces two residents compressed to 41.65 units on a descending coast.
 */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g,app=h.load(h.profileThrough(39));
app.launch(40);h.finish(app);const base=plain(app.engine.b);app.stopBattle();g.HonroApp=app;
g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
for(const n of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events']){
 let source=await readFile('shared/runtime/'+n+'.js','utf8');
 if(n==='act4-coast-events')source=source.replace('function tide(b){','P.testResidentMove=moveNpc;\nfunction tide(b){');
 vm.runInContext(source,g);
}
function fixture(stage=40){
 const b=plain(base);b.honroAct4Preview=stage;b.phase='aim';b.side=0;
 b.units=b.units.filter(u=>u.honroAct4Resident).slice(0,2);
 b.terrain=[{id:'test-coast',x:1000,y:1500,w:1000,h:700,vertices:[{x:1000,y:1500},{x:2000,y:1900},{x:2000,y:2200},{x:1000,y:2200}],oneWay:false,indestructible:true}];
 delete b.honroWorldTerrain;
 const [rear,front]=b.units;for(const [u,x] of [[rear,1705.6],[front,1747.25]])Object.assign(u,{x,y:1500+(x-1000)*.4,fixed:false,vx:0,vy:0,jumping:false,r:22,h:92,walkSpeed:170,moveLeft:180});
 return {b,e:new g.HONRO_CORE.Engine(b,()=>{}),rear,front};
}
const P=g.HonroAct4TerrainPreview,T=g.HonroTerrain;
for(const stage of [39,40]){
 const {b,e,rear,front}=fixture(stage),start=front.x;
 for(let i=0;i<20;i++)P.testResidentMove(e,front,1900,1/60,220);
 assert(front.x>start+20,`Stage ${stage}: front must walk out of existing compression`);
 assert(T.separated(b,front,front.x,front.y,12));assert.equal(rear.x,1705.6);
}
for(const stage of [38,41]){const {e,front}=fixture(stage),x=front.x;P.testResidentMove(e,front,1900,1/60,220);assert.equal(front.x,x,'other chapters do not gain an exception');}
{
 const {e,rear}=fixture(),x=rear.x;P.testResidentMove(e,rear,1900,1/60,220);assert.equal(rear.x,x,'rear cannot deepen overlap');
}
{
 const {b,e,front}=fixture(),x=front.x;const blocker={...plain(front),id:'blocking-hero',honroAct4Resident:false,side:0,x:front.x+55};b.units.push(blocker);
 P.testResidentMove(e,front,1900,1/60,220);assert.equal(front.x,x,'cannot enter another actor while separating');
}
{
 const {e,front}=fixture(),x=front.x;front.jumping=true;front.vy=60;P.testResidentMove(e,front,1900,1/60,220);assert.equal(front.x,x,'airborne overlap is not excused');
}
console.log('Resident separation: grounded forward recovery, rear/new-body/airborne/chapter guards passed (synthetic).');
