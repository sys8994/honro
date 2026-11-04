/** Diagnostic only: one stag on a smaller rock seated on the existing deck. */
import {deckEastRockMixed} from './rock-deck-mixed.mjs';
export function smallDeckRock(input){const p=deckEastRockMixed(input),s=p.stages.find(v=>v.metadata?.stageId===6),rock=s.elements.find(v=>v.id==='place6-east-rock'),deer=s.design?.positioning?.clusterPositions?.['foe-6-cluster'];if(!rock||!deer)throw Error('Expected east rock and stag');Object.assign(rock,{x:5050,y:2430.12,scale:.48});Object.assign(deer,{x:5050,y:2310});return p;}
