// HBUG-103: real contact integration and commands, never an always-grounded stub.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,classes=['archer','mage','knight','occultist'],rows=[];
const steps=[1/240,1/60,1/30,.08],baseSkill={archer:'A01',mage:'M01',knight:'S01',occultist:'O01'};
const templates=new Map();
const point=(t,x)=>({x,y:C.topAt(t,x)});
function fixture(stage=1,cls='archer'){
 if(!templates.has(stage))templates.set(stage,structuredClone(battlefield(g,stage).b));
 const b=structuredClone(templates.get(stage)),e=new C.Engine(b),q={b,e},u=C.makeUnit(cls,0,e.active.x,e.active.y,{id:'ground-probe',loadout:[baseSkill[cls]],moveLeft:10000,maxMove:10000,focus:1000,maxFocus:1000});
 q.b.units=[u];q.b.active=u.id;q.b.side=0;q.b.phase='aim';q.b.projectiles=[];q.e.checkEnd=()=>false;return {...q,u};
}
function place(u,p){Object.assign(u,p,{vx:0,vy:0,jumping:false,airborne:false,dead:false,acted:false,moveLeft:10000,fallApexY:undefined});}
function solid(id,x,y,w,h=1200,extra={}){return{id,x,y,w,h,mat:'rock',hp:99999,maxHp:99999,...extra};}
function setup(q,terrain){q.b.terrain=terrain;q.b.sceneVersion++;q.b.width=2400;q.b.height=3400;q.b.waters=[];}
function clearFeet(b,u,label){const bad=b.terrain.find(t=>!t.broken&&!t.oneWay&&C.terrainContains(t,u.x,u.y-.2));assert(!bad,`${label}: feet entered ${bad?.id} at ${u.x},${u.y}`);}
function assertFire(q){q.b.phase='aim';q.b.side=0;q.u.acted=false;assert(q.e.fire(baseSkill[q.u.cls],35,.35),`${q.u.cls}: actual ground fire rejected`);}
// Screenshot's valley descent: the old solver landed here, but surface() was
// null forever because it used the walkable 1.35 slope limit for physical rest.
for(const cls of classes)for(const dt of steps)for(const x of [1275,1300,1328,1568]){
 const q=fixture(5,cls),{b,e,u}=q,t=b.terrain.find(t=>t.id==='valley-floor'),p=point(t,x);place(u,p);
 assert(Math.abs(C.terrainSlopeAt(t,x,p.y))>1.35);assert.equal(e.surface(x,p.y-.1,p.y+.1),null,'steep face must remain excluded from route search');
 for(let n=0;n<Math.ceil(.5/dt);n++)e.integrateBody(u,dt,true);
 assert(e.grounded(u),`${cls}/${dt}/${x}: resting contact missing`);assert(Math.abs(u.y-p.y)<1e-6);assert.equal(u.vy,0);
 const snapshot=JSON.stringify(b),roundTrip=JSON.parse(snapshot),resumed=new C.Engine(roundTrip);assert(resumed.grounded(resumed.active));assert.equal(JSON.stringify(b),snapshot,'queries must not rewrite a live save');
 assert(e.jump(u),'actual jump rejected');assert(!e.grounded(u));assert.equal(e.fire(baseSkill[cls],35,.35),false,'jumping still blocks fire');
 place(u,p);assertFire(q);rows.push({kind:'screenshot steep contact',stage:5,cls,dt,x,jump:true,fire:true,save:true});
}
console.log('PASS steep contact',rows.length);
// The old below-surface exposure probe rejected BOTH coincident/overlapping
// tops. Standing, walking and falling must all see the same union boundary.
for(const cls of classes)for(const dt of steps)for(const direction of [-1,1]){
 const q=fixture(1,cls),{b,e,u}=q;setup(q,[solid('left',0,1000,650),solid('right',500,1000,1400)]);
 place(u,{x:direction>0?450:700,y:1000});for(let n=0;n<Math.ceil(1/dt);n++){e.walk(u,direction,dt);e.integrateBody(u,dt,true);assert(e.grounded(u));assert.equal(u.y,1000);clearFeet(b,u,'overlap');}
 assert(Math.abs(u.x-(direction>0?450:700))>200,'ordinary walking was blocked by overlap');
 place(u,{x:550,y:900});u.vy=250;for(let n=0;n<Math.ceil(1/dt);n++)e.integrateBody(u,dt,true);assert.equal(u.y,1000);assert(e.grounded(u));
 rows.push({kind:'overlap walk and landing',cls,dt,direction});
}
console.log('PASS overlap',rows.length);
// A buried lower floor remains invalid; the roof above a cave does not attract
// feet through its solid underside, and one-way platforms allow ascent.
{
 const q=fixture(),{e,u}=q;setup(q,[solid('roof',0,500,2000,100),solid('floor',0,1000,2000),solid('buried',100,1050,1000)]);
 place(u,{x:550,y:1000});assert(e.grounded(u));assert.equal(e.contactSurface(550,1049,1051),null);for(let i=0;i<60;i++)e.integrateBody(u,1/60,true);assert.equal(u.y,1000);
 u.y=850;u.vy=-600;u.jumping=true;for(let i=0;i<60;i++)e.integrateBody(u,1/120,true);assert(u.y-u.h>=599,'jump passed through solid cave ceiling');
 setup(q,[solid('oneway',0,800,2000,30,{oneWay:true}),solid('floor',0,1400,2000)]);place(u,{x:550,y:1100});u.vy=-900;u.jumping=true;let above=false;for(let i=0;i<300;i++){e.integrateBody(u,1/120,true);above ||= u.y<800;}assert(above);assert.equal(u.y,800);assert(e.grounded(u));
 rows.push({kind:'buried floors, cave ceiling and one-way ascent'});
}
console.log('PASS cave/one-way');
// Grounded queries are geometric and preserve genuine flight/knockback gates.
{
 const q=fixture(),{e,u}=q;setup(q,[solid('floor',0,1000,2000)]);place(u,{x:550,y:1000});
 for(const flags of [{y:980},{airborne:true},{jumping:true},{vx:20},{vy:80}]){place(u,{x:550,y:1000});Object.assign(u,flags);assert(!e.grounded(u));assert.equal(e.fire('A01',30,.4),false);}
 place(u,{x:550,y:1000});u.vx=300;for(let i=0;i<240;i++)e.integrateBody(u,1/120,true);assert(e.grounded(u));assert(u.x>550&&u.x<900,'ground friction changed into a teleport');
 setup(q,[solid('left',0,1000,500),solid('right',700,1300,1300)]);place(u,{x:480,y:1000});for(let i=0;i<20;i++){e.walk(u,1,1/60);e.integrateBody(u,1/60,true);}assert(u.y>1001&&!e.grounded(u),'a real gap must still cause a fall');
 rows.push({kind:'air, jump, knockback and real gap guards'});
}
console.log('PASS grounded guards');
// Contour bends and tiny seams do not need a jump, and a hidden narrow ridge
// cannot be traversed by a straight chord through the support polygon.
for(const dt of steps)for(const direction of [-1,1]){
 const q=fixture(),{e,u,b}=q,pts=[{x:0,y:1000},{x:502,y:1000},{x:504,y:998},{x:506,y:1000},{x:2000,y:1000},{x:2000,y:2000},{x:0,y:2000}];
 setup(q,[solid('contour',0,998,2000,1002,{vertices:pts})]);place(u,{x:direction>0?490:520,y:1000});for(let i=0;i<Math.ceil(.25/dt);i++){e.walk(u,direction,dt);e.integrateBody(u,dt,true);clearFeet(b,u,'contour');assert(e.grounded(u));}assert(direction>0?u.x>515:u.x<495);
 rows.push({kind:'contour bend sweep',dt,direction});
}
// A vertical rise inside the current support polygon cannot be skipped as if
// it were the harmless supporting floor; leaving it requires a real jump.
for(const dt of steps)for(const direction of [-1,1]){
 const q=fixture(),{e,u,b}=q,pts=direction>0?[{x:0,y:1000},{x:550,y:1000},{x:550,y:900},{x:2000,y:900},{x:2000,y:2000},{x:0,y:2000}]:[{x:0,y:900},{x:550,y:900},{x:550,y:1000},{x:2000,y:1000},{x:2000,y:2000},{x:0,y:2000}];
 setup(q,[solid('same-solid-wall',0,900,2000,1100,{vertices:pts})]);place(u,{x:direction>0?530:570,y:1000});
 for(let i=0;i<Math.ceil(.5/dt);i++){e.walk(u,direction,dt);e.integrateBody(u,dt,true);clearFeet(b,u,'same-solid wall');}
 assert(direction>0?u.x<550:u.x>550);assert(e.grounded(u));assert(e.jump(u));rows.push({kind:'same-solid wall',dt,direction});
}
// A connected cave roof is not exempt merely because the floor belongs to
// the same polygon. Adequate headroom stays traversable for every body.
for(const cls of classes)for(const dt of [1/120,1/30])for(const clearance of ['low','clear'])for(const mode of ['walk','impulse']){
 const q=fixture(1,cls),{e,u,b}=q,roofBottom=1000-(clearance==='low'?u.h*.55:u.h+12),pts=[{x:0,y:1000},{x:1200,y:1000},{x:1200,y:roofBottom},{x:650,y:roofBottom},{x:650,y:700},{x:2000,y:700},{x:2000,y:2400},{x:0,y:2400}];
 setup(q,[solid('connected-cave',0,700,2000,1700,{vertices:pts})]);place(u,{x:620,y:1000});if(mode==='impulse')u.vx=400;
 for(let i=0;i<Math.ceil(.6/dt);i++){if(mode==='walk')e.walk(u,1,dt);e.integrateBody(u,dt,true);assert(!C.terrainContains(b.terrain[0],u.x,u.y-u.h+7),`${cls}/${dt}/${clearance}/${mode}: head entered connected cave roof`);clearFeet(b,u,'connected cave');}
 if(clearance==='low')assert(u.x<650);else assert(u.x>660);rows.push({kind:'connected cave clearance',cls,dt,clearance,mode});
}
console.log('PASS contour',rows.length);
// Actual authored surfaces: all 20 stages, all four collision bodies, both
// directions and common frame steps. Start on exposed tops, then let real
// walk/integrate decide contacts; never correct an actor during the run.
for(let stage=1;stage<=20;stage++){console.log('Authored stage',stage);
 const seed=fixture(stage),samples=[];
 for(const t of seed.b.terrain){if(t.broken)continue;const ps=C.poly(t);for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];if(z.x-a.x<3)continue;const p={x:(a.x+z.x)/2,y:(a.y+z.y)/2};if(p.x<30||p.x>seed.b.width-30||!C.exposedSurface(seed.b.terrain,t,p.x,p.y))continue;samples.push({...p,t:t.id,slope:(z.y-a.y)/(z.x-a.x)});}}
 const chosen=[samples[0],samples[Math.floor(samples.length/2)],samples.at(-1),samples.find(p=>Math.abs(p.slope)>1.35),samples.find(p=>p.t.includes('collision'))].filter((p,i,a)=>p&&a.indexOf(p)===i);
 assert(chosen.length>=2,`stage${stage}: insufficient exposed samples`);
 for(const cls of classes)for(const dt of [1/120,1/60,1/30])for(const direction of [-1,1])for(const p of chosen){
  const q=fixture(stage,cls),{e,u,b}=q;place(u,p);assert(e.grounded(u),`stage${stage}/${p.t}: initial physical support missing`);
  for(let i=0;i<Math.ceil(.3/dt);i++){e.walk(u,direction,dt);e.integrateBody(u,dt,true);clearFeet(b,u,`stage${stage}/${cls}/${dt}/${direction}/${p.t}`);assert(Number.isFinite(u.x)&&Number.isFinite(u.y));}
  rows.push({kind:'authored contact traversal',stage,cls,dt,direction,terrain:p.t,x:u.x,y:u.y});
 }
}
const out='_local/reports/ground-contact';await mkdir(out,{recursive:true});await writeFile(`${out}/regression.json`,JSON.stringify({cases:rows.length,scope:'Engine contact/commands/save and isolated authored geometry probes; not a campaign clear or browser input test',rows},null,2)+'\n');console.log(`PASS ground contact: ${rows.length} cases, 20 stages, four bodies, real jump/fire gates and save roundtrip`);
