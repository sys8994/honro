import {beforeQuestProjectProse} from './quest-project-prose-history.mjs';
import {beforeApprovedWaterfall} from './approved-waterfall-contract-helpers.mjs';
/** Exact metadata-only correction of the approved route/funeral author. */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {runtime} from '../game/tests/helpers.mjs';
import {repairQuestSpaceReferences,authorAct23QuestRedesign} from '../tools/map-forge/act23-quest-redesign.mjs';
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex'),plain=v=>JSON.parse(JSON.stringify(v));
const bytes=readFileSync('tests/fixtures/campaign-contracts/metadata-before.json','utf8');
assert.equal(hash(bytes),'78abe6d173d25aaf08e1e4fc2e68062b6df3ad12f1ad2afcbc24a88b50dfb91e');
const g=await runtime({legacyMaps:false});
const f=JSON.parse(bytes),p=JSON.parse(readFileSync('shared/data/campaign.json','utf8')),before=plain(p);
assert.equal(f.sourceCommit,'5ca1830');
for(const[n,space]of Object.entries(f.spaces))before.stages[n-1].design.space=plain(space);
assert.equal(hash(beforeApprovedWaterfall(before,g)),f.projectSha256,'Everything except the two explicitly reviewed metadata objects stays exact');
const expected=plain(before),s15=expected.stages[14].design.space,s19=expected.stages[18].design.space;
assert.equal(s15.rooms[2].terrainIds.pop(),'fc15-west-descent');
s15.rooms[3].terrainIds.push('fc15-dry-basin-rim');
assert.deepEqual(s15.surfaces[9],{id:'fc15-west-descent',terrainId:'fc15-west-descent',role:'shelf',edgeIndices:[0],roomIds:['open-shaft']});
s15.surfaces[9]={id:'fc15-dry-basin-rim',terrainId:'fc15-dry-basin-rim',role:'shelf',edgeIndices:[0,1,2,3],roomIds:['carved-groove']};
assert.equal(s15.routes[0].anchors[21].x,5450);
Object.assign(s15.routes[0].anchors[21],{y:4270.789473684211,surfaceId:'fc15-dry-basin-rim'});
assert.deepEqual(s19.encounterSites.map(s=>s.unitId).sort(),Array.from({length:18},(_,i)=>'a2-enemy-'+i).sort());s19.encounterSites=[];
const expectedHash=hash(expected),exact=q=>assert.equal(hash(beforeQuestProjectProse(q)),expectedHash,'Only enumerated metadata changes; no arbitrary route/actor/terrain change');exact(p);
const repaired=plain(before);repaired.stages.forEach(repairQuestSpaceReferences);exact(repaired);repaired.stages.forEach(repairQuestSpaceReferences);exact(repaired);
exact(await authorAct23QuestRedesign(p));console.log('PASS exact source author and enumerated metadata delta');
vm.runInContext('Date.now=()=>1780000000000',g);
const oldErrors=plain(g.HonroMaps.validate(before)).filter(e=>e.level==='err');assert.equal(oldErrors.length,20);
assert.deepEqual(plain(g.HonroMaps.validate(p)).filter(e=>e.level==='err'),[],'All30 canonical chapters pass complete existing schema');
const negatives=[];for(const[id,mutate]of[
 ['restore-deleted-room-reference',q=>q.stages[14].design.space.rooms[2].terrainIds.push('fc15-west-descent')],
 ['remove-live-room-reference',q=>q.stages[14].design.space.rooms[2].terrainIds.shift()],
 ['restore-deleted-enemy-reference',q=>q.stages[18].design.space.encounterSites.push(plain(f.spaces[19].encounterSites[0]))],
 ['remove-valid-surface',q=>q.stages[14].design.space.surfaces.shift()],
 ['change-route-x',q=>q.stages[14].design.space.routes[0].anchors[21].x++],
 ['change-route-y',q=>q.stages[14].design.space.routes[0].anchors[21].y++],
 ['change-physical-terrain',q=>q.stages[14].terrains[0].points[0].x++],
 ['change-actor-stat',q=>q.stages[18].units[0].hp++],
 ['remove-other-stage',q=>q.stages.pop()]
]){const q=plain(p);mutate(q);assert.throws(()=>exact(q),id);negatives.push(id);}
// No global invalid-reference sweep: unknown broken references remain visible.
const unknown=plain(p);unknown.stages[18].design.space.encounterSites.push({...f.spaces[19].encounterSites[0],id:'unknown',unitId:'unknown'});repairQuestSpaceReferences(unknown.stages[18]);assert(g.HonroMaps.validate(unknown).some(e=>e.text.includes('Missing encounter unit unknown')));
const profile=g.HONRO_CORE.defaults();profile.recruited=['archer','mage','knight','occultist'];const battles=[];
for(let n=1;n<=30;n++){
 const a=plain(g.HonroMaps.createBattle(before.stages[n-1],before,plain(profile),{origin:'campaign'}));
 const b=plain(g.HonroMaps.createBattle(p.stages[n-1],p,plain(profile),{origin:'campaign'}));
 if(f.spaces[n]){assert.deepEqual(b.honroMap.space,p.stages[n-1].design.space);assert.deepEqual(a.honroMap.space,f.spaces[n]);b.honroMap.space=plain(a.honroMap.space);}
 assert.equal(hash(b),hash(a),'Entire compiled battle including actors, skills, goals, collision, camera settings and activation stays exact: '+n);
 battles.push({stage:n,compiledSha256:hash(a),actors:a.units.length,terrain:a.terrain.length});
}
mkdirSync('_local/reports/campaign-contracts',{recursive:true});writeFileSync('_local/reports/campaign-contracts/metadata-repair.json',JSON.stringify({passed:true,sourceCommit:f.sourceCommit,beforeProjectSha256:f.projectSha256,afterProjectSha256:hash(p),oldErrors,allowedChanges:['15: remove open-shaft obsolete terrain membership','15: add existing dry-basin-rim to carved-groove','15: replace obsolete surface by exact existing rim edges0–3','15: preserve route x5450, correct support and y4270.789473684211','19: remove18 metadata sites of already-removed enemies'],negativeControls:negatives,battles,scope:'Complete raw canonical and compiled battle equality except enumerated honroMap.space metadata; no browser/play-quality claim.'},null,2)+'\n');
console.log('PASS exact metadata correction,20 schema errors removed,30 whole compiled battles preserved and9 symmetric negative controls');
