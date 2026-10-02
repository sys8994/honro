import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import vm from 'node:vm';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,plain=x=>JSON.parse(JSON.stringify(x)),rows=[];
const check=(name,fn)=>{fn();rows.push({name,passed:true});console.log('PASS',name);};
const fixture=id=>{const q=battlefield(g,id);g.HonroAct2.attach(q.app,q.e);return q;};
check('20 canonical maps, independent Act 2 objectives and four companions',()=>{
 assert.equal(g.HONRO_PROJECT.stages.length,20);assert.equal(g.HONRO_CONTENT.stages.length,20);
 assert.deepEqual(plain(g.HonroStageRules.stageParty(10)),['archer','mage','knight']);
 for(let id=11;id<=20;id++){const {b,e,st}=fixture(id);assert.equal(e.heroesAlive().length,4);assert.deepEqual(plain(st.requires),[id-1]);assert(!g.HonroObjectives.state(b,st).complete);assert(g.HonroAct2.entry({stage:st}).length<=8);assert(b.units.every(u=>Number.isFinite(u.attack)&&Number.isFinite(u.hp)));assert.equal(g.HonroDifficulty.audit(st,b).issues.length,0);}
});
vm.runInContext(await readFile('workshop/recipes/act2-caves.js','utf8'),g);
check('Act 2 recipe is deterministic and preserves the existing ten maps',()=>{
 const authored=g.HonroMaps.finalize(g.HonroAct2Design.build(g.HONRO_PROJECT));assert.deepEqual(plain(authored),plain(g.HONRO_PROJECT));assert.deepEqual(plain(g.HonroMaps.normalize(authored)),plain(authored));
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
 const sodan=e.heroesAlive().find(u=>u.cls==='occultist');b.active=sodan.id;assert(g.HonroAct2.use(app,m));assert(resident.honroResolved&&!resident.dead);assert(e.unit(m.spiritId).dead);assert.equal(g.HonroAct2.memory(b).rescued.length,1);assert.equal(g.HonroAct2.use(app,m),false);
});
check('Cave ceiling is solid to a real projectile, with an open firing shaft',()=>{
 const {b,e}=fixture(15),u=e.active;u.angle=90;
 assert(b.terrain.filter(t=>t.honroCeiling).length===3);assert(e.fire('A01',90,.55));
 let minY=Infinity;for(let i=0;i<500&&b.projectiles.length;i++){for(const p of [...b.projectiles]){minY=Math.min(minY,p.y);e.stepProjectile(p,1/120);}}
 assert.equal(b.projectiles.length,0);assert(minY>1300,`roof should stop high shot, minY=${minY}`);
 assert(!b.terrain.some(t=>t.honroCeiling&&C.terrainContains(t,1690,1100)), 'shaft stays physically open');
});
check('Breaking the unsupported brace creates a recoverable hazard, not a softlock',()=>{
 const {b,e,app}=fixture(17),t=b.terrain.find(t=>t.id==='collapse-pin');e.damageTerrain(t,1000);assert(g.HonroAct2.memory(b).collapse);assert(!b.terrain.find(t=>t.id==='gate-debris').broken);const m=b.honroMarkers.find(m=>m.id==='rebuild-brace');assert(!m.collected);g.HonroAct2.use(app,m);assert(g.HonroAct2.memory(b).rebuilt);assert(b.terrain.find(t=>t.id==='gate-debris').broken);
});
check('Rockfall changes the walkable route, and draining water keeps its bed below its surface',()=>{
 const {b,e}=fixture(12),before=e.surface(1970,1000,2200).y;e.damageTerrain(b.terrain.find(t=>t.id==='rock-pin'),1000);assert(e.surface(1970,1000,2200).y<before-200);
 const q=fixture(15),water=q.b.waters[0],y=water.y;g.HonroAct2.use(q.app,q.b.honroMarkers.find(m=>m.id==='sluice'));assert.equal(water.y,y+120);assert(water.bottom.every(p=>p.y>water.y));assert(q.b.honroSurfaceZones.filter(z=>z.kind==='water-pool').every(z=>z.bottom.every(p=>p[1]>z.surface[0][1])));
});
check('Cave rock shelves have continuous exposed support through both ends',()=>{
 for(const id of [13,16,17,18,19]){const {b,e}=fixture(id),x=id>=18?3240:1800,t=b.terrain.find(t=>t.id==='act2-floor');for(let xx=x-380;xx<=x+590;xx+=4){const y=C.terrainSurfaces(t,xx)[0].y;assert(e.surface(xx,y-1,y+1),`${id}: buried seam at ${xx}`);}}
});
check('Mokjong is scenery; keeper cannot die and his suppression requires every objective',()=>{
 const {b,e}=fixture(18),boss=e.unit('act2-keeper');assert(!b.terrain.some(t=>t.id.includes('bell')));boss.hp=1;e.recover(boss);assert(!boss.dead&&boss.hp===1,'knockback outside the map cannot kill the keeper');e.hurt(boss,1e9,e.active.id);assert(!boss.dead&&boss.hp>=1&&boss.honroSubdued);assert(!g.HonroObjectives.state(b,g.HONRO_CONTENT.stages[17]).complete);
});
for(let id=11;id<=20;id++)check(`Act 2-${id-10} ordered objectives, narrative, save and rewards (state fixture)`,()=>{
 const {b,e,app,st}=fixture(id);g.HonroAllies.attach(app,e);g.HonroEncounters.attach(app,e);
 for(const s of st.steps){
  const hero=e.heroesAlive().find(u=>u.cls===(s.requiredClass||(s.kind==='rescue'?'occultist':'archer')));b.active=hero.id;b.phase='aim';b.side=0;hero.acted=false;hero.vx=hero.vy=0;
  const m=b.honroMarkers.find(m=>m.id===s.id);
  if(s.kind==='destroy')e.damageTerrain(b.terrain.find(t=>t.id===s.id),1000,0,hero.id);
  else if(s.kind==='defeat')e.hurt(e.unit(s.target),1e9,hero.id);
  else if(s.kind==='reach'){Object.assign(hero,{x:m.x,y:m.y});}
  else if(s.kind==='escort'){Object.assign(e.unit('objective'),{x:m.x,y:m.y});}
  else {Object.assign(hero,{x:m.x,y:m.y});assert(g.HonroAct2.eligibility(app,m).ok,s.id);assert(g.HonroAct2.use(app,m),s.id);}
  g.HonroAct2.tick(app,0);
  assert(g.HonroAct2.memory(b).done[s.id]||g.HonroAct2.state(b).allTargets.find(t=>t.id===s.id)?.done,`${id}/${s.id}`);
  const restored=plain(b);assert.deepEqual(plain(g.HonroAct2.state(restored)),plain(g.HonroAct2.state(b)),s.id+' save roundtrip');
 }
 assert(g.HonroObjectives.state(b,st).complete);assert(app.speeches.length>0);g.HonroProgression.complete(b);const xp=plain(b.heroes);g.HonroProgression.complete(b);assert.deepEqual(plain(b.heroes),xp,'no repeated clear XP');
});
check('Actor loss and resident loss have explicit failure, and all late revelations remain ordered',()=>{
 const {b,e}=fixture(18);e.heroesAlive().find(u=>u.cls==='mage').dead=true;assert.match(g.HonroAct2.failure(b),/담허/);
 for(const s of g.HONRO_CONTENT.stages.filter(s=>s.act===2&&s.actStage<9))assert(!JSON.stringify([s.story,s.beats,s.outro]).includes('백기곡'));
 assert(JSON.stringify(g.HONRO_CONTENT.stages[18].beats).includes('백기곡'));
});
await mkdir('_local/reports/act2',{recursive:true});await writeFile('_local/reports/act2/unit.json',JSON.stringify({checks:rows,limitations:'Ordered objective tests use explicit state fixtures; they are not normal combat playthroughs.'},null,2));
