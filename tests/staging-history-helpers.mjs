// Compare the same cast/stats before and after approved presentation timing.
// Only named entrances are projected; unknown actors or stat changes stay strict.
import assert from 'node:assert/strict';
const entrances={1:'npc-woodcutter',3:'npc-hwigyeom',4:'npc-chunrye',9:'npc-sodan'};
export function historicalSceneRoster(b,expected){
 const result=[...b.units],id=entrances[b.honroStage];if(!id)return result;
 const actor=b.honroStaging?.hidden?.[id],index=expected.findIndex(u=>u.id===id);
 assert(actor&&index>=0,'An approved entrance retains exactly its historical cast');
 assert(!result.some(u=>u.id===id),'Hidden cast cannot also be an active actor');
 result.splice(index,0,actor);return result;
}
