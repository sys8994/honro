import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
import {runProbe,runObjectiveProbe} from '../tools/stage31/probes.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false}),P=g.HonroProductionContract,clone=v=>JSON.parse(JSON.stringify(v));
const base=clone(g.HONRO_PROJECT),id='stage-31';
const report=P.audit(base,id);
// Keep the historical failure as an explicit malformed fixture. The evolving
// campaign need not retain that old cut forever for this regression to work.
const cutProject=clone(base),cutStage=cutProject.stages.find(s=>s.id===id);
const cutX=Math.min(6280,cutStage.width-100),cutY=Math.round(cutStage.height*.45);
cutStage.terrains=[{id:'qa-internal-underground-cut',type:'solid',baseMaterial:'earth',
 oneWay:false,breakable:false,points:[{x:0,y:cutY},{x:cutX,y:cutY},
 {x:cutX,y:cutStage.terrainBounds.bottom},{x:0,y:cutStage.terrainBounds.bottom}],
 playProjection:{bounds:clone(cutStage.playBounds),start:{x:0,y:cutY}}}];
assert(P.audit(cutProject,id).issues.some(v=>v.rule==='T02'),'An authored internal underground cut must still fail');
assert(report.issues.some(v=>v.rule==='E01'),'Unassigned enemy roles must fail');
assert(report.issues.some(v=>v.rule==='P01'),'No existing-stage reference must fail');
assert.equal(report.qualityApproved,false);
assert.throws(()=>P.assertExport(base,id),/차단/);
const p=P.begin(base,id),card=p.production.cards[id];
card.intent='낮은 제방과 얕은물 경로 중 사격 위치를 선택한다.';card.referenceStages=['stage-3','stage-30'];
const hash=P.fingerprint(p,id);p.production.reviews[id]=P.reviewKinds.map(kind=>({kind,fingerprint:hash,verdict:'pass',observation:'This is a fixture, not a real approval.',evidence:[{path:'missing.png',sha256:'0'.repeat(64)}]}));
assert.equal(P.fingerprint(p,id),hash,'Receipt changes must not silently rewrite geometry identity');
assert.equal(P.releaseStatus(p,id).exportAllowed,false,'Four written passes cannot override actual bad geometry');
const moved=clone(p);moved.stages.find(s=>s.id===id).units[0].x+=20;
assert.notEqual(P.fingerprint(moved,id),hash,'Editing an actor expires the old visual review');
assert.equal(P.releaseStatus(moved,id).missingReviews.length,4);
assert.throws(()=>P.placeEnemy(p,id,{id:'x',kind:'hound',x:1200,role:'whatever',groupId:'x',supportId:'a4-31-land'}),/역할/);
assert.throws(()=>P.placeEnemy(p,id,{id:'x',kind:'hound',x:1200,role:'pursuer',groupId:'x',supportId:'a4-31-land'}),/교전/);
assert.throws(()=>P.bankFromProfile(p,id,{id:'bad-bank',material:'earth',profile:[{x:0,y:1900},{x:3000,y:2000},{x:6280,y:1900}]}),/단면/,'A bank stopping inside the world must not be generated');
assert.throws(()=>P.placeScenery(p,id,{id:'unanchored',assetId:p.library[0].id,x:500,supportId:'missing'}));
assert.deepEqual(base,clone(g.HONRO_PROJECT),'Inspector and failed export may not mutate live content');
// Positive geometry fixture: the contract must be usable, not just reject all maps.
let fixture=clone(base),st=g.HonroMaps.emptyStage('contract-fixture','계약 단위 검사',2000,1000);
st.terrains=[{id:'floor',type:'solid',baseMaterial:'earth',oneWay:false,breakable:false,points:[{x:0,y:600},{x:2000,y:600},{x:2000,y:1000},{x:0,y:1000}]}];
st.units=[g.HonroUnits.record('archer','player',100,600,'player'),{...g.HonroUnits.record('hound','foe',1500,600,'enemy'),encounterGroup:'guard'}];st.encounters=[{id:'guard',key:'guard',behavior:'guard',unitIds:['foe']}];st.initialState.honroActiveLimit=3;
st.environment=g.HonroEnvironment.makeEnvironment(st);fixture.stages.push(st);fixture=g.HonroTerrainDomain.author(fixture);fixture=P.begin(fixture,st.id);
const fc=fixture.production.cards[st.id];fc.intent='계약의 정상 입력 단위 검사';fc.referenceStages=['stage-3'];fc.budget={initial:1,elites:0,activeLimit:3,finiteSpawnCount:0,rationale:'Contract fixture only, not a campaign budget recommendation.'};fc.routes=[{id:'main',role:'primary',purpose:'지지면을 걷는다',points:[{x:100,y:600,supportId:'floor'},{x:1800,y:600,supportId:'floor'}]}];fc.encounters=[{id:'guard',purpose:'동쪽 구역 압박',targetZone:{x:900,y:400,w:1000,h:300},members:[{id:'foe',role:'vanguard',supportId:'floor'}]}];
fc.cameraViews=['overview','normal','close','min-zoom','mobile','left-edge','right-edge'].map(kind=>({id:kind,kind,x:kind==='left-edge'?0:kind==='right-edge'?2000:1000,y:600,scale:kind==='overview'?.35:kind==='close'?.9:kind==='min-zoom'?g.HonroBounds.zoomLimits(800).min:.5,width:kind==='mobile'?390:800,height:kind==='mobile'?844:600}));fc.requiredProbes=['route','shot','enemy-action','objective'].map(kind=>({id:kind,kind,claim:'별도의 실제 엔진 관측 필요'}));
const valid=P.audit(fixture,st.id);assert.equal(valid.machinePass,true,JSON.stringify(valid.issues));assert.equal(P.releaseStatus(fixture,st.id).exportAllowed,false,'Machine-valid geometry is not visual/gameplay approval');
// A grounded steep face is not automatically a walkable route. Use explicit
// geometry rather than accepting a special-case Stage31 actor or support ID.
const steep=clone(fixture),ss=steep.stages.find(s=>s.id===st.id),sc=steep.production.cards[st.id];
ss.terrains.push({id:'steep-contact',type:'solid',baseMaterial:'rock',oneWay:true,breakable:false,
 points:[{x:1300,y:700},{x:1500,y:300},{x:1540,y:320},{x:1340,y:720}]});
Object.assign(ss.units.find(u=>u.id==='foe'),{x:1400,y:500});
sc.encounters[0].members[0].supportId='steep-contact';
assert(!P.audit(steep,st.id).issues.some(v=>v.rule==='E01'),'Exposed steep contact agrees with Engine grounding');
sc.routes.push({id:'bad-walk',role:'alternative',purpose:'Deliberately invalid walk-slope fixture',
 points:[{x:1380,y:540,supportId:'steep-contact'},{x:1400,y:500,supportId:'steep-contact'}]});
assert(P.audit(steep,st.id).issues.some(v=>v.rule==='T03'),'Steep contact does not relax walkable route checks');
const floating=clone(steep);floating.stages.find(s=>s.id===st.id).units.find(u=>u.id==='foe').y-=30;
assert(P.audit(floating,st.id).issues.some(v=>v.rule==='E01'),'Floating enemy still rejected');
const wrongSupport=clone(steep);wrongSupport.production.cards[st.id].encounters[0].members[0].supportId='missing';
assert(P.audit(wrongSupport,st.id).issues.some(v=>v.rule==='E01'),'Invented support still rejected');
const buried=clone(steep);buried.stages.find(s=>s.id===st.id).terrains.push({id:'cover',type:'solid',
 baseMaterial:'rock',oneWay:false,breakable:false,points:[{x:1380,y:450},{x:1420,y:450},{x:1420,y:550},{x:1380,y:550}]});
assert(P.audit(buried,st.id).issues.some(v=>v.rule==='E01'),'Named support buried in a solid is not valid contact');
const walk=runProbe(g,fixture,st.id,{id:'route',kind:'route',actor:'player',inputs:[{op:'move',direction:1,frames:120}],checkpoints:[{x:100,y:590,w:300,h:20,grounded:true},{x:400,y:590,w:850,h:20,grounded:true}]});assert.equal(walk.result,'pass',JSON.stringify(walk));
const notMoved=runProbe(g,fixture,st.id,{id:'route',kind:'route',actor:'player',inputs:[{op:'advance',frames:120}],checkpoints:[{x:100,y:590,w:300,h:20},{x:400,y:590,w:850,h:20}]});assert.equal(notMoved.result,'fail');
assert.throws(()=>runProbe(g,fixture,st.id,{id:'route',kind:'route',inputs:[{op:'move',direction:1,frames:120,hp:9999}]}),/Unapproved/);
assert.equal(runProbe(g,fixture,st.id,{id:'objective',kind:'objective',inputs:[{op:'advance',frames:1}]}).result,'not-supported','Do not fake App objective verification with Engine-only fixtures');
card.requiredProbes=[{id:'board',kind:'objective',claim:'실제 승선 완료만 성공'}];const idle=await runObjectiveProbe(p,id,{id:'board',kind:'objective',inputs:[{op:'skip-dialogue'},{op:'advance',frames:60}]});assert.equal(idle.result,'fail','Entering the map or idling cannot complete the boarding objective');
console.log('Production contract: actual Stage31 fails; fake approvals cannot pass; edits expire reviews; no source mutation.');

// An unrelated legacy stage cannot prevent opening/saving a governed draft.
// Target-stage schema errors must still block production export.
const draftNormalized=g.HonroMaps.normalize(P.begin(base,id));
assert(draftNormalized.production.cards[id]);
const duplicate=clone(draftNormalized);duplicate.stages.find(s=>s.id===id).units.push(clone(duplicate.stages.find(s=>s.id===id).units[0]));
assert(P.audit(duplicate,id).issues.some(i=>i.text.includes('공통 맵 스키마')));
const missingMetadata=clone(base);delete missingMetadata.stages.find(s=>s.id===id).metadata;
assert(P.governed(missingMetadata,id),'Removing metadata cannot bypass Stage31 production checks');

const rockDraft=clone(fixture);
const groundedRock=P.placeScenery(rockDraft,st.id,{id:'test-foot-rock',assetId:'mockup-granite-large',x:900,scale:.6,supportId:'floor'});
const rock=groundedRock.stages.find(s=>s.id===st.id).elements.find(e=>e.id==='test-foot-rock'),rockAsset=groundedRock.library.find(a=>a.id===rock.assetId);
const actualFoot=g.HonroGeometry.transformPoint(rockAsset.reference.foot,rockAsset,rock);
assert(Math.abs(actualFoot.y-rock.productionSupport.y)<1e-8,'Visual foot, not asset origin, must touch the declared surface');
assert.equal(actualFoot.x,900);
