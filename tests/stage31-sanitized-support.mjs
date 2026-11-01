/** Actual candidate regression for exact campaign spawn reconciliation.
 * Run after the selected world has been installed and prepare-draft has run. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {loadPilotRuntime} from '../tools/stage31/pilot-runtime.mjs';
process.env.HONRO_ACT4_RELEASE='1';const g=await runtime({legacyMaps:false});await loadPilotRuntime(g);
const p=JSON.parse(await readFile(process.argv[2]||'_local/reports/stage31-sanitized-audit/draft.json','utf8')),id='stage-31',P=g.HonroProductionContract;
const bad=(doc,actor)=>P.audit(doc,id).issues.some(v=>v.rule==='E01'&&v.objectId===actor),members=p.production.cards[id].encounters.flatMap(x=>x.members);
const ids=['pilot31-ridge-court-7','pilot31-lookout-return-5'];
const copyCard=()=>({...p,production:{...p.production,cards:{...p.production.cards,[id]:structuredClone(p.production.cards[id])}}});
for(const id of ids){
 assert(!bad(p,id),id+' actual same-support resolution should pass');
 let q=copyCard(),m=q.production.cards['stage-31'].encounters.flatMap(x=>x.members).find(x=>x.id===id);delete m.spawnResolution;assert(bad(q,id),'missing explicit expected resolution must fail');
 q=copyCard();m=q.production.cards['stage-31'].encounters.flatMap(x=>x.members).find(x=>x.id===id);m.spawnResolution.x+=1;assert(bad(q,id),'wrong resolved coordinate must fail');
 q=copyCard();m=q.production.cards['stage-31'].encounters.flatMap(x=>x.members).find(x=>x.id===id);m.supportId='approved31-entry';assert(bad(q,id),'wrong support must fail');
}
let q=copyCard();q.production.cards[id].routes[0].points.push({x:5985,y:2145.375,supportId:'approved31-east-return'});assert(P.audit(q,id).issues.some(v=>v.rule==='T03'),'steep raw face must remain invalid for a walkable route');
const sanitize=g.HonroStageRules.sanitizeStageBattle;g.HonroStageRules.sanitizeStageBattle=b=>b;
try{for(const id of ids)assert(bad(p,id),'if actual entry sanitization is absent the exception must fail');}finally{g.HonroStageRules.sanitizeStageBattle=sanitize;}
assert.equal(P.releaseStatus(p,id).exportAllowed,false,'supported spawns cannot replace probes or reviews');
console.log('PASS exact sanitized spawns, wrong/missing expected position, support, missing sanitizer, route slope and release guard');
