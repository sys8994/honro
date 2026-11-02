/** Focused raw-hook and effective-runtime parity. Not a browser/gameplay clear. */
import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {applyStage20ArtCandidate} from '../tools/act2-vector-production/apply-stage20-candidate.mjs';import {runtimeParts,runtimeEntries} from '../shared/build.mjs';
const plain=v=>JSON.parse(JSON.stringify(v)),raw=(await runtimeEntries({vector:false,render:false,productionStory:true})).find(x=>x.name==='campaign').project,snapshot=plain(raw),after=applyStage20ArtCandidate(raw),s=raw.stages.find(s=>s.metadata?.stageId===20),a=after.stages.find(s=>s.metadata?.stageId===20);
assert.deepEqual(plain(raw),snapshot);assert.equal(after.library.length,raw.library.length+3);assert.equal(a.elements.length,s.elements.length+3);
assert.deepEqual({...a,elements:s.elements},s);for(const x of raw.stages)if(x!==s)assert.deepEqual(after.stages.find(t=>t.id===x.id),x);
assert.throws(()=>applyStage20ArtCandidate(after),/Duplicate/);const drift=plain(raw);drift.stages.find(s=>s.metadata?.stageId===20).terrains[0].points[0].y++;assert.throws(()=>applyStage20ArtCandidate(drift),/source changed/);
process.env.HONRO_ACT2_STAGE20_CANDIDATE='0';assert.equal(applyStage20ArtCandidate(raw),raw);delete process.env.HONRO_ACT2_STAGE20_CANDIDATE;
const g=vm.createContext({console,structuredClone,performance,setTimeout,clearTimeout});g.window=g;for(const code of await runtimeParts({vector:true,render:false,productionStory:true}))vm.runInContext(code,g);
const effective=g.HONRO_PROJECT,source=effective.stages.find(s=>s.metadata?.stageId===20),candidate=plain(source),assets=after.library.slice(-3);candidate.elements.push(...a.elements.slice(-3));
for(const asset of assets){assert.deepEqual(Array.from(g.HonroVectorArt.validate(asset.vector)),[]);assert.deepEqual(asset.collision,[]);assert(!asset.params.bodyTerrainIds.includes('gate-repair'));for(const id of asset.params.bodyTerrainIds){const host=source.terrains.find(t=>t.id===id);assert(['act2-floor','exit-overhang'].includes(host.id));}}
const next={...effective,library:[...effective.library,...assets],stages:effective.stages.map(t=>t===source?candidate:t)},before=g.HonroMaps.createBattle(source,effective,undefined,{origin:'campaign'}),current=g.HonroMaps.createBattle(candidate,next,undefined,{origin:'campaign'});g.HonroStageRules.sanitizeStageBattle(before);g.HonroStageRules.sanitizeStageBattle(current);
for(const key of ['terrain','honroWorldTerrain','units','waters','honroMarkers','objectives','honroState'])assert.deepEqual(plain(current[key]??null),plain(before[key]??null),`effective ${key} parity`);
// Baked clip is bound to effective authored world polygons, not just host names.
const path=ps=>{const area=ps.reduce((a,p,i)=>{const q=ps[(i+1)%ps.length];return a+p.x*q.y-q.x*p.y;},0);if(area<0)ps=[...ps].reverse();return 'M'+ps.map(p=>`${p.x},${p.y}`).join('L')+'Z';};
for(const asset of assets){const solid=[],insets=[];for(const id of asset.params.bodyTerrainIds){const w=before.honroWorldTerrain.find(t=>t.id===id),t=before.terrain.find(t=>t.id===id),ps=g.HONRO_CORE.poly(w),physical=g.HONRO_CORE.poly(t),edges=(t.honroWalkEdges||[]).flatMap(i=>[physical[i],physical[(i+1)%physical.length]]).filter(Boolean);solid.push(path(ps));insets.push(path(ps.map(p=>({x:p.x,y:p.y+(edges.some(e=>Math.abs(e.x-p.x)<.01&&Math.abs(e.y-p.y)<.01)?4:0)}))));}assert.deepEqual(asset.vector.clips.canonicalSolid,solid);assert.deepEqual(asset.vector.clips.contactInset,insets);}
assert.deepEqual(plain(candidate.initialState),plain(source.initialState));assert.deepEqual(plain(candidate.events),plain(source.events));
console.log('PASS Stage20 raw hook source lock, visual-only project delta, native limits, effective terrain/actors/water/events parity, dynamic convoy props and machinery excluded. No browser/fullplay claim.');
// Final material pack must not introduce schema errors or break actual Stage20
// asset-table save/restore. This is a native codec check, not normal browser play.
const errors=p=>plain(g.HonroMaps.validate(p)).filter(x=>x.level==='err').map(x=>x.text).sort();
assert.deepEqual(errors(next),errors(effective),'material-only delta adds no strict schema errors');
const store=g.HonroProfileStore,original=JSON.stringify(current),packed=store.compactBattleArt(current),restored=plain(packed);
assert.equal(JSON.stringify(current),original,'art save must not mutate battle');
assert.equal(packed.honroLocalArtTable?.assets.length,3,'campaign compaction must actually activate');
assert(JSON.stringify(packed).length<original.length,'duplicate traced definitions must be removed');
assert(store.restoreBattleArt(restored));assert.deepEqual(restored,plain(current));
console.log('PASS Stage20 campaign compiler strict-schema delta and active table exact roundtrip; raw/packed chars',original.length,JSON.stringify(packed).length);

// Production App launch, not a battle with identity flags rewritten afterward.
// Prerequisite progression is a fixture; DOM/storage/Canvas are doubles, not quota evidence.
const {appHarness,KEY}=await import('./app-regression-helpers.mjs');
const h=await appHarness({productionStory:true}),ag=h.g,project=ag.HONRO_PROJECT;
ag.HONRO_PROJECT={...project,library:[...project.library,...plain(assets)],stages:project.stages.map(st=>st.metadata?.stageId===20?{...st,elements:[...st.elements,...plain(a.elements.slice(-3))]}:st)};
const app=h.load(h.profileThrough(19));app.launch(20);
const ab=app.engine.b,ap=ag.HonroProfileStore.compactBattleArt(ab),ar=plain(ap),text=JSON.stringify(ab);
assert.equal(ab.honroMapOrigin,'campaign');assert.equal(ab.honroCustom,false);assert.equal(ab.honroStage,20);
assert.equal(ap.honroLocalArtTable?.assets.length,3);assert(JSON.stringify(ap).length<text.length);assert.equal(JSON.stringify(ab),text);
assert(ag.HonroProfileStore.restoreBattleArt(ar));assert.deepEqual(ar,plain(ab));
const stored=JSON.parse(h.storage.get(KEY));assert.equal(stored.honroBattle?.honroLocalArtTable?.assets.length,3,'actual App launch save uses table');
console.log('PASS production App Stage20 launch/save actual table and exact codec restore; raw/packed/profile chars',text.length,JSON.stringify(ap).length,h.storage.get(KEY).length,'saved chars',text.length-JSON.stringify(ap).length,'(storage double; not browser quota/fullplay)');
