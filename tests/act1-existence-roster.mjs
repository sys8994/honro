import assert from 'node:assert/strict';
import {beforeExistenceRoster} from './existence-delta-helpers.mjs';
import {beforeObjectiveRevision} from './objective-delta-helpers.mjs';
import {beforePlatformPassages} from './platform-passage-delta-helpers.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const plain=v=>JSON.parse(JSON.stringify(v)),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,project=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
const baseline=JSON.parse(await readFile('tests/fixtures/act1-roster-before.json','utf8')),beforeSkills=JSON.parse(await readFile('tests/fixtures/existence-profiles-before.json','utf8')).skills;
// Raw canonical JSON and bundled Game/Workshop project use the same idempotent authoring.
assert.equal(hash(g.HonroAct1Roster.author(plain(project))),hash(project));
assert.equal(hash(g.HonroAct1Roster.author(plain(project)).stages.slice(10)),hash(project.stages.slice(10)),'All later acts are untouched, including future production maps');
const historical=beforePlatformPassages(beforeObjectiveRevision(project,{stages:[]}).project);
assert.equal(hash(historical.stages.slice(10,20)),baseline.laterActsHash,'Act 2 source outside the exact approved objective revision is unchanged');
const original=beforeExistenceRoster(historical);
for(const {id,hash:expected} of baseline.stageHashes)assert.equal(hash(original.stages[id-1]),expected,'Only seven explicitly reviewed units change: '+id);
assert.equal(hash(g.HonroAct1Roster.author(plain(original))),hash(historical),'Author reproduces exact reviewed roster');
const spirit=u=>['ghost','shade','lantern'].includes(u.honroVariant||u.honroType),summary=[];
for(let id=1;id<=10;id++){
 const after=battlefield(g,id),savedProject=g.HONRO_PROJECT;
 const oldProject=plain(savedProject);for(const old of baseline.units.filter(x=>x.stage===id)){const s=oldProject.stages[id-1];s.units[s.units.findIndex(u=>u.id===old.unit.id)]=old.unit;}
 g.HONRO_PROJECT=oldProject;const before=battlefield(g,id);g.HONRO_PROJECT=savedProject;
 const current=after.b.units.filter(u=>u.side===1),old=before.b.units.filter(u=>u.side===1);
 assert.equal(current.length,old.length);assert(!after.e.heroesAlive().some(u=>u.cls==='occultist'),'Sodan unavailable in Act 1');
 const ordinary=current.filter(u=>!u.boss&&!u.honroMidboss&&!u.honroFinalBoss);
 assert(ordinary.filter(spirit).length/ordinary.length<=.125,'Spirit quota stage '+id);if(id<=6)assert(!ordinary.some(spirit));
 for(const u of current){const was=old.find(v=>v.id===u.id);for(const k of ['hp','maxHp','combatBaseHp','armor','elite'])assert.equal(u[k],was[k],`${id}/${u.id} ${k} budget`);assert(Math.abs(g.HonroAct1Roster.attackBudget(u)*u.attack-g.HonroAct1Roster.attackBudget(was)*was.attack)<1e-8,'Outgoing damage budget preserved');if(u.boss||u.honroMidboss||u.honroFinalBoss)assert.deepEqual(plain(u),plain(was),'Named boss unchanged');}
 assert.deepEqual(plain(after.b.honroEvents),plain(before.b.honroEvents),'waves unchanged');
 // Controlled no-crit standing body hits. Existing effective(), hurt(), armor and rounding run.
 // Sum of repeated single-hit kill counts is a workload proxy, not elapsed combat time or full clear.
 function sample(q,skills,oldProfiles){const results=[];for(const hero of q.e.heroesAlive()){
  const sid=skills[hero.cls];if(!sid)continue;const s=C.SKILLS[sid],attack=oldProfiles?beforeSkills.find(v=>v.id===sid).existenceAttack:s.existenceAttack;
  const hits=[];for(const target of q.b.units.filter(u=>u.side===1)){
   const b=plain(q.b),attacker=b.units.find(u=>u.id===hero.id),foe=b.units.find(u=>u.id===target.id);attacker.critChance=0;attacker.ranks[sid]=1;attacker.x=foe.x-900;attacker.y=foe.y;
   b.active=attacker.id;b.phase='aim';b.side=0;b.shot=1;b.units=[attacker,foe];const e=new C.Engine(b);e.checkEnd=()=>false;e.random=()=>.99;
   const damage=e.effective(s,attacker).damage,p={skill:sid,owner:attacker.id,side:0,shot:1,skillRank:1,damage,x:foe.x,y:foe.y-foe.h*.5,launchX:attacker.x,launchY:attacker.y-foe.h*.5,apexY:attacker.y-foe.h*.5,vx:800,vy:0,mode:s.mode,hit:[],existenceAttack:attack};
   const hp=foe.hp;e.hurt(foe,damage,attacker.id,true,p,{x:foe.x,y:foe.y-foe.h*.5});const dealt=hp-foe.hp;
   assert(dealt>0);hits.push({id:target.id,kind:target.honroVariant||target.role,elite:!!target.elite,boss:!!(target.boss||target.honroMidboss||target.honroFinalBoss),damage:dealt,hitsToKill:Math.ceil(hp/dealt)});
  }results.push({class:hero.cls,skill:sid,averageDamage:hits.reduce((n,v)=>n+v.damage,0)/hits.length,hitWorkload:hits.reduce((n,v)=>n+v.hitsToKill,0),hits});}return results;}
 const skills={archer:'A01',mage:'M01',knight:'S09'},previous=sample(before,skills,true),next=sample(after,skills,false);
 const archerBefore=previous.find(x=>x.class==='archer'),archerAfter=next.find(x=>x.class==='archer');assert(archerAfter.hitWorkload<=archerBefore.hitWorkload,'Seolo baseline workload must not worsen');
 summary.push({stage:id,party:after.e.heroesAlive().map(u=>u.cls),enemies:ordinary.length,spiritsBefore:old.filter(spirit).length,spiritsAfter:ordinary.filter(spirit).length,before:previous,after:next});
}
// No roster migration is installed in validate/sanitize: a started battle is an immutable encounter.
const {appHarness}=await import('./app-regression-helpers.mjs');
const harness=await appHarness(),app=harness.load(harness.profileThrough(2));app.launch(3);harness.finish(app);
const old=baseline.units.find(x=>x.stage===3).unit,target=app.engine.b.units.find(u=>u.id===old.id);
Object.assign(target,plain(old),{hp:47,acted:true,awake:true,vx:17,vy:-5});
const retained=u=>plain(Object.fromEntries(['honroVariant','honroType','cls','role','hp','maxHp','x','y','vx','vy','acted','dead','loadout','ranks','cooldowns'].filter(k=>u[k]!==undefined).map(k=>[k,u[k]])));
harness.g.HonroStageRules.sanitizeStageBattle(app.engine.b);const state=retained(target);
app.export();const exported=await harness.exported();assert.deepEqual(retained(exported.honroBattle.units.find(u=>u.id===old.id)),state);
await harness.import(exported);app.continue();harness.finish(app);
assert.deepEqual(retained(app.engine.b.units.find(u=>u.id===old.id)),state,'App import/Continue preserves saved species, HP, position, action and velocity');
await mkdir('_local/reports/existence',{recursive:true});await writeFile('_local/reports/existence/act1-damage-workload.json',JSON.stringify({scope:'Deterministic direct-hit workload at stage entry level, no crit, rank 1; not a full normal-combat clear or human TTK',rows:summary},null,2)+'\n');
console.log(summary.map(r=>{const a=r.before.find(x=>x.class==='archer'),z=r.after.find(x=>x.class==='archer');return `Stage ${r.stage}: spirits ${r.spiritsBefore}->${r.spiritsAfter}/${r.enemies}; Seolo hit workload ${a.hitWorkload}->${z.hitWorkload}`;}).join('\n'));
console.log('PASS: authored/runtime roster, body sensitivity, waves, stage-entry damage, bosses, later acts and live-save preservation');
