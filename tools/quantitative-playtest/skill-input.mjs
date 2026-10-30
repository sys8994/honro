import assert from 'node:assert/strict';
/** Dispatch the existing battle HUD click; never mutate selected/profile/battle. */
export function selectCombatSkill(app,click,id){
 const u=app.engine?.active;
 assert(u&&app.canInput(),'Official skill selection requires an input-ready actor');
 assert(u.loadout.includes(id),'Only a currently equipped skill can be selected');
 click('combat-skill',{skill:id});
 assert.equal(app.selected,id,'Official HUD must select the requested skill');
 assert.equal(app.selectedByUnit[u.id],id,'Official HUD must remember skill per actor');
 assert(!app.charging,'Official skill change must cancel the previous charge');
 return {selected:app.selected,remembered:app.selectedByUnit[u.id],path:'official-combat-skill-click'};
}
