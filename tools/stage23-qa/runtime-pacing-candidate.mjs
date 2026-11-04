/** Generate one isolated Stage23 diagnostic product candidate from the hash-locked
 * original. This does not run a battle or alter an existing save. Native results
 * are diagnostic only, not normal-build/browser/release acceptance. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const [kind,output]=process.argv.slice(2);
assert(['original','elite-hp-90','carrier-budget-1000'].includes(kind)&&output,
 'Usage: node runtime-pacing-candidate.mjs original|elite-hp-90|carrier-budget-1000 OUTPUT');
const path='shared/runtime/act23-v4-ch23-reviewed.js';
const original=await readFile(path,'utf8');
assert.equal(createHash('sha256').update(original).digest('hex'),
 '71e3b81904fe845b4cbc190e1e0be9be714421c75a146725075665e42b07773c');
const author="author(map){const u=map.units.find(u=>u.id==='act3-carrier'),p=map.markers.find(p=>p.id==='dispatch-bundle'),goods={x:u.x-70,y:u.y};p.x=u.x;p.y=u.y;";
const prepare="prepare(b,p){delete p.honroReviewed23RestObservation;carrier(b).name='짐꾼';mem(b).last??={x:carrier(b).x,y:carrier(b).y};},";
assert.equal(original.split(author).length,2);assert.equal(original.split(prepare).length,2);
let result=original;
if(kind==='elite-hp-90'){
 const ids=['s23-B-0','s23-C-0','s23-C-3','s23-E-5'];
 result=result.replace(author,author+`\n  // Diagnostic fresh-entry-only candidate: preserve all roles/attack/armor/XP.\n  map.initialState.honroReviewed23PacingCandidate={id:'elite-hp-90',version:1,ids:${JSON.stringify(ids)},hpScale:.9};`);
 const code=`\n  const candidate=b.honroReviewed23PacingCandidate;\n  if(candidate?.id==='elite-hp-90'&&!b.honroReviewed23PacingApplied){\n   const difficulty=C.DIFFICULTIES[b.difficulty]||C.DIFFICULTIES.normal;\n   for(const id of candidate.ids){const target=unit(b,id);if(!target||target.side!==1||!target.honroAct3Elite)throw Error('Stage23 candidate elite missing: '+id);\n    const hp=Math.max(1,Math.round(target.maxHp*candidate.hpScale));target.hp=target.maxHp=hp;target.combatBaseHp=hp/difficulty.hp;}\n   b.honroReviewed23PacingApplied={id:candidate.id,version:1};\n  }\n`;
 result=result.replace(prepare,prepare.slice(0,-2)+code+'},');
}else if(kind==='carrier-budget-1000'){
 result=result.replace(author,author+"\n  // Diagnostic fresh-entry-only candidate: speed/HP/blocking/victory unchanged.\n  u.stageOverrides={...u.stageOverrides,maxMove:1000,moveLeft:1000};\n  map.initialState.honroReviewed23PacingCandidate={id:'carrier-budget-1000',version:1};");
}
await writeFile(output,result);
console.log(JSON.stringify({kind,sourceRuntimeSha256:createHash('sha256').update(original).digest('hex'),candidateRuntimeSha256:createHash('sha256').update(result).digest('hex'),output,scope:'Generated source before fresh battle construction only; existing saved battles are not retuned. Unaccepted isolated candidate.'}));
