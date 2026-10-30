/** Offline observed action ledger; never infers missing provenance or approves difficulty. */
import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync,constants} from 'node:zlib';
import {pathToFileURL} from 'node:url';
const key=(owner,shot)=>JSON.stringify([owner,shot]);
export function combatAnalysis(rows){
 const start=rows.find(r=>r.type==='run-start'),entry=rows.find(r=>r.type==='entry'),end=rows.findLast(r=>r.type==='run-end'),units=new Map((entry?.initial?.units||[]).map(u=>[u.id,u])),actions=new Map(),targets=new Map(),warnings=new Set();let rawHpLoss=0,rawShieldLoss=0,unidentifiedHits=0;
 const action=(owner,shot)=>{const id=key(owner,shot);if(!actions.has(id))actions.set(id,{id,owner,shot,fireRound:null,skill:null,ownerSide:null,explicitProvenance:true,hits:0,targets:new Map(),feedback:[]});return actions.get(id);};
 for(const r of rows){
  if(r.type!=='engine-event')continue;
  if(r.method==='fire'&&r.accepted===true&&Number.isFinite(r.shot)){const a=action(r.before.id,r.shot);a.fireRound=r.round;a.skill=r.skill;a.ownerSide=r.before.allegiance??r.before.side;continue;}
  if(r.method==='damage-feedback'&&typeof r.attackId==='string'){const pieces=r.attackId.split(':'),shot=Number(pieces.pop()),round=Number(pieces.pop()),owner=pieces.join(':');if(Number.isFinite(shot))action(owner,shot).feedback.push({targetId:r.targetId,round,damage:r.damage,critical:r.critical});continue;}
  if(r.method!=='hurt'||!r.before||!r.after)continue;
  const hp=Math.max(0,r.before.hp-r.after.hp),shield=Math.max(0,(r.before.shield||0)-(r.after.shield||0));rawHpLoss+=hp;rawShieldLoss+=shield;if(!hp&&!shield)continue;
  if(r.hit?.damageSource==='environment'||!r.owner)continue;
  if(!Number.isFinite(r.hit?.shot)){unidentifiedHits++;warnings.add('Damaging hit without recorded shot identity');continue;}
  const a=action(r.owner,r.hit.shot);a.hits++;a.skill??=r.hit.skill;if(r.hit.ownerState?.allegiance!==undefined)a.ownerSide=r.hit.ownerState.allegiance;else a.ownerSide??=r.hit.ownerState?.side??null;
  if(r.hit.shotOrigin!=='explicit-provenance'){a.explicitProvenance=false;warnings.add('Legacy/fallback shot identity cannot establish a unique original attack action');}
  if(a.ownerSide===null)warnings.add('Actual attacker allegiance missing');
  let t=a.targets.get(r.before.id);if(!t){t={id:r.before.id,side:r.before.side,hpLoss:0,shieldLoss:0,maxHp:null,denominatorStable:true,rounds:new Set(),hitContext:[]};a.targets.set(t.id,t);}
  t.hpLoss+=hp;t.shieldLoss+=shield;t.rounds.add(r.round);if(!Number.isFinite(r.before.maxHp)||r.before.maxHp<=0){t.denominatorStable=false;warnings.add('Actual per-hit maxHp missing; no initial-HP substitution');}else if(t.maxHp===null)t.maxHp=r.before.maxHp;else if(t.maxHp!==r.before.maxHp){t.denominatorStable=false;warnings.add('maxHp changed during an original attack action');}
  t.hitContext.push({round:r.round,direct:r.hit.direct,skill:r.hit.skill,rank:r.hit.skillRank,source:r.hit.source,target:r.hit.target});
  if(r.before.side===1){let enemy=targets.get(r.before.id);if(!enemy){enemy={id:r.before.id,groups:new Set(),damageGroups:new Set(),firstDamageRound:r.round,deathRound:null,identityVerified:true};targets.set(enemy.id,enemy);}enemy.damageGroups.add(a.id);if(a.ownerSide===0)enemy.groups.add(a.id);else if(a.ownerSide===null)enemy.identityVerified=false;if(!a.explicitProvenance)enemy.identityVerified=false;if(r.before.hp>0&&r.after.hp<=0)enemy.deathRound=r.round;}
 }
 const attackRows=[...actions.values()].map(a=>({...a,targets:[...a.targets.values()].map(t=>({...t,rounds:[...t.rounds],hpLossPercent:a.explicitProvenance&&t.denominatorStable&&t.maxHp?100*t.hpLoss/t.maxHp:null})),feedback:a.feedback}));
 const kills=[...targets.values()].filter(t=>t.deathRound!==null).map(t=>{const verified=t.identityVerified&&[...t.groups].every(id=>actions.get(id)?.explicitProvenance&&actions.get(id)?.ownerSide===0),u=units.get(t.id),role=u?.honroPilotBudgetBasis?.role,kind=u?.boss?'major-boss':u?.honroMidboss||u?.honroPilotMidboss||role==='midboss'?'midboss':role?'normal':'unknown';return {id:t.id,kind,observedShotGroups:t.damageGroups.size,contributingAllyActions:verified?t.groups.size:null,normalKillActions:kind==='normal'&&verified?t.groups.size:null,firstDamageRound:t.firstDamageRound,deathRound:t.deathRound,observedRoundSpan:t.deathRound-t.firstDamageRound+1,actionIdentityVerified:verified};});
 return {schema:'honro-observed-combat-actions/v1',runId:start?.runId??end?.runId??null,sourceHash:start?.sourceHash??null,controllerHash:start?.controllerHash??null,evaluation:start?.evaluation??null,cohortIdentity:start?.cohortIdentity??null,completeTrace:!!start&&!!end,outcome:end?.outcome??'error',rawObservedHpLoss:rawHpLoss,rawObservedShieldLoss:rawShieldLoss,unidentifiedHits,attacks:attackRows,enemyAttackDamage:attackRows.filter(a=>a.ownerSide===1).flatMap(a=>a.targets.filter(t=>t.side===0).map(t=>({attackId:a.id,owner:a.owner,shot:a.shot,skill:a.skill,fireRound:a.fireRound,...t,explicitProvenance:a.explicitProvenance}))),kills,warnings:[...warnings],acceptance:'not evaluated; finite observed action groups are not human difficulty/fun or full SOP approval'};
}
export async function readCombatEvents(file){const bytes=await readFile(file),text=file.endsWith('.gz')?gunzipSync(bytes,{finishFlush:constants.Z_SYNC_FLUSH}).toString('utf8'):bytes.toString('utf8'),parts=text.split('\n'),rows=[];for(let i=0;i<parts.length;i++){if(!parts[i].trim())continue;try{rows.push(JSON.parse(parts[i]));}catch(e){if(i!==parts.length-1)throw e;}}return rows;}
if(import.meta.url===pathToFileURL(process.argv[1]||'').href){const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('analyze-combat.mjs run.jsonl.gz output.json');const result=combatAnalysis(await readCombatEvents(input));await writeFile(output,JSON.stringify(result,null,2));console.log(JSON.stringify({runId:result.runId,attacks:result.attacks.length,kills:result.kills.length,warnings:result.warnings}));}
