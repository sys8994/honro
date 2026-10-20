/** Historical geometry/placement equality and affected-save restart contract. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const plain=x=>JSON.parse(JSON.stringify(x));
const fixture=JSON.parse(await readFile('tests/fixtures/pre-image-terrain.json','utf8'));
const g=await runtime({legacyMaps:false}),checks=[];
function canonical(v){return Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;}
const hash=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
// Stage 1 has a separately authorized positioning redesign after restoration.
for(const expected of fixture.stages.filter(s=>s.stage!==1)){
 const stage=plain(g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===expected.stage));
 assert.equal(hash(stage.terrains),expected.terrains,'historical terrain '+expected.stage);
 assert.equal(hash(stage.elements),expected.elements,'historical landmarks '+expected.stage);
 assert.equal(hash(stage),expected.wholeStage,'entire historical stage '+expected.stage);
}
checks.push('Stages 2–10 exactly match the pre-image baseline, including geometry and dependent placements');
for(const [sid,previousRevision] of [[1,5],[1,6],[3,2],[8,1]]){
 const {b,p}=battlefield(g,sid);g.HonroCampaignMapRevision.stamp(b);p.honroBattle=plain(b);
 const saved=plain(p),keep=Object.fromEntries(['heroes','cleared','loadouts','settings'].filter(k=>p[k]!==undefined).map(k=>[k,plain(p[k])]));
 assert.equal(g.HonroCampaignMapRevision.discard(p),false);assert.deepEqual(plain(p),saved,'same revision remains exact');
 p.honroBattle.honroCampaignMapRevision=previousRevision;p.honroBattle.terrain[0].x=-999999;
 assert.equal(g.HonroCampaignMapRevision.discard(p),true);assert.equal(p.honroBattle,null);assert.equal(p.honroMapRestart,sid);
 const rebuilt=battlefield(g,sid,{profile:p}).b;assert.notEqual(rebuilt.terrain[0].x,-999999);
 for(const [key,value] of Object.entries(keep))assert.deepEqual(plain(p[key]),value,key+' preserved');
}
checks.push('Stages 1/3/8 replace image-era battles, preserve profile, and keep same-revision Continue exact');
console.log('PASS',checks);
