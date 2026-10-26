import {battlefield} from '../game/tests/helpers.mjs';
// Current reward/recruitment fixture only. This neither plays chapters1–4 nor
// forces a late recruit's XP to equal the archer's historical budget anchor.
export function stage5Entry(g){
 const C=g.HONRO_CORE,P=g.HonroProgression,p=C.defaults(),rows=[];
 for(let id=1;id<=4;id++){const st=g.HONRO_CONTENT.stages[id-1];p.honroGrowth??={version:3,stages:{}};p.honroGrowth.stages[id]??={policy:3,combat:{},cleared:false};const {b}=battlefield(g,id,{profile:p});P.complete(b);p.heroes=structuredClone(b.heroes);p.honroGrowth=structuredClone(b.honroGrowth.ledger);p.cleared[id]={visits:1,rounds:0};P.recruit(p,st);rows.push({id,xp:Object.fromEntries(p.recruited.map(cls=>[cls,p.heroes[cls].xp]))});}
 return{heroes:p.heroes,cleared:p.cleared,ledger:p.honroGrowth,rows,scope:'Current first-clear reward and recruit fixture through4; no prior chapter gameplay or equal-XP correction'};
}
