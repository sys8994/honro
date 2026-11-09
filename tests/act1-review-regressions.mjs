/** Production model and save lifecycle. Explicit approach/combat fixtures,
 * isolated bodies and movement refill; never a normal campaign/play claim. */
import assert from 'node:assert/strict';
import vm from 'node:vm';import {readFile} from 'node:fs/promises';
import {appHarness,plain,KEY} from './app-regression-helpers.mjs';
const h=await appHarness({productionStory:true}),g=h.g,C=g.HONRO_CORE;
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
function start(id){const p=h.profileThrough(id-1);for(const cls of p.recruited)p.heroes[cls].xp=C.xpAtLevel(g.HonroProgression.plan(id).entryLevel);const a=h.load(p);a.launch(id);return{a,b:a.engine.b,e:a.engine};}
for(const id of [4,6,7]){
 const{a,b,e}=start(id),u=b.units.find(u=>u.honroAlly),enemy=b.units.find(u=>u.side===1),hp=u.hp;
 g.HonroClearReport.begin(b,{fresh:true});e.hurt(u,251,enemy.id,true,undefined,undefined,'salheun');
 assert.equal(b.honroReport.other.npc.received,hp-u.hp);assert.equal(hp-u.hp,251);
 const snapshot=plain(b);a.profile.honroBattle=snapshot;const resumed=h.load(plain(a.profile));resumed.continue();
 assert.equal(resumed.engine.b.honroReport.other.npc.received,251);
 if(id===6){const r=g.HonroClearReport.freeze(b);assert.equal(r.npcDamageRevision,1);const legacy=plain(r);delete legacy.npcDamageRevision;delete legacy.npcDamagePartial;const before=JSON.stringify(legacy);assert(g.HonroClearReportUI.detail(legacy).includes('미집계'));assert.equal(JSON.stringify(legacy),before);}
 console.log('NPC damage and Continue',id,u.id,hp,u.hp);a.engine=null;resumed.engine=null;
}
{
 const{a,b,e}=start(3),boss=b.units.find(u=>u.id==='midboss-stage3');
 assert.equal(boss.maxHp,652);assert(Math.abs(boss.attack-.5738693883860637)<1e-9);
 assert(!b.terrain.some(t=>t.id.startsWith('place3-stone-')));
 const u=b.units.find(u=>u.id==='p-archer');b.units=[u];b.active=u.id;e.checkEnd=()=>false;
 Object.assign(u,{x:3030,y:C.topAt(b.terrain.find(t=>t.id==='ferry-ground'),3030),vx:0,vy:0});
 for(let i=0;i<300&&u.x<3550;i++){u.moveLeft=u.maxMove;e.walk(u,1,1/60);e.stepUnits(1/60);}
 assert(u.x>3550,'cleared lower rock route must no longer snag ordinary walking');a.engine=null;
}
{
 const{a,b,e}=start(5),u=b.units.find(u=>u.id==='p-mage'),t=b.terrain.find(t=>t.id==='stage5-timber-low');
 assert.equal(t.x,2020);b.units=[u];b.active=u.id;e.checkEnd=()=>false;
 Object.assign(u,{x:2210,y:C.topAt(t,2210),vx:0,vy:0});assert(e.jump(u));
 for(let i=0;i<180;i++){u.moveLeft=u.maxMove;if(u.x<2650)e.walk(u,1,1/60);e.stepUnits(1/60);if(u.x>2640&&e.grounded(u))break;}
 assert(u.x>2640&&e.grounded(u),'default jump reaches the middle rock/step');a.engine=null;
}
{
 const{a,b,e}=start(2),u=b.units.find(u=>u.id==='p-archer');b.units=[u];b.active=u.id;e.checkEnd=()=>false;const hp=u.hp;
 const support=()=>e.surface(u.x,u.y-5,u.y+5)?.t?.id;
 function walk(x,id){for(let i=0;i<500;i++){u.moveLeft=u.maxMove;if(Math.abs(u.x-x)>4)e.walk(u,Math.sign(x-u.x)*.7,1/60);e.stepUnits(1/60);if(Math.abs(u.x-x)<8&&e.grounded(u)&&support()===id)return;}assert.fail('descent walk '+id);}
 function drop(id){for(let i=0;i<35;i++)e.stepUnits(1/60);assert(e.drop(u));for(let i=0;i<300;i++){e.stepUnits(1/60);if(i>25&&e.grounded(u)&&support()===id)return;}assert.fail('descent drop '+id);}
 walk(1100,'left-tree-branch-upper');drop('left-tree-branch-middle');drop('left-descent-rest-upper');walk(1220,'left-descent-stone-high');walk(1300,'left-tree-branch-lower');drop('left-descent-stone-mid');walk(1075,'left-descent-stone-low');walk(900,'left-descent-rest-lower');walk(790,'canyon-ground');assert.equal(u.hp,hp);a.engine=null;
}
{
 const{a,b,e}=start(9),m=b.honroMarkers.find(m=>m.id==='receiver-west'),u=e.active;
 Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0});a.dialogue=null;a.turnNotice=null;
 assert.match(g.HonroInteractions.eligibility(a,m).reason,/적/);
 const near=e.alive(1).filter(v=>Math.abs(v.y-m.y)<=120&&Math.hypot(v.x-m.x,v.y-m.y)<220);
 assert(near.length);for(const v of near)Object.assign(v,{x:v.x+600,y:v.y});
 assert(g.HonroInteractions.eligibility(a,m).ok,'displacement clears installation without kills');assert.equal(b.kills,0);
 a.engine=null;
}
{
 const{a,b}=start(11),S=g.HonroProfileStore,before=JSON.stringify(b),packed=S.compactBattleArt(b),restored=plain(packed);
 assert(JSON.stringify(packed).length<3000000);assert.equal(JSON.stringify(b),before);
 const library=g.HONRO_PROJECT.library;g.HONRO_PROJECT.library=[];
 try{assert(S.restoreBattleArt(restored));assert.deepEqual(restored,plain(b));}finally{g.HONRO_PROJECT.library=library;}
 a.flushBattleSave();assert(JSON.parse(h.storage.get(KEY)).honroBattle);
 console.log('Stage11 inline/packed chars',before.length,JSON.stringify(packed).length);a.engine=null;
}
// The untouched canonical source supplies genuine pre-repair geography. Keep
// its battle/HP/resources/progress instead of replacing it on Continue.
{
 const{a,b}=start(5),target=g.HonroQuestTargets.records(b).find(t=>t.id==='cliff-cleat');
 for(const state of ['holding','notHolding','broken']){b.honroState.ritual={active:state==='holding'};target.broken=state==='broken';const text=g.HonroStoryContent.eventLines(a,{id:'lower-beasts'}).map(r=>r[1]).join(' ');assert(text.includes('산개')&&!text.includes('사슴'),state+' current event identity');}a.engine=null;
}
const original=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
for(const id of [2,3,5,9]){
 const p=h.profileThrough(id-1),st=original.stages.find(s=>s.metadata.stageId===id);
 const old=g.HonroMaps.createBattle(st,original,p,{origin:'campaign'});g.HonroStageRules.sanitizeStageBattle(old);if(id===5)g.HonroStage5Positioning.memory(old);if(id===9)g.HonroEncounterDensity.memory(old);
 const projection=b=>plain({terrain:b.terrain,units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft})),state:b.honroState});
 p.honroBattle=plain(old);const a=h.load(p);a.continue();assert.deepEqual(projection(a.engine.b),projection(old));assert.deepEqual(plain(a.profile.heroes),p.heroes);a.engine=null;
 console.log('Pre-repair Continue preserves geography, actors, resources and progress',id);
}
console.log('PASS targeted Act1 review and Stage11 self-contained save regressions');
