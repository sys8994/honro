/** Focused real event-module contract tests. Physics, render and story UI are doubles;
 * this is NOT normal-play or visual proof. Every positive fixture retains live foes. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const root=process.env.ACT4_FIXTURE_ROOT||'shared/runtime';
const seeds=JSON.parse(await readFile(process.env.ACT4_SEEDS||'shared/data/act4/reviewed.json','utf8'));
const g=vm.createContext({console,HONRO_CORE:{equipmentActor:()=>true},HONRO_ACT4_PREVIEW_SEEDS:seeds,HonroAct4TerrainPreview:{campaignProof:{}},HonroScene:class{},HONRO_APP_READY:{then(){}},document:{hidden:false,addEventListener(){},getElementById(){return null;},querySelector(){return null;}},HonroStory:{start(){},save(){}}});
for(const file of ['act4-events.js','act4-coast-events.js'])vm.runInContext(await readFile(root+'/'+file,'utf8'),g);
const P=g.HonroAct4TerrainPreview;
function fixture(n){
 const hero={id:'archer',cls:'archer',side:0,hp:100,x:100,y:100,acted:false},mate={id:'mage',cls:'mage',side:0,hp:100,x:160,y:100,acted:false},foe={id:'survivor',side:1,hp:100,x:1000,y:100};
 const b={honroAct4Official:1,honroAct4Preview:n,honroStage:n,phase:'aim',side:0,round:3,units:[hero,mate,foe],projectiles:[],terrain:[],sceneVersion:0,honroAct4Design:{coords:{},waterPolicies:[],exit:{x:7000,y:100}},honroAct4PreviewDynamic:[]};
 const e={b,active:hero,unit:id=>b.units.find(u=>u.id===id),grounded:u=>!u.jumping,finishAction(){this.finished=true;},settleBusy:()=>false};
 const app={engine:e,stage:{name:'fixture'},modal:{classList:{contains:()=>false}},scene:{x:0,y:0,scale:1,canvas:{clientWidth:100,clientHeight:100}},canSpeak:()=>false};
 const q=P.previewMemory(b);q.observed={};return {b,e,app,q,hero,mate,foe};
}
{
 const {b,e,app,q,hero,mate,foe}=fixture(31);
 assert.equal(P.interact(app),false,'cannot signal from spawn');
 Object.assign(hero,{x:5900,y:1735});
 assert.equal(P.interact(app,'label'),'나룻배에 신호 보내기 · 2라운드 버티기');assert.equal(q.boatSignal,undefined,'probe is read-only');
 assert.equal(P.interact(app),true);assert.equal(q.boatSignal.round,3);assert(e.finished);assert(!q.complete);
 q.events.boat_approach={started:true,terminal:true};
 P.observe(app,.1);assert.equal(q.boat.phase,'waiting');b.round=4;P.observe(app,.1);assert.equal(q.boat.phase,'waiting');
 // JSON checkpoint round and actor survive; no counter reset on repeated input.
 b.honroAct4PreviewState=JSON.parse(JSON.stringify(q));const saved=b.honroAct4PreviewState;
 b.round=5;P.observe(app,.1);assert.equal(saved.boat.phase,'approach');
 saved.boat.phase='docked';delete saved.boatSignal; // Legacy docked save has no new signal field.saved.events.board_ready={started:true,terminal:true};
 Object.assign(hero,{x:6350,y:1860});Object.assign(mate,{x:6500,y:1860});
 b.projectiles.push({});assert.equal(P.interact(app),false);b.projectiles=[];
 mate.jumping=true;assert.equal(P.interact(app),false);mate.jumping=false;
 assert.equal(P.interact(app),true);assert(saved.complete&&foe.hp>0);assert.equal(saved.boat.phase,'boarded');
}
{
 const {b,e,app,q,hero,mate,foe}=fixture(32);
 b.units.push({id:'a4-shelter-speaker',side:2,hp:100,x:4890,y:2010,honroAct4Sheltered:true});
 Object.assign(hero,{x:4700,y:2010});b.honroAct4Design.shelter={manifest:Array.from({length:7},(_,i)=>'shelter-person-'+i)};
 P.coastObserve(app,.1);assert.equal(q.shelterDoor.phase,'opening','remote enemy does not block shelter');assert.equal(q.shelterTravel,undefined,'live enemies must not grant unlimited movement');
 delete q.shelterDoor;Object.assign(foe,{x:4800,y:2010});P.coastObserve(app,.1);assert.equal(q.shelterDoor,undefined,'near threat blocks opening');
 Object.assign(foe,{x:1000,y:100});Object.assign(hero,{x:6800,y:100});Object.assign(mate,{x:6850,y:100});
 assert.equal(P.interact(app),false,'arrival alone cannot fabricate seven residents');
 q.events.missing_four={started:true,terminal:true};q.safeSeven={ids:b.honroAct4Design.shelter.manifest,sourceRun:'fixture'};
 mate.jumping=true;assert.equal(P.interact(app),false);mate.jumping=false;
 assert.equal(P.interact(app),true);assert(q.complete&&foe.hp>0);assert.equal(q.completionProof.safeSeven.ids.length,7);
}
{
 const {b,app,q,hero,mate,foe}=fixture(35);Object.assign(hero,{x:6600,y:100});Object.assign(mate,{x:6700,y:100});
 mate.jumping=true;assert.equal(P.interact(app),false);mate.jumping=false;
 q.bark={key:'edge'};assert.equal(P.interact(app),false);q.bark=null;
 assert.equal(P.interact(app),true);assert(q.complete&&foe.hp>0);
}
{
 const {b,e,app,q,hero,mate,foe}=fixture(36);hero.cls='knight';hero.x=2370;
 assert.equal(P.interact(app),true,'door push with surviving enemy');assert.equal(q.door.phase,'falling');assert(!q.complete);
 q.door.phase='fallen';Object.assign(hero,{x:6600,y:100});Object.assign(mate,{x:6700,y:100});assert.equal(P.interact(app),false,'missing departure event blocks win');
 q.events.leave={terminal:true};q.events.door_falls={terminal:true,skipped:true};mate.jumping=true;assert.equal(P.interact(app),false);mate.jumping=false;assert.equal(P.interact(app),true);assert(q.complete&&foe.hp>0);
}
{
 const {b,e,app,q,hero,mate,foe}=fixture(40);b.honroAct4Design.escort={boat:{x:3000,destination:4800}};
 for(let i=0;i<4;i++)b.units.push({id:'resident'+i,side:2,hp:100,honroAct4Resident:true,x:2800,y:1950});
 Object.assign(hero,{x:2700,y:1950});q.observed={'return-boat':0,'return-high':0};q.events.boarding={started:true,terminal:false};
 P.coastObserve(app,.1);assert.equal(q.returnEscort.phase,'boarding','escort starts with enemy alive');assert(!q.complete);
 Object.assign(hero,{x:5500,y:100});Object.assign(mate,{x:5600,y:100});q.returnEscort.phase='safe';
 assert.equal(P.interact(app),false,'roster/next story gate remains');q.events.next={terminal:true};b.units.at(-1).hp=0;assert.equal(P.interact(app),false,'dead resident cannot be counted safe');b.units.at(-1).hp=100;
 assert.equal(P.interact(app),true);assert(q.complete&&foe.hp>0);
}
console.log('PASS Act4 31 signal/2-round/restore/boarding, 32 local safety/reunion proof, 35 breakout, 36 door, 40 escort with enemies alive. Doubled physics/UI, not full-play proof.');
