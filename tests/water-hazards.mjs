/** Explicit hazard/pose fixtures, not normal-input campaign victory. */
import assert from 'node:assert/strict';
import vm from 'node:vm';import{readFile}from'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import{appHarness,KEY}from'./app-regression-helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,plain=x=>JSON.parse(JSON.stringify(x));
const make=()=>{const b=g.HonroMaps.createBattle(g.HONRO_PROJECT.stages[4],g.HONRO_PROJECT,undefined,{origin:'campaign'});return{b,e:new C.Engine(b),u:b.units.find(u=>u.id==='p-archer'),m:b.units.find(u=>u.id==='p-mage'),w:b.waters.find(w=>w.id==='stage5-plunge-pool')};};
g.document={addEventListener(){}};vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
let n=0;const ok=(condition,label)=>{assert(condition,label);n++;};
{
 const {b,e,u,w}=make();ok(w.policy.mode==='recover'&&w.policy.damageFraction===.25,'authored 25% recover');ok(b.waters.find(w=>w.id==='stage5-shallow-water').policy.mode==='shallow','explicit shallow');ok(!b.waters.find(w=>w.id==='stage5-headwater').policy,'decorative source no hazard');
 for(const side of ['left','right'])for(const p of w.policy.shores[side]){const q={...u,x:p.x,y:p.y};const c=e.contactSurface(p.x,p.y-.15,p.y+.15);ok(c?.t.id===p.support&&C.validTerrainContactPose(b.terrain,q),side+' supported shore '+p.x);}
}
for(const side of ['left','right']){
 let {b,e,u,m,w}=make();Object.assign(u,{x:side==='left'?3800:5590,y:2870,acted:false});e.tick(0);const hp=u.hp;Object.assign(u,{x:side==='left'?4200:5100,y:3000,vx:100,vy:120,jumping:true});b.active=u.id;b.side=0;b.phase='aim';b.honroState.ritual={active:true,holderId:u.id};b.honroState.waterfallSight=true;
 ok(!e.canAct()&&!e.fire('A01',30,.5,true)&&!e.jump(u),'submerged input/AI cast/jump blocked before first tick');
 const eligibility=g.HonroInteractions.eligibility({engine:e,canInput:()=>true},b.honroMarkers.find(m=>m.id==='receiver-5'));ok(!eligibility.ok,'submerged interaction blocked');
 e.tick(1/60);ok(u.hp===hp-Math.ceil(u.maxHp*.25)&&u.waterRecovery?.side===side&&u.acted&&u.moveLeft===0,'one damage receipt and action consumed');ok(!b.honroState.ritual.active&&!b.honroState.waterfallSight,'ritual cancelled');ok(!e.select(u.id),'processing actor cannot be selected');ok(e.active.id===m.id&&e.canAct(),'other unacted hero still playable');
 const saved=plain(b);e=new C.Engine(saved);b=saved;u=e.unit(u.id);w=b.waters.find(w=>w.id===w.id);const after=u.hp;for(let i=0;i<60;i++)e.tick(1/60);
 ok(u.hp===after&&!u.waterRecovery&&u.x===(side==='left'?3990:5580),'Continue same-side shore without second damage');ok(C.validTerrainContactPose(b.terrain,u),'landed on actual exposed contact');ok(u.acted&&u.moveLeft===0,'return gives no free action');
}
{
 const {e,b,u,m,w}=make();Object.assign(u,{x:3800,y:2800});e.tick(0);Object.assign(u,{x:4200,y:3000});Object.assign(m,{x:3990,y:w.policy.shores.left[0].y});const hp=u.hp;e.tick(.02);for(let i=0;i<45;i++)e.tick(1/60);ok(!u.waterRecovery&&u.x===4060&&u.hp===hp-Math.ceil(u.maxHp*.25),'occupied first shore uses same bank next explicit contact');
}
{
 const {e,b,u,w}=make();b.units=b.units.filter(v=>v===u);Object.assign(u,{x:4200,y:3000,hp:1});e.tick(.02);ok(u.dead&&u.hp===0&&!u.waterRecovery,'25% can kill, no revive');
}
for(const trait of [undefined,'aquatic','flying']){
 const {e,b,u,w}=make();const foe=b.units.find(u=>u.side===1&&!u.honroObjectiveTarget&&u.honroVariant==='hound');Object.assign(foe,{x:4200,y:3000,waterTraversal:trait});const hp=foe.hp;e.tick(.01);ok(trait?foe.hp===hp&&!foe.waterRecovery:foe.hp===hp-Math.ceil(foe.maxHp*.25)&&!!foe.waterRecovery,'ground/enumerated trait '+trait);
}
{
 const {e,b,u}=make();const crow=b.units.find(u=>u.honroVariant==='crow');Object.assign(crow,{x:4200,y:3000});const hp=crow.hp;e.tick(.02);ok(crow.hp===hp&&!crow.waterRecovery,'existing flying species exempt');
}
{
 const {e,b,u,w}=make();w.policy={mode:'lethal'};Object.assign(u,{x:4200,y:3000});e.tick(.02);ok(u.dead&&u.hp===0&&!u.waterRecovery,'explicit lethal common policy');
}
for(const mode of ['shallow',undefined]){
 const {e,b,u,w}=make();w.policy=mode?{mode}:undefined;Object.assign(u,{x:4200,y:3000});const hp=u.hp;e.tick(.02);ok(u.hp===hp&&!u.waterRecovery,'shallow/decorative water inert '+mode);
}
{
 const {e,b,u,w}=make();w.frozen=b.round+2;Object.assign(u,{x:4200,y:3000});const hp=u.hp;e.tick(.02);ok(u.hp===hp&&!u.waterRecovery,'existing frozen surface exempt');
}
for(const method of ['jump','knockback']){
 const {e,b,u}=make();Object.assign(u,{x:4060,y:2860,moveLeft:1200,vx:0,vy:0});e.tick(0);const hp=u.hp;
 if(method==='jump')assert(e.jump(u));else e.impulse(u,400,-30);
 for(let i=0;i<240&&!u.waterRecovery&&!u.dead;i++){if(method==='jump'&&e.canAct())e.move(1,1/60);e.tick(1/60);}
 ok(!!u.waterRecovery&&u.waterRecovery.side==='left'&&u.hp===hp-Math.ceil(u.maxHp*.25),method+' actual body entry receipt');
}
{
 const {e,b,u,m,w}=make();const blocker=plain(m);blocker.id='shore-blocker';Object.assign(m,{x:3990,y:2860,fixed:true});Object.assign(blocker,{x:4060,y:2860,fixed:true});b.units.push(blocker);Object.assign(u,{x:4200,y:3000});const hp=u.hp;e.tick(.02);for(let i=0;i<120;i++)e.tick(1/60);
 ok(!u.waterRecovery&&u.x<3990&&u.x>=3894&&u.y===2860&&u.hp===hp-Math.ceil(u.maxHp*.25),'occupied nominated points use a free connected low same-bank contact');ok(C.validTerrainContactPose(b.terrain,u),'fallback is real exposed terrain contact');
}
{
 const {e,b,u,m,w}=make();const npc=plain(m);Object.assign(npc,{id:'objective',side:2,x:4200,y:3000,hp:1,fixed:true});b.units.push(npc);e.tick(.02);ok(npc.dead&&npc.hp===0,'fixed core NPC receives hazard');ok(C.evaluateStageEnd(C.STAGES[b.stageId-1],b,[u,m],e.alive(1),npc).lose,'existing protection failure sees NPC death');
}

{
 const {e,b,u,w}=make();b.phase='won';Object.assign(u,{x:4200,y:3000});const hp=u.hp;e.tick(.1);ok(u.hp===hp&&!u.waterRecovery,'finished battle immutable');
 for(const actor of b.units.filter(u=>!C.flyingEnemy(u)&&!u.honroObjectiveTarget))for(const side of ['left','right'])for(const p of w.policy.shores[side])ok(C.validTerrainContactPose(b.terrain,{...actor,x:p.x,y:p.y}),'all ground body shore contact '+actor.id);
 const stage=plain(g.HONRO_PROJECT.stages[4]);stage.materials.find(w=>w.id==='stage5-plunge-pool').conductive=false;stage.units.find(u=>u.id==='s5-entry-hound').stageOverrides.waterTraversal='aquatic';const q=g.HonroMaps.createBattle(stage,g.HONRO_PROJECT,undefined,{origin:'campaign'});ok(q.waters.some(w=>w.id==='stage5-plunge-pool'&&w.policy.mode==='recover'),'explicit nonconductive hazard compiled');ok(q.units.find(u=>u.id==='s5-entry-hound').waterTraversal==='aquatic','authored stageOverrides trait compiled');
}
{
 const {e,b,u}=make();Object.assign(u,{x:4200,y:3000,focus:10});e.tick(0);e.newRound();ok(u.acted&&u.moveLeft===0,'pending actor remains spent at round reset');ok(u.focus===10,'pending actor receives no free focus regeneration');ok(b.active!==u.id||b.phase!=='aim','round reset does not select pending hero');
}
{
 const {e,b,u,w}=make(),guards=b.units.filter(v=>['s5-entry-hound','s5-cave-hound'].includes(v.id));for(const[i,v]of guards.entries())Object.assign(v,{x:w.policy.shores.left[i].x,y:2860,fixed:true});
 b.terrain.push({id:'water-recovery-test-wall',x:3960,y:2740,w:8,h:150,mat:'stone',hp:9999,maxHp:9999});b.sceneVersion++;Object.assign(u,{x:4200,y:3000,waterEntrySides:{[w.id]:'left'}});const hp=u.hp;e.tick(0);e.tick(.8);ok(!!u.waterRecovery&&u.waterRecovery.side==='left'&&u.x<5350,'no return across an intervening wall or to the free opposite bank');ok(u.hp===hp-Math.ceil(u.maxHp*.25),'blocked connected-shore search does not charge extra damage');
}
{
 const {e,b,u,m}=make(),foe=e.unit('s5-entry-hound');b.units=b.units.filter(v=>v===u||v===m||v===foe||v.honroObjectiveTarget);Object.assign(foe,{x:4200,y:3000,awake:true,aggroUntil:999});e.tick(0);ok(!!foe.waterRecovery&&e.combatEnemies().includes(foe),'recovering foe still counts as combat pressure for existing defend healing');e.switchTeam();ok(!b.queue.includes(foe.id),'recovering foe is excluded only from the action queue');
}
// Nothing outside Stage5 was assigned a hazard by this change.
const hazards=g.HONRO_PROJECT.stages.flatMap(s=>(s.materials||[]).filter(w=>w.waterPolicy&&w.waterPolicy.mode!=='shallow').map(w=>({stage:s.metadata.stageId,id:w.id,mode:w.waterPolicy.mode})));
assert.deepEqual(plain(hazards),[{stage:5,id:'stage5-plunge-pool',mode:'recover'}]);
{
 const h=await appHarness(),app=h.load(h.profileThrough(4));app.launch(5);h.finish(app);app.close();let e=app.engine,u=e.unit('p-archer');Object.assign(u,{x:3990,y:2860});e.tick(0);Object.assign(u,{x:4200,y:3000});const hp=u.hp;e.tick(.02);const p=JSON.parse(h.storage.get(KEY));ok(!!p.honroBattle.units.find(u=>u.id==='p-archer').waterRecovery,'immediate production save stores recovery receipt before autosave/menu exit');const fresh=h.load(p);fresh.continue();h.finish(fresh);fresh.close();e=fresh.engine;u=e.unit('p-archer');ok(u.hp===hp-Math.ceil(u.maxHp*.25)&&!!u.waterRecovery,'App Continue preserves damage and pending state');for(let i=0;i<60;i++)e.tick(1/60);ok(u.hp===hp-Math.ceil(u.maxHp*.25)&&u.x===3990&&!u.waterRecovery,'App Continue returns once without healing');const stored=JSON.parse(h.storage.get(KEY)).honroBattle.units.find(v=>v.id===u.id);ok(stored.x===3990&&!stored.waterRecovery&&stored.hp===u.hp,'completed recovery immediately durable');
}
console.log('PASS',n,'water policy/ground contact/input/knockback-jump/Continue/occupancy/death/trait boundaries; explicit lethal assignments outside Stage5:0');
