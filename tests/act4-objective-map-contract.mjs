/** Production authored maps and Engine contacts, endpoint fixtures only; not full play. */
import assert from 'node:assert/strict';
import vm from 'node:vm';import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g,app=h.load(h.profileThrough(30));g.HONRO_ACT4_PILOT_COMBAT_REFERENCE=JSON.parse(await readFile('shared/data/act4/pilot-combat-reference.json','utf8'));vm.runInContext(await readFile('shared/runtime/act4-pilot-combat.js','utf8'),g);app.launch(31);h.finish(app);const entry=plain(app.engine.b);app.stopBattle();g.HonroApp=app;
g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
for(const m of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events'])vm.runInContext(await readFile('shared/runtime/'+m+'.js','utf8'),g);
const P=g.HonroAct4TerrainPreview,b=plain(entry),e=new h.C.Engine(b,()=>{});e.checkEnd=()=>false;app.engine=e;app.dialogue=null;b.phase='aim';b.side=0;const u=b.units.find(u=>u.side===0),cfg=b.honroAct4Design.boarding;b.active=u.id;u.acted=false;
const q=P.previewMemory(b);if(q.arrivalTour)q.arrivalTour.active=false;
const point=P.signalPoint(b),candidates=[];
for(let x=point.x-390;x<=point.x+390;x+=30){const s=e.contactSurface(x,point.y-270,point.y+270);if(s){const old={x:u.x,y:u.y};Object.assign(u,{x,y:s.y,vx:0,vy:0});if(e.grounded(u))candidates.push({x,y:s.y,terrain:s.t?.id});Object.assign(u,old);}}
console.log(JSON.stringify({stage:31,boarding:cfg,point,candidates,liveEnemies:b.units.filter(u=>u.side===1&&u.hp>0).length}));
assert(candidates.length,'signal interaction needs real supported shore candidates');
Object.assign(u,candidates[0]);assert.equal(P.interact(app,'label'),'나룻배에 신호 보내기 · 2라운드 버티기');assert.equal(P.interact(app),true);assert(q.boatSignal);assert(!q.complete);
console.log('PASS authored Stage31 signal endpoint on real Engine terrain, no enemy removal; not route or full-play proof.');
