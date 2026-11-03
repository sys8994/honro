/** Diagnostic mixed elevation only; not part of the production build. */
import {floor} from './author.mjs';
import {deckEastRock} from './rock-deck.mjs';
export function deckEastRockMixed(input){const p=deckEastRock(input),s=p.stages.find(v=>v.metadata?.stageId===6),deer=s.units.find(v=>v.id==='foe-6');if(!deer)throw Error('Expected primary stag');Object.assign(deer,{x:4570,y:floor(4570),spawnX:4570,spawnY:floor(4570)});return p;}
