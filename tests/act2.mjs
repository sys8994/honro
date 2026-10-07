import {act12Project} from './campaign-scope-helpers.mjs';
import {applyAct2SceneComposition} from '../tools/environment/act2-scene-composition.mjs';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import vm from 'node:vm';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {openRoute,assertStanding} from './act2-spatial-test-helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,plain=x=>JSON.parse(JSON.stringify(x)),rows=[];
const check=(name,fn)=>{fn();rows.push({name,passed:true});console.log('PASS',name);};
const fixture=id=>{const q=battlefield(g,id);g.HonroAct2.attach(q.app,q.e);return q;};
check('30 canonical maps retain independent Act 2 objectives and four companions',()=>{
 assert.equal(g.HONRO_PROJECT.stages.length,30);assert.equal(g.HONRO_CONTENT.stages.length,30);
 assert.deepEqual(plain(g.HonroStageRules.stageParty(10)),['archer','mage','knight']);
 for(let id=11;id<=20;id++){const {b,e,st}=fixture(id);assert.equal(e.heroesAlive().length,4);assert.deepEqual(plain(st.requires),[id-1]);assert(!g.HonroObjectives.state(b,st).complete);assert(g.HonroAct2.entry({stage:st}).length<=8);assert(b.units.every(u=>Number.isFinite(u.attack)&&Number.isFinite(u.hp)));assert.equal(g.HonroDifficulty.audit(st,b).issues.length,0);}
});
vm.runInContext(await readFile('workshop/recipes/act2-caves.js','utf8'),g);
const regeneratedAct2=g.HonroMaps.finalize(await applyAct2SceneComposition(g.HonroAct2Design.build(act12Project(g.HONRO_PROJECT))));
check('Act 2 recipe is deterministic and preserves the existing ten maps',()=>{
 const authored=regeneratedAct2;assert.deepEqual(plain(authored),plain(act12Project(g.HONRO_PROJECT)));assert.deepEqual(plain(g.HonroMaps.normalize(authored)),plain(authored));
});
check('Recruit repairs old Act 1 completion without changing skills, XP or Act 1 roster',()=>{
 const p=C.defaults();p.cleared[10]={rounds:20};p.recruited=['archer','mage','knight'];p.heroes.archer.xp=C.xpAtLevel(12);const old=plain(p.heroes.archer);g.HonroAct2.recruit(p);assert(p.recruited.includes('occultist'));assert(C.levelOf(p.heroes.occultist)>=12);assert.deepEqual(plain(p.heroes.archer),old);const once=plain(p);g.HonroAct2.recruit(p);assert.deepEqual(plain(p),once);
});
check('Spirits resist form, accept soul, and O08 enables party form damage',()=>{
 const {e,b}=fixture(11),u=b.units.find(u=>u.honroSpirit),sodan=e.heroesAlive().find(u=>u.cls==='occultist');
 const form=C.existenceMultiplier({form:1,qi:0,soul:0},u),soul=C.existenceMultiplier({form:0,qi:0,soul:1},u);assert(form<=.1&&soul>1.2);e.manifest(u,sodan,1);assert(C.existenceMultiplier({form:1,qi:0,soul:0},u)>.9);assert(u.manifestedUntil>=b.round);
});
check('Resident extraction is nonlethal, one-time, and player damage cannot kill the host',()=>{
 const {e,b,app}=fixture(14),m=b.honroMarkers.find(m=>m.id==='family-upper'),resident=e.unit(m.target),before=resident.hp;
 e.hurt(resident,1e9,e.active.id);assert.equal(resident.hp,before);
 const sodan=e.heroesAlive().find(u=>u.cls==='occultist');b.active=sodan.id;
 // Isolate the rescue after its required upper-village clear. A live host spirit
 // must be weakened and the immediate approach secured before extraction.
 g.HonroAct2.memory(b).done['clear-upper']=true;
 for(const u of e.alive(1))if(u.id!==m.spiritId&&Math.hypot(u.x-m.x,u.y-m.y)<360){u.hp=0;u.dead=true;}
 const spirit=e.unit(m.spiritId);spirit.hp=Math.floor(spirit.maxHp*.35);
 assert(g.HonroAct2.use(app,m));assert(resident.honroResolved&&!resident.dead);assert(spirit.dead);assert.equal(g.HonroAct2.memory(b).rescued.length,1);assert.equal(g.HonroAct2.use(app,m),false);
});
check('Continuous cave ceiling blocks a high shot while the bow target hangs below it',()=>{
 const {b,e}=fixture(15),u=e.active;u.angle=90;
 assert(b.terrain.some(t=>t.honroCeiling));const predicted=e.predict(u,C.SKILLS.A01,90,1,undefined,true);assert(b.terrain.find(t=>t.id===predicted.terrain)?.honroCeiling,'high shot must meet real cave collision');assert(e.fire('A01',90,1));
 let minY=Infinity;for(let i=0;i<500&&b.projectiles.length;i++){for(const p of [...b.projectiles]){minY=Math.min(minY,p.y);e.stepProjectile(p,1/120);}}
 assert.equal(b.projectiles.length,0);assert(minY>=predicted.y-20,`live arrow escaped predicted roof collision, minY=${minY}`);
 const target=b.honroMarkers.find(m=>m.id==='marker-shaft-pin'),step=b.honroAct2Steps.find(s=>s.id==='shaft-pin'),hanger=b.honroCaveHangingTarget,roof=b.terrain.find(t=>t.honroCeiling&&C.terrainContains(t,hanger.x,hanger.roofY-20));
 assert(target&&hanger&&step?.requiredClass==='archer');assert.equal(target.x,hanger.x);
 assert(C.terrainContains(roof,hanger.x,hanger.roofY-20));
 assert(!C.terrainContains(roof,hanger.x,target.y));
 assert(target.y>hanger.roofY+150,'target hangs inside the cavern, below the ceiling');
});
check('Breaking the unsupported brace creates a recoverable hazard, not a softlock',()=>{
 const {b,e,app}=fixture(17),t=b.terrain.find(t=>t.id==='collapse-pin');e.damageTerrain(t,1000);assert(g.HonroAct2.memory(b).collapse);assert(!b.terrain.find(t=>t.id==='gate-debris').broken);const m=b.honroMarkers.find(m=>m.id==='rebuild-brace');assert(!m.collected);g.HonroAct2.use(app,m);assert(g.HonroAct2.memory(b).rebuilt);assert(b.terrain.find(t=>t.id==='gate-debris').broken);
});
check('Rockfall changes the walkable route, and draining water keeps its bed below its surface',()=>{
 const {b,e}=fixture(12),floor=b.terrain.find(t=>t.id==='act2-floor'),restored=floor.honroRestoredVertices;assert(restored,'rockfall must retain a real route-restoration state');const sample=restored.map(p=>({x:p.x,y:p.y,old:C.topAt(floor,p.x,p.y)})).sort((a,b)=>(b.old-b.y)-(a.old-a.y))[0];assert(sample.old-sample.y>200,'restoration must change actual walkable terrain');e.damageTerrain(b.terrain.find(t=>t.id==='rock-pin'),1000);assert(Math.abs(C.topAt(floor,sample.x,sample.y)-sample.y)<.1);
 const q=fixture(15),water=q.b.waters[0],y=water.y,sluice=q.b.honroMarkers.find(m=>m.id==='sluice');q.b.honroState.act2.done['clear-water']=true;
 for(const u of q.e.alive(1))if(Math.hypot(u.x-sluice.x,u.y-sluice.y)<360){u.hp=0;u.dead=true;}
 assert(g.HonroAct2.use(q.app,sluice));const drained=q.b.waters[0];assert.equal(drained.y,y+120);assert(drained.bottom.slice(1,-1).every(p=>p.y>drained.y));assert(q.b.honroSurfaceZones.filter(z=>z.kind==='water-pool').every(z=>z.bottom.slice(1,-1).every(p=>p[1]>z.surface[0][1])));
});
check('Mandatory cave route seams remain exposed on actual authored surfaces',()=>{
 for(const id of [13,16,17,18,19]){const {b,e}=fixture(id);openRoute(b);const route=g.HONRO_PROJECT.stages[id-1].design.space.routes.find(r=>r.id==='main').anchors;for(const p of route)assertStanding(g,b,e,p,e.active,`${id}: mandatory route seam`);}
});
check('Mokjong is scenery; keeper cannot die and his suppression requires every objective',()=>{
 const {b,e}=fixture(18),boss=e.unit('act2-keeper');assert(!b.terrain.some(t=>t.honroElementId&&b.honroElements.find(v=>v.id===t.honroElementId)?.assetId==='act2:bell'),'bell artwork must never add collision');boss.hp=1;e.recover(boss);assert(!boss.dead&&boss.hp===1,'knockback outside the map cannot kill the keeper');e.hurt(boss,1e9,e.active.id);assert(!boss.dead&&boss.hp>=1&&boss.honroSubdued);assert(!g.HonroObjectives.state(b,g.HONRO_CONTENT.stages[17]).complete);
});
for(let id=11;id<=20;id++)check(`Act 2-${id-10} ordered objectives, narrative, save and rewards (state fixture)`,()=>{
 const {b,e,app,st}=fixture(id);g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);
 for(const s of st.steps){
  if(s.kind==='clear'&&g.HonroAct2.memory(b).done[s.id])continue;
  const hero=e.heroesAlive().find(u=>u.cls===(s.requiredClass||(s.kind==='rescue'?'occultist':'archer')));b.active=hero.id;b.phase='aim';b.side=0;hero.acted=false;hero.vx=hero.vy=0;
  const m=b.honroMarkers.find(m=>m.id===s.id);
  assert.equal(g.HonroAct2.current(b)?.id,s.id,`${id}: objective order before ${s.id}`);
  if(s.kind==='clear'){
   const a=g.HonroAct2.memory(b);
   // Boss/convoy ambushes are triggered by their own earlier event in live play.
   // This fixture resolves any already spawned roster for the designated cohort.
   if(s.cohorts==='all'){
    const plan=g.HonroAct2Plan.forStage(id);
    if(plan.bossWave)assert(a.events['keeper-retaliation'],'keeper wave must have triggered');
    if(plan.progressWave)assert(a.events['convoy-ambush'],'convoy wave must have triggered');
   }
   for(const u of g.HonroAct2.enemiesFor(b,s)){u.hp=0;u.dead=true;}
  }else if(s.kind==='hold'){
   for(const u of e.heroesAlive()){u.x=m.x;u.y=m.y;}
   const waveSite=b.honroMarkers.find(v=>v.id==='wave-'+s.id);
   for(const u of e.alive(1))if(!u.honroAct2Boss&&(Math.hypot(u.x-m.x,u.y-m.y)<s.contestRadius+30||waveSite&&Math.hypot(u.x-waveSite.x,u.y-waveSite.y)<780)){u.hp=0;u.dead=true;}
   app.actorBoundary=hero.id;
   for(let j=0;j<s.rounds+3&&g.HonroAct2.current(b)?.id===s.id;j++){
    b.round++;g.HonroAct2.tick(app,0);
    // Resolve the incoming wave to make physical room for the next one. The
    // keeper and enemies outside this defense remain for later objectives.
    for(const u of e.alive(1))if(!u.honroAct2Boss&&(u.honroSpawnSource?.startsWith(s.id)||Math.hypot(u.x-m.x,u.y-m.y)<s.contestRadius+30)){u.hp=0;u.dead=true;}
   }
   assert.equal(g.HonroAct2.memory(b).holds[s.id].spawned,s.wave.count,s.id+' wave count');
  }else if(s.kind==='destroy')e.damageTerrain(b.terrain.find(t=>t.id===s.id),1000,0,hero.id);
  else if(s.kind==='defeat')e.hurt(e.unit(s.target),1e9,hero.id);
  else if(s.kind==='reach'){Object.assign(hero,{x:m.x,y:m.y});}
  else if(s.kind==='escort'){Object.assign(e.unit('objective'),{x:m.x,y:m.y});}
  else {
   Object.assign(hero,{x:m.x,y:m.y});
   for(const u of e.alive(1))if(u.id!==m.spiritId&&!u.honroAct2Boss&&Math.hypot(u.x-m.x,u.y-m.y)<360){u.hp=0;u.dead=true;}
   if(s.kind==='rescue'){const spirit=e.unit(m.spiritId);spirit.hp=Math.min(spirit.hp,Math.floor(spirit.maxHp*.35));}
   assert(g.HonroAct2.eligibility(app,m).ok,s.id);assert(g.HonroAct2.use(app,m),s.id);
  }
  g.HonroAct2.tick(app,0);
  assert(g.HonroAct2.memory(b).done[s.id]||g.HonroAct2.state(b).allTargets.find(t=>t.id===s.id)?.done,`${id}/${s.id}`);
  const restored=plain(b);assert.deepEqual(plain(g.HonroAct2.state(restored)),plain(g.HonroAct2.state(b)),s.id+' save roundtrip');
 }
 assert(g.HonroObjectives.state(b,st).complete);assert(app.speeches.length>0);g.HonroProgression.complete(b);const xp=plain(b.heroes);g.HonroProgression.complete(b);assert.deepEqual(plain(b.heroes),xp,'no repeated clear XP');
});
check('Actor loss and resident loss have explicit failure, and all late revelations remain ordered',()=>{
 const {b,e}=fixture(18);e.heroesAlive().find(u=>u.cls==='mage').dead=true;assert.match(g.HonroAct2.failure(b),/담허/);
 for(const s of g.HONRO_CONTENT.stages.filter(s=>s.act===2&&s.actStage<9))assert(!JSON.stringify([s.story,s.beats,s.outro]).includes('저문골'));
 assert(JSON.stringify(g.HONRO_CONTENT.stages[18].beats).includes('저문골'));
});
await mkdir('_local/reports/act2-revision',{recursive:true});await writeFile('_local/reports/act2-revision/unit-flow.json',JSON.stringify({checks:rows,limitations:'Ordered objective tests use explicit state fixtures; they are not normal combat playthroughs.'},null,2));
