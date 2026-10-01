(function(G){'use strict';
const C=G.HONRO_CORE,config=G.HONRO_BALANCE,clone=x=>JSON.parse(JSON.stringify(x));
const xpAt=level=>{const n=Math.floor(level);return C.xpAtLevel(n)+Math.round((level-n)*C.xpToNext(n));};
// Stage rewards keep their established budget; only the amount required to level grows.
const rewardXpAt=level=>{const n=Math.floor(level);return C.oldXpAtLevel12(n)+Math.round((level-n)*C.oldXpToNext12(n));};
const plan=id=>config.stages[id-1];
const joinLevel=st=>Math.max(1,Math.min(30,Math.floor(st.joinLevel??plan(st.id)?.exitLevel??(st.level||1)+1)));
function alignRecruit(profile,st,b=profile.honroBattle){
  const cls=st.recruit;if(!cls||!profile.recruited.includes(cls))return;
  const floor=Math.max(xpAt(joinLevel(st)),profile.heroes[cls]?.xp||0,b?.heroes?.[cls]?.xp||0);
  for(const heroes of [profile.heroes,b?.heroes])if(heroes?.[cls])C.grantXP(heroes[cls],Math.max(0,floor-heroes[cls].xp));
  for(const u of b?.units||[])if(u.side===0&&!u.summoned&&u.cls===cls&&u.level<C.levelOf(b.heroes[cls]))C.applyHero(u,b.heroes[cls]);
}
function repairRecruits(profile,b=profile.honroBattle){for(const st of G.HONRO_CONTENT.stages)if(st.recruit)alignRecruit(profile,st,b);}
function recruit(profile,st,b){
  if(!st.recruit)return;const first=!profile.recruited.includes(st.recruit);if(first)profile.recruited.push(st.recruit);
  alignRecruit(profile,st,b);profile.party=[...profile.recruited];
  if(first){const cls=st.recruit,h=profile.heroes[cls];C.autoTrain(h,cls);C.sanitizeLoadout(profile,cls);if(b?.heroes){b.heroes[cls]=clone(h);for(const u of b.units||[])if(u.side===0&&!u.summoned&&u.cls===cls){u.loadout=[...profile.loadouts[cls]];C.applyHero(u,h);}}}
}
const budget=id=>{const p=plan(id),start=rewardXpAt(p.entryLevel),end=rewardXpAt(p.exitLevel),total=end-start;return {start,end,total,combat:Math.round(total*config.combatShare)};};
function entryHero(st){const h=C.freshHero('archer');h.xp=rewardXpAt(plan(st.id).entryLevel);h.ranks.A01=Math.min(4,1+Math.floor((C.levelOf(h)-1)/3));return h;}
function referenceStats(st){const h=entryHero(st),stats=C.heroStats(h,'archer',['A01']);return {...stats,shot:C.SKILLS.LA01.damage*(C.skillBalanceFactor?.(C.SKILLS.LA01)||1)*stats.attack*1.18*C.skillDamageFactor(h.ranks.A01)*.96};}
function tuneEnemy(st,u,kind){
  const p=plan(st.id),r=referenceStats(st);
  const weight={bat:.68,crow:.78,lantern:.80,ghost:1,human:1,shade:1.15,beast:1.25,warden:1.6,mourner:1.45}[kind]||1;
  const mult=C.DIFFICULTIES.normal;
  u.combatBaseHp=r.shot*p.targetHits*weight*(u.elite?1.25:1)/mult.hp;
  const skills=u.loadout.map(id=>C.SKILLS[id]),mean=skills.reduce((n,s)=>n+s.damage*C.skillBalanceFactor(s),0)/Math.max(1,skills.length);
  u.combatBaseAttack=r.hp*p.targetIncomingHpFraction/Math.max(1,mean*(1-r.armor)*mult.damage);
  const difficulty=C.DIFFICULTIES[u.honroDifficulty]||mult;
  u.maxHp=u.hp=Math.round(u.combatBaseHp*difficulty.hp);u.attack=u.combatBaseAttack*difficulty.damage;
  u.honroXpWeight=weight*(u.elite?1.25:1);u.xpBudget=0;u.xpGranted=0;
}
function tuneMidboss(b,st,u){
  const p=plan(st.id),r=referenceStats(st),d=C.DIFFICULTIES[b.difficulty]||C.DIFFICULTIES.normal,n=C.DIFFICULTIES.normal,hits=p.midBossHits||5.5;
  const mean=u.loadout.reduce((sum,id)=>{const sk=C.SKILLS[id];return sum+sk.damage*C.skillBalanceFactor(sk);},0)/Math.max(1,u.loadout.length);
  u.combatBaseHp=r.shot*hits/Math.max(.45,1-(u.armor||0))/n.hp;
  u.combatBaseAttack=r.hp*(p.targetIncomingHpFraction*1.55)/Math.max(1,mean*(1-r.armor)*n.damage);
  u.hp=u.maxHp=Math.round(u.combatBaseHp*d.hp);u.attack=u.combatBaseAttack*d.damage;u.honroXpWeight=3.2;u.elite=true;u.honroMidboss=true;
}
function tuneBoss(b,st,u){
  const p=plan(st.id),r=referenceStats(st),d=C.DIFFICULTIES[b.difficulty]||C.DIFFICULTIES.normal,n=C.DIFFICULTIES.normal;
  const mean=u.loadout.reduce((sum,id)=>{const s=C.SKILLS[id];return sum+s.damage*C.skillBalanceFactor(s);},0)/u.loadout.length;
  u.combatBaseHp=r.shot/.96*.82*p.bossHits/n.hp;
  u.combatBaseAttack=r.hp*p.bossIncomingHpFraction/(mean*(1-r.armor)*n.damage);
  u.hp=u.maxHp=Math.round(u.combatBaseHp*d.hp);u.attack=u.combatBaseAttack*d.damage;u.honroXpWeight=5;
}
function actionWeight(a){if(!a)return 0;if(a.type==='multi')return(a.actions||[]).reduce((n,a)=>n+actionWeight(a),0);if(a.type==='sniperAmbush')return a.n*.78;if(a.type==='spawn')return a.n*({bat:.68,crow:.78,lantern:.8,shade:1.15,beast:1.25,warden:1.6,mourner:1.45}[a.kind]||1);return 0;}
function initialize(b,profile){
  for(const u of b.units)if(u.side===0&&!u.summoned||u.honroAlly){const stats=C.heroStats({xp:C.xpAtLevel(u.level||1),ranks:u.ranks||{}},u.cls);u.critChance=stats.critChance;u.critMultiplier=stats.critMultiplier;}
  if(b.mode!=='campaign')return;
  if(b.honroGrowth?.ledger?.version===config.version)return;
  const ledger=clone(profile.honroGrowth||{version:config.version,stages:{}});ledger.version=config.version;ledger.stages??={};
  const id=b.honroStage,limit=budget(id),entryXp=Math.max(0,...b.units.filter(u=>u.side===0&&!u.summoned).map(u=>b.heroes[u.cls]?.xp||0)),shift=Math.max(0,entryXp-limit.start);
  limit.start+=shift;limit.end+=shift;
  ledger.stages[id]??={combat:{},cleared:!!profile.cleared[id]};
  const state=ledger.stages[id];state.combat??={};state.cleared||=!!profile.cleared[id];
  const weight=b.units.filter(u=>u.side===1).reduce((n,u)=>n+(u.honroXpWeight||1),0)+(b.honroEvents||[]).reduce((n,e)=>n+actionWeight(e.action),0);
  b.honroGrowth={ledger,limit,weight:Math.max(1,weight)};
  for(const u of b.units.filter(u=>u.side===1))enemyXP(b,u);
}
function enemyXP(b,u){if(b.honroGrowth){u.xpBudget=Math.max(1,Math.round(b.honroGrowth.limit.combat*(u.honroXpWeight||1)/b.honroGrowth.weight));u.xpGranted=0;}}
function awardCombat(e,source,amount){
  const b=e.b,g=b.honroGrowth,state=g.ledger.stages[b.honroStage];if(amount<=0||state.cleared)return;
  let changed=false;
  // Expedition XP is shared: NPC assistance and final-hit ownership cannot starve
  // a companion. The persistent per-stage budget also survives failure/retry.
  for(const u of b.units.filter(u=>u.side===0&&!u.summoned)){
    const h=b.heroes[u.cls],spent=state.combat[u.cls]||0,grant=Math.max(0,Math.min(Math.round(amount),g.limit.combat-spent,g.limit.end-h.xp));
    if(!grant)continue;
    changed=true;state.combat[u.cls]=spent+grant;const result=C.grantXP(h,grant);e.emit('xp',{cls:u.cls,value:result.actual});
    if(result.after>result.before){C.applyHero(u,h);e.fx('text',u.x,u.y-u.h-35,'#f4d797',22,`경지 ${result.after}`);e.emit('level',{cls:u.cls,value:result.after});}
  }
  if(changed)e.emit('save');
}
function defeat(e,u,killer){
  if(u.killRewarded||u.side!==1)return;u.killRewarded=true;
  awardCombat(e,killer,Math.max(0,u.xpBudget-u.xpGranted));u.xpGranted=u.xpBudget;
  if(killer?.side===0)e.b.heroes[killer.cls].kills++;
}
function complete(b){
  if(!b.honroGrowth)return;
  const g=b.honroGrowth,state=g.ledger.stages[b.honroStage];if(state.cleared)return;
  for(const u of b.units.filter(u=>u.side===0&&!u.summoned))C.grantXP(b.heroes[u.cls],Math.max(0,g.limit.end-b.heroes[u.cls].xp));
  state.cleared=true;
}
function persist(app){if(app.engine?.b.honroGrowth)app.profile.honroGrowth=clone(app.engine.b.honroGrowth.ledger);}
G.HonroProgression={version:config.version,plan,budget,xpAt,rewardXpAt,joinLevel,recruit,repairRecruits,entryHero,referenceStats,tuneEnemy,tuneMidboss,tuneBoss,initialize,enemyXP,awardCombat,defeat,complete,persist};
})(globalThis);
