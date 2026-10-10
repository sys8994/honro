import {withHistoricalStage18,beforeStage12Quarry} from './stage8-bier-history-helpers.mjs';
import {authorStage18Bell} from '../tools/map-forge/apply-stage18-bell.mjs';
import {withHistoricalStage16} from './stage16-temple-history-helpers.mjs';
import {authorStage16Temple} from '../tools/map-forge/apply-stage16-temple.mjs';
import {withHistoricalStage11} from './stage11-ravine-history-helpers.mjs';
import {authorStage11Ravine} from '../tools/map-forge/apply-stage11-ravine.mjs';
import {authorStage17Worksite} from '../tools/map-forge/apply-stage17-worksite.mjs';
import {beforeApprovedTopology} from './approved-topology-history-helpers.mjs';
import {applyForestCavernTopology} from '../tools/map-forge/forest-cavern-topology.mjs';
import {applyCavernPlaceLayers} from '../tools/map-forge/cavern-place-layers.mjs';
import {applyCavernTransitionLayers} from '../tools/map-forge/cavern-transition-layers.mjs';
import {applyAct2VectorArt} from '../tools/environment/build-act2-art.mjs';
import {createHash} from 'node:crypto';
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
import {applyAct2SceneComposition} from '../tools/environment/act2-scene-composition.mjs';
import assert from 'node:assert/strict';
import {plain} from './act2-spatial-contract-helpers.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import vm from 'node:vm';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[],metrics=[];
const baseline=JSON.parse(await readFile('tests/fixtures/act2-v1-baseline.json','utf8'));
const balance=JSON.parse(await readFile('game/config/balance.json','utf8'));
const check=(name,fn)=>{fn();rows.push({name,passed:true});console.log('PASS',name);};
const fixture=id=>{const q=battlefield(g,id);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct2.attach(q.app,q.e);return q;};
for(const before of baseline.stages){
 const audit=()=>{
 const id=before.id,st=g.HONRO_PROJECT.stages[id-1],plan=g.HonroAct2Plan.forStage(id),{b,e,app}=fixture(id),nodes=st.terrains.reduce((n,t)=>n+t.points.length,0),enemies=e.alive(1),lamps=st.markers.filter(m=>m.id.startsWith('spirit-lamp'));
 metrics.push({stage:id,size:[st.width,st.height],areaRatio:st.width*st.height/(before.width*before.height),terrainNodes:nodes,previousNodes:before.terrainNodes,initial:enemies.length,waves:plan.waveCount,elites:enemies.filter(u=>u.elite).length,lamps:lamps.length,decorations:st.elements.length,backgrounds:st.environment.placements.length,routeDistance:st.routes.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-st.routes[i].x,p.y-st.routes[i].y),0),plannedRounds:plan.rounds});
 check(id+' preserves expanded size and authors room-specific physical geometry',()=>{assert(st.width>=before.width*2&&st.height>=before.height*2);assert(st.design.space.rooms.length>=4);assert(st.design.space.surfaces.length>=1);assert(st.routes.length>2);});
 check(id+' expanded encounters and finite defense objective',()=>{assert(enemies.length>=before.enemies*2);assert(enemies.filter(u=>u.elite).length>=3);assert(g.HonroAct2.steps(b).some(s=>s.kind==='clear'));assert(g.HonroAct2.steps(b).some(s=>s.kind==='hold'));assert(plan.waveCount>=6);assert.equal(g.HonroDifficulty.audit(g.HONRO_CONTENT.stages[id-1],b).reinforcements,plan.waveCount);});
 check(id+' spirit lamp scarcity and story entry',()=>{assert.equal(lamps.length,plan.lamps.length);assert(lamps.length<=2);assert(g.HonroAct2.entry(app).length<=8);assert(st.elements.length>0);});
 check(id+' measured planning range agrees with balance data',()=>{assert.deepEqual(st.design.targetRounds,plan.rounds);assert.deepEqual(plain(g.HONRO_BALANCE.stages.find(s=>s.id===id).targetRounds),Array.from(plan.rounds));assert.deepEqual(Array.from(st.design.expectedMinutes),Array.from(plan.rounds,r=>Math.round(r*1.35+5)));});
 if(id===14||id===16)check(id+' main buildings remain grounded and rear architecture has explicit world supports',()=>{const asset=id===14?'act2:cave-house':'act2:temple';assert(st.elements.some(e=>e.assetId===asset&&e.depthLayer==='L1'));for(const e of st.environment.placements.filter(e=>e.id.startsWith('a2-scene-'))){const group=st.environment.groups.find(g=>g.id===e.groupId),support=st.environment.surfaces.find(s=>s.id===e.supportId),a=g.HONRO_PROJECT.library.find(a=>a.id===e.assetId);assert.equal(e.depthLayer,'L2');assert.equal(group?.verticalMode,'WORLD');assert.equal(support?.groupId,group.id);assert.equal(support?.kind,'act2-rear-terrace');assert.equal(e.y,0);assert.equal(a.collision.length,0);}});
 if(id===14)check('14 foreground homes vary across unequal physical terraces',()=>{const homes=st.elements.filter(e=>e.assetId.startsWith('act2:cave-house')||e.assetId==='act2:scene-longhouse');assert(new Set(homes.map(e=>e.assetId)).size>=3);assert(homes.every(e=>e.depthLayer==='L1'));assert(Math.max(...homes.map(e=>e.y))-Math.min(...homes.map(e=>e.y))>1000,'homes must occupy unequal physical terraces');});
 check(id+' flying enemies retain ground-band or exact reviewed crown shot access',()=>{for(const u of enemies.filter(v=>g.HonroWorld.archetypes[v.honroType]?.flying)){
  if(Math.abs(g.HonroWorld.top(b,u.x,u.y)-u.y)<=400)continue;
  // These two approved cavern targets face the upper crown/shoulder, not
  // the floor directly below their X. Keep all unrelated 400-unit guards.
  const firingId=id===15&&({'a2-enemy-12':'west-crown','a2-enemy-13':'west-shoulder'})[u.id];
  assert(firingId,`${id}/${u.id} is out of shot range`);beforeApprovedTopology(g.HONRO_PROJECT,{stages:[15]});
  const site=st.design.topology.firingSites.find(s=>s.id===firingId),q=fixture(id),shooter=q.e.heroesAlive().find(v=>v.cls==='archer'),target=q.e.unit(u.id),skill=C.SKILLS.A01;
  Object.assign(shooter,{x:site.x,y:site.y,vx:0,vy:0});q.b.units=[shooter,target];q.b.active=shooter.id;q.b.phase='aim';q.b.side=0;q.e.checkEnd=()=>false;assert(q.e.grounded(shooter),'reviewed crown shot origin must be grounded');
  const aim=q.e.shotSeeds(shooter,skill,target).find(a=>q.e.predict(shooter,skill,a.angle,a.power,target,false).unit===target.id);assert(aim,'reviewed crown target must have a legal basic-arrow lane');
  const hp=target.hp;assert(q.e.fire(skill.id,aim.angle,aim.power));for(let f=0;f<1800&&q.b.projectiles.length;f++)for(const p of [...q.b.projectiles])if(q.b.projectiles.includes(p))q.e.stepProjectile(p,C.STEP);assert(target.hp<hp,'live basic arrow reaches reviewed crown target');
 }});
 if(id>=17)check(id+' late-act correction is applied once to fresh and resumed enemies',()=>{
  assert.equal(plan.active,3);
  const u=enemies[0],before={hp:u.maxHp,attack:u.attack};
  assert(u.honroAct2LateTuned);
  g.HonroAct2.tuneEncounter(u,id);
  assert.deepEqual({hp:u.maxHp,attack:u.attack},before);
  const saved={...u,maxHp:Math.round(before.hp/.85),hp:Math.round(before.hp/.85),attack:before.attack/.65,honroAct2Tuned:true,honroAct2LateTuned:false};
  const old={hp:saved.maxHp,attack:saved.attack};
  g.HonroAct2.tuneEncounter(saved,id);
  assert.equal(saved.maxHp,Math.max(1,Math.round(old.hp*.85)));
  assert.equal(saved.attack,old.attack*.65);
  const corrected={hp:saved.maxHp,attack:saved.attack};g.HonroAct2.tuneEncounter(saved,id);
  assert.deepEqual({hp:saved.maxHp,attack:saved.attack},corrected);
 });
 if(id>=13&&id<=19)check(id+' stage-aware enclosure and authored background',()=>{if(id===13){assert(b.honroCaveApproach&&b.honroCaveApproach.start>0&&b.honroCaveApproach.end===b.width,'partial cave must preserve open forecourt');}else assert(b.honroCaveEnvelope?.portals.length>=1);assert(b.terrain.some(t=>t.honroCeiling));assert(st.environment.groups.length>0);if(id===13)assert(st.design.space.rooms.some(r=>r.sky==='open'),'sunken forecourt requires daylight');else assert.equal(st.environment.skyVisible,false);});
 check(id+' interactions cannot bypass the next combat objective',()=>{const all=b.honroMarkers.filter(m=>m.action==='act2'&&!m.id.startsWith('spirit-lamp'));for(const m of all){const s=g.HonroAct2.current(b);if(s?.id!==m.id)assert.equal(g.HonroAct2.use(app,m),false,m.id);}assert.equal(g.HonroAct2.state(b).complete,false);});
 };
 if(before.id===11)withHistoricalStage11(g,audit);else if(before.id===16)withHistoricalStage16(g,audit);else if(before.id===18||before.id===19)withHistoricalStage18(g,audit);else audit();
}
check('Only two chapters have manifestation lamps',()=>assert.equal(metrics.filter(m=>m.lamps>0).length,2));
check('The final outdoor chapter has its own dawn panorama',()=>assert.equal(g.HonroEnvironment.campaignMood(20).variant,'dawn'));
const originalSky=await readFile('shared/assets/environment/act1-far.svg','utf8'),dawnSky=await readFile('shared/assets/environment/act2-dawn.svg','utf8');
check('Dawn palette preserves every approved mountain path as pure SVG',()=>{
 // Native Canvas requires explicit paths for SVG use/gradient ellipses. Expand
 // the original primitives exactly, then compare every path, including order.
 const paths=svg=>{const defs=new Map([...svg.matchAll(/<path\b[^>]*id="([^"]+)"[^>]*d="([^"]+)"[^>]*\/>/g)].map(m=>[m[1],m[2]]));
  svg=svg.replace(/<use\b[^>]*href="#([^"]+)"[^>]*\/>/g,(_,id)=>{assert(defs.has(id),'unknown original SVG reference');return '<path d="'+defs.get(id)+'"/>';});
  svg=svg.replace(/<ellipse\b([^>]*)\/>/g,(_,attrs)=>{const a=Object.fromEntries([...attrs.matchAll(/(cx|cy|rx|ry)="([^"]+)"/g)].map(m=>[m[1],Number(m[2])]));assert(Object.values(a).every(Number.isFinite));return `<path d="M${a.cx-a.rx} ${a.cy}A${a.rx} ${a.ry} 0 1 0 ${a.cx+a.rx} ${a.cy}A${a.rx} ${a.ry} 0 1 0 ${a.cx-a.rx} ${a.cy}Z"/>`;});
  return [...svg.matchAll(/\sd="([^"]+)"/g)].map(m=>m[1]);};
 assert.deepEqual(paths(dawnSky),paths(originalSky));
 assert(!/<(?:image|filter|script)\b/i.test(dawnSky));
 assert(dawnSky.includes('id="sun"'));
});
check('Clear objective needs the whole designated cohort',()=>{const {b,e}=fixture(13),s=g.HonroAct2.current(b),foes=g.HonroAct2.enemiesFor(b,s);assert(foes.length>=6);for(const u of foes.slice(1)){u.dead=true;u.hp=0;}assert.equal(g.HonroAct2.current(b).id,s.id);foes[0].dead=true;foes[0].hp=0;assert.notEqual(g.HonroAct2.current(b).id,s.id);});
check('Defense needs presence, elapsed full rounds, and spawned waves',()=>{
 const {b,e,app}=withHistoricalStage11(g,()=>fixture(11)),a=g.HonroAct2.memory(b),s=g.HonroAct2.steps(b).find(s=>s.kind==='hold');
 for(const q of g.HonroAct2.steps(b)){if(q.id===s.id)break;a.done[q.id]=true;}
 const m=b.honroMarkers.find(m=>m.id===s.id);g.HonroAct2.tick(app,0);assert.equal(a.holds[s.id].progress,0);
 b.round+=3;g.HonroAct2.tick(app,0);assert.equal(a.holds[s.id].progress,0,'elapsed time away must not count');
 // Objective-state fixture. Physical walking is checked separately; this does not establish a normal-combat clear.
 for(const u of e.heroesAlive()){u.x=m.x;u.y=m.y;}
 for(const u of e.alive(1)){u.x=b.width-200;u.y=b.height-400;}
 app.actorBoundary=e.active.id;for(let j=0;j<s.rounds+2;j++){b.round++;g.HonroAct2.tick(app,0);for(const u of e.alive(1)){u.dead=true;u.hp=0;}}
 assert(a.holds[s.id].progress>=s.rounds);assert.equal(a.holds[s.id].spawned,s.wave.count);assert.notEqual(g.HonroAct2.current(b)?.id,s.id);
});
check('Spirit manifestation is local and retains damage collision',()=>{const {b,e}=fixture(18),souls=e.alive(1).filter(u=>u.honroSpirit),u=souls[0],far=souls.at(-1),archer=e.heroesAlive().find(u=>u.cls==='archer'),sodan=e.heroesAlive().find(u=>u.cls==='occultist');b.active=archer.id;assert(!g.HonroAct2.visible(b,u));const hp=u.hp;e.hurt(u,150,archer.id);assert(u.hp<hp&&!u.dead);b.active=sodan.id;assert(g.HonroAct2.visible(b,u));b.active=archer.id;g.HonroAct2.expose(b,b.round+2,u,50);assert(g.HonroAct2.visible(b,u));assert(!g.HonroAct2.visible(b,far));});
check('Existing revision 1 battles keep their original objective list',()=>{const {b}=fixture(14);delete b.honroAct2Steps;b.honroAct2Revision=1;b.honroState.act2.version=1;assert.equal(g.HonroAct2.steps(b).length,4);assert.equal(g.HonroAct2.current(b).id,'family-upper');});
vm.runInContext(await readFile('workshop/recipes/act2-caves.js','utf8'),g);
// This recipe predates quarry12; validate and project that separate layer
// before preserving the original all-map deterministic assertion.
const historicalRecipeProject=beforeStage12Quarry(g.HONRO_PROJECT);
const regeneratedBeforeBell=await authorStage16Temple(await authorStage17Worksite(await authorStage11Ravine(g.HonroMaps.finalize(applyCavernTransitionLayers(applyCavernPlaceLayers(applyForestCavernTopology(await applyAct2SceneComposition(await applyAct2VectorArt(g.HonroAct2Design.build(historicalRecipeProject))),{stages:[15]})))),g),g,{art:true}),g,{art:true});
const regeneratedAct2=await authorStage18Bell(regeneratedBeforeBell,g,{art:true});
check('Historical recipe preserves all 30 canonical maps after exact quarry projection',()=>{const digest=x=>createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');for(const s of regeneratedAct2.stages)assert.equal(digest(s),digest(historicalRecipeProject.stages.find(q=>q.id===s.id)),s.id+' exact canonical recipe');assert.deepEqual(plain(regeneratedAct2),plain(historicalRecipeProject));});
await mkdir('_local/reports/act2-revision',{recursive:true});await writeFile('_local/reports/act2-revision/unit.json',JSON.stringify({checks:rows,metrics},null,2));
console.log('PASS',rows.length,'revision checks');
