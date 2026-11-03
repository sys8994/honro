import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {appHarness} from './candidate-harness.mjs';
import {createPlayerOperations} from './player-operations.mjs';
export async function createFinale({record=()=>{}}={}){
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true,productionInputActions:true}),{g,C}=h;
g.performance={now:()=>0};g.HONRO_APP_READY=Promise.resolve();g.HonroScene.prototype.landmark=function(){};g.HonroScene.prototype.background=function(){};g.HonroScene.prototype.render=function(){};g.HonroScene.prototype.size=function(){return {w:1440,h:900,d:1}};g.HonroScene.prototype.storyRelease=function(camera){Object.assign(this,camera)};g.HonroScene.prototype.minimap=function(){};
g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json'));
g.HONRO_ACT4_PILOT_COMBAT_REFERENCE=JSON.parse(await readFile('shared/data/act4/pilot-combat-reference.json'));
const raw=execFileSync('xz',['-dc','tools/act4-rc/fixtures/stage40-checkpoints/sailing-observation-local-storage.json.xz'],{maxBuffer:20*1024*1024});
const app=h.load(JSON.parse(raw));g.HonroApp=app;
for(const name of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-pilot-combat','act4-campaign'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);
assert.equal(app.profileStore.locked,false,'Prepared profile must load without recovery');app.continue();app.close();assert(app.engine,'Continue must create engine');
const e=app.engine,b=e.b;assert.equal(b.round,1);assert.equal(b.units.filter(u=>u.side===1).length,42);assert.equal(b.honroStage,40);
app.scene.canvas={clientWidth:1440,clientHeight:900,checkVisibility:()=>true,getBoundingClientRect:()=>({left:0,top:0,width:1440,height:900})};app.scene.scale=.5;app.scene.x=1000;app.scene.y=1600;
const noop=()=>{},ctx=new Proxy({measureText:s=>({width:s.length*8})},{get:(t,k)=>t[k]||noop});
const ops=createPlayerOperations({app,g,C,record,render(){const u=e.active;if(u){app.scene.x=u.x;app.scene.y=u.y-200;}g.HonroAct4PilotCombat.draw(app.scene,ctx,b);}});

return {h,g,C,app,e,b,ops,raw};
}
