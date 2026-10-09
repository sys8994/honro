/** Legal pre-entry fixture. Real first-clear/recruit XP through11 is not a
 * playthrough of those chapters. No live actor/resource/objective writes. */
import assert from 'node:assert/strict';
import {campaignEntryReadiness} from './stage18-bell-fullplay-helper.mjs';
export const QUARRY_ENTRY={xp:23502,level:11,earned:23,ordinaryStats:6,slots:{archer:['A01','A14','A11','A05'],mage:['M01','M04','M11','M03'],knight:['S00','S03','S01','S09'],occultist:['O01','O04','O08','O06']}};
export function quarryEntryProfile(g,{ordinaryStats=QUARRY_ENTRY.ordinaryStats}={}){
 const C=g.HONRO_CORE,readiness=campaignEntryReadiness(g,{through:11}),p=C.defaults(),training=[];
 assert.equal(readiness.xp,QUARRY_ENTRY.xp,'Real first-clear/recruit entry XP');assert.equal(readiness.level,QUARRY_ENTRY.level);
 p.recruited=g.HonroStageRules.stageParty(12);p.party=[...p.recruited];p.settings.difficulty='normal';p.cleared=structuredClone(readiness.cleared);p.honroGrowth=structuredClone(readiness.ledger);
 function train(h,id){if(h.ranks[id])return;const node=C.TALENT_MAP[id];assert(node,'Known skill '+id);if(node.prereq)train(h,node.prereq);assert(C.train(h,id),C.trainReason(h,id));training.push({op:'train',skill:id,rank:h.ranks[id]});}
 for(const cls of p.recruited){const h=p.heroes[cls];h.xp=readiness.heroes[cls].xp;C.resetTalents(h,cls);for(const id of QUARRY_ENTRY.slots[cls])train(h,id);for(let n=0;n<ordinaryStats;n++){assert(C.investStat(h,cls),'Legal ordinary stat');training.push({op:'ordinary-stat',cls,rank:h.statTraining});}p.loadouts[cls]=[...QUARRY_ENTRY.slots[cls]];C.sanitizeLoadout(p,cls);assert.deepEqual([...p.loadouts[cls]],QUARRY_ENTRY.slots[cls]);assert.equal(p.loadouts[cls].length,4);assert.equal(C.pointsEarned(h),QUARRY_ENTRY.earned);assert(Object.values(h.ranks).every(n=>n===1));for(const forbidden of ['SP03','M09','O11'])assert(!h.ranks[forbidden]&&!p.loadouts[cls].includes(forbidden));assert(C.pointsSpent(h,cls)<=C.pointsEarned(h));}
 return{profile:p,readiness,training,scope:'Pre-entry reward-ledger and legal rank1/stat6/four-slot fixture, not an eleven-chapter playthrough or a live battle edit.'};
}
