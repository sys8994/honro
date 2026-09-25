(function(G){'use strict';
const C=G.HONRO_CORE,H=G.HONRO_CONTENT,P=G.HonroProgression;
const median=a=>{const s=[...a].sort((a,b)=>a-b);return s.length?s[Math.floor(s.length/2)]:0;};
function audit(stage,b){
  const p=P.plan(stage.id),r=P.referenceStats(stage);
  const enemies=b.units.filter(u=>u.side===1&&!u.dead),ordinary=enemies.filter(u=>!u.boss&&!u.elite);
  const hits=u=>u.maxHp/(r.shot/.96*(1-(u.armor||0)));
  const incoming=u=>{const s=u.loadout.map(id=>C.SKILLS[id]);return s.reduce((n,s)=>n+s.damage*C.skillBalanceFactor(s)*u.attack*(1-r.armor),0)/Math.max(1,s.length)/r.hp;};
  const reinforcements=(b.honroEvents||[]).reduce((n,e)=>n+G.HonroEncounters.spawnCount(e.action),0);
  const medianHits=median(ordinary.map(hits)),medianIncoming=median(ordinary.map(incoming));
  const issues=[];
  if(medianHits<.65||medianHits>4)issues.push('ordinary enemy hit budget');
  if(medianIncoming<.035||medianIncoming>.15)issues.push('incoming damage budget');
  if(stage.active>4)issues.push('simultaneous enemy actions');
  const growth=P.budget(stage.id);
  return {stage:stage.id,name:stage.name,entryLevel:p.entryLevel,exitLevel:p.exitLevel,initialEnemies:enemies.length,reinforcements,activeLimit:stage.active,heroes:b.units.filter(u=>u.side===0).length,medianHitsToKill:+medianHits.toFixed(2),medianEnemyHitHpPercent:+(medianIncoming*100).toFixed(2),focusRoundHpPercentAt55PercentAccuracy:+(stage.active*medianIncoming*.55*100).toFixed(2),combatXpBudget:growth.combat,totalXpBudget:growth.total,completionTargetXp:growth.end,issues,status:issues.length?'검토 필요':'예산 내'};
}
function auditAll(profile,makeWorld){return H.stages.map(st=>{const p=JSON.parse(JSON.stringify(profile));p.recruited=G.HonroStageRules.stageParty(st.id);for(const cls of p.recruited)p.heroes[cls].xp=P.xpAt(P.plan(st.id).entryLevel);return audit(st,makeWorld(st,p));});}
G.HonroDifficulty={version:2,audit,auditAll,recommendation:r=>r.issues.join(', ')||'예산 유지'};
})(globalThis);
