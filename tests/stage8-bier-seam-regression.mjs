/** Real R47 save, unchanged actors/HP/resources/terrain, paired navigators.
 * Only normal selection/movement/jump/tick inputs; not another chapter run. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {escortNavigator as originalNavigator} from './stage23-escort-fullplay-helper.mjs';
import {escortNavigator as fixedNavigator} from './stage8-bier-fullplay-helper.mjs';
import {auditQuarryEngine} from './stage12-quarry-fullplay-helper.mjs';
const source='tests/fixtures/stage8-bier-seam-saved.json',saved=JSON.parse(await readFile(source,'utf8')),h=await appHarness(),{g,C}=h;
const sha=x=>createHash('sha256').update(x).digest('hex'),rows=[];
for(const hero of ['p-archer','p-mage'])for(const [version,factory]of [['original',originalNavigator],['fixed',fixedNavigator],['fixed-fresh-route',fixedNavigator]]){
 let now=saved.virtualMs,frames=0;g.performance={now:()=>now};const app=h.load(plain(saved.profile));app.continue();const e=app.engine,b=e.b;
 assert.deepEqual(plain(b),saved.profile.honroBattle,'Exact whole-battle Continue before any input');
 const audit=auditQuarryEngine(b,e,()=>({round:b.round,frame:frames}));
 assert(app.canInput());if(e.active.id!==hero)assert(audit.production(()=>e.select(hero)),'Ordinary companion selection');
 const u=e.active;assert.equal(u.id,hero);const before=plain(u),events=[];
 const tick=()=>{now+=C.STEP*1000;e.tick(C.STEP);if(!app.dialogue)audit.production(()=>app.missionTick(C.STEP));audit.guard();frames++;};
 const record=row=>events.push({round:b.round,frame:frames,...plain(row)}),nav=factory(g,b,e,{tick,ready:()=>app.canInput(),record,stageId:8,routes:g.HONRO_PROJECT.stages[7].design.bier.routes,navigationState:version==='fixed-fresh-route'?null:plain(saved.navigatorState)});
 const stored=saved.navigatorState.nav.find(([id])=>id===hero)?.[1];assert(stored?.point?.id.startsWith('rally-'),'Use the original saved rally destination and route');
 nav.advance(u,plain(stored.point),stored.enemy);audit.guard();
 assert.equal(audit.log.externalWrites.length,0);assert.equal(audit.log.recoveries.length,0);assert.deepEqual(plain(b.items),saved.profile.honroBattle.items);
 const landed=events.filter(x=>x.op==='land'),seam=events.filter(x=>x.op==='walk-edge-jump');
 const row={hero,version,frames,from:{x:before.x,y:before.y,moveLeft:before.moveLeft,hp:before.hp},to:{x:u.x,y:u.y,moveLeft:u.moveLeft,hp:u.hp,support:nav.surface(u)},movementSpent:before.moveLeft-u.moveLeft,seam,landed,events,liveAudit:audit.log};rows.push(row);
 if(version==='original'){assert(Math.abs(u.x-5615)<3,'Original saved seam remains below the step');assert.equal(nav.surface(u),'s8-ground');assert(row.movementSpent>before.moveLeft*.9,'Original oscillation spends over90 percent of the ordinary movement budget');assert.equal(seam.length,0);}
 else{if(version==='fixed')assert.equal(seam.length,2,'Two disconnected saved walk edges become real short jumps');assert(landed.some(x=>x.support==='s8-court'&&x.matched),'Actual landing across the cover-to-court air gap');assert(landed.some(x=>x.support==='s8-central-step'&&x.matched),'Actual supported landing on the step');assert(u.y<before.y-450,'Ordinary route climbs back onto the court after both discontinuities');assert.equal(nav.surface(u),'s8-court','Both saved companions leave the lower layer through real jumps');assert.equal(u.hp,before.hp,'No damage/resource rescue was needed');assert(u.moveLeft>=0&&u.moveLeft<before.moveLeft,'Actual movement and jumps consume the original budget');}
 console.log(JSON.stringify({hero,version,frames,from:row.from,to:row.to,seamJumps:seam.length,landed:landed.map(x=>x.support),externalWrites:audit.log.externalWrites.length}));
}
await mkdir('_local/reports/encounter-density',{recursive:true});await writeFile('_local/reports/encounter-density/stage8-seam-saved-regression.json',JSON.stringify({schema:'honro-saved-navigation-regression/v1',observedAt:new Date().toISOString(),fixture:source,fixtureSha256:sha(await readFile(source)),originalHelperSha256:sha(await readFile('tests/stage23-escort-fullplay-helper.mjs')),fixedHelperSha256:sha(await readFile('tests/stage8-bier-fullplay-helper.mjs')),source:saved.origin,scope:'Same whole battle, same saved rally route, one bounded normal-input movement call per case. Not a chapter completion or browser proof.',rows},null,2)+'\n');
console.log('PASS both real saved companions cross the central-step seam with ordinary movement/jump inputs and no live writes');
