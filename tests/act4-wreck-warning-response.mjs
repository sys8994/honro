/** Production warning/response hooks with explicit phase and Canvas fixtures.
 * Not normal play, browser visibility or boss encounter acceptance.
 */
import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
import {appHarness} from './app-regression-helpers.mjs';import {loadPilotRuntime} from '../tools/stage31/pilot-runtime.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g,app=h.load(h.profileThrough(38));g.HonroApp=app;g.HonroScene.prototype.render=function(){};g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
for(const name of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);await loadPilotRuntime(g);
const P=g.HonroAct4TerrainPreview,s=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===39),p=g.HonroMaps.profileFor(s);g.HonroEquipment.fresh(p);const b=g.HonroMaps.createBattle(s,g.HONRO_PROJECT,p,{origin:'campaign'}),e=new g.HONRO_CORE.Engine(b,()=>{},true),hero=b.units.find(u=>u.side===0);
app.engine=e;app.stage=g.HONRO_CONTENT.stages[38];app.dialogue=null;app.charging=false;app.modal.classList.remove('open');g.document.hidden=false;
const c={save(){},restore(){},setTransform(){},measureText:()=>({width:260}),setLineDash(){},beginPath(){},arc(){},stroke(){},fillRect(){},fillText(){}};
let visible=true,blocked=false;const scene={ctx:c,x:hero.x,y:hero.y-hero.h*.5,scale:1,size:()=>({d:1}),canvas:{checkVisibility:()=>visible,getBoundingClientRect:()=>({left:0,top:0,width:1440,height:900})}};app.scene=scene;app.root={querySelectorAll:()=>blocked?[{getBoundingClientRect:()=>({left:0,top:0,right:1440,bottom:900,width:1440,height:900})}]:[]};
P.attachCoast(app);const q=P.previewMemory(b);
function pending(){const t={x:hero.x,y:hero.y-hero.h*.5,target:hero.id,dueRound:2,warningSeen:false};q.artillery={count:0,history:[],next:t};return t;}
Object.assign(b,{round:1,side:0,phase:'aim',active:hero.id,teamEnds:[0,0]});hero.acted=false;
let t=pending();assert(!P.coast.wreckWarningReady(e,t));P.coast.drawWreckWarning(scene,c,app,b);assert(t.warningSeen);assert(t.offered[hero.id]);assert(!P.coast.wreckWarningReady(e,t),'visible marker alone is insufficient');
Object.assign(b,{round:2,side:1});b.teamEnds[0]=1;assert(!P.coast.wreckWarningReady(e,t),'automatic round/team end is not a response');
Object.assign(b,{round:1,side:0,phase:'aim',active:hero.id,teamEnds:[0,0]});hero.acted=false;e.finishAction(true);assert.equal(t.response?.id,hero.id,'native completion of an offered allied action creates response');assert(!P.coast.wreckWarningReady(e,t));b.round=2;b.side=1;b.teamEnds[0]=1;assert(P.coast.wreckWarningReady(e,t));const received=t;
for(const mode of ['hidden','dialogue','modal','invisible','occluded','offscreen']){
 t=pending();g.document.hidden=mode==='hidden';app.dialogue=mode==='dialogue'?{}:null;if(mode==='modal')app.modal.classList.add('open');else app.modal.classList.remove('open');visible=mode!=='invisible';blocked=mode==='occluded';scene.x=mode==='offscreen'?hero.x+5000:hero.x;
 P.coast.drawWreckWarning(scene,c,app,b);assert(!t.warningSeen,mode+' cannot observe warning');
}
g.document.hidden=false;app.dialogue=null;app.modal.classList.remove('open');visible=true;blocked=false;scene.x=hero.x;Object.assign(b,{round:1,side:0,phase:'aim',active:hero.id,teamEnds:[0,0]});hero.acted=false;app.charging=true;t=pending();P.coast.drawWreckWarning(scene,c,app,b);assert(t.warningSeen);assert(!t.offered?.[hero.id],'in-progress charge is not a new response opportunity');e.finishAction(true);assert(!t.response);app.charging=false;
t=pending();t.warningSeen=true;t.response={id:hero.id};assert(!P.coast.wreckWarningReady(e,t),'legacy seen flag without timing cannot fire');P.coast.drawWreckWarning(scene,c,app,b);assert.equal(t.response,undefined,'legacy warning must be observed anew');
const npc=b.units.find(u=>u.honroAct4Resident),zone=b.honroAct4Design.rescue.safeZone;let at;
for(const x of [zone.x1+50,(zone.x1+zone.x2)/2,zone.x2-50])for(const terrain of b.terrain)for(const f of g.HONRO_CORE.terrainSurfaces(terrain,x))if(f.y>=zone.y1&&f.y<=zone.y2){at={x,y:f.y};break;}
assert(at,'real supported safe-zone fixture');Object.assign(npc,at,{vx:0,vy:0,dead:false});assert(P.coast.rescueSafe(e,npc));assert(!P.coast.wreckTargetSafe(e,{target:npc.id,x:npc.x,y:npc.y-npc.h*.5}));
const center={x:npc.x,y:npc.y-npc.h*.5};assert(!P.coast.wreckTrajectorySafe(e,{x:center.x+200,y:center.y},{x:center.x-200,y:center.y},.1),'trajectory through safe resident is forbidden');
const boss=e.unit('a4-wreck');Object.assign(b,{active:boss.id,side:1,phase:'enemy',round:2,queue:[boss.id],projectiles:[]});b.teamEnds[0]=1;boss.acted=false;q.artillery={count:0,history:[],next:received};e.enemyAction();assert(b.projectiles.some(p=>p.owner===boss.id),'Valid observed response must permit a real native artillery cast');
const ray={b:{width:2000,height:2000,units:[],honroAct4Design:{rescue:{safeZone:{x1:500,x2:600,y1:500,y2:600}}}},acceleration:()=>({x:0,y:0}),advanceProjectile:(p,dt)=>({x:p.x+p.vx*dt,y:p.y+p.vy*dt,vx:p.vx,vy:p.vy}),projectileCollision:()=>null};assert(!P.coast.wreckTrajectorySafe(ray,{x:100,y:500},{x:0,y:500},.1),'Miss after nominal target time must not enter safe zone');ray.b.honroAct4Design.rescue.safeZone.y1=1500;ray.b.honroAct4Design.rescue.safeZone.y2=1600;assert(P.coast.wreckTrajectorySafe(ray,{x:100,y:500},{x:0,y:500},.1),'Unrelated safe zone does not suppress every cast');
console.log('PASS wreck warning visibility/occlusion/charge, actual allied-response receipt, team boundary, legacy receipt and safe-resident trajectory fixtures; no full-play claim.');
