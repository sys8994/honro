/** Current18 entry: real legacy-v3 clear/recruit ledger, not a campaign replay
 * or current v4 average. Existing18 representative four slots, stat6, then
 * lowest legal equipped rank, slot-order ties. No result-driven optimization. */
import assert from 'node:assert/strict';
import {historicalClearLedger} from './stage16-current-entry-helper.mjs';
export function current18Entry(g){
 const C=g.HONRO_CORE,readiness=historicalClearLedger(g,17),p=C.defaults(),training=[],allocation={};assert.equal(readiness.level,14);
 p.recruited=g.HonroStageRules.stageParty(18);p.party=[...p.recruited];p.settings.difficulty='normal';p.settings.debugMode=false;p.cleared=structuredClone(readiness.cleared);p.honroGrowth=structuredClone(readiness.ledger);
 const slots={archer:['A01','A14','A11','A05'],mage:['M01','M04','M11','M03'],knight:['S00','S03','S01','S09'],occultist:['O01','O04','O08','O06']};
 for(const cls of p.recruited){const h=p.heroes[cls];h.xp=readiness.heroes[cls].xp;C.resetTalents(h,cls);const buy=id=>{if(h.ranks[id])return;const t=C.TALENT_MAP[id];assert(t,id);if(t.prereq)buy(t.prereq);assert(C.train(h,id),C.trainReason(h,id));training.push({cls,id,to:h.ranks[id],op:'unlock'});};for(const id of slots[cls])buy(id);for(let i=0;i<6;i++){assert(C.investStat(h,cls));training.push({cls,op:'stat',to:h.statTraining});}p.loadouts[cls]=slots[cls];C.sanitizeLoadout(p,cls);
  while(C.pointsLeft(h,cls)>0){const legal=slots[cls].map((id,i)=>({id,i,rank:h.ranks[id]||0,reason:C.trainReason(h,id)})).filter(q=>!q.reason).sort((a,z)=>a.rank-z.rank||a.i-z.i);if(!legal.length)break;const q=legal[0];assert(C.train(h,q.id));training.push({cls,id:q.id,from:q.rank,to:h.ranks[q.id],op:'rank'});}
  allocation[cls]={xp:h.xp,level:C.levelOf(h),earned:C.pointsEarned(h),spent:C.pointsSpent(h,cls),remaining:C.pointsLeft(h,cls),ranks:structuredClone(h.ranks),loadout:[...p.loadouts[cls]],statTraining:h.statTraining,stats:C.heroStats(h,cls,p.loadouts[cls]),stopReasons:slots[cls].map(id=>({id,reason:C.trainReason(h,id)||null}))};assert(allocation[cls].spent<=allocation[cls].earned);
 }
 return{profile:p,readiness:{...readiness,scope:'Actual legacy-v3 completion/recruit ledger through17; no fixed old anchor XP injected. Prior chapters not played; fresh-v4 average unverified.'},training,allocation};
}
