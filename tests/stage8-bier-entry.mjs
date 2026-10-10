/** Immutable pre-redesign contracts and legal Lv7 entry. Not prior-stage play. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {bierEntryProfile,bierEntryResources,BIER_ENTRY} from './stage8-bier-entry-helper.mjs';
const plain=v=>JSON.parse(JSON.stringify(v)),hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const pinned={'history-before':'68f20d3def9b0cc43f251ce837ef689cdccc4381a99ebb8ae89d0d06ae8e78a6','before-stage8':'52737bf29c30acf61aa234d6f59dfe5b12c830355c93f97f3a68e94d3f870f22','entry-ledger':'a42a481bf1277bef99e6f6ab2eca2b98d94e1a7a3720ae01e1272ab429a2e73f'},fixtures={};
for(const[name,digest]of Object.entries(pinned)){const bytes=await readFile(`tests/fixtures/stage8-bier/${name}.json`);assert.equal(hash(bytes),digest,'Never rewrite immutable '+name);fixtures[name]=JSON.parse(bytes);}
const f=fixtures['history-before'],old=fixtures['before-stage8'],ledger=fixtures['entry-ledger'];
assert.equal(f.sourceCommit,'bf8b108eb1f27110b2363e6c9211af2f98828c07');assert.equal(f.sourceTree,'a14f5e985a85361a372750065e35d0713c101e00');assert.equal(old.sourceCommit,f.sourceCommit);assert.equal(old.sourceTree,f.sourceTree);
assert.equal(f.stages.length,30);assert.equal(f.library.length,580);assert.equal(f.runtime.files.length,130);
assert.equal(hash(old.stage),f.stages.find(s=>s.id==='stage-8').sha256);
assert.deepEqual(old.contracts,{party:['archer','mage','knight'],initial:21,elites:0,active:4,populationCap:22,limit:BIER_ENTRY.limit});
for(const row of f.protectedFixtures)assert.equal(hash(await readFile(row.path)),row.sha256,'Protected prior fixture '+row.path);
const project=JSON.parse(await readFile('shared/data/campaign.json','utf8'));
assert.deepEqual(project.stages.map(s=>s.id),f.stageOrder);assert.deepEqual(Object.fromEntries(Object.entries(project).filter(([k])=>!['stages','library'].includes(k))),f.globals);
for(const row of f.stages.filter(s=>s.id!=='stage-8'))assert.equal(hash(project.stages.find(s=>s.id===row.id)),row.sha256,'Other29 exact '+row.id);
for(const [i,row]of f.library.entries()){assert.equal(project.library[i].id,row.id,'Existing asset order');assert.equal(hash(project.library[i]),row.sha256,'Existing asset '+row.id);}
const g=await runtime({legacyMaps:false}),rows={};
for(const [name,options]of [['representative',{}],['geometry',{ordinaryStats:0}],['basic',{basicOnly:true}]]){
 const q=bierEntryProfile(g,options),{b,e}=battlefield(g,8,{profile:plain(q.profile)});
 assert.deepEqual(plain(q.profile),ledger[name].profile,'Exact legal '+name+' entry');assert.deepEqual(plain(q.training),ledger[name].training,'Paid training '+name);assert.deepEqual(plain(q.readiness),ledger[name].readiness,'Seven actual reward/recruit calls');
 const resources=bierEntryResources(g,b,e);assert.deepEqual(plain(resources),ledger[name].resources);assert.deepEqual(plain(b.honroGrowth.limit),BIER_ENTRY.limit);assert.equal(b.seed,ledger[name].seed);assert.equal(b.units.filter(u=>u.side===0).length,3);rows[name]={resources,limit:plain(b.honroGrowth.limit)};
}
assert.deepEqual(plain(rows.geometry.resources.map(u=>u.maxMove)),[1316,1336,1426]);assert.deepEqual(plain(rows.representative.resources.map(u=>u.maxMove)),[1513,1536,1811]);
// Compile the historical Stage8 data with the CURRENT engine. Never execute old code.
const saved={project:g.HONRO_PROJECT,content:g.HONRO_CONTENT.stages[7],balance:g.HONRO_BALANCE.stages[7]};
try{g.HONRO_PROJECT={...saved.project,stages:saved.project.stages.map(s=>s.id==='stage-8'?plain(old.stage):s)};g.HONRO_CONTENT.stages[7]=plain(old.content);g.HONRO_BALANCE.stages[7]=plain(old.balance);const {b,e}=battlefield(g,8,{profile:plain(ledger.representative.profile)});assert.deepEqual(plain(b.units),old.battle.units);assert.deepEqual(plain(b.terrain),old.battle.terrain);assert.deepEqual(plain(b.honroGrowth),old.battle.honroGrowth);assert.equal(g.HonroEncounters.populationCap(b),22);assert.deepEqual(plain(bierEntryResources(g,b,e)),ledger.representative.resources);}
finally{g.HONRO_PROJECT=saved.project;g.HONRO_CONTENT.stages[7]=saved.content;g.HONRO_BALANCE.stages[7]=saved.balance;}
const out='_local/reports/stage8-bier';await mkdir(out,{recursive:true});await writeFile(out+'/entry.json',JSON.stringify({scope:'Legal pre-entry training and real reward/recruit ledger; no Stages1–7 playthrough, new geometry, battle completion or browser claim.',sourceBase:f.sourceCommit,fixtures:pinned,protectedFixtures:f.protectedFixtures.length,rows},null,2)+'\n');console.log('Stage8 entry: XP8644/Lv7, legal rank1 slots/stat6 + stat0 + basic, original21/cap22 and other29/580 assets exact.');
