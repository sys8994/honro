/** Real App stop/load/Continue with isolated current-waterfall arrow shots. DOM is mocked. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,plain=x=>JSON.parse(JSON.stringify(x)),storage=new Map();
const node=()=>({innerHTML:'',classList:{remove(){},add(){},toggle(){},contains(){return false;}},dataset:{}}),nodes=new Map();
g.document={addEventListener(){},getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},body:node()};g.localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};g.requestAnimationFrame=()=>0;g.innerWidth=1440;g.HonroAudio=class{configure(){}play(){}};g.HonroScene=class{event(){}focusUnit(){}};g.HonroUI={bottom:()=>''};g.HonroStory={event(){},start:()=>false,turnPaused:()=>false,allowed:()=>true,queue:()=>false};
const main=await readFile('shared/runtime/main.js','utf8');vm.runInContext(main.replace('G.HonroApp = new App();','G.HonroLifecycleTest = {App, fresh, load};'),g);
const {App}=g.HonroLifecycleTest;for(const n of ['bind','inputs','updateHUD','updateAudio','cancelInput','close'])App.prototype[n]=function(){};App.prototype.notify=function(m){this.lastNotice=m;};App.prototype.showMap=function(){this.stopBattle();this.screen='map';};
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);g.HonroInteractions.mount=()=>{};let app=new App();for(let id=1;id<5;id++)app.profile.cleared[id]={};app.launch(5);
let b,e,t,target,archer,mage,marker;function refs(){e=app.engine;b=e.b;t=b.honroQuestTargets.find(t=>t.id==='cliff-cleat');target=e.unit(t.id);archer=e.heroesAlive().find(u=>u.cls==='archer');mage=e.heroesAlive().find(u=>u.cls==='mage');marker=b.honroMarkers.find(m=>m.id==='receiver-5');}refs();
// Isolate the authored projectile lane from ordinary enemies; target HP, damage,
// geometry, skills and all App save/Continue mechanics stay production values.
b.units=b.units.filter(u=>u.side!==1||u.honroObjectiveTarget);
Object.assign(mage,{x:marker.x,y:marker.y,vx:0,vy:0,jumping:false,airborne:false});b.active=mage.id;assert(g.HonroInteractions.use(app,marker));g.HonroMission.tick(app,0);assert(b.honroState.ritual.active);Object.assign(archer,b.honroMapAnchors.shotGap,{vx:0,vy:0});
const snapshot=()=>plain({hp:target.hp,maxHp:target.maxHp,broken:t.broken,ritual:b.honroState.ritual,round:b.round,targets:b.units.filter(u=>u.honroObjectiveTarget).map(u=>({id:u.id,hp:u.hp,dead:u.dead,x:u.x,y:u.y})),state:b.honroState,terrain:b.terrain});
function resume(){const expected=snapshot();app.stopBattle();app=new App();app.continue();refs();assert.deepEqual(snapshot(),expected);assert(!b.terrain.some(v=>v.id===target.id));}
let count=0;const hits=[];
while(!target.dead&&count++<30){b.phase='aim';b.side=0;b.active=archer.id;archer.acted=false;const hp=target.hp;assert.equal(e.predict(archer,C.SKILLS.A01,10,.8).unit,target.id);assert(e.fire('A01',10,.8));for(let i=0;i<1800&&b.projectiles.length;i++){for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);g.HonroMission.tick(app,0);}assert(target.hp<hp);hits.push({before:hp,after:target.hp});if(hits.length===1){assert(target.hp>0);resume();}}
assert(target.dead&&t.broken);assert(!b.honroState.ritual.active);assert(marker.collected);resume();assert(target.dead&&t.broken);assert(g.HonroObjectives.state(b,app.stage).objectiveReady);assert(!g.HonroObjectives.state(b,app.stage).complete);b.round=b.honroState.objectiveReadyRound+1;assert(app.checkMission(e));assert.equal(b.phase,'won');
console.log(JSON.stringify({status:'PASS',scope:'Live canonical arrows, real App partial/destroyed save-load-Continue, unchanged stabilization',hits}));
