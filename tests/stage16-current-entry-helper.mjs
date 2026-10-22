/** Fixed legal camp fixture. Historical-v3 entry, not prior-chapter fullplay or
 * fabricated combat credit. Existing16 four-slot loadouts +14 earned allocation
 * rule: stat6, then lowest trainable equipped rank/slot order, no optimization. */
import assert from 'node:assert/strict';
import {battlefield} from '../game/tests/helpers.mjs';
// Same production ledger loop as the Stage14/18 helper, without its stale
// stale legacy-anchor assertion: actual recruit-at6 differs from that formula.
function ledger16(g,through=15){const C=g.HONRO_CORE,P=g.HonroProgression,p=C.defaults(),rows=[];for(let id=1;id<=through;id++){const st=g.HONRO_CONTENT.stages[id-1];if(id===11)g.HonroAct2.recruit(p);p.honroGrowth??={version:3,stages:{}};p.honroGrowth.stages[id]??={policy:3,combat:{},cleared:false};const {b}=battlefield(g,id,{profile:p});P.complete(b);p.heroes=structuredClone(b.heroes);p.honroGrowth=structuredClone(b.honroGrowth.ledger);p.cleared[id]={visits:1,rounds:0};P.recruit(p,st);rows.push({stage:id,limit:structuredClone(b.honroGrowth.limit),xp:Object.fromEntries(p.recruited.map(cls=>[cls,p.heroes[cls].xp]))});}const levels=p.recruited.map(cls=>C.levelOf(p.heroes[cls]));assert(levels.every(n=>n===levels[0]));return{xp:p.heroes.archer.xp,level:levels[0],heroes:p.heroes,cleared:p.cleared,ledger:p.honroGrowth,rows};}
export function current16Entry(g,{stageId=16}={}){
 const C=g.HONRO_CORE,readiness=ledger16(g,stageId-1),p=C.defaults(),{level,xp}=readiness,training=[],allocation={};
 assert.equal(level,13);
 p.recruited=g.HonroStageRules.stageParty(stageId);p.party=[...p.recruited];p.settings.difficulty='normal';p.settings.debugMode=false;
 p.cleared=structuredClone(readiness.cleared);p.honroGrowth=structuredClone(readiness.ledger);
 const slots={archer:['A01','A02','A06','A05'],mage:['M01','M10','M11','M04'],knight:['S00','S01','S03','S05'],occultist:['O01','O02','O04','O08']};
 function unlock(h,id,cls){if(h.ranks[id])return;const t=C.TALENT_MAP[id];assert(t);if(t.prereq)unlock(h,t.prereq,cls);assert(C.train(h,id),C.trainReason(h,id));training.push({cls,op:'unlock',id,rank:h.ranks[id]});}
 for(const cls of p.recruited){const h=p.heroes[cls];h.xp=readiness.heroes[cls].xp;C.resetTalents(h,cls);for(const id of slots[cls])unlock(h,id,cls);for(let i=0;i<6;i++){assert(C.investStat(h,cls));training.push({cls,op:'stat',rank:h.statTraining});}p.loadouts[cls]=slots[cls];C.sanitizeLoadout(p,cls);
  while(C.pointsLeft(h,cls)>0){const legal=slots[cls].map((id,i)=>({id,i,rank:h.ranks[id]||0,reason:C.trainReason(h,id)})).filter(v=>!v.reason).sort((a,b)=>a.rank-b.rank||a.i-b.i);if(!legal.length)break;const q=legal[0];assert(C.train(h,q.id));training.push({cls,op:'rank',id:q.id,from:q.rank,to:h.ranks[q.id]});}
  assert(C.pointsSpent(h,cls)<=C.pointsEarned(h));assert.equal(C.levelOf(h),level);assert.equal(h.statTraining,6);assert(!h.honroDebugSkills);allocation[cls]={earned:C.pointsEarned(h),spent:C.pointsSpent(h,cls),remaining:C.pointsLeft(h,cls),ranks:structuredClone(h.ranks),loadout:[...p.loadouts[cls]],statTraining:h.statTraining,stats:C.heroStats(h,cls,p.loadouts[cls]),stopReasons:slots[cls].map(id=>({id,reason:C.trainReason(h,id)||null}))};
 }
 return{profile:p,readiness:{...readiness,scope:`Stage${stageId} historical v3 first-clear/recruit reward-ledger fixture through${stageId-1}, calculated with current production reward APIs. Reachable legacy continuation case, not current v4 average allocation or prior chapters played.`},training,allocation};
}

export {ledger16 as historicalClearLedger};
