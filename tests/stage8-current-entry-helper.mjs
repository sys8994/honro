/** Current first-clear reward fixture; never a previous seven-stage playthrough. */
import assert from 'node:assert/strict';
import {battlefield} from '../game/tests/helpers.mjs';
import {BIER_ENTRY} from './stage8-bier-entry-helper.mjs';
export function currentBierEntryProfile(g,{basicOnly=false}={}){
 const C=g.HONRO_CORE,P=g.HonroProgression,p=C.defaults(),rows=[],training=[];
 for(let id=1;id<=7;id++){const st=g.HONRO_CONTENT.stages[id-1];p.honroGrowth??={version:3,stages:{}};p.honroGrowth.stages[id]??={policy:3,combat:{},cleared:false};const {b}=battlefield(g,id,{profile:p});P.complete(b);p.heroes=structuredClone(b.heroes);p.honroGrowth=structuredClone(b.honroGrowth.ledger);p.cleared[id]={visits:1,rounds:0};P.recruit(p,st);rows.push({stage:id,xp:p.heroes.archer.xp});}
 p.party=[...p.recruited];p.settings.difficulty='normal';
 function train(h,cls,id){if(h.ranks[id])return;const t=C.TALENT_MAP[id];assert.equal(t.cls,cls);if(t.prereq)train(h,cls,t.prereq);assert(C.train(h,id),C.trainReason(h,id));training.push({op:'train',cls,id});}
 for(const cls of p.party){const h=p.heroes[cls];C.resetTalents(h,cls);const slots=basicOnly?[BIER_ENTRY.slots[cls][0]]:BIER_ENTRY.slots[cls];for(const id of slots)train(h,cls,id);for(let i=0;i<6;i++){assert(C.investStat(h,cls));training.push({op:'ordinary-stat',cls});}p.loadouts[cls]=[...slots];C.sanitizeLoadout(p,cls);assert(C.pointsSpent(h,cls)<=C.pointsEarned(h));}
 return {profile:p,training,readiness:{rows,xp:p.heroes.archer.xp,scope:'Current completion rewards only; not prior combat'},basicOnly};
}
