/** First-clear/recruit reward ledger, not a Stages1–7 playthrough. */
import assert from 'node:assert/strict';
import {campaignEntryReadiness} from './stage18-bell-fullplay-helper.mjs';
export const BIER_ENTRY=Object.freeze({stage:8,through:7,xp:8644,level:7,earned:15,ordinaryStats:6,
 slots:{archer:['A01','A02','A03','A11'],mage:['M01','M04','M11','M09'],knight:['S00','S01','S04','S09']},
 limit:{start:8644,end:12812,total:4168,combat:1667}});
export function bierEntryProfile(g,{ordinaryStats=BIER_ENTRY.ordinaryStats,basicOnly=false,readiness=null}={}){
 assert([0,6].includes(ordinaryStats));const C=g.HONRO_CORE,r=readiness??campaignEntryReadiness(g,{through:7}),p=C.defaults(),training=[];
 assert.equal(r.xp,8644);assert.equal(r.level,7);assert.equal(r.rows.length,7);
 p.recruited=g.HonroStageRules.stageParty(8);assert.deepEqual([...p.recruited],['archer','mage','knight']);p.party=[...p.recruited];p.settings.difficulty='normal';p.cleared=structuredClone(r.cleared);p.honroGrowth=structuredClone(r.ledger);
 function train(h,cls,id){if(h.ranks[id])return;const t=C.TALENT_MAP[id];assert(t?.cls===cls);if(t.prereq)train(h,cls,t.prereq);assert(C.train(h,id),C.trainReason(h,id));training.push({op:'train',cls,id,rank:h.ranks[id]});}
 for(const cls of p.recruited){const h=p.heroes[cls];h.xp=r.heroes[cls].xp;C.resetTalents(h,cls);const slots=basicOnly?[BIER_ENTRY.slots[cls][0]]:BIER_ENTRY.slots[cls];for(const id of slots)train(h,cls,id);for(let n=0;n<ordinaryStats;n++){assert(C.investStat(h,cls));training.push({op:'ordinary-stat',cls,rank:h.statTraining});}p.loadouts[cls]=[...slots];C.sanitizeLoadout(p,cls);assert.deepEqual([...p.loadouts[cls]],slots);assert.equal(C.pointsEarned(h),15);assert(C.pointsSpent(h,cls)<=15);assert(Object.values(h.ranks).every(n=>n===1));assert(!h.ranks.SP03&&!h.ranks.S15);}
 return{profile:p,readiness:r,training,scope:'Legal pre-battle reward-ledger and talent allocation. No prior-stage playthrough or live-battle mutation.',ordinaryStats,basicOnly};
}
export function bierEntryResources(g,b,e){return b.units.filter(u=>u.side===0&&!u.summoned).map(u=>({cls:u.cls,xp:b.heroes[u.cls].xp,level:u.level,hp:u.hp,maxHp:u.maxHp,mp:u.focus,maxMp:u.maxFocus,maxMove:u.maxMove,jumpCost:e.jumpCost(u),regen:u.regen,slots:[...u.loadout],ranks:structuredClone(u.ranks),statTraining:b.heroes[u.cls].statTraining,defend:{hp:Math.round(u.maxHp*.04),mp:Math.max(u.regen,Math.round(u.maxFocus*.12)),shield:Math.round(u.maxHp*.12)}}));}
