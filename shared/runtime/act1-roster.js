(function(G){'use strict';
// Only the authored default project is revised. Never pass a live/saved battle.
// Locations, health/attack budgets, wave counts and named bosses stay authored.
const replacements={
 3:{'foe-5':'human'},
 5:{'foe-3':'human','foe-7':'stag'},
 7:{'foe-7':'bat','foe-10':'human'},
 9:{'foe-0':'human','foe-8':'human'}
};
// Match the existing mean incoming direct-hit budget on an ordinary human.
// Otherwise changing a spirit's skill family to a bow can silently double damage.
function attackBudget(u){const C=G.HONRO_CORE;return u.loadout.reduce((n,id)=>{const s=C.SKILLS[id];return n+s.damage*C.skillBalanceFactor(s)*C.existenceMultiplier(s.existenceAttack||C.attackForSkill(s),{side:0});},0)/Math.max(1,u.loadout.length);}
function author(project){
 for(const st of project.stages||[]){const changes=replacements[st.metadata?.stageId];if(!changes)continue;
  for(const u of st.units||[]){const kind=changes[u.id];if(!kind||u.kind===kind||u.side!==1||u.boss||u.honroMidboss||u.honroFinalBoss)continue;
   // Do not reinterpret user-authored replacement units in an imported project.
   if(!['ghost','shade','lantern'].includes(u.kind))continue;
   const previousBudget=attackBudget(u),def=G.HonroWorld.archetypes[kind],rank=Math.max(1,...Object.values(u.ranks||{}));
   Object.assign(u,{kind,name:def.name,role:def.role,cls:def.cls,honroType:def.look,honroVariant:def.variant||kind,h:def.h,r:def.r,fixed:!!def.flying,intent:def.intent,loadout:[...def.skills],ranks:Object.fromEntries(def.skills.map(id=>[id,rank]))});
   G.HONRO_CORE.migrateEnemySkills(u);
   const scale=previousBudget/Math.max(.001,attackBudget(u));u.attack*=scale;if(u.combatBaseAttack!==undefined)u.combatBaseAttack*=scale;
   // Removed templates must not carry a spirit-only override into a real body.
   delete u.existenceDefense;delete u.existenceShift;
  }
 }
 return project;
}
G.HonroAct1Roster={author,replacements,attackBudget};
})(globalThis);
