(function(G){'use strict';
const C=G.HONRO_CORE,config=G.HONRO_BALANCE,X=G.HonroContributionXP,clone=x=>JSON.parse(JSON.stringify(x));
const xpAt=level=>{const n=Math.floor(level);return C.xpAtLevel(n)+Math.round((level-n)*C.xpToNext(n));};
// Stage rewards keep their established budget; only the amount required to level grows.
const rewardXpAt=level=>{const n=Math.floor(level);return C.oldXpAtLevel12(n)+Math.round((level-n)*C.oldXpToNext12(n));};
const plan=id=>config.stages[id-1];
const rewardClasses=b=>G.HonroSplitCampaign?.active(b)?C.CLASS_IDS:[...new Set(b.units.filter(u=>campaignHero(b,u)).map(u=>u.cls))];
const campaignHero=(b,u)=>u.side===0&&!u.summoned&&(!(b.honroStage>=21&&b.honroStage<=30)||!u.enthrall);
const joinLevel=st=>Math.max(1,Math.min(30,Math.floor(st.joinLevel??plan(st.id)?.exitLevel??(st.level||1)+1)));
function alignRecruit(profile,st,b=profile.honroBattle){
  const cls=st.recruit;if(!cls||!profile.recruited.includes(cls)||profile.heroes[cls]?.honroDebugSkills)return;
  const floor=Math.max(xpAt(joinLevel(st)),profile.heroes[cls]?.xp||0,b?.heroes?.[cls]?.xp||0);
  for(const heroes of [profile.heroes,b?.heroes])if(heroes?.[cls])C.grantXP(heroes[cls],Math.max(0,floor-heroes[cls].xp));
  for(const u of b?.units||[])if(u.side===0&&!u.summoned&&u.cls===cls&&u.level<C.levelOf(b.heroes[cls]))C.applyHero(u,b.heroes[cls]);
}
function repairRecruits(profile,b=profile.honroBattle){for(const st of G.HONRO_CONTENT.stages)if(st.recruit)alignRecruit(profile,st,b);}
function recruit(profile,st,b){
  // Stage 5 remains the legacy XP/recruitment anchor. New journeys meet him at stage 6.
  if(!st.recruit||(st.id===5&&st.recruit==='knight'))return;const first=!profile.recruited.includes(st.recruit);if(first)profile.recruited.push(st.recruit);
  alignRecruit(profile,st,b);profile.party=[...profile.recruited];
  if(first){const cls=st.recruit,h=profile.heroes[cls];C.autoTrain(h,cls);C.sanitizeLoadout(profile,cls);if(b?.heroes){b.heroes[cls]=clone(h);for(const u of b.units||[])if(u.side===0&&!u.summoned&&u.cls===cls){u.loadout=[...profile.loadouts[cls]];C.applyHero(u,h);}}}
}
function recruitAtEntry(profile,stageId){
 if(Number(stageId)<6||!profile.cleared?.[5]||profile.recruited.includes('knight'))return;
 const anchor=G.HONRO_CONTENT.stages.find(s=>s.id===5);
 recruit(profile,{...anchor,id:6},null);
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
function actionWeight(a){if(!a)return 0;if(a.type==='multi')return(a.actions||[]).reduce((n,a)=>n+actionWeight(a),0);if(a.type==='sniperAmbush')return a.n*.78;if(a.type==='spawn')return(a.n+(a.act3Authored&&a.elite ? .6 : 0))*({bat:.68,crow:.78,lantern:.8,shade:1.15,beast:1.25,warden:1.6,mourner:1.45}[a.kind]||1);return 0;}
const validLimit=limit=>limit&&['start','end','total','combat'].every(key=>Number.isFinite(limit[key])&&limit[key]>=0)&&limit.end>=limit.start;
function rememberLimit(b){
  const g=b?.honroGrowth,state=g?.ledger?.stages?.[b.honroStage];
  if(state&&validLimit(g.limit))state.limit=clone(g.limit);
}
function recoverEarnedXp(b,roster){for(const cls of C.CLASS_IDS){const h=b.heroes[cls],saved=roster?.[cls];if(!h||!saved)continue;const result=C.grantXP(h,Math.max(0,saved.xp-h.xp));if(result.after>result.before)for(const u of b.units.filter(u=>campaignHero(b,u)&&!u.enthrall&&u.cls===cls))C.applyHero(u,h,false);}}
function initialize(b,profile){
  for(const u of b.units)if(u.side===0&&!u.summoned||u.honroAlly){const stats=C.heroStats({...((u.side===0&&!u.summoned&&!u.enthrall?b.heroes?.[u.cls]:null)||{xp:C.xpAtLevel(u.level||1)}),ranks:u.ranks||{}},u.cls,u.loadout);u.critChance=stats.critChance;u.critMultiplier=stats.critMultiplier;}
  if(b.mode!=='campaign')return;
  if(b.honroGrowth?.ledger?.stages?.[b.honroStage]){
    const live=b.honroGrowth.ledger.stages[b.honroStage],stored=profile.honroGrowth?.stages?.[b.honroStage];
    if(live.contribution?.version===4&&stored?.contribution?.version===4&&(stored.contribution.sequence||0)>(live.contribution.sequence||0)){
      b.honroGrowth.ledger.stages[b.honroStage]=clone(stored);
      recoverEarnedXp(b,profile.heroes);
    }
    if(profile.cleared?.[b.honroStage]&&b.honroGrowth.ledger.stages[b.honroStage].contribution){b.honroGrowth.ledger.stages[b.honroStage].cleared=true;b.honroGrowth.ledger.stages[b.honroStage].contribution.completed=true;}
    reconcileWounds(b);rememberLimit(b);return;
  }
  const ledger=clone(profile.honroGrowth||{version:config.version,stages:{}});ledger.version=config.version;ledger.stages??={};
  const id=b.honroStage,previous=profile.honroBattle,saved=previous?.honroGrowth;
  // Recover an old export's unfinished stage before its snapshot is replaced,
  // even when entering a different chapter. Keep all unrelated stage records.
  for(const [stageId,recorded]of Object.entries(saved?.ledger?.stages||{})){
    const old=ledger.stages[stageId]||{},combat={};
    for(const cls of new Set([...Object.keys(old.combat||{}),...Object.keys(recorded.combat||{})]))combat[cls]=Math.max(old.combat?.[cls]||0,recorded.combat?.[cls]||0);
    const recovered={...clone(recorded),...old,combat,cleared:!!(old.cleared||recorded.cleared||profile.cleared[stageId])};
    if(recorded.contribution?.version===4){const live=recorded.contribution,stored=old.contribution;recovered.contribution=clone(!stored||(live.sequence||0)>=(stored.sequence||0)?live:stored);recovered.policy=4;if(!stored||(live.sequence||0)>=(stored.sequence||0))recoverEarnedXp(b,previous?.heroes);}
    if(+stageId===previous?.honroStage&&validLimit(saved.limit))recovered.limit=clone(saved.limit);
    ledger.stages[stageId]=recovered;
  }
  const hadRecord=!!ledger.stages[id],legacyBattle=!!b.honroGrowth&&!b.honroGrowth.ledger?.stages?.[id]?.contribution||previous?.honroStage===id&&!!saved&&!saved.ledger?.stages?.[id]?.contribution;
  ledger.stages[id]??={combat:{},cleared:!!profile.cleared[id]};
  const state=ledger.stages[id];state.combat??={};state.cleared||=!!profile.cleared[id];
  const useContribution=!hadRecord&&!legacyBattle&&!state.cleared&&!b.honroCustom;
  const limit=validLimit(state.limit)?clone(state.limit):budget(id);
  if(!validLimit(state.limit)&&!useContribution){
    // Ledger-only old saves have no ceiling: remove each companion's already
    // recorded combat XP before recovering the original party entry shift.
    const entryXp=Math.max(0,...b.units.filter(u=>campaignHero(b,u)).map(u=>(b.heroes[u.cls]?.xp||0)-(state.combat[u.cls]||0)));
    const shift=Math.max(0,entryXp-limit.start);limit.start+=shift;limit.end+=shift;
  }
  state.limit=clone(limit);
  // A recorded v3 stage is immutable policy-wise, including all retries.
  if(useContribution){
    const actors=[...new Set(b.units.filter(u=>campaignHero(b,u)).map(u=>u.cls))],split=G.HonroSplitCampaign?.active(b),levels=Object.fromEntries(actors.map(cls=>[cls,C.levelOf(b.heroes[cls])]));
    state.contribution=X.create(limit.total*(split?4:actors.length),limit.combat*actors.length,actors,levels);
    state.policy=4;
  }else state.policy??=state.contribution?4:3;
  if(state.contribution)ledger.version=Math.max(4,ledger.version||0);
  const act3Weight=id>=21&&id<=30&&!b.honroCustom?(G.HONRO_CONTENT.stages[id-1].steps||[]).reduce((n,s)=>n+(s.wave?actionWeight({type:'spawn',kind:s.wave.kind,n:s.wave.count}):0),0):0;
  const weight=b.units.filter(u=>u.side===1&&u.summonKind!=='eater').reduce((n,u)=>n+(u.honroXpWeight||1),0)+(b.honroEvents||[]).reduce((n,e)=>n+actionWeight(e.action),0)+act3Weight;
  b.honroGrowth={ledger,limit,weight:Math.max(1,weight)};
  for(const u of b.units)registerOwner(b,u);
  for(const u of b.units.filter(u=>u.side===1&&u.summonKind!=='eater')){enemyXP(b,u);if(isContributionBattle(b))registerEnemy(b,u);}
  reconcileWounds(b);
}
function enemyXP(b,u){if(b.honroGrowth){u.xpBudget=Math.max(1,Math.round(b.honroGrowth.limit.combat*(u.honroXpWeight||1)/b.honroGrowth.weight));u.xpGranted=0;}}
function awardCombat(e,source,amount){
  const b=e.b,g=b.honroGrowth,state=g.ledger.stages[b.honroStage];if(b.mode!=='campaign'||isContributionBattle(b)||amount<=0||state.cleared)return;
  let changed=false;
  // Expedition XP is shared: NPC assistance and final-hit ownership cannot starve
  // a companion. The persistent per-stage budget also survives failure/retry.
  for(const cls of rewardClasses(b)){
    const u=b.units.find(u=>campaignHero(b,u)&&u.cls===cls),h=b.heroes[cls],spent=state.combat[cls]||0,grant=Math.max(0,Math.min(Math.round(amount),g.limit.combat-spent,g.limit.end-h.xp));
    if(!grant)continue;
    changed=true;state.combat[cls]=spent+grant;const result=C.grantXP(h,grant);e.emit('xp',{cls,value:result.actual});
    if(u&&result.after>result.before){C.applyHero(u,h,!u.dead);if(!u.dead){e.fx('rune',u.x,u.y-u.h*.5,'#dfca8a',85);e.fx('ring',u.x,u.y-4,'#c7ddbb',65);e.fx('text',u.x,u.y-u.h-35,'#f4d797',22,`경지 ${result.after}`);e.emit('sound',{name:'heal'});e.emit('level',{cls:u.cls,value:result.after});}}
  }
  if(changed)e.emit('save');
}
function defeat(e,u,killer){
  if(u.killRewarded||u.side!==1||u.summoned)return;u.killRewarded=true;
  if(isContributionBattle(e.b)){const row=registerEnemy(e.b,u);if(row){if(row.progress<row.hp)X.damage(contributionState(e.b),row.id,row.hp,row.hp-row.progress,{});if(!row.defeated)X.touch(contributionState(e.b));row.defeated=true;}}
  else awardCombat(e,killer,Math.max(0,u.xpBudget-u.xpGranted));u.xpGranted=u.xpBudget;
  if(killer?.side===0)e.b.heroes[killer.cls].kills++;
}
function complete(b){
  if(!b.honroGrowth)return;
  const g=b.honroGrowth,state=g.ledger.stages[b.honroStage];if(state.cleared)return;
  if(isContributionBattle(b)){completeContribution(b);state.cleared=true;return;}
  for(const cls of rewardClasses(b))C.grantXP(b.heroes[cls],Math.max(0,g.limit.end-b.heroes[cls].xp));
  state.cleared=true;
}
// Contribution policy is per stage, never inferred from a profile's global version.
const contributionState=b=>b?.mode==='campaign'?b?.honroGrowth?.ledger?.stages?.[b.honroStage]?.contribution:null;
const isContributionBattle=b=>contributionState(b)?.version===4;
function registerOwner(b,u){const s=contributionState(b);if(!s||!u)return;const owner=u.summonOwner||u.enthrall?.owner;if(owner){const p=b.units.find(v=>v.id===owner);if(p&&p!==u)registerOwner(b,p);if(s.owners[owner])s.owners[u.id]=s.owners[owner];}else if(campaignHero(b,u)&&C.CLASS_IDS.includes(u.cls)){s.owners[u.id]=u.cls;if(!s.actors.includes(u.cls)){s.actors.push(u.cls);s.factors[u.cls]=1;}}}
function actorClass(b,id){const s=contributionState(b);if(!s)return null;const u=b.units.find(v=>v.id===id);if(u){if(u.side!==0&&!u.summonOwner&&!u.enthrall)return null;registerOwner(b,u);}return s.owners[id]|| (s.actors.includes(id)?id:null);}
function registerEnemy(b,u){const s=contributionState(b);if(!s||!u||u.summoned)return null;const id=u.honroContributionId||u.id;u.honroContributionId=id;const row=X.enemy(s,id,u.maxHp,u.honroXpWeight||1);if(!row.progress&&!Object.keys(row.threats).length){row.hp=Math.max(1,u.maxHp);row.weight=u.honroXpWeight||1;}return row;}
function liveEnemyProgress(row,u){return Math.max(0,u.maxHp-u.hp)*row.hp/Math.max(1,u.maxHp);}
function recordDamage(b,target,owner,actual,assists={}){const s=contributionState(b);if(!s||s.completed||target.side!==1||actual<=0)return;const row=registerEnemy(b,target);if(!row)return;target.honroContributionDamage=Math.max(target.honroContributionDamage||0,liveEnemyProgress(row,target));const cls=actorClass(b,owner),credits={},parts=Object.entries(assists).map(([id,n])=>[actorClass(b,id),Math.max(0,n)]).filter(([id])=>id),total=parts.reduce((n,[,v])=>n+v,0),scale=total>actual?actual/total:1;for(const [id,n]of parts)credits[id]=(credits[id]||0)+n*scale;if(cls)credits[cls]=(credits[cls]||0)+Math.max(0,actual-total*scale);const hpScale=row.hp/Math.max(1,target.maxHp);for(const id of Object.keys(credits))credits[id]*=hpScale;X.damage(s,row.id,target.honroContributionDamage,actual*hpScale,credits);}
function recordThreat(b,enemy,target,hpBefore,loss,protections={}){const s=contributionState(b);if(!s||s.completed||!enemy||enemy.side!==1||target.side===1||target.summoned||(!campaignHero(b,target)&&!target.honroAlly&&!target.honroCivilian))return;const row=registerEnemy(b,enemy);if(!row)return;const credits={};for(const[id,n]of Object.entries(protections)){const cls=actorClass(b,id);if(cls)credits[cls]=(credits[cls]||0)+Math.max(0,n);}X.threat(s,row.id,target.id,target.maxHp,hpBefore,loss,credits,enemy.honroContributionDamage||liveEnemyProgress(row,enemy));}
function recordHeal(b,target,owner,actual){const s=contributionState(b);if(!s||s.completed||actual<=0)return;const outstanding=Object.values(s.enemies).reduce((n,row)=>n+(row.wounds[target.id]||[]).reduce((v,w)=>v+w.hp,0),0),beforeDeficit=Math.max(0,target.maxHp-target.hp+actual);if(outstanding>beforeDeficit)X.heal(s,target.id,outstanding-beforeDeficit,null);X.heal(s,target.id,Math.min(actual,beforeDeficit),actorClass(b,owner));}
function reconcileWounds(b){const s=contributionState(b);if(!s||s.completed)return;for(const u of b.units){const outstanding=Object.values(s.enemies).reduce((n,row)=>n+(row.wounds[u.id]||[]).reduce((v,w)=>v+w.hp,0),0),deficit=Math.max(0,u.maxHp-u.hp);if(outstanding>deficit)X.heal(s,u.id,outstanding-deficit,null);}}
function recordControl(b,enemy,owner,token){const s=contributionState(b),cls=actorClass(b,owner);if(s&&cls){const row=registerEnemy(b,enemy);if(row){const band=Math.min(9,Math.floor(Math.min(row.progress,liveEnemyProgress(row,enemy))/row.hp*10));X.control(s,row.id,'band:'+band,cls);}}}
function recordBlock(b,enemy,owner,token,damage){const s=contributionState(b),cls=actorClass(b,owner);if(!s||!cls||enemy?.side!==1)return;const row=registerEnemy(b,enemy);if(!row)return;const band=Math.min(9,Math.floor(Math.min(row.progress,enemy.honroContributionDamage||liveEnemyProgress(row,enemy))/row.hp*10));X.block(s,row.id,band,token,cls,damage);}
function shieldLayers(b,target,before){const s=contributionState(b);if(!s)return null;const layers=target.honroShieldSources??={},sum=Object.values(layers).reduce((a,v)=>a+v,0);if(sum>before&&sum>0)for(const id of Object.keys(layers))layers[id]*=before/sum;else if(sum<before)layers['']=(layers['']||0)+before-sum;return layers;}
function shieldAdded(b,target,owner,before){const layers=shieldLayers(b,target,before);if(layers&&target.shield>before){registerOwner(b,b.units.find(u=>u.id===owner));layers[owner]=(layers[owner]||0)+target.shield-before;}}
function shieldConsumed(b,target,before,absorbed){const layers=shieldLayers(b,target,before),out={};if(!layers||!before)return out;for(const[id,n]of Object.entries(layers)){out[id]=n*absorbed/before;layers[id]=Math.max(0,n-out[id]);}return out;}
function objective(b,token,contributors,points=20){const s=contributionState(b);if(!s)return false;const credits={};for(const item of contributors||[]){const cls=item.id==='_system'?'_system':actorClass(b,item.id||item.cls);if(cls)credits[cls]=(credits[cls]||0)+Math.max(0,item.weight??1);}return X.objective(s,String(token),credits,points);}
function applyContributionGrants(b,grants,e){const s=contributionState(b);for(const [cls,amount]of Object.entries(grants)){const h=b.heroes[cls];if(!h)continue;const result=C.grantXP(h,amount);s.capDiscarded??={};s.capDiscarded[cls]=(s.capDiscarded[cls]||0)+amount-result.actual;if(result.actual)e?.emit('xp',{cls,value:result.actual});for(const u of b.units.filter(u=>campaignHero(b,u)&&!u.enthrall&&u.cls===cls))if(result.after>result.before){const hp=u.hp;C.applyHero(u,h,!u.dead);recordHeal(b,u,'',u.hp-hp);if(e&&!u.dead){e.fx('text',u.x,u.y-u.h-35,'#f4d797',22,`경지 ${result.after}`);e.emit('sound',{name:'heal'});e.emit('level',{cls,value:result.after});}}}if(Object.keys(grants).length)e?.emit('save');}
const contributionCaps=b=>Object.fromEntries(C.CLASS_IDS.map(cls=>[cls,Math.max(0,C.xpAtLevel(C.MAX_LEVEL)-b.heroes[cls].xp)]));
function flushContribution(e){const b=e.b,s=contributionState(b);if(!s||s.completed)return;for(const row of Object.values(s.enemies).filter(v=>v.defeated&&!v.settled).sort((a,b)=>a.id.localeCompare(b.id))){row.settled=true;X.touch(s);const amount=Math.min(s.combatLimit-s.combatSpent,Math.floor(s.combatLimit*row.weight/b.honroGrowth.weight)),before=s.spent+s.forfeited,grants=X.reserve(s,amount,X.scores(s,row.id),contributionCaps(b));s.combatSpent+=s.spent+s.forfeited-before;applyContributionGrants(b,grants,e);}}
function completeContribution(b){const s=contributionState(b);if(!s||s.completed)return;G.HonroObjectiveContributions?.beforeComplete?.(b,G.HONRO_CONTENT.stages[b.honroStage-1]);const split=G.HonroSplitCampaign?.active(b),end=b.honroSplit?.version===1?27:28;
 // Branch rewards wait for reunion; only active members earned the combat slice.
 if(split&&b.honroStage>=25&&b.honroStage<end){s.completed=true;s.deferred=true;X.touch(s);return;}
 if(split&&b.honroStage===end){const states=Object.entries(b.honroGrowth.ledger.stages).filter(([id,v])=>+id>=25&&+id<=end&&v.contribution?.version===4&&(v.contribution.deferred||+id===end)).map(([,v])=>v.contribution),weights={},opportunities={};let total=0;
  for(const q of states){const scores=X.scores(q),sum=Object.values(scores).reduce((a,n)=>a+n,0),weight=q.total;for(const cls of q.actors){opportunities[cls]=(opportunities[cls]||0)+weight;if(sum>0)weights[cls]=(weights[cls]||0)+(scores[cls]||0)/sum*q.actors.length*weight;}if(sum>0&&scores._system){weights._system=(weights._system||0)+scores._system/sum*q.actors.length*weight;opportunities._system=(opportunities._system||0)+weight;}total+=q.total-q.spent-q.forfeited;}
  for(const cls of Object.keys(weights))weights[cls]/=opportunities[cls];
  // Normalize total expedition entitlement, then deduct already earned combat XP.
  const entitlement=X.apportion(states.reduce((n,q)=>n+q.total,0),weights),owed={};for(const[cls,n]of Object.entries(entitlement)){const prior=states.reduce((v,q)=>v+(cls==='_system'?q.forfeited:q.paid[cls]||0),0);if(n>prior)owed[cls]=n-prior;}
  const grants={};for(const q of states){const left=q.total-q.spent-q.forfeited,systemBefore=q.systemForfeited||0,part=X.reserve(q,left,owed,contributionCaps(b));if(!Object.keys(part).length)q.forfeited=q.total-q.spent;owed._system=Math.max(0,(owed._system||0)-((q.systemForfeited||0)-systemBefore));for(const[cls,n]of Object.entries(part)){grants[cls]=(grants[cls]||0)+n;owed[cls]=Math.max(0,(owed[cls]||0)-n);}applyContributionGrants(b,part);q.completed=true;q.deferred=false;q.reunionSettled=true;X.touch(q);}
  s.reunionGrants=grants;return;
 }
 const remaining=s.total-s.spent-s.forfeited,grants=X.reserve(s,remaining,X.scores(s),contributionCaps(b));if(!Object.keys(grants).length)s.forfeited=s.total-s.spent;s.completed=true;X.touch(s);applyContributionGrants(b,grants);
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
      if(h.honroDebugSkills){heroes[cls].honroDebugSkills=true;heroes[cls].xp=h.xp;}
      heroes[cls].statTraining=C.statTrainingRank(h);delete heroes[cls].statRanks;
    }
  }
  profile.heroes=heroes;
}
function persist(app){if(app.engine?.b.honroGrowth){rememberLimit(app.engine.b);app.profile.honroGrowth=clone(app.engine.b.honroGrowth.ledger);}}
G.HonroProgression={version:config.version,contributionVersion:4,isContributionBattle,contributionState,registerOwner,recordDamage,recordThreat,recordHeal,reconcileWounds,recordControl,recordBlock,shieldAdded,shieldConsumed,objective,flushContribution,completeContribution,plan,budget,xpAt,rewardXpAt,legacyCampaignAnchor,joinLevel,recruit,recruitAtEntry,repairRecruits,entryHero,referenceStats,tuneEnemy,tuneMidboss,tuneBoss,initialize,enemyXP,awardCombat,defeat,complete,persist,markCampAllocation,reconcileCampAllocations,syncRoster};
})(globalThis);
