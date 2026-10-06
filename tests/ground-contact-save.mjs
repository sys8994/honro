// Production App export/import/Continue, with only DOM/storage/download doubles.
// Explicit geometry probes are not campaign-completion evidence.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C}=h,classes=['archer','mage','knight','occultist'],rows=[];
const base={archer:'A01',mage:'M01',knight:'S01',occultist:'O01'};
function fixture(stage=1,cls='archer'){
 const p=h.profileThrough(10);p.settings.debugMode=false;const a=h.load(p);a.launch(stage);h.finish(a);const b=a.engine.b,start=a.engine.active;
 const existing=b.units.find(u=>u.side===0&&u.cls===cls),u=existing?plain(existing):C.makeUnit(cls,0,start.x,start.y);
 if(!existing)C.applyHero(u,b.heroes[cls],true);Object.assign(u,{id:'saved-contact-probe',loadout:[base[cls]],acted:false});
 b.units=[u];b.active=u.id;b.phase='aim';b.side=0;b.projectiles=[];b.honroGeometryReady=true;a.engine.checkEnd=()=>false;return{a,b,u,e:a.engine};
}
const solid=(id,x,y,w,h=1200,extra={})=>({id,x,y,w,h,mat:'rock',hp:99999,maxHp:99999,...extra});
function geometry(q,terrain){q.b.terrain=terrain;q.b.sceneVersion++;q.b.width=2400;q.b.height=3400;q.b.waters=[];}
function position(u,x,y){Object.assign(u,{x,y,vx:0,vy:0,airborne:false,jumping:false,acted:false});}
const retained=u=>plain({x:u.x,y:u.y,vx:u.vx,vy:u.vy,airborne:u.airborne,jumping:u.jumping,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,fallApexY:u.fallApexY});
async function roundTrip(q,label,{recover=false}={}){
 const before=retained(q.u),terrain=plain(q.b.terrain),recoveries=q.b.honroContactRecoveries?.length||0;
 q.a.export();const p=await h.exported();assert.deepEqual(retained(p.honroBattle.units.find(u=>u.id===q.u.id)),before,'export preserves the live pose');
 await h.import(p);q.a.continue();h.finish(q.a);let b=q.a.engine.b,u=q.a.engine.active;
 assert.deepEqual(plain(b.terrain),terrain,label+': import must not rewrite terrain');
 if(recover){assert(Math.hypot(u.x-before.x,u.y-before.y)>.5,label+': genuine burial must recover');assert(C.validTerrainContactPose(b.terrain,u),label+': recovery must find physically clear support');assert.equal(b.honroContactRecoveries.length,recoveries+1);assert.equal(u.hp,before.hp);assert.equal(u.focus,before.focus);assert.equal(u.moveLeft,before.moveLeft);}
 else{assert.deepEqual(retained(u),before,label+': supported/falling pose moved on App continue');assert.equal(b.honroContactRecoveries?.length||0,recoveries);}
 // A second import/Continue must neither repeat a repair nor drift a valid pose.
 const once=retained(u);q.a.export();await h.import(await h.exported());q.a.continue();h.finish(q.a);b=q.a.engine.b;u=q.a.engine.active;assert.deepEqual(retained(u),once,label+': repeated load must be stable');
 rows.push({label,recover,before,after:retained(u)});return q.a;
}
// Four real body shapes on the screenshot descent and its nearby steep joins.
for(const cls of classes)for(const x of [1271,1275,1287.894154123141,1300,1328,1568]){
 const q=fixture(5,cls),t=q.b.terrain.find(t=>t.id==='valley-floor');position(q.u,x,C.topAt(t,x));
 assert(q.e.grounded(q.u));assert(C.validTerrainContactPose(q.b.terrain,q.u),`${cls}/${x}: valid steep contact rejected`);
 const a=await roundTrip(q,`stage5 ${cls} steep x${x}`);assert(a.engine.grounded(a.engine.active));
}
// Reach the slope using ordinary engine movement, then call actual App export,
// file-import handler and Continue. No position correction after initialization.
for(const cls of classes){
 const q=fixture(5,cls);position(q.u,1467,2851);
 for(let i=0;i<240;i++){const x=q.u.x;q.e.move(-1,1/120);q.e.tick(1/120);if(Math.abs(x-q.u.x)<.001)break;}
 assert(q.e.jump(q.u));for(let i=0;i<30;i++){q.e.move(-1,1/120);q.e.tick(1/120);}for(let i=0;i<360;i++)q.e.tick(1/120);
 assert(q.u.x>1270&&q.u.x<1330);assert(q.e.grounded(q.u));const a=await roundTrip(q,`${cls} normal jump landing`);assert(a.engine.fire(base[cls],35,.35),'fire must remain available after App resume');
}
for(const cls of classes)for(const kind of ['flat','one-way','tiny-seam','overlap','steep-overlap','clear-cave','near-wall','deep-floor','buried-wall','low-cave','thin-roof','falling','jumping']){
 const q=fixture(1,cls),{u}=q;let recover=false;
 if(kind==='flat'||kind==='falling'||kind==='jumping'||kind==='deep-floor'){geometry(q,[solid('floor',0,1000,2200)]);position(u,700,kind==='deep-floor'?1036:kind==='falling'?820:kind==='jumping'?740:1000);if(kind==='falling')Object.assign(u,{vy:95,fallApexY:700});if(kind==='jumping')Object.assign(u,{vy:-220,jumping:true,fallApexY:740});recover=kind==='deep-floor';}
 if(kind==='tiny-seam'){geometry(q,[solid('left',0,1000,300,1500,{slope:240}),solid('right',301.5,1240,1200,1400,{slope:960})]);position(u,300.75,1240);assert(q.e.grounded(u));assert(C.validTerrainContactPose(q.b.terrain,u));}
 if(kind==='one-way'){geometry(q,[solid('platform',300,800,1400,35,{oneWay:true}),solid('floor',0,1400,2200)]);position(u,700,800);assert(C.validTerrainContactPose(q.b.terrain,u));}
 if(kind==='overlap'){geometry(q,[solid('a',0,1000,1000),solid('b',500,1000,1700)]);position(u,700,1000);}
 if(kind==='steep-overlap'){const points=[{x:0,y:500},{x:1000,y:2500},{x:2200,y:2500},{x:2200,y:3300},{x:0,y:3300}];geometry(q,[solid('a',0,500,2200,2800,{vertices:points}),solid('b',0,500,2200,2800,{vertices:plain(points)})]);position(u,400,1300);}
 if(kind==='near-wall'||kind==='buried-wall'){geometry(q,[solid('floor',0,1000,2200),solid('wall',750,700,180,500)]);position(u,kind==='near-wall'?743.9:800,1000);recover=kind==='buried-wall';}
 if(kind==='clear-cave'||kind==='low-cave'||kind==='thin-roof'){
  const bottom=1000-(kind==='clear-cave'?u.h+16:kind==='thin-roof'?u.h*.3:u.h*.55),top=kind==='thin-roof'?bottom-3:650;
  const vertices=[{x:0,y:1000},{x:1500,y:1000},{x:1500,y:bottom},{x:650,y:bottom},{x:650,y:top},{x:2200,y:top},{x:2200,y:3300},{x:0,y:3300}];
  geometry(q,[solid('connected-cave',0,top,2200,3300-top,{vertices})]);position(u,700,1000);recover=kind!=='clear-cave';
 }
 if(recover)assert.equal(C.validTerrainContactPose(q.b.terrain,u),false,kind+': burial cannot take the support exemption');
 await roundTrip(q,`${cls} ${kind}`,{recover});
}
// Preserve old stone geometry as well as the raised canonical instance. Walk to
// the actual stopped pose; the save fix may not replace or mutate either map.
for(const variant of ['original','repaired']){
 // Resolve the authored repair from its canonical source.
 const {ACT1_STONE_REPAIR:repair}=await import('../tools/map-forge/act1-collision-repair.mjs');
 const source=plain(g.HONRO_PROJECT),instance=source.stages[2].elements.find(e=>e.id===repair.elementId);instance.y=variant==='original'?repair.fromY:repair.toY;
 const keep=g.HONRO_PROJECT;g.HONRO_PROJECT=source;const old=fixture(3);g.HONRO_PROJECT=keep;
 for(let i=0;i<1000;i++){const x=old.u.x;old.e.move(1,1/120);old.e.tick(1/120);if(Math.abs(old.u.x-x)<.001&&old.e.grounded(old.u))break;}
 assert(old.e.grounded(old.u));await roundTrip(old,`stage3 ${variant} stone save`);
}
await mkdir('_local/reports/ground-contact-save',{recursive:true});await writeFile('_local/reports/ground-contact-save/summary.json',JSON.stringify({cases:rows.length,rows,scope:'Production App save/import/Continue with DOM/storage doubles; no browser or normal-campaign claim'},null,2)+'\n');console.log(`PASS App ground-contact save: ${rows.length} cases, valid poses stable and actual burial recovered`);
