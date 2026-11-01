/** Production event trigger with explicit position/camera fixtures, not full play. */
import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';import {appHarness,plain} from './app-regression-helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g,app=h.load(h.profileThrough(34));g.HonroApp=app;
g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
for(const name of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);
app.stage=g.HONRO_CONTENT.stages[34];
const s=g.HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===35),p=g.HonroMaps.profileFor(s);g.HonroEquipment.fresh(p);const original=g.HonroMaps.createBattle(s,g.HONRO_PROJECT,p),P=g.HonroAct4TerrainPreview;
function trigger({x,cameraX=4290,cameraY=1140,legacy=false,hidden=false}){
 const b=plain(original);delete b.honroAct4PreviewState;if(legacy)delete b.honroAct4Design.coords;
 for(const u of b.units.filter(u=>u.side===0)){u.x=x;u.y=1100;}app.engine=new g.HONRO_CORE.Engine(b,()=>{},true);app.dialogue=null;app.done=false;app.modal.classList.remove('open');g.document.hidden=hidden;
 app.scene={x:cameraX,y:cameraY,scale:1,canvas:{clientWidth:1200,clientHeight:800}};P.observe(app,0);return !!P.previewMemory(b).events.edge?.started;
}
assert.equal(s.width,4608);assert.equal(trigger({x:4291}),true,'Current exit must be reachable without old x6500');assert.equal(trigger({x:4289}),false);assert.equal(trigger({x:4291,cameraX:500}),false);assert.equal(trigger({x:4291,hidden:true}),false);assert.equal(trigger({x:6501,cameraX:6980,cameraY:1800,legacy:true}),true);console.log('PASS current Stage35 edge, threshold/visibility/hidden guards and old-layout fallback; fixture only.');
