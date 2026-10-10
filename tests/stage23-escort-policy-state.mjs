/** Narrow controller/serialization audit only. No real physics or fullplay claim. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {yardRoutes} from '../tools/map-forge/stage23-loading-yard.mjs';
import {escortNavigator} from './stage23-escort-fullplay-helper.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const controller=await read('tests/stage23-escort-fullplay.mjs');
const helper=await read('tests/stage23-escort-fullplay-helper.mjs');
const sha256=s=>createHash('sha256').update(s).digest('hex');
const rows=[];

// Exact current highRoute function, with deliberately synthetic movement stubs.
const fn=controller.slice(controller.indexOf('function highRoute('),controller.indexOf('\nfunction lowPoint'));
assert(fn.includes('state.air'));
const r=yardRoutes().find(r=>r.id==='D-E-return'),events=[],goals=[];
const u={id:'p-mage',cls:'mage',x:5650,y:4200,moveLeft:9};
let supported='sy-west-upper',firstTurn=true;
const ctx={stage:{design:{escortYard:{routes:[r]}}},routeStates:new Map([['p-mage:D-E-return',{index:r.anchors.length-1}]]),plain:v=>JSON.parse(JSON.stringify(v)),ready:()=>true,
 e:{grounded:()=>true,move:dir=>{if(!firstTurn){u.x+=Math.sign(dir)*10;u.moveLeft-=10;}},jumpCost:()=>75,jump:()=>false},
 nav:{advance:(_u,p)=>goals.push(p),clear:()=>{},surface:()=>supported},record:x=>events.push(x),C:{STEP:1/120},
 tick:()=>{if(firstTurn){u.x=5670;u.y=4350;u.moveLeft=0;supported='sy-stone-bridge';}}};
vm.createContext(ctx);vm.runInContext(fn+';this.run=highRoute',ctx);
assert.equal(ctx.run(u,'D-E-return'),false);
const saved=JSON.parse(JSON.stringify([...ctx.routeStates]));
assert(saved[0][1].air);assert.equal(saved[0][1].index,r.anchors.length-1);
ctx.routeStates=new Map(saved);firstTurn=false;u.moveLeft=1909;
assert.equal(ctx.run(u,'D-E-return'),true);assert.equal(goals.length,0);
assert(Math.abs(u.x-5740)<22);assert.equal(ctx.routeStates.values().next().value.air,undefined);
rows.push({name:'Interrupted drop serialized and resumed on its actual lower support',passed:true,firstLandingX:5670,firstMoveLeft:0,expectedLandingX:5740,finalPose:{...u},upperWaypointCalls:goals.length,lastEvent:events.at(-1)});

// Minimal graph fixtures isolate Map/Set serialization; no game actors are used.
const actor={id:'p-mage',cls:'mage',x:0,y:0,moveLeft:100};
const point={id:'goal',x:0,y:0,surfaceId:'ground'};
const entry=()=>({nav:[[actor.id,{index:0,point:{...point},enemy:false,links:[{from:{x:0,y:0,surfaceId:'ground'},point:{x:0,y:0,surfaceId:'ground'}}]}]],failed:[[actor.id,['keep']]]});
const g={HONRO_CORE:{STEP:1/120,validTerrainContactPose:()=>true},HONRO_PROJECT:{stages:[{design:{space:{sites:{}}}}]}};
const b={terrain:[],width:1,height:1};
const e={heroesAlive:()=>[actor],contactSurface:()=>({t:{id:'ground'}}),grounded:()=>true};
const mk=navigationState=>escortNavigator(g,b,e,{stageId:1,routes:[],navigationState,tick:()=>{},ready:()=>true,record:()=>{}});

const source=entry(),nav=mk(source),output=nav.snapshot();
output.nav[0][1].index=77;output.nav[0][1].links[0].point.x=77;
output.failed[0][1].push('output-mutation');
assert.equal(nav.snapshot().nav[0][1].index,0);
assert.equal(nav.snapshot().nav[0][1].links[0].point.x,0);
assert.deepEqual(nav.snapshot().failed[0][1],['keep']);
rows.push({name:'Snapshot output nested state and failed-edge arrays are independent',passed:true});

source.nav[0][1].index=88;source.nav[0][1].links[0].point.x=88;
source.failed[0][1].push('input-mutation');
assert.equal(nav.snapshot().nav[0][1].index,0);
assert.equal(nav.snapshot().nav[0][1].links[0].point.x,0);
assert.deepEqual(nav.snapshot().failed[0][1],['keep']);
rows.push({name:'Restore input mutations cannot change running nested state or failed Set',passed:true});

const source2=entry(),nav2=mk(source2);nav2.advance(actor,point);
assert.equal(nav2.snapshot().nav[0][1].index,1);assert.equal(source2.nav[0][1].index,0);
rows.push({name:'Running navigator mutation cannot change restore input',passed:true});

const bridgeActor={id:'p-mage',cls:'mage',x:0,y:100,moveLeft:0};
const oldPoint={id:'lower-support',x:0,y:100,surfaceId:'ground'};
const newPoint={id:'lower-support',x:30,y:100,surfaceId:'bridge'};
const oldState={nav:[[bridgeActor.id,{point:oldPoint,index:0,enemy:false,links:[{point:oldPoint}]}]],failed:[]};
const bridgeG={HONRO_CORE:{STEP:1/120,topAt:()=>100,validTerrainContactPose:()=>true},HONRO_PROJECT:{stages:[{design:{space:{sites:{}}}}]}};
const bridgeB={terrain:[{id:'ground',x:-100,w:110},{id:'bridge',x:20,w:110}],width:100,height:200};
const bridgeE={heroesAlive:()=>[bridgeActor],contactSurface:()=>({t:{id:'ground'}}),grounded:()=>true};
const bridgeNav=escortNavigator(bridgeG,bridgeB,bridgeE,{stageId:1,routes:[{anchors:[{x:0,y:100,surfaceId:'ground'},{x:30,y:100,surfaceId:'bridge'}]}],navigationState:oldState,tick:()=>{},ready:()=>false,record:()=>{}});
bridgeNav.advance(bridgeActor,newPoint);
assert.equal(bridgeNav.snapshot().nav[0][1].point.surfaceId,'bridge');
assert.equal(bridgeNav.snapshot().nav[0][1].goal.surfaceId,'bridge');
rows.push({name:'Same ID and distance below160 still invalidate cache on support change',passed:true});

assert(controller.includes('const kept=b=>plain(b);'));
assert(controller.includes('navigatorState:nav.snapshot()'));
assert(controller.includes('const navigationState=nav?.snapshot()||resume?.navigatorState;'));
rows.push({name:'Source contract includes full-battle comparison and navigation snapshot wiring',passed:true,method:'Current source structural inspection, not an executed save/Continue test'});

const report={createdAt:new Date().toISOString(),scope:'Synthetic controller boundary and serialization tests only; no real physics, normal fullplay, balance, browser, or deployment acceptance.',controllerSha256:sha256(controller),navigatorSha256:sha256(helper),passed:rows.every(r=>r.passed),checks:rows};
await mkdir('_local/reports/stage23-escort',{recursive:true});await writeFile('_local/reports/stage23-escort/role-policy-serialization-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
