// Real App export/import/Continue, with DOM/storage/download doubles only.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{C}=h,rows=[];
const snapshot=u=>plain({x:u.x,y:u.y,vx:u.vx,vy:u.vy,jumping:u.jumping,platformDrop:u.platformDrop,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft});
for(const cls of C.CLASS_IDS)for(const [phase,age]of [['prepare',0],['prepare',.09],['fall',0],['fall',.03],['fall',.30],['land',0],['land',.12]]){
 const profile=h.profileThrough(11);profile.settings.debugMode=false;const a=h.load(profile);a.launch(11);h.finish(a);const e=a.engine,b=e.b,u=b.units.find(u=>u.side===0&&u.cls===cls);
 Object.assign(u,{x:700,y:800,vx:0,vy:0,airborne:false,jumping:false,acted:false,moving:0});
 Object.assign(b,{units:[u],active:u.id,phase:'aim',side:0,width:2400,height:3000,terrain:[{id:'top',x:300,y:800,w:1000,h:30,mat:'wood',hp:99999,maxHp:99999,oneWay:true},{id:'bottom',x:0,y:1060,w:2200,h:1000,mat:'rock',hp:99999,maxHp:99999}],waters:[],projectiles:[],drafts:[],honroGeometryReady:true});b.sceneVersion++;e.checkEnd=()=>false;
 assert(e.drop());let guard=0;while(u.platformDrop?.phase!==phase||u.platformDrop.elapsed+1e-7<age){e.integrateBody(u,1/240);assert(++guard<600,`${cls} ${phase} ${age}`);}
 const before=snapshot(u),terrain=plain(b.terrain);a.export();const exported=await h.exported();assert.deepEqual(snapshot(exported.honroBattle.units[0]),before);
 await h.import(exported);a.continue();h.finish(a);let resumed=a.engine.active;assert.deepEqual(snapshot(resumed),before,`${cls} ${phase} app roundtrip`);assert.deepEqual(plain(a.engine.b.terrain),terrain);
 a.export();await h.import(await h.exported());a.continue();h.finish(a);resumed=a.engine.active;assert.deepEqual(snapshot(resumed),before,'Repeated Continue preserves exact stage');
 for(let n=0;n<600;n++)a.engine.integrateBody(resumed,1/240);assert.equal(resumed.y,1060);assert(!resumed.platformDrop);assert(a.engine.grounded(resumed));assert.equal(resumed.hp,before.hp);assert.equal(resumed.moveLeft,before.moveLeft);rows.push({cls,phase,age,afterY:resumed.y});
}
await mkdir('_local/reports/platform-drop',{recursive:true});await writeFile('_local/reports/platform-drop/save.json',JSON.stringify({rows,scope:'Real App export/import/Continue with DOM/storage/download doubles; no browser claim.'},null,2)+'\n');console.log(`PASS ${rows.length} four-party drop preparation/descent/landing save boundaries, twice each`);
