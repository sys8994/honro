import {readFileSync} from 'node:fs';
export const finaleIDs=Object.freeze(['boss_daedosa','grot_hanging','grot_hands','grot_door','wonhon','wonhon_knotted','gate_armor','forepaw']);
const data=Object.fromEntries(finaleIDs.map(id=>[id,JSON.parse(readFileSync(new URL(id+'.json',import.meta.url),'utf8'))]));
export function finaleActor(design){
 const actor=data[design.id];
 if(!actor)return null;
 if(actor.id!==design.id||actor.name!==design.name||actor.family!==design.family||actor.visualRevision!=='act6-art-20261126')throw Error('Invalid Act 6 actor pairing: '+design.id);
 return actor;
}
export const finaleSourceFiles=['tools/actor-forge/art-act6/index.mjs',...finaleIDs.map(id=>'tools/actor-forge/art-act6/'+id+'.json')];
// Authored vector profiles only; the historic baseline and every other actor keep their budgets.
export const finaleBudgets=Object.freeze({boss_daedosa:5000,grot_hanging:4700,grot_hands:5000,grot_door:7300,wonhon:3700,wonhon_knotted:4600,gate_armor:6000,forepaw:3000});
