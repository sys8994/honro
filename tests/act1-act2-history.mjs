import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {act2History,historicalAct2Maps} from './act1-act2-history-helpers.mjs';
const project=JSON.parse(readFileSync('shared/data/campaign.json','utf8')),g=vm.createContext({});
vm.runInContext(readFileSync('shared/map/terrain-domain.js','utf8'),g);
const hash=p=>createHash('sha256').update(JSON.stringify(historicalAct2Maps(p,g.HonroTerrainDomain))).digest('hex');
const untouched=JSON.stringify(project);
assert.equal(hash(project),act2History.historicalAct2Hash);
assert.equal(JSON.stringify(project),untouched,'historical comparison never mutates production data');
for(const change of [
 p=>p.stages[13].units[0].x++,
 p=>p.stages[13].terrains[0].points[0].y++,
 p=>p.stages[13].markers[0].x++,
 p=>p.stages[13].initialState.honroAct2Steps.at(-1).radius=123,
 p=>p.stages[11].name+=' unreviewed',
 p=>p.stages[12].units.find(u=>u.kind==='bat').kind='echo'
]){
 const p=structuredClone(project);change(p);let rejected=false;
 try{rejected=hash(p)!==act2History.historicalAct2Hash;}catch{rejected=true;}
 assert(rejected,'unapproved geometry, placement, objective, prose and bat drift must fail');
}
console.log('PASS ACT2 historical anchor, pure exact-delta reversal and six mutation controls');
