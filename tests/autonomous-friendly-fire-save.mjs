// Actual App export/import/Continue; isolated fixture and DOM/storage doubles only.
import assert from 'node:assert/strict';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{C}=h;
for(const kind of ['summon','combo','orbit'])for(const legacy of [false,true]){
 const app=h.load(h.profileThrough(22));app.launch(23);h.finish(app);const e=app.engine,b=e.b;
 const u=b.units.find(t=>t.side===0&&t.cls===(kind==='summon'?'occultist':'knight'));assert(u);
 Object.assign(u,{x:400,y:1500,acted:false,airborne:false,focus:999,maxFocus:999});
 const ally=C.makeUnit('knight',2,650,1500,{id:'resume-ally',honroAlly:true,honroProtected:true,hp:9999,maxHp:9999,armor:0,shield:0,fixed:true});
 const foe=C.makeUnit('knight',1,kind==='combo'?510:850,1500,{id:'resume-foe',hp:9999,maxHp:9999,armor:0,shield:0,fixed:true});
 Object.assign(b,{width:4000,height:2000,units:[u,ally,foe],terrain:[{id:'resume-floor',x:0,y:1500,w:4000,h:500,mat:'rock',hp:99999,maxHp:99999}],waters:[],projectiles:[],drafts:[],fields:[],active:u.id,side:0,phase:'aim'});b.sceneVersion++;
 e.canAct=()=>true;e.grounded=()=>true;e.checkEnd=()=>false;
 if(kind==='summon'){const ghost=e.spawnSummon(u,'lantern',420,1500);e.launchSummonBolt(ghost,foe);b.phase='flight';}
 else {const id=kind==='combo'?'S07':'S12';u.ranks[id]=1;u.loadout=[id];assert(e.fire(id,0,.7));if(kind==='orbit')Object.assign(b.projectiles[0],{x:500,y:1460,vx:600,vy:0,gravityScale:0,wind:0});}
 if(legacy)for(const p of b.projectiles)delete p.autonomous;
 const before=plain({projectiles:b.projectiles,action:u.meleeAction,units:b.units.map(t=>({id:t.id,owner:t.summonOwner}))});
 app.export();await h.import(await h.exported());app.continue();h.finish(app);const resumed=app.engine;
 assert.deepEqual(plain({projectiles:resumed.b.projectiles,action:resumed.unit(u.id).meleeAction,units:resumed.b.units.map(t=>({id:t.id,owner:t.summonOwner}))}),before,kind+' Continue preserves attack provenance and owners');
 resumed.checkEnd=()=>false;resumed.random=()=>.99;const hp=resumed.unit(ally.id).hp;
 for(let n=0;n<240&&(resumed.b.projectiles.length||resumed.unit(u.id).meleeAction);n++)resumed.tick(C.STEP);
 assert.equal(resumed.unit(ally.id).hp,hp,kind+' protected ally after Continue');assert(resumed.unit(foe.id).hp<foe.maxHp,kind+' enemy still damaged after Continue');
}
console.log('PASS six real App export/import/Continue cases: summon/combo/orbit, new and legacy provenance');
// A03 auto-retargeted continuation passes through the real App save boundary.
for(const legacy of [false,true]){
 const app=h.load(h.profileThrough(22));app.launch(23);h.finish(app);const e=app.engine,b=e.b,u=b.units.find(t=>t.side===0&&t.cls==='archer');
 Object.assign(u,{x:200,y:1500,acted:false,airborne:false,focus:999,maxFocus:999,loadout:['A03'],ranks:{A03:8}});
 const unit=(id,side,x)=>C.makeUnit('knight',side,x,1500,{id,hp:9999,maxHp:9999,armor:0,shield:0,fixed:true});
 const first=unit('chain-first',1,600),ally=unit('chain-ally',2,700),last=unit('chain-last',1,800);
 Object.assign(b,{width:4000,height:2000,units:[u,first,ally,last],terrain:[{id:'floor',x:0,y:1500,w:4000,h:500,mat:'rock',hp:99999,maxHp:99999}],waters:[],projectiles:[],drafts:[],fields:[],active:u.id,side:0,phase:'aim'});b.sceneVersion++;e.canAct=()=>true;e.grounded=()=>true;e.checkEnd=()=>false;
 assert(e.fire('A03',0,.7));const p=b.projectiles[0];Object.assign(p,{x:580,y:1460,vx:900,vy:0,gravityScale:0,wind:0});
 for(let n=0;n<30&&!p.chain;n++)e.stepProjectile(p,C.STEP);assert.equal(p.chain,1);if(legacy)delete p.autonomous;
 ally.honroAlly=true;const before=plain(b.projectiles);app.export();await h.import(await h.exported());app.continue();h.finish(app);const resumed=app.engine;assert.deepEqual(plain(resumed.b.projectiles),before);resumed.checkEnd=()=>false;resumed.random=()=>.99;
 for(let n=0;n<150&&resumed.b.projectiles.length;n++)resumed.tick(C.STEP);
 assert.equal(resumed.unit(ally.id).hp,9999);assert(resumed.unit(last.id).hp<9999);
}
console.log('PASS A03 current/legacy automatic-chain real App export/import/Continue');
