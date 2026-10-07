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
// Derive the bridge from the unchanged first-clear/recruit rules. Do not
// hard-code 61,569 XP: a later authorized Act 1/2 change must surface in tests.
function legacyCampaignAnchor(last=20){
 const xp={archer:0,mage:0,knight:0,occultist:0},roster=['archer'];
 for(const st of G.HONRO_CONTENT.stages.filter(s=>s.id<=last)){
  const p=plan(st.id),start=rewardXpAt(p.entryLevel),end=rewardXpAt(p.exitLevel),shift=Math.max(0,...roster.map(cls=>xp[cls]-start));
  for(const cls of roster)xp[cls]=Math.max(xp[cls],end+shift);
  if(st.recruit){if(!roster.includes(st.recruit))roster.push(st.recruit);xp[st.recruit]=Math.max(xp[st.recruit],xpAt(joinLevel(st)));}
 }
 return Math.max(...roster.map(cls=>xp[cls]));
}
const budget=id=>{const p=plan(id),current=p.rewardCurve==='current',start=current?(id===21?legacyCampaignAnchor(20):xpAt(p.entryLevel)):rewardXpAt(p.entryLevel),end=current?xpAt(p.exitLevel):rewardXpAt(p.exitLevel),total=end-start;return {start,end,total,combat:Math.round(total*config.combatShare)};};
function entryHero(st){const h=C.freshHero('archer');h.xp=plan(st.id).rewardCurve==='current'?budget(st.id).start:rewardXpAt(plan(st.id).entryLevel);h.ranks.A01=Math.min(4,1+Math.floor((C.levelOf(h)-1)/3));return h;}
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
const validLimit=limit=>limit&&['start','end','total','combat'].every(key=>Number.isFinite(limit[key])&&limit[key]>=0)&&limit.end>=limit.start;
function rememberLimit(b){
  const g=b?.honroGrowth,state=g?.ledger?.stages?.[b.honroStage];
  if(state&&validLimit(g.limit))state.limit=clone(g.limit);
}
function initialize(b,profile){
  for(const u of b.units)if(u.side===0&&!u.summoned||u.honroAlly){const stats=C.heroStats({xp:C.xpAtLevel(u.level||1),ranks:u.ranks||{}},u.cls);u.critChance=stats.critChance;u.critMultiplier=stats.critMultiplier;}
  if(b.mode!=='campaign')return;
  if(b.honroGrowth?.ledger?.version===config.version){rememberLimit(b);return;}
  const ledger=clone(profile.honroGrowth||{version:config.version,stages:{}});ledger.version=config.version;ledger.stages??={};
  const id=b.honroStage,previous=profile.honroBattle,saved=previous?.honroGrowth;
  // Recover an old export's unfinished stage before its snapshot is replaced,
  // even when entering a different chapter. Keep all unrelated stage records.
  const recorded=saved?.ledger?.stages?.[previous?.honroStage];
  if(saved?.ledger?.version===config.version&&recorded){
    const old=ledger.stages[previous.honroStage]||{},combat={};
    for(const cls of new Set([...Object.keys(old.combat||{}),...Object.keys(recorded.combat||{})]))combat[cls]=Math.max(old.combat?.[cls]||0,recorded.combat?.[cls]||0);
    const recovered={...clone(recorded),...old,combat,cleared:!!(old.cleared||recorded.cleared||profile.cleared[previous.honroStage])};
    if(validLimit(saved.limit))recovered.limit=clone(saved.limit);
    ledger.stages[previous.honroStage]=recovered;
  }
  ledger.stages[id]??={combat:{},cleared:!!profile.cleared[id]};
  const state=ledger.stages[id];state.combat??={};state.cleared||=!!profile.cleared[id];
  const limit=validLimit(state.limit)?clone(state.limit):budget(id);
  if(!validLimit(state.limit)){
    // Ledger-only old saves have no ceiling: remove each companion's already
    // recorded combat XP before recovering the original party entry shift.
    const entryXp=Math.max(0,...b.units.filter(u=>u.side===0&&!u.summoned).map(u=>(b.heroes[u.cls]?.xp||0)-(state.combat[u.cls]||0)));
    const shift=Math.max(0,entryXp-limit.start);limit.start+=shift;limit.end+=shift;
  }
  state.limit=clone(limit);
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
// Camp allocates the next expedition while Continue owns an independent combat
// snapshot. Only these choices cross the sync boundary; combat owns XP/counters.
function markCampAllocation(profile,cls){
  if(profile.honroBattle?.heroes?.[cls]){
    profile.honroCampPending??={};profile.honroCampPending[cls]=true;
  }
}
function reconcileCampAllocations(profile){
  const battle=profile.honroBattle;
  if(!battle){delete profile.honroCampPending;return;}
  // Older saves have no marker. A profile/snapshot allocation difference is an
  // unsaved camp choice, including a refund to zero, never a rank maximum.
  for(const cls of C.CLASS_IDS){
    const h=profile.heroes[cls],old=battle.heroes?.[cls];if(!h||!old)continue;
    const ids=new Set([...Object.keys(h.ranks),...Object.keys(old.ranks)]);
    if([...ids].some(id=>(h.ranks[id]||0)!==(old.ranks[id]||0))||C.statTrainingRank(h)!==C.statTrainingRank(old))markCampAllocation(profile,cls);
  }
}
function syncRoster(profile,b){
  const heroes=clone(b.heroes);
  for(const cls of C.CLASS_IDS){
    const h=profile.heroes[cls];
    if(profile.honroCampPending?.[cls]&&h&&heroes[cls]){
      heroes[cls].ranks=clone(h.ranks);
      heroes[cls].statTraining=C.statTrainingRank(h);delete heroes[cls].statRanks;
    }
  }
  profile.heroes=heroes;
}
function persist(app){if(app.engine?.b.honroGrowth){rememberLimit(app.engine.b);app.profile.honroGrowth=clone(app.engine.b.honroGrowth.ledger);}}
G.HonroProgression={version:config.version,plan,budget,xpAt,rewardXpAt,legacyCampaignAnchor,joinLevel,recruit,repairRecruits,entryHero,referenceStats,tuneEnemy,tuneMidboss,tuneBoss,initialize,enemyXP,awardCombat,defeat,complete,persist,markCampAllocation,reconcileCampAllocations,syncRoster};
})(globalThis);
