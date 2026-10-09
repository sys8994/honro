import {beforeCurrentStage16Temple} from './stage16-temple-history-helpers.mjs';
/** Current-stage invariants, bodies, objectives and finite warned defense.
 * Mission fixtures are deliberately separate from normal-input combat proof. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {authorStage17Worksite} from '../tools/map-forge/apply-stage17-worksite.mjs';
import {unitContract} from './act2-spatial-contract-helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,plain=x=>JSON.parse(JSON.stringify(x)),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),before=JSON.parse(await readFile('tests/fixtures/stage17-worksite-before.json','utf8')),project=beforeCurrentStage16Temple(JSON.parse(await readFile('shared/data/campaign.json','utf8'))),st=project.stages[16],checks=[];
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
const fixture=()=>{const q=battlefield(g,17);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct2.attach(q.app,q.e);return q;};
const boundary=q=>{q.app.actorBoundary=q.e.active.id;q.b.honroState.actorTurnSerial=(q.b.honroState.actorTurnSerial||0)+1;g.HonroMission.tick(q.app,0);};
// Validate and reverse only the later exact Stage16 delta before this original
// Stage17 author/library boundary. Current Stage17 gameplay still uses g unchanged.
const author=await authorStage17Worksite(plain(project),g,{art:!!st.design.worksite.art});
check('current generator is deterministic and canonical runtime/Workshop source matches',()=>{
 assert.equal(hash(author),hash(project),'canonical author');assert.deepEqual(plain(g.HONRO_PROJECT.stages[16]),st,'common bundle source');
 assert.deepEqual(plain(g.HonroMaps.normalize(project).stages[16]),st,'normalize');assert.deepEqual(plain(g.HonroMaps.finalize(project).stages[16]),st,'finalize');assert.equal(g.HonroSpaceLayout.validate(st).length,0);
});
check('all other29 stages and every existing asset are exact in original order',()=>{
 for(const row of before.otherStages)assert.equal(hash(project.stages.find(s=>s.id===row.id)),row.sha256,row.id);
 const ids=new Set(before.libraryIds);assert.equal(hash(project.library.filter(a=>ids.has(a.id))),before.librarySha256);assert.deepEqual(project.library.filter(a=>ids.has(a.id)).map(a=>a.id),before.libraryIds);
 for(const a of project.library.filter(a=>!ids.has(a.id)))assert(a.id.startsWith('stage17:worksite-'));
});
check('current seven objectives, fixed radii, defense5, initial36/elites8 and action3 stay exact',()=>{
 const q=fixture();assert.deepEqual(plain(q.b.honroAct2Steps),before.stage.initialState.honroAct2Steps);assert.equal(q.b.enemyLimit,3);assert.equal(q.e.alive(1).length,36);assert.equal(q.e.alive(1).filter(u=>u.honroAct2Elite).length,8);assert(!q.b.honroMarkers.some(m=>m.id.includes('collapse-pin')));
 assert.deepEqual(plain(g.HonroStageRules.stageParty(17)),['archer','mage','knight','occultist']);
 for(const s of q.b.honroAct2Steps){const m=q.b.honroMarkers.find(m=>m.id===s.id),site=st.design.space.sites[s.id];assert.equal(m.x,site.x);assert.equal(m.y,site.y);assert(C.validTerrainContactPose(q.b.terrain,{...q.e.active,x:site.x,y:site.y}),s.id+' actual support');}
});
check('original damage/body rules persist, only named elites and shared XP budget scale with the36-body roster',()=>{
 const q=fixture(),oldProject={...project,stages:project.stages.map(s=>s.metadata.stageId===17?before.stage:s)},old=g.HonroMaps.createBattle(before.stage,oldProject,q.profile,{origin:'campaign'}),oe=new C.Engine(old,()=>{},true),oa={...q.app,engine:oe};g.HonroAllies.attach(oa,oe);g.HonroEncounters.attach(oa,oe);g.HonroAct2.attach(oa,oe);
 for(const u of q.b.units){const previous=old.units.find(v=>v.id===u.id);if(previous){const a=unitContract(u),b=unitContract(previous);delete a.xpBudget;delete b.xpBudget;
   if(['a2-enemy-10','a2-enemy-21'].includes(u.id)){assert(Math.abs(u.combatBaseHp*1.25-previous.combatBaseHp)<1e-8);assert.equal(u.armor,.04);assert.equal(u.elite,false);assert(Math.abs(u.honroXpWeight*1.25-previous.honroXpWeight)<1e-8);for(const k of ['hp','maxHp','combatBaseHp','armor','elite','honroXpWeight']){delete a[k];delete b[k];}}
   assert.deepEqual(a,b,u.id+' same damage/body/skill contract');}
  const flying=g.HonroWorld.archetypes[u.honroVariant]?.flying;assert(flying?!g.HonroTerrain.intersects(q.b,u):C.validTerrainContactPose(q.b.terrain,u),u.id+' full body support/air');}
 assert.equal(q.e.alive(1).filter(u=>u.elite&&u.honroType!=='hoist').length,8,'No hidden factory-index elites');
 assert.equal(q.b.honroGrowth.limit.combat,old.honroGrowth.limit.combat,'Same total combat XP ceiling');assert.equal(q.b.honroGrowth.limit.end,old.honroGrowth.limit.end,'Same chapter completion XP target');
 const foes=q.e.alive(1);for(let i=0;i<foes.length;i++)for(let j=i+1;j<foes.length;j++)assert(Math.abs(foes[i].x-foes[j].x)>=foes[i].r+foes[j].r||Math.abs(foes[i].y-foes[j].y)>=Math.min(foes[i].h,foes[j].h),foes[i].id+'/'+foes[j].id+' overlap');
});
check('repair gate joins solid roof/floor and no optional path bypasses it',()=>{
 const q=fixture(),gate=q.b.terrain.find(t=>t.id==='gate-repair');assert(!gate.broken);const ps=C.poly(gate),top=Math.min(...ps.map(p=>p.y)),bottom=Math.max(...ps.map(p=>p.y));assert(top<3340&&bottom>4580);
 for(const route of st.design.space.routes.filter(r=>r.id!=='main'))assert(route.anchors.every(p=>p.x<9300));
 for(const y of [3420,3700,4200,4500])assert(g.HonroTerrain.intersects(q.b,{...q.e.active,x:9350,y}),`closed wall body ${y}`);
});
check('defense warns before a later actor boundary, alternates supported ground lanes and stops at10',()=>{
 const q=fixture(),a=g.HonroAct2.memory(q.b);for(const s of g.HonroAct2.steps(q.b)){if(s.id==='hold-hoist')break;a.done[s.id]=true;}
 const m=q.b.honroMarkers.find(m=>m.id==='hold-hoist');Object.assign(q.e.active,{x:m.x,y:m.y});q.b.terrain.find(t=>t.id==='gate-repair').broken=true;q.app.actorBoundary=null;
 for(let i=0;i<4;i++){
  const count=q.b.units.length;g.HonroMission.tick(q.app,0);const warning=g.HonroStage17Worksite.memory(q.b).warnings['hold-hoist-'+i*3];assert(warning);assert.equal(q.b.units.length,count,'warning is not a spawn');boundary(q);
  const born=q.b.units.filter(u=>u.honroSpawnSource==='hold-hoist-'+i*3);assert.equal(born.length,i===3?1:3,'defense wave '+i);for(const u of born)assert(C.validTerrainContactPose(q.b.terrain,u),u.id+' supported cart');
  assert(born.every(u=>u.honroWorksiteEntry===(i%2?'east':'west')));for(const u of born){u.hp=0;u.dead=true;} // State fixture: vacate the entry after checking this finite wave.
  q.b.round++;q.app.actorBoundary=null;
 }
 assert.equal(a.holds['hold-hoist'].spawned,10);const count=q.b.units.length;for(let i=0;i<7;i++){q.b.round++;boundary(q);}assert.equal(q.b.units.length,count);assert.equal(Object.keys(g.HonroStage17Worksite.memory(q.b).entries).length,4);
});
check('occupied entry waits atomically and saved warning survives without duplicate',()=>{
 const q=fixture(),a=g.HonroAct2.memory(q.b);for(const s of g.HonroAct2.steps(q.b)){if(s.id==='hold-hoist')break;a.done[s.id]=true;}
 const m=q.b.honroMarkers.find(m=>m.id==='hold-hoist');Object.assign(q.e.active,{x:m.x,y:m.y});const blocker=q.e.heroesAlive()[1],entry=q.b.honroWorksiteDefenseEntries[0];Object.assign(blocker,{x:entry.x,y:entry.y});q.app.actorBoundary=null;g.HonroMission.tick(q.app,0);const n=q.b.units.length;boundary(q);assert.equal(q.b.units.length,n);assert.equal(a.holds['hold-hoist'].spawned,0);
 const saved=plain(q.b),e=new C.Engine(saved,()=>{},true),app={...q.app,engine:e};g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);g.HonroAct2.attach(app,e);const hero=e.unit(blocker.id);hero.x=400;hero.y=4300;boundary({b:saved,e,app});assert.equal(saved.units.filter(u=>u.honroSpawnSource==='hold-hoist-0').length,3);boundary({b:saved,e,app});assert.equal(saved.units.filter(u=>u.honroSpawnSource==='hold-hoist-0').length,3);
});
check('a real pre-worksite battle resumes with its original geometry, bodies, resources and objective progress',()=>{
 const oldProject={...project,stages:project.stages.map(s=>s.metadata.stageId===17?before.stage:s)},profile=C.defaults();profile.recruited=['archer','mage','knight','occultist'];
 const old=g.HonroMaps.createBattle(before.stage,oldProject,profile,{origin:'campaign'}),engine=new C.Engine(old,()=>{},true),app={engine,stage:g.HONRO_CONTENT.stages[16],profile,training:false,done:false,event(){},sayLines(){},checkMission(){return false;}};
 g.HonroStageRules.sanitizeStageBattle(old);g.HonroAllies.attach(app,engine);g.HonroEncounters.attach(app,engine);g.HonroAct2.attach(app,engine);
 old.round=8;old.units.find(u=>u.side===1).hp=37;g.HonroAct2.memory(old).done['clear-works']=true;old.items.heal=1;
 const saved=plain(old),contract=b=>plain({width:b.width,height:b.height,terrain:b.terrain,worldTerrain:b.honroWorldTerrain,units:b.units,markers:b.honroMarkers,steps:b.honroAct2Steps,state:b.honroState,items:b.items,round:b.round}),frozen=contract(saved),e=new C.Engine(saved,()=>{},true),resumed={...app,engine:e};
 g.HonroStageRules.sanitizeStageBattle(saved);g.HonroAllies.attach(resumed,e);g.HonroEncounters.attach(resumed,e);g.HonroAct2.attach(resumed,e);
 assert.deepEqual(contract(saved),frozen);assert.equal(saved.width,8400);assert(!g.HonroStage17Worksite.active(saved));assert.equal(g.HonroAct2.current(saved).id,'brace');
});
await mkdir('_local/reports/stage17-worksite',{recursive:true});await writeFile('_local/reports/stage17-worksite/contracts.json',JSON.stringify({checks,scope:'State fixtures, source and physical body contracts only; not normal combat completion.'},null,2)+'\n');
