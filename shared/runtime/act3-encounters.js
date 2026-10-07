(function(G){'use strict';
// Only the fresh authored revision opts in. Never retune or repopulate a live save.
function initialize(b){
 if(b.honroCustom||b.honroStage<21||b.honroStage>30||b.honroAct3EncounterRevision!==1)return;
 const st=G.HONRO_CONTENT.stages[b.honroStage-1];
 for(const u of b.units){if(u.side!==1||u.honroAct3Encounter!==1||u.honroAct3EncounterTuned)continue;
  // Legacy index%11 promotion is not the authored roster. Resolve the explicit
  // guard/archer role first, then apply one difficulty-independent elite scale.
  u.elite=false;u.armor=.04;G.HonroProgression.tuneEnemy(st,u,u.honroVariant||u.honroType);
  if(u.honroAct3Elite){u.elite=true;u.name='정예 '+u.name;u.combatBaseHp*=1.55;u.combatBaseAttack*=1.15;u.honroXpWeight*=1.6;u.armor=.12;}
  const d=G.HONRO_CORE.DIFFICULTIES[b.difficulty]||G.HONRO_CORE.DIFFICULTIES.normal;
  u.hp=u.maxHp=Math.round(u.combatBaseHp*d.hp);u.attack=u.combatBaseAttack*d.damage;u.honroAct3EncounterTuned=true;
 }
}
G.HonroAct3Encounters={initialize};
})(globalThis);
