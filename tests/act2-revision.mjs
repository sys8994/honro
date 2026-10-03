import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import vm from 'node:vm';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[],metrics=[];
const baseline=JSON.parse(await readFile('tests/fixtures/act2-v1-baseline.json','utf8'));
const check=(name,fn)=>{fn();rows.push({name,passed:true});console.log('PASS',name);};
const fixture=id=>{const q=battlefield(g,id);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct2.attach(q.app,q.e);return q;};
for(const before of baseline.stages){
 const id=before.id,st=g.HONRO_PROJECT.stages[id-1],plan=g.HonroAct2Plan.forStage(id),{b,e,app}=fixture(id),nodes=st.terrains.reduce((n,t)=>n+t.points.length,0),enemies=e.alive(1),lamps=st.markers.filter(m=>m.id.startsWith('spirit-lamp'));
 metrics.push({stage:id,size:[st.width,st.height],areaRatio:st.width*st.height/(before.width*before.height),terrainNodes:nodes,previousNodes:before.terrainNodes,initial:enemies.length,waves:plan.waveCount,elites:enemies.filter(u=>u.elite).length,lamps:lamps.length,decorations:st.elements.length,backgrounds:st.environment.placements.length,routeDistance:st.routes.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-st.routes[i].x,p.y-st.routes[i].y),0),plannedRounds:plan.rounds});
 check(id+' doubles both dimensions and adds actual geometry',()=>{assert(st.width>=before.width*2&&st.height>=before.height*2);assert(nodes>=before.terrainNodes*2);assert(st.routes.length>20);});
 check(id+' expanded encounters and finite defense objective',()=>{assert(enemies.length>=before.enemies*2);assert(enemies.filter(u=>u.elite).length>=3);assert(g.HonroAct2.steps(b).some(s=>s.kind==='clear'));assert(g.HonroAct2.steps(b).some(s=>s.kind==='hold'));assert(plan.waveCount>=6);assert.equal(g.HonroDifficulty.audit(g.HONRO_CONTENT.stages[id-1],b).reinforcements,plan.waveCount);});
 check(id+' spirit lamp scarcity and story entry',()=>{assert.equal(lamps.length,plan.lamps.length);assert(lamps.length<=2);assert(g.HonroAct2.entry(app).length<=8);assert(st.elements.length>=before.decorations*1.6);});
 check(id+' flying enemies stay within the playable ground band',()=>{for(const u of enemies.filter(v=>g.HonroWorld.archetypes[v.honroType]?.flying))assert(Math.abs(g.HonroWorld.top(b,u.x,u.y)-u.y)<=400,`${u.id} is out of shot range`);});
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
 if(id>=13&&id<=19)check(id+' enclosed rock and authored background',()=>{assert.equal(b.honroCaveEnvelope.portals.length,2);assert(b.terrain.some(t=>t.honroCeiling));assert(st.environment.groups.length>0);assert.equal(st.environment.skyVisible,false);});
 check(id+' interactions cannot bypass the next combat objective',()=>{const all=b.honroMarkers.filter(m=>m.action==='act2'&&!m.id.startsWith('spirit-lamp'));for(const m of all){const s=g.HonroAct2.current(b);if(s?.id!==m.id)assert.equal(g.HonroAct2.use(app,m),false,m.id);}assert.equal(g.HonroAct2.state(b).complete,false);});
}
check('Only two chapters have manifestation lamps',()=>assert.equal(metrics.filter(m=>m.lamps>0).length,2));
check('The final outdoor chapter has its own dawn panorama',()=>assert.equal(g.HonroEnvironment.campaignMood(20).variant,'dawn'));
const originalSky=await readFile('shared/assets/environment/act1-far.svg','utf8'),dawnSky=await readFile('shared/assets/environment/act2-dawn.svg','utf8');
check('Dawn palette preserves every approved mountain path as pure SVG',()=>{
 const paths=svg=>[...svg.matchAll(/\sd="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(paths(dawnSky),paths(originalSky));
 assert(!/<(?:image|filter|script)\b/i.test(dawnSky));
 assert(dawnSky.includes('id="sun"'));
});
check('Clear objective needs the whole designated cohort',()=>{const {b,e}=fixture(13),s=g.HonroAct2.current(b),foes=g.HonroAct2.enemiesFor(b,s);assert(foes.length>=6);for(const u of foes.slice(1)){u.dead=true;u.hp=0;}assert.equal(g.HonroAct2.current(b).id,s.id);foes[0].dead=true;foes[0].hp=0;assert.notEqual(g.HonroAct2.current(b).id,s.id);});
check('Defense needs presence, elapsed full rounds, and spawned waves',()=>{
 const {b,e,app}=fixture(11),a=g.HonroAct2.memory(b),s=g.HonroAct2.steps(b).find(s=>s.kind==='hold');
 for(const q of g.HonroAct2.steps(b)){if(q.id===s.id)break;a.done[q.id]=true;}
 const m=b.honroMarkers.find(m=>m.id===s.id);g.HonroAct2.tick(app,0);assert.equal(a.holds[s.id].progress,0);
 b.round+=3;g.HonroAct2.tick(app,0);assert.equal(a.holds[s.id].progress,0,'elapsed time away must not count');
 // Objective-state fixture. Physical full play is checked by the separate bot.
 for(const u of e.heroesAlive()){u.x=m.x;u.y=m.y;}
 for(const u of e.alive(1)){u.x=b.width-200;u.y=b.height-400;}
 app.actorBoundary=e.active.id;for(let j=0;j<s.rounds+2;j++){b.round++;g.HonroAct2.tick(app,0);for(const u of e.alive(1)){u.dead=true;u.hp=0;}}
 assert(a.holds[s.id].progress>=s.rounds);assert.equal(a.holds[s.id].spawned,s.wave.count);assert.notEqual(g.HonroAct2.current(b)?.id,s.id);
});
check('Spirit manifestation is local and retains damage collision',()=>{const {b,e}=fixture(18),souls=e.alive(1).filter(u=>u.honroSpirit),u=souls[0],far=souls.at(-1),archer=e.heroesAlive().find(u=>u.cls==='archer'),sodan=e.heroesAlive().find(u=>u.cls==='occultist');b.active=archer.id;assert(!g.HonroAct2.visible(b,u));const hp=u.hp;e.hurt(u,150,archer.id);assert(u.hp<hp&&!u.dead);b.active=sodan.id;assert(g.HonroAct2.visible(b,u));b.active=archer.id;g.HonroAct2.expose(b,b.round+2,u,50);assert(g.HonroAct2.visible(b,u));assert(!g.HonroAct2.visible(b,far));});
check('Existing revision 1 battles keep their original objective list',()=>{const {b}=fixture(14);delete b.honroAct2Steps;b.honroAct2Revision=1;b.honroState.act2.version=1;assert.equal(g.HonroAct2.steps(b).length,4);assert.equal(g.HonroAct2.current(b).id,'family-upper');});
vm.runInContext(await readFile('workshop/recipes/act2-caves.js','utf8'),g);
check('Deterministic recipe preserves first act exactly',()=>{const project=g.HonroMaps.finalize(g.HonroAct2Design.build(g.HONRO_PROJECT));assert.equal(JSON.stringify(project),JSON.stringify(g.HONRO_PROJECT));});
await mkdir('_local/reports/act2-revision',{recursive:true});await writeFile('_local/reports/act2-revision/unit.json',JSON.stringify({checks:rows,metrics},null,2));
console.log('PASS',rows.length,'revision checks');
