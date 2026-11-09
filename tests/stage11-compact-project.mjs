/** Candidate B project/placement checks. No active campaign writes or fullplay. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime} from '../game/tests/helpers.mjs';
import {createCompactProject} from '../tools/map-forge/stage11-compact-project.mjs';
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),plain=x=>JSON.parse(JSON.stringify(x));
process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false,productionStory:true}),source=g.HONRO_PROJECT,before=hash(source),activeBytes=await readFile('shared/data/campaign.json');
const candidate=process.env.HONRO_COMPACT_CANDIDATE||'B-open',p=createCompactProject(g,source,candidate),s=p.stages.find(s=>s.metadata.stageId===11);
assert.equal(hash(source),before,'pure source input');assert.equal(hash(p.library),hash(source.library),'library immutable');
for(let i=0;i<source.stages.length;i++)if(source.stages[i].metadata.stageId!==11)assert.equal(hash(p.stages[i]),hash(source.stages[i]),'unrelated stage '+(i+1));
assert.equal(p.stages.length,source.stages.length);assert.equal(s.width,6200);assert.equal(s.height,3200);
assert.deepEqual(plain(g.HonroTerrainDomain.validate(s)),[]);
assert.equal(s.units.filter(u=>u.team==='enemy').length,21);assert.equal(s.units.filter(u=>u.team==='player').length,4);
assert.equal(s.units.filter(u=>u.stageOverrides?.elite).length,3);assert.equal(s.units.filter(u=>u.stageOverrides?.honroCompact11MinibossCandidate).length,1);
assert.equal(s.events.length,0);assert(!s.units.some(u=>u.team==='npc'));assert(!s.markers.some(m=>m.action==='rescue'));
assert.equal(s.initialState.honroV4Steps.filter(v=>v.kind==='clear').reduce((n,v)=>n+v.defeatIds.length,0),15);
assert.equal(s.initialState.honroActiveLimit,5);
const profile=g.HonroMaps.profileFor(s),b=g.HonroMaps.createBattle(s,p,profile,{origin:'campaign'}),C=g.HONRO_CORE;
assert.equal(g.HonroEncounters.populationCap(b),24,'explicit opt-in density cap');
for(const group of s.encounters)for(const id of group.unitIds){assert.equal(s.units.find(u=>u.id===id).encounterGroup,group.key,'authored encounter key');const u=b.units.find(u=>u.id===id);assert.equal(u.honroCluster,group.key,'compiled encounter key');assert.equal(u.group,s.encounters.indexOf(group)+1,'compiled numeric group');}
const invalid=b.units.filter(u=>!u.honroCompact11Air&&!C.validTerrainContactPose(b.terrain,u)).map(u=>({id:u.id,x:u.x,y:u.y,h:u.h,r:u.r}));
const embeddedAir=b.units.filter(u=>u.honroCompact11Air&&b.terrain.some(t=>!t.oneWay&&!t.broken&&C.terrainRectIntersects(t,u.x-u.r*.55,u.y-u.h+6,u.r*1.1,Math.max(3,u.h-13),.15))).map(u=>u.id);
assert.equal(b.units.filter(u=>u.side===1&&u.honroAct2Elite).length,3,'factory keeps exactly three ordinary elites');
const overlaps=[];for(let i=0;i<b.units.length;i++)for(let j=i+1;j<b.units.length;j++){const a=b.units[i],z=b.units[j];if(Math.abs(a.x-z.x)<a.r+z.r&&Math.max(a.y-a.h,z.y-z.h)<Math.min(a.y,z.y))overlaps.push([a.id,z.id]);}
const result={scope:'Static candidate authored project and real common compiler/unit factory. Not normal gameplay, behavior, artwork, browser or difficulty approval.',candidate,sourceStageCount:source.stages.length,sourceHash:before,projectHash:hash(p),stageHash:hash(s),sourceAndOther39StagesPreserved:true,libraryUnchanged:true,compiledEncounterGroupsConsistent:true,populationCap:g.HonroEncounters.populationCap(b),initialEnemies:b.units.filter(u=>u.side===1).length,finiteRequired:3,totalBudget:24,requiredBudget:18,optionalBudget:6,ordinaryElites:3,minibossCandidates:1,minibossBehaviorImplemented:false,party:b.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.x,y:u.y,h:u.h,r:u.r})),invalidSupportedPoses:invalid,embeddedAirBodies:embeddedAir,overlaps,unverified:['host/next-host spirit travel','safe north pair admission and exact3 births','last combat to four-person gathering','telegraph/counter/miniboss behavior','AI effectiveness, legal normal growth damage and difficulty','fullplay/browser/art/save/deployment']};
const out='_local/reports/act2-redesign-20261109/compact-project/'+candidate;
await mkdir(out,{recursive:true});
await writeFile(out+'/result.json',JSON.stringify(result,null,2)+'\n');
await writeFile(out+'/project.json',JSON.stringify(p)+'\n');
assert.equal(invalid.length,0,'grounded unit placements');assert.equal(embeddedAir.length,0,'airborne bodies outside solid terrain');assert.equal(overlaps.length,0,'no initial actor body overlaps');
assert.equal(b.units.filter(u=>u.side===0).every(u=>u.h===92),true);assert.equal(b.honroV4Chapter11.host,'rv11-entry-root-pack-0');assert.equal(b.honroV4Chapter11.other,'rv11-entry-root-pack-2');
assert.deepEqual(await readFile('shared/data/campaign.json'),activeBytes,'active campaign untouched');
console.log(JSON.stringify({...result,party:undefined},null,2));
