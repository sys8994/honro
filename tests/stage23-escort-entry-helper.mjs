/** Legal pre-entry reward-ledger fixture, following stage12-quarry-entry-helper.
 * Production first-clear/recruit calls through22 establish XP; they do not play
 * those chapters. Training happens before battle creation, never on live actors. */
import assert from 'node:assert/strict';
import {campaignEntryReadiness} from './stage18-bell-fullplay-helper.mjs';

const freeze=value=>{for(const child of Object.values(value))if(child&&typeof child==='object')freeze(child);return Object.freeze(value);};
export const ESCORT_ENTRY=freeze({
 stage:23,through:22,difficulty:'normal',seed:19388,xp:75748,level:16,earned:33,
 ordinaryStats:6,extraPassives:0,forbiddenSkills:['SP03','M09'],
 slots:{archer:['A01','A14','A11','A02'],mage:['M01','M04','M11','M03'],knight:['S00','S03','S01','S04'],occultist:['O01','O04','O08','O11']},
 limit:{start:75748,end:83635,total:7887,combat:3155},
 policy:{consumablesUsed:0,externalResourceWrites:0,externalActorPositionWrites:0,recoverCalls:0}
});

export function escortEntryProfile(g,{ordinaryStats=ESCORT_ENTRY.ordinaryStats,readiness=null}={}){
 assert([0,6].includes(ordinaryStats),'Use the separate geometry/stat0 or representative/stat6 profile');
 const C=g.HONRO_CORE,r=readiness??campaignEntryReadiness(g,{through:ESCORT_ENTRY.through}),p=C.defaults(),training=[];
 assert.equal(r.rows.length,22,'All22 reward-ledger rows are required');
 assert.deepEqual(r.rows.map(row=>row.stage),Array.from({length:22},(_,i)=>i+1));
 assert.equal(r.xp,ESCORT_ENTRY.xp,'Actual first-clear/recruit XP');assert.equal(r.level,ESCORT_ENTRY.level);
 p.recruited=g.HonroStageRules.stageParty(23);p.party=[...p.recruited];p.settings.difficulty=ESCORT_ENTRY.difficulty;
 p.cleared=structuredClone(r.cleared);p.honroGrowth=structuredClone(r.ledger);
 assert(!p.cleared[23]&&!p.honroGrowth.stages[23],'No Stage23 clear or reward is fabricated');
 function train(h,cls,id){
  if(h.ranks[id])return;
  const node=C.TALENT_MAP[id];assert(node&&node.cls===cls,'Known same-class talent '+id);
  if(node.prereq)train(h,cls,node.prereq);
  const reason=C.trainReason(h,id);assert(C.train(h,id),reason||'Legal training '+id);
  training.push({op:'train',cls,skill:id,rank:h.ranks[id],spent:C.pointsSpent(h,cls)});
 }
 for(const cls of p.recruited){
  const h=p.heroes[cls];assert.equal(r.heroes[cls].xp,ESCORT_ENTRY.xp);h.xp=r.heroes[cls].xp;
  // Reward-path recruits may auto-train. Refund before selecting a legal build;
  // none of that allocation (notably SP03) leaks into this entry profile.
  C.resetTalents(h,cls);
  for(const id of ESCORT_ENTRY.slots[cls])train(h,cls,id);
  for(let n=0;n<ordinaryStats;n++){
   assert(C.investStat(h,cls),'Legal ordinary-stat investment '+cls);
   training.push({op:'ordinary-stat',cls,rank:h.statTraining,spent:C.pointsSpent(h,cls)});
  }
  p.loadouts[cls]=[...ESCORT_ENTRY.slots[cls]];C.sanitizeLoadout(p,cls);
  assert.deepEqual([...p.loadouts[cls]],ESCORT_ENTRY.slots[cls]);assert.equal(p.loadouts[cls].length,4);
  assert.equal(C.pointsEarned(h),ESCORT_ENTRY.earned);assert.equal(C.levelOf(h),ESCORT_ENTRY.level);
  assert.equal(h.statTraining,ordinaryStats);assert(Object.values(h.ranks).every(n=>n===1),'Every learned skill is rank1');
  assert(!Object.keys(h.ranks).some(id=>C.SKILLS[id]?.passive),'No additional passives');
  for(const id of ESCORT_ENTRY.forbiddenSkills)assert(!h.ranks[id]&&!p.loadouts[cls].includes(id),'No '+id);
  assert(C.pointsSpent(h,cls)<=C.pointsEarned(h),'No bonus training points');
 }
 return{profile:p,readiness:r,training,kind:ordinaryStats===0?'geometry-stat0':'representative-stat6',
  scope:'Pre-entry first-clear/recruit reward-ledger fixture through22; not a Stages1–22 playthrough, normal22 export, combat victory, or live actor/resource edit.'};
}

/** Read-only entry resources and ordinary App.defend recovery ceilings.
 * At full resources the applied recovery is zero; these are maximum gains
 * after spending/losing resources, not hidden start-of-battle healing. */
export function escortEntryResources(g,b,e){
 const C=g.HONRO_CORE;
 return b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall).map(u=>{
  const h=b.heroes[u.cls];
  return{cls:u.cls,xp:h.xp,level:u.level,earned:C.pointsEarned(h),spent:C.pointsSpent(h,u.cls),unspent:C.pointsLeft(h,u.cls),
   ordinaryStats:h.statTraining,ranks:structuredClone(h.ranks),slots:[...u.loadout],
   hp:u.hp,maxHp:u.maxHp,mp:u.focus,maxMp:u.maxFocus,move:u.moveLeft,maxMove:u.maxMove,jumpCost:e.jumpCost(u),regen:u.regen,
   defend:{hpCeiling:Math.round(u.maxHp*.04),mpCeiling:Math.max(u.regen,Math.round(u.maxFocus*.12)),shieldFloor:Math.round(u.maxHp*.12),endsAction:true}};
 });
}
